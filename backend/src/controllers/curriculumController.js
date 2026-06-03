const { Op } = require('sequelize');
const {
  sequelize,
  Curriculum, CurriculumTeam, Department, User,
  CommitteeStep, CommitteeDocument, Document, DocumentVersion,
  TQF2Document, DocumentAnnotation, AuditLog, Notification
} = require('../models');
const { ROLES, CURRICULUM_STATUS, COMMITTEE_STATUS, COMMITTEE_FLOW, COMMITTEE_LABELS } = require('../config/constants');
const emailService = require('../services/emailService');
const { resolveTeamEmails, resolveTeamUserIds } = require('../utils/teamEmailLookup');

const cName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '';

// ─── List หลักสูตร (ไม่โหลด team ใน list view เพื่อลด payload) ──────────────
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, search, degree, status, department_id, year } = req.query;
    const where = {};
    
    // Default base conditions for role
    const baseConditions = [];

    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      baseConditions.push(
        { department_id: req.user.department_id },
        sequelize.where(sequelize.col('team.email'), req.user.email)
      );
    } else if (req.user.role === ROLES.REGISTRAR) {
      where.degree_level = require('../config/constants').DEGREE_LEVELS.BACHELOR;
    }

    // Only apply degree filter if role doesn't already have a fixed degree restriction
    if (degree && req.user.role !== ROLES.REGISTRAR) where.degree_level = degree;
    if (status) where.status = status;
    if (department_id) where.department_id = department_id;
    if (year) where.curriculum_year = year;

    // Combine base conditions with search conditions
    const orConditions = [];
    if (baseConditions.length > 0) {
      orConditions.push({ [Op.or]: baseConditions });
    }
    
    if (search) {
      orConditions.push({
        [Op.or]: [
          { degree_name: { [Op.like]: `%${search}%` } },
          { field_of_study: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    if (orConditions.length > 0) {
      where[Op.and] = orConditions;
    }

    const queryOptions = {
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: CurriculumTeam, as: 'team', attributes: [], required: false },
        {
          model: CommitteeStep, as: 'committee_steps',
          attributes: ['id', 'committee_type', 'step_order', 'status']
        }
      ],
      order: [['created_at', 'DESC']],
      distinct: true,
      subQuery: false
    };

    if (page && limit) {
      const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
      const { count, rows } = await Curriculum.findAndCountAll(queryOptions);
      return res.json({
        success: true,
        data: rows,
        meta: { total: count, page: parsedPage, limit: parsedLimit }
      });
    }

    const curricula = await Curriculum.findAll(queryOptions);
    res.json({ success: true, data: curricula });
  } catch (error) { next(error); }
};

// ─── รายละเอียดหลักสูตร (โหลด team + steps ครบ) ──────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, {
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: CurriculumTeam, as: 'team' },
        {
          model: CommitteeStep, as: 'committee_steps',
          order: [['step_order', 'ASC']]
        }
      ]
    });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const isSameDept = curriculum.department_id === req.user.department_id;
      const isTeamMember = curriculum.team && curriculum.team.some(member => member.email === req.user.email);
      if (!isSameDept && !isTeamMember) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้' });
      }
    }
    
    if (req.user.role === ROLES.REGISTRAR && curriculum.degree_level !== require('../config/constants').DEGREE_LEVELS.BACHELOR) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้ (นายทะเบียนเห็นเฉพาะ ป.ตรี)' });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) { next(error); }
};

// ─── สร้างหลักสูตร ────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { department_id, degree_level, curriculum_type, curriculum_year,
      degree_name, degree_name_abbr, field_of_study, deadline, team } = req.body;

    const duplicate = await Curriculum.findOne({
      where: { department_id, degree_level, curriculum_year, field_of_study: field_of_study || null },
      transaction: t
    });
    if (duplicate) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'หลักสูตรนี้มีอยู่แล้วในระบบ (แผนก + ระดับ + ปี + สาขาซ้ำกัน)' });
    }

    const curriculum = await Curriculum.create({
      department_id, degree_level, curriculum_type, curriculum_year,
      degree_name, degree_name_abbr, field_of_study, deadline,
      status: CURRICULUM_STATUS.PENDING_DEPARTMENT,
      created_by: req.user.id
    }, { transaction: t });

    const flow = COMMITTEE_FLOW[degree_level] || [];
    await CommitteeStep.bulkCreate(
      flow.map((step) => ({
        curriculum_id: curriculum.id,
        committee_type: step.type,
        step_order: step.order,
        status: 'pending'
      })),
      { transaction: t }
    );

    if (team && team.length > 0) {
      await CurriculumTeam.bulkCreate(
        team.map((member) => ({ ...member, curriculum_id: curriculum.id })),
        { transaction: t }
      );
    }

    await AuditLog.create({
      curriculum_id: curriculum.id,
      user_id: req.user.id,
      action: 'CREATE_CURRICULUM',
      details: { curriculum_year, degree_level, degree_name },
      ip_address: req.ip
    }, { transaction: t });

    // Commit transaction ก่อนส่งอีเมล
    await t.commit();

    const allEmails = await resolveTeamEmails(team || [], req.user.email ? [req.user.email] : []);
    if (allEmails.length > 0) {
      emailService.sendCurriculumCreated(allEmails, curriculum)
        .catch((err) => console.error('[Email] sendCurriculumCreated failed:', err.message));
    }

    const created = await Curriculum.findByPk(curriculum.id, {
      include: ['department', 'team', 'committee_steps']
    });
    res.status(201).json({ success: true, data: created, message: 'สร้างหลักสูตรสำเร็จ' });
  } catch (error) { 
    if (!t.finished) await t.rollback();
    next(error); 
  }
};

// ─── แก้ไขข้อมูลพื้นฐานหลักสูตร ──────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id);
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const before = {};
    const DATE_FIELDS = ['deadline'];
    const updatable = ['degree_name', 'degree_name_abbr', 'field_of_study', 'deadline', 'curriculum_year'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        before[field] = curriculum[field];
        curriculum[field] = DATE_FIELDS.includes(field) ? (req.body[field] || null) : req.body[field];
      }
    });
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'UPDATE_CURRICULUM', details: { before, after: req.body }, ip_address: req.ip
    });
    res.json({ success: true, data: curriculum, message: 'อัปเดตหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── อัปเดตทีมหลักสูตร ───────────────────────────────────────────────────────
exports.updateTeam = async (req, res, next) => {
  try {
    const { team } = req.body;
    const curriculum = await Curriculum.findByPk(req.params.id);
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    await CurriculumTeam.destroy({ where: { curriculum_id: curriculum.id } });
    if (team && team.length > 0) {
      await CurriculumTeam.bulkCreate(
        team.map(({ _userSelected, ...m }) => ({ ...m, curriculum_id: curriculum.id }))
      );
    }

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'UPDATE_TEAM', details: { member_count: team?.length || 0 }, ip_address: req.ip
    });
    const updated = await Curriculum.findByPk(curriculum.id, { include: ['team'] });
    res.json({ success: true, data: updated.team, message: 'อัปเดตทีมสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Timeline เส้นทางการเปลี่ยนสถานะหลักสูตร ──────────────────────────────────
exports.getTimeline = async (req, res, next) => {
  const STATUS_CHANGE_ACTIONS = [
    'CREATE_CURRICULUM', 'DEPARTMENT_SUBMIT',
    'ADMIN_APPROVE', 'ADMIN_REJECT',
    'COMMITTEE_APPROVED', 'COMMITTEE_REVISION',
    'RESUBMIT_AFTER_REVISION'
  ];
  try {
    const logs = await AuditLog.findAll({
      where: {
        curriculum_id: req.params.id,
        action: { [Op.in]: STATUS_CHANGE_ACTIONS }
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'position', 'role'] }],
      order: [['created_at', 'ASC']],
      limit: 200
    });

    const now = new Date();
    const timeline = logs.map((log, idx) => {
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
        is_current: !next
      };
    });

    res.json({ success: true, data: timeline });
  } catch (error) { next(error); }
};

// ─── ดู Audit Log ────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, { attributes: ['id', 'department_id'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    // faculty/staff เห็น audit log เฉพาะหลักสูตรในแผนกตัวเอง
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      if (curriculum.department_id !== req.user.department_id) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดู audit log นี้' });
      }
    }

    const { page, limit } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    const { count, rows } = await AuditLog.findAndCountAll({
      where: { curriculum_id: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'position', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parsedPage, limit: parsedLimit } });
  } catch (error) { next(error); }
};

// ─── ภาควิชาส่งหลักสูตร ──────────────────────────────────────────────────────
exports.submitByDepartment = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, { include: ['team', 'department'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const allowedStatuses = [CURRICULUM_STATUS.PENDING_DEPARTMENT, CURRICULUM_STATUS.REVISION];
    if (!allowedStatuses.includes(curriculum.status)) {
      return res.status(409).json({ success: false, message: `ไม่สามารถส่งหลักสูตรที่มีสถานะ "${curriculum.status}" ได้` });
    }

    curriculum.status = CURRICULUM_STATUS.DEPARTMENT_SUBMITTED;
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'DEPARTMENT_SUBMIT', ip_address: req.ip
    });

    const admins = await User.findAll({ where: { role: ROLES.ADMIN, is_active: true }, attributes: ['id', 'email'] });
    if (admins.length > 0) {
      await Notification.bulkCreate(admins.map(admin => ({
        user_id: admin.id,
        title: 'ภาควิชาส่งหลักสูตร',
        message: `${curriculum.department?.name} ได้ส่งหลักสูตร ${cName(curriculum)} เพื่อตรวจสอบ`,
        type: 'info',
        curriculum_id: curriculum.id
      })));

      const adminEmails = admins.filter(a => a.email).map(a => a.email);
      if (adminEmails.length > 0) {
        emailService.sendDepartmentSubmitted(adminEmails, curriculum, curriculum.department?.name)
          .catch(err => console.error('[Email] sendDepartmentSubmitted failed:', err.message));
      }
    }
    res.json({ success: true, message: 'ส่งหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Admin ตีกลับ ─────────────────────────────────────────────────────────────
exports.rejectByAdmin = async (req, res, next) => {
  try {
    const { note, revision_deadline } = req.body;
    const curriculum = await Curriculum.findByPk(req.params.id, { include: ['team'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    const allowedStatuses = [CURRICULUM_STATUS.DEPARTMENT_SUBMITTED, CURRICULUM_STATUS.UNDER_COMMITTEE];
    if (!allowedStatuses.includes(curriculum.status)) {
      return res.status(409).json({ success: false, message: `ไม่สามารถตีกลับหลักสูตรที่มีสถานะ "${curriculum.status}" ได้` });
    }

    curriculum.status = CURRICULUM_STATUS.REVISION;
    curriculum.current_committee_step_id = null;
    curriculum.revision_deadline = revision_deadline || null;
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'ADMIN_REJECT', details: { note, revision_deadline: revision_deadline || null }, ip_address: req.ip
    });

    const rejEmails = await resolveTeamEmails(curriculum.team || []);
    if (rejEmails.length > 0) {
      emailService.sendRevisionRequired(rejEmails, curriculum, note, revision_deadline)
        .catch((err) => console.error('[Email] sendRevisionRequired failed:', err.message));
    }

    const teamUserIds = await resolveTeamUserIds(curriculum.team || []);
    if (teamUserIds.length > 0) {
      await Notification.bulkCreate(teamUserIds.map(uid => ({
        user_id: uid,
        title: 'หลักสูตรถูกส่งกลับแก้ไข',
        message: `${cName(curriculum)} ถูกส่งกลับให้แก้ไข กรุณาตรวจสอบรายละเอียดในระบบ`,
        type: 'warning',
        curriculum_id: curriculum.id
      })));
    }

    res.json({ success: true, message: 'ส่งกลับแก้ไขสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Admin อนุมัติ → เข้าสู่คณะกรรมการขั้นแรก ─────────────────────────────────
// Bug fix: ใช้ sort() แทนการเชื่อมั่น array order จาก Sequelize include
exports.approveByAdmin = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, {
      include: [
        { model: CommitteeStep, as: 'committee_steps' },
        { model: CurriculumTeam, as: 'team' },
      ]
    });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    if (curriculum.status !== CURRICULUM_STATUS.DEPARTMENT_SUBMITTED) {
      return res.status(409).json({ success: false, message: `ไม่สามารถอนุมัติหลักสูตรที่มีสถานะ "${curriculum.status}" ได้` });
    }

    // เรียง steps ใน JS เพื่อให้แน่ใจว่าได้ step แรกจริงๆ
    const sortedSteps = [...(curriculum.committee_steps || [])].sort((a, b) => a.step_order - b.step_order);
    const firstStep = sortedSteps[0];

    curriculum.status = CURRICULUM_STATUS.UNDER_COMMITTEE;
    curriculum.current_committee_step_id = firstStep?.id || null;
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'ADMIN_APPROVE', ip_address: req.ip
    });

    const teamUserIds = await resolveTeamUserIds(curriculum.team || []);
    if (teamUserIds.length > 0) {
      await Notification.bulkCreate(teamUserIds.map(uid => ({
        user_id: uid,
        title: 'หลักสูตรผ่านการตรวจสอบเบื้องต้น',
        message: `${cName(curriculum)} ผ่านการตรวจสอบและเข้าสู่กระบวนการคณะกรรมการแล้ว`,
        type: 'success',
        curriculum_id: curriculum.id
      })));
    }

    const allEmails = await resolveTeamEmails(curriculum.team || []);
    if (allEmails.length > 0) {
      emailService.sendAdminApproved(allEmails, curriculum)
        .catch(err => console.error('[Email] sendAdminApproved failed:', err.message));
    }

    res.json({ success: true, message: 'อนุมัติและส่งต่อคณะกรรมการสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Admin ผ่านการตรวจสอบหลังแก้ไข → ส่งกลับคณะกรรมการชุดเดิม ──────────────
exports.approveRecheck = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, {
      include: [{ model: CurriculumTeam, as: 'team' }]
    });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    if (curriculum.status !== CURRICULUM_STATUS.PENDING_ADMIN_RECHECK) {
      return res.status(409).json({ success: false, message: `ไม่สามารถดำเนินการได้ (สถานะปัจจุบัน: ${curriculum.status})` });
    }

    // รีเซ็ต step ที่ตีกลับ → pending เพื่อรอมติครั้งใหม่
    if (curriculum.current_committee_step_id) {
      await CommitteeStep.update(
        { status: COMMITTEE_STATUS.PENDING },
        { where: { id: curriculum.current_committee_step_id } }
      );
    } else {
      // ถูกตีกลับจาก department_submitted → current_committee_step_id = null
      // ให้ resume ที่ first step เหมือน approveByAdmin
      const firstStep = await CommitteeStep.findOne({
        where: { curriculum_id: curriculum.id },
        order: [['step_order', 'ASC']]
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

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'ADMIN_APPROVE_RECHECK',
      details: { resume_step_id: curriculum.current_committee_step_id },
      ip_address: req.ip
    });

    const teamUserIds = await resolveTeamUserIds(curriculum.team || []);
    if (teamUserIds.length > 0) {
      await Notification.bulkCreate(teamUserIds.map(uid => ({
        user_id: uid,
        title: 'เอกสารผ่านการตรวจสอบ — พร้อมนำเข้าคณะกรรมการ',
        message: `${cName(curriculum)} ผ่านการตรวจสอบจากงานหลักสูตรแล้ว และกลับเข้าสู่กระบวนการคณะกรรมการ`,
        type: 'success',
        curriculum_id: curriculum.id
      })));
    }

    res.json({ success: true, message: 'ผ่านการตรวจสอบ — ส่งกลับคณะกรรมการสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Admin ตีกลับหลังแก้ไข → ส่งกลับสาขาแก้เพิ่ม ───────────────────────────
exports.rejectRecheck = async (req, res, next) => {
  try {
    const { note, revision_deadline } = req.body;
    const curriculum = await Curriculum.findByPk(req.params.id, { include: ['team'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    if (curriculum.status !== CURRICULUM_STATUS.PENDING_ADMIN_RECHECK) {
      return res.status(409).json({ success: false, message: `ไม่สามารถดำเนินการได้ (สถานะปัจจุบัน: ${curriculum.status})` });
    }

    // คง current_committee_step_id ไว้ เพื่อให้รู้ว่าจะต้อง resume ที่ step ไหน
    curriculum.status = CURRICULUM_STATUS.REVISION;
    curriculum.revision_deadline = revision_deadline || null;
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'ADMIN_REJECT_RECHECK',
      details: { note, revision_deadline: revision_deadline || null, resume_step_id: curriculum.current_committee_step_id },
      ip_address: req.ip
    });

    const rejEmails = await resolveTeamEmails(curriculum.team || []);
    if (rejEmails.length > 0) {
      emailService.sendRevisionRequired?.(rejEmails, curriculum, note, revision_deadline)
        ?.catch(err => console.error('[Email] sendRevisionRequired failed:', err.message));
    }

    const teamUserIds = await resolveTeamUserIds(curriculum.team || []);
    if (teamUserIds.length > 0) {
      await Notification.bulkCreate(teamUserIds.map(uid => ({
        user_id: uid,
        title: 'เอกสารถูกส่งกลับแก้ไขเพิ่มเติม',
        message: `${cName(curriculum)} ยังต้องแก้ไขเพิ่มเติมก่อนนำเข้าคณะกรรมการ`,
        type: 'warning',
        curriculum_id: curriculum.id
      })));
    }

    res.json({ success: true, message: 'ส่งกลับแก้ไขสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── ลบหลักสูตร (Soft Delete) ──────────────────────────────────────────────────
exports.delete = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const curriculum = await Curriculum.findByPk(id, { transaction: t });
    if (!curriculum) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    }

    // แค่เรียก destroy() จะทำงานเป็น Soft Delete เพราะ paranoid: true ใน Model
    await curriculum.destroy({ transaction: t });

    await AuditLog.create({
      curriculum_id: curriculum.id,
      user_id: req.user.id,
      action: 'DELETE_CURRICULUM',
      ip_address: req.ip
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'ลบหลักสูตรสำเร็จ (Soft Delete)' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ─── List หลักสูตรที่ถูกยกเลิก (Archived) ───────────────────────────────────────
exports.getArchived = async (req, res, next) => {
  try {
    const curricula = await Curriculum.findAll({
      where: {
        deleted_at: { [Op.not]: null }
      },
      paranoid: false,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['deleted_at', 'DESC']]
    });
    res.json({ success: true, data: curricula });
  } catch (error) { next(error); }
};

// ─── กู้คืนหลักสูตร (Restore) ──────────────────────────────────────────────────
exports.restore = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const curriculum = await Curriculum.findByPk(id, { paranoid: false, transaction: t });
    
    if (!curriculum) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    }
    
    if (!curriculum.deleted_at) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'หลักสูตรนี้ไม่ได้ถูกยกเลิก' });
    }

    await curriculum.restore({ transaction: t });

    await AuditLog.create({
      curriculum_id: curriculum.id,
      user_id: req.user.id,
      action: 'RESTORE_CURRICULUM',
      ip_address: req.ip
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'กู้คืนหลักสูตรสำเร็จ' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
