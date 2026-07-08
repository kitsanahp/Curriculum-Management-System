const { Op } = require('sequelize');
const {
  sequelize,
  Curriculum, CurriculumTeam, Department, User,
  CommitteeStep, CommitteeDocument, Document, DocumentVersion,
  TQF2Document, DocumentAnnotation, AuditLog, Notification
} = require('../models');
const { ROLES, CURRICULUM_STATUS, COMMITTEE_STATUS, COMMITTEE_FLOW } = require('../config/constants');
const emailService = require('./emailService');
const { resolveTeamEmails, resolveTeamUserIds } = require('../utils/teamEmailLookup');
const { listScope } = require('../utils/curriculumAccess');
const { registrarScopeOr } = require('../utils/registrarAccess');
const ApiError = require('../utils/apiError');

// ชื่อหลักสูตรแบบสั้นสำหรับข้อความแจ้งเตือน/อีเมล
const cName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '';

// ─────────────────────────────────────────────────────────────────────────────
// Notification helpers — รวม pattern ที่เดิมเขียนซ้ำในทุก workflow action
// ─────────────────────────────────────────────────────────────────────────────

// สร้าง in-app notification ให้ user หลายคนพร้อมกัน (ข้ามถ้า list ว่าง)
async function notifyUsers(userIds, { title, message, type }, curriculumId) {
  if (!userIds.length) return;
  await Notification.bulkCreate(userIds.map((user_id) => ({
    user_id, title, message, type, curriculum_id: curriculumId,
  })));
}

// แจ้งเตือนทีมหลักสูตร (resolve user_id จาก team + extra แล้วส่ง in-app)
async function notifyTeam(curriculum, payload, extraUserIds = []) {
  const userIds = await resolveTeamUserIds(curriculum.team || [], extraUserIds);
  await notifyUsers(userIds, payload, curriculum.id);
}

// ส่งอีเมลแบบ fire-and-forget — ไม่ block response, log error เฉยๆ (pattern เดิมของระบบ)
function fireEmail(label, promise) {
  promise?.catch?.((err) => console.error(`[Email] ${label} failed:`, err.message));
}

// บันทึก audit log (ตัวห่อบางๆ เพื่อให้ call site อ่านง่าย)
function writeAudit({ curriculumId, actor, action, details }, transaction) {
  return AuditLog.create({
    curriculum_id: curriculumId,
    user_id: actor.id,
    action,
    details,
    ip_address: actor.ip,
  }, transaction ? { transaction } : undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// Read / Query — logic การ build query + role scope ที่เคยอยู่ใน controller
// ─────────────────────────────────────────────────────────────────────────────

// List หลักสูตรพร้อม role scope + filter + pagination
// คืน { data, meta } — meta เป็น null เมื่อไม่ได้แบ่งหน้า
async function listCurricula(user, query) {
  const { page, limit, search, degree, status, department_id, year } = query;
  const where = {};

  // faculty → เฉพาะหลักสูตรที่ตนอยู่ในทีม | staff → ทั้งภาควิชา
  const baseConditions = [];
  const scope = listScope(user);

  let registrarOr = null;
  if (scope) {
    baseConditions.push(scope.condition);
  } else if (user.role === ROLES.REGISTRAR) {
    registrarOr = await registrarScopeOr();
  }

  // degree filter — ข้ามสำหรับ registrar (มี degree restriction ตายตัวอยู่แล้ว)
  if (degree && user.role !== ROLES.REGISTRAR) where.degree_level = degree;
  if (status) where.status = status;
  if (department_id) where.department_id = department_id;
  if (year) where.curriculum_year = year;

  const orConditions = [];
  if (baseConditions.length > 0) orConditions.push({ [Op.or]: baseConditions });
  if (registrarOr) orConditions.push({ [Op.or]: registrarOr });

  if (search) {
    // escape LIKE wildcard (\ % _) ไม่งั้นผู้ใช้พิมพ์ % หรือ _ แล้วผลค้นหาเพี้ยน
    const safe = String(search).replace(/[\\%_]/g, '\\$&');
    orConditions.push({
      [Op.or]: [
        { degree_name: { [Op.like]: `%${safe}%` } },
        { field_of_study: { [Op.like]: `%${safe}%` } },
      ],
    });
  }

  if (orConditions.length > 0) where[Op.and] = orConditions;

  const include = [
    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'academic_position'] },
    {
      // separate: true → query แยก ไม่ทวีจำนวนแถว main (กัน LIMIT นับผิด)
      model: CommitteeStep, as: 'committee_steps',
      attributes: ['id', 'committee_type', 'step_order', 'status'],
      separate: true,
      order: [['step_order', 'ASC']],
    },
  ];
  // team join จำเป็นเฉพาะ faculty (baseCondition อ้างถึง team.email)
  if (scope?.needsTeam) {
    include.push({ model: CurriculumTeam, as: 'team', attributes: [], required: false });
  }

  const queryOptions = {
    where, include,
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false,
  };

  if (page && limit) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    queryOptions.limit = parsedLimit;
    queryOptions.offset = (parsedPage - 1) * parsedLimit;
    const { count, rows } = await Curriculum.findAndCountAll(queryOptions);
    return { data: rows, meta: { total: count, page: parsedPage, limit: parsedLimit } };
  }

  const curricula = await Curriculum.findAll(queryOptions);
  return { data: curricula, meta: null };
}

// ปีการศึกษาที่มีหลักสูตรอยู่จริง (สำหรับ dropdown ตัวกรอง) — เคารพ role scope
async function listCurriculumYears(user) {
  const where = {};
  const include = [];
  const scope = listScope(user);
  if (scope) {
    if (scope.needsTeam) {
      // faculty → join team แบบ INNER เพื่อให้ได้เฉพาะปีของหลักสูตรที่ตนรับผิดชอบ
      include.push({ model: CurriculumTeam, as: 'team', attributes: [], required: true });
      where[Op.and] = [scope.condition];
    } else {
      Object.assign(where, scope.condition);
    }
  } else if (user.role === ROLES.REGISTRAR) {
    where[Op.or] = await registrarScopeOr();
  }
  const rows = await Curriculum.findAll({
    where, include,
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('curriculum_year')), 'year']],
    order: [['curriculum_year', 'DESC']],
    raw: true,
  });
  return rows.map((r) => r.year).filter(Boolean);
}

// Timeline เส้นทางการเปลี่ยนสถานะ — query audit ที่เป็น "การเปลี่ยนสถานะ" แล้วคำนวณ duration
const STATUS_CHANGE_ACTIONS = [
  'CREATE_CURRICULUM', 'DEPARTMENT_SUBMIT',
  'ADMIN_APPROVE', 'ADMIN_REJECT',
  'COMMITTEE_APPROVED', 'COMMITTEE_REVISION',
  'RESUBMIT_AFTER_REVISION',
];

async function buildTimeline(curriculumId) {
  const logs = await AuditLog.findAll({
    where: { curriculum_id: curriculumId, action: { [Op.in]: STATUS_CHANGE_ACTIONS } },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'position', 'role', 'academic_position'] }],
    order: [['created_at', 'ASC']],
    limit: 200,
  });

  const now = new Date();
  return logs.map((log, idx) => {
    const next = logs[idx + 1];
    const start = new Date(log.createdAt);
    const end = next ? new Date(next.createdAt) : now;
    const duration_days = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    return {
      id: log.id,
      action: log.action,
      details: log.details,
      user: log.user,
      createdAt: log.createdAt,
      duration_days,
      is_current: !next,
    };
  });
}

// Audit log แบบแบ่งหน้า
async function listAuditLogs(curriculumId, { page, limit }) {
  const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const { count, rows } = await AuditLog.findAndCountAll({
    where: { curriculum_id: curriculumId },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'position', 'role', 'academic_position'] }],
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  });
  return { data: rows, meta: { total: count, page: parsedPage, limit: parsedLimit } };
}

// หลักสูตรที่ถูกยกเลิก (soft-deleted)
function listArchived() {
  return Curriculum.findAll({
    where: { deleted_at: { [Op.not]: null } },
    paranoid: false,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'academic_position'] },
    ],
    order: [['deleted_at', 'DESC']],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations / Workflow — business logic ที่เปลี่ยน state + side effects
// (caller โหลด/ตรวจสิทธิ์ผ่าน loadAuthorizedCurriculum แล้วส่ง instance เข้ามา
//  ยกเว้น createCurriculum ที่ยังไม่มี record)
// ─────────────────────────────────────────────────────────────────────────────

// สร้างหลักสูตร + committee steps ตาม flow + team + audit + อีเมลแจ้งทีม
async function createCurriculum(body, actor) {
  const { department_id, degree_level, curriculum_type, curriculum_year,
    degree_name, degree_name_abbr, field_of_study, deadline, team } = body;

  const created = await sequelize.transaction(async (t) => {
    const duplicate = await Curriculum.findOne({
      where: { department_id, degree_level, curriculum_year, field_of_study: field_of_study || null },
      transaction: t,
    });
    if (duplicate) {
      throw new ApiError(409, 'หลักสูตรนี้มีอยู่แล้วในระบบ (แผนก + ระดับ + ปี + สาขาซ้ำกัน)');
    }

    const curriculum = await Curriculum.create({
      department_id, degree_level, curriculum_type, curriculum_year,
      degree_name, degree_name_abbr, field_of_study,
      deadline: deadline || null, // กัน '' → DATEONLY แปลงเป็น "Invalid date"
      status: CURRICULUM_STATUS.PENDING_DEPARTMENT,
      created_by: actor.id,
    }, { transaction: t });

    const flow = COMMITTEE_FLOW[degree_level] || [];
    await CommitteeStep.bulkCreate(
      flow.map((step) => ({
        curriculum_id: curriculum.id,
        committee_type: step.type,
        step_order: step.order,
        status: 'pending',
      })),
      { transaction: t }
    );

    if (team && team.length > 0) {
      await CurriculumTeam.bulkCreate(
        team.map((member) => ({ ...member, curriculum_id: curriculum.id })),
        { transaction: t }
      );
    }

    await writeAudit({
      curriculumId: curriculum.id, actor, action: 'CREATE_CURRICULUM',
      details: { curriculum_year, degree_level, degree_name },
    }, t);

    return curriculum;
  });

  // อีเมลส่งหลัง commit (side effect — ไม่อยู่ใน transaction)
  // แจ้งเฉพาะทีมหลักสูตร — actor คือ admin ผู้ตรวจ ไม่ต้องได้สำเนาของตัวเอง
  const allEmails = await resolveTeamEmails(team || []);
  if (allEmails.length > 0) {
    fireEmail('sendCurriculumCreated', emailService.sendCurriculumCreated(allEmails, created));
  }

  return Curriculum.findByPk(created.id, { include: ['department', 'team', 'committee_steps'] });
}

// แก้ไขข้อมูลพื้นฐานหลักสูตร (เฉพาะ field ที่อนุญาต) + audit ค่า before/after
async function updateCurriculumInfo(curriculum, body, actor) {
  const DATE_FIELDS = ['deadline'];
  const updatable = ['degree_name', 'degree_name_abbr', 'field_of_study', 'deadline', 'curriculum_year'];
  const before = {};
  updatable.forEach((field) => {
    if (body[field] !== undefined) {
      before[field] = curriculum[field];
      curriculum[field] = DATE_FIELDS.includes(field) ? (body[field] || null) : body[field];
    }
  });
  await curriculum.save();
  await writeAudit({
    curriculumId: curriculum.id, actor, action: 'UPDATE_CURRICULUM',
    details: { before, after: body },
  });
  return curriculum;
}

// แทนที่ทีมหลักสูตรทั้งชุด (destroy + bulkCreate ใน transaction กัน data loss)
async function updateCurriculumTeam(curriculum, team, actor) {
  await sequelize.transaction(async (t) => {
    await CurriculumTeam.destroy({ where: { curriculum_id: curriculum.id }, transaction: t });
    if (team && team.length > 0) {
      await CurriculumTeam.bulkCreate(
        team.map(({ _userSelected, ...m }) => ({ ...m, curriculum_id: curriculum.id })),
        { transaction: t }
      );
    }
  });
  await writeAudit({
    curriculumId: curriculum.id, actor, action: 'UPDATE_TEAM',
    details: { member_count: team?.length || 0 },
  });
  const updated = await Curriculum.findByPk(curriculum.id, { include: ['team'] });
  return updated.team;
}

// ภาควิชาส่งหลักสูตร → แจ้ง admin (in-app + email)
async function submitByDepartment(curriculum, actor) {
  const allowedStatuses = [CURRICULUM_STATUS.PENDING_DEPARTMENT, CURRICULUM_STATUS.REVISION];
  if (!allowedStatuses.includes(curriculum.status)) {
    throw new ApiError(409, `ไม่สามารถส่งหลักสูตรที่มีสถานะ "${curriculum.status}" ได้`);
  }
  // ถูกตีกลับจาก "คณะกรรมการ" (current_committee_step_id ค้างอยู่) ต้องไปทาง resubmit
  // เท่านั้น — ถ้าปล่อยผ่าน submit ปกติ สถานะจะกลายเป็น department_submitted แล้ว
  // admin approve จะรีเซ็ตไป step แรก ทำให้เสียตำแหน่ง "เริ่มที่คณะกรรมการชุดที่ตีกลับ"
  if (curriculum.status === CURRICULUM_STATUS.REVISION && curriculum.current_committee_step_id) {
    throw new ApiError(409, 'หลักสูตรนี้ถูกตีกลับจากคณะกรรมการ ต้องส่งผ่าน "ส่งให้งานหลักสูตรตรวจสอบ" เพื่อกลับเข้าขั้นตอนเดิม');
  }

  curriculum.status = CURRICULUM_STATUS.DEPARTMENT_SUBMITTED;
  await curriculum.save();
  await writeAudit({ curriculumId: curriculum.id, actor, action: 'DEPARTMENT_SUBMIT' });

  const admins = await User.findAll({
    where: { role: ROLES.ADMIN, is_active: true }, attributes: ['id', 'email'],
  });
  if (admins.length > 0) {
    await notifyUsers(
      admins.map((a) => a.id),
      {
        title: 'ภาควิชาส่งหลักสูตร',
        message: `${curriculum.department?.name} ได้ส่งหลักสูตร ${cName(curriculum)} เพื่อตรวจสอบ`,
        type: 'info',
      },
      curriculum.id
    );
    const adminEmails = admins.filter((a) => a.email).map((a) => a.email);
    if (adminEmails.length > 0) {
      fireEmail('sendDepartmentSubmitted',
        emailService.sendDepartmentSubmitted(adminEmails, curriculum, curriculum.department?.name));
    }
  }
}

// admin ตีกลับหลักสูตร → กลับสาขาแก้ไข (in-app + email แจ้งทีม)
async function rejectByAdmin(curriculum, { note, revision_deadline }, actor) {
  const allowedStatuses = [CURRICULUM_STATUS.DEPARTMENT_SUBMITTED, CURRICULUM_STATUS.UNDER_COMMITTEE];
  if (!allowedStatuses.includes(curriculum.status)) {
    throw new ApiError(409, `ไม่สามารถตีกลับหลักสูตรที่มีสถานะ "${curriculum.status}" ได้`);
  }

  curriculum.status = CURRICULUM_STATUS.REVISION;
  curriculum.current_committee_step_id = null;
  curriculum.revision_deadline = revision_deadline || null;
  await curriculum.save();
  await writeAudit({
    curriculumId: curriculum.id, actor, action: 'ADMIN_REJECT',
    details: { note, revision_deadline: revision_deadline || null },
  });

  const emails = await resolveTeamEmails(curriculum.team || []);
  if (emails.length > 0) {
    fireEmail('sendRevisionRequired',
      emailService.sendRevisionRequired(emails, curriculum, note, revision_deadline));
  }
  await notifyTeam(curriculum, {
    title: 'หลักสูตรถูกส่งกลับแก้ไข',
    message: `${cName(curriculum)} ถูกส่งกลับให้แก้ไข กรุณาตรวจสอบรายละเอียดในระบบ`,
    type: 'warning',
  });
}

// admin อนุมัติ → เข้าสู่คณะกรรมการขั้นแรก (เรียง step ใน JS กัน array order ไม่ชัวร์)
async function approveByAdmin(curriculum, actor) {
  if (curriculum.status !== CURRICULUM_STATUS.DEPARTMENT_SUBMITTED) {
    throw new ApiError(409, `ไม่สามารถอนุมัติหลักสูตรที่มีสถานะ "${curriculum.status}" ได้`);
  }

  const sortedSteps = [...(curriculum.committee_steps || [])].sort((a, b) => a.step_order - b.step_order);
  const firstStep = sortedSteps[0];

  curriculum.status = CURRICULUM_STATUS.UNDER_COMMITTEE;
  curriculum.current_committee_step_id = firstStep?.id || null;
  await curriculum.save();
  await writeAudit({ curriculumId: curriculum.id, actor, action: 'ADMIN_APPROVE' });

  await notifyTeam(curriculum, {
    title: 'หลักสูตรผ่านการตรวจสอบเบื้องต้น',
    message: `${cName(curriculum)} ผ่านการตรวจสอบและเข้าสู่กระบวนการคณะกรรมการแล้ว`,
    type: 'success',
  });
  const emails = await resolveTeamEmails(curriculum.team || []);
  if (emails.length > 0) {
    fireEmail('sendAdminApproved', emailService.sendAdminApproved(emails, curriculum));
  }
}

// admin ผ่านการตรวจสอบหลังแก้ไข → resume คณะกรรมการชุดที่ตีกลับ (หรือ step แรกถ้าตีกลับจาก submitted)
async function approveRecheck(curriculum, actor) {
  if (curriculum.status !== CURRICULUM_STATUS.PENDING_ADMIN_RECHECK) {
    throw new ApiError(409, `ไม่สามารถดำเนินการได้ (สถานะปัจจุบัน: ${curriculum.status})`);
  }

  if (curriculum.current_committee_step_id) {
    // รีเซ็ต step ที่ตีกลับ → pending เพื่อรอมติครั้งใหม่
    await CommitteeStep.update(
      { status: COMMITTEE_STATUS.PENDING },
      { where: { id: curriculum.current_committee_step_id } }
    );
  } else {
    // ถูกตีกลับจาก department_submitted → resume ที่ first step เหมือน approveByAdmin
    const firstStep = await CommitteeStep.findOne({
      where: { curriculum_id: curriculum.id },
      order: [['step_order', 'ASC']],
    });
    if (firstStep) {
      curriculum.current_committee_step_id = firstStep.id;
      await CommitteeStep.update(
        { status: COMMITTEE_STATUS.PENDING },
        { where: { id: firstStep.id } }
      );
    }
  }

  curriculum.status = CURRICULUM_STATUS.UNDER_COMMITTEE;
  await curriculum.save();
  await writeAudit({
    curriculumId: curriculum.id, actor, action: 'ADMIN_APPROVE_RECHECK',
    details: { resume_step_id: curriculum.current_committee_step_id },
  });

  await notifyTeam(curriculum, {
    title: 'เอกสารผ่านการตรวจสอบ — พร้อมนำเข้าคณะกรรมการ',
    message: `${cName(curriculum)} ผ่านการตรวจสอบจากงานหลักสูตรแล้ว และกลับเข้าสู่กระบวนการคณะกรรมการ`,
    type: 'success',
  });
}

// admin ตีกลับหลังแก้ไข → ส่งกลับสาขาแก้เพิ่ม (คง current_committee_step_id ไว้เพื่อ resume ภายหลัง)
async function rejectRecheck(curriculum, { note, revision_deadline }, actor) {
  if (curriculum.status !== CURRICULUM_STATUS.PENDING_ADMIN_RECHECK) {
    throw new ApiError(409, `ไม่สามารถดำเนินการได้ (สถานะปัจจุบัน: ${curriculum.status})`);
  }

  curriculum.status = CURRICULUM_STATUS.REVISION;
  curriculum.revision_deadline = revision_deadline || null;
  await curriculum.save();
  await writeAudit({
    curriculumId: curriculum.id, actor, action: 'ADMIN_REJECT_RECHECK',
    details: { note, revision_deadline: revision_deadline || null, resume_step_id: curriculum.current_committee_step_id },
  });

  const emails = await resolveTeamEmails(curriculum.team || []);
  if (emails.length > 0) {
    fireEmail('sendRevisionRequired',
      emailService.sendRevisionRequired?.(emails, curriculum, note, revision_deadline));
  }
  await notifyTeam(curriculum, {
    title: 'เอกสารถูกส่งกลับแก้ไขเพิ่มเติม',
    message: `${cName(curriculum)} ยังต้องแก้ไขเพิ่มเติมก่อนนำเข้าคณะกรรมการ`,
    type: 'warning',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Soft / Hard delete
// ─────────────────────────────────────────────────────────────────────────────

// ลบหลักสูตร (Soft Delete — paranoid: true ใน model)
async function softDelete(id, actor) {
  await sequelize.transaction(async (t) => {
    const curriculum = await Curriculum.findByPk(id, { transaction: t });
    if (!curriculum) throw new ApiError(404, 'ไม่พบหลักสูตร');
    await curriculum.destroy({ transaction: t });
    await writeAudit({ curriculumId: curriculum.id, actor, action: 'DELETE_CURRICULUM' }, t);
  });
}

// กู้คืนหลักสูตรที่ถูกยกเลิก
async function restore(id, actor) {
  await sequelize.transaction(async (t) => {
    const curriculum = await Curriculum.findByPk(id, { paranoid: false, transaction: t });
    if (!curriculum) throw new ApiError(404, 'ไม่พบหลักสูตร');
    if (!curriculum.deleted_at) throw new ApiError(400, 'หลักสูตรนี้ไม่ได้ถูกยกเลิก');
    await curriculum.restore({ transaction: t });
    await writeAudit({ curriculumId: curriculum.id, actor, action: 'RESTORE_CURRICULUM' }, t);
  });
}

// เคลียร์ child records ของหลักสูตรหนึ่ง ๆ ตามลำดับ FK (ลึกสุดก่อน) — ใช้ใน transaction
async function purgeCurriculumChildren(id, t, actor) {
  const steps = await CommitteeStep.findAll({ where: { curriculum_id: id }, attributes: ['id'], transaction: t });
  const stepIds = steps.map((s) => s.id);
  if (stepIds.length) {
    await CommitteeDocument.destroy({ where: { committee_step_id: stepIds }, force: true, transaction: t });
  }
  await CommitteeStep.destroy({ where: { curriculum_id: id }, force: true, transaction: t });

  const docs = await Document.findAll({ where: { curriculum_id: id }, attributes: ['id'], paranoid: false, transaction: t });
  const docIds = docs.map((d) => d.id);
  if (docIds.length) {
    await DocumentVersion.destroy({ where: { document_id: docIds }, force: true, transaction: t });
    await DocumentAnnotation.destroy({ where: { document_id: docIds, document_type: 'document' }, force: true, transaction: t });
  }
  await Document.destroy({ where: { curriculum_id: id }, force: true, transaction: t });

  const tqf2s = await TQF2Document.findAll({ where: { curriculum_id: id }, attributes: ['id'], paranoid: false, transaction: t });
  const tqf2Ids = tqf2s.map((d) => d.id);
  if (tqf2Ids.length) {
    await DocumentAnnotation.destroy({ where: { document_id: tqf2Ids, document_type: 'tqf2' }, force: true, transaction: t });
  }
  await TQF2Document.destroy({ where: { curriculum_id: id }, force: true, transaction: t });

  await CurriculumTeam.destroy({ where: { curriculum_id: id }, force: true, transaction: t });

  // เก็บ audit ของการลบถาวรไว้ (AuditLog.curriculum_id ไม่มี FK constraint จึงคงค่า id ไว้เป็นประวัติได้)
  await writeAudit({ curriculumId: id, actor, action: 'FORCE_DELETE_CURRICULUM' }, t);
}

// ลบหลักสูตรถาวร (Hard Delete) — เฉพาะที่ถูกยกเลิกแล้วเท่านั้น
async function forceDelete(id, actor) {
  await sequelize.transaction(async (t) => {
    const curriculum = await Curriculum.findByPk(id, { paranoid: false, transaction: t });
    if (!curriculum) throw new ApiError(404, 'ไม่พบหลักสูตร');
    if (!curriculum.deleted_at) throw new ApiError(400, 'ลบถาวรได้เฉพาะหลักสูตรที่ถูกยกเลิกแล้วเท่านั้น');
    await purgeCurriculumChildren(id, t, actor);
    await curriculum.destroy({ force: true, transaction: t });
  });
}

// ลบหลักสูตรถาวรทั้งหมดที่ถูกยกเลิก — คืนจำนวนที่ลบ
async function forceDeleteAll(actor) {
  return sequelize.transaction(async (t) => {
    const archived = await Curriculum.findAll({
      where: { deleted_at: { [Op.not]: null } },
      attributes: ['id'], paranoid: false, transaction: t,
    });
    if (!archived.length) throw new ApiError(400, 'ไม่มีหลักสูตรที่ถูกยกเลิกให้ลบ');

    for (const c of archived) {
      await purgeCurriculumChildren(c.id, t, actor);
      await Curriculum.destroy({ where: { id: c.id }, force: true, paranoid: false, transaction: t });
    }
    return archived.length;
  });
}

module.exports = {
  // read
  listCurricula, listCurriculumYears, buildTimeline, listAuditLogs, listArchived,
  // mutations / workflow
  createCurriculum, updateCurriculumInfo, updateCurriculumTeam,
  submitByDepartment, rejectByAdmin, approveByAdmin, approveRecheck, rejectRecheck,
  // delete
  softDelete, restore, forceDelete, forceDeleteAll,
};
