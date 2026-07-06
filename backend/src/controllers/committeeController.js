const path = require('path');
const { Op } = require('sequelize');
const {
  sequelize, CommitteeStep, CommitteeDocument, Curriculum, Document, AuditLog, Notification, User, Department
} = require('../models');
const { COMMITTEE_STATUS, CURRICULUM_STATUS, COMMITTEE_LABELS, ROLES } = require('../config/constants');
const emailService = require('../services/emailService');
const { resolveTeamEmails, resolveTeamUserIds } = require('../utils/teamEmailLookup');
const { canAccessCurriculum } = require('../utils/curriculumAccess');
const { getServiceUnitDeptId, registrarCanAccess } = require('../utils/registrarAccess');

const cName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '';

exports.uploadDecision = async (req, res, next) => {
  // ลบไฟล์ที่ multer อัปโหลดแล้ว (ใช้ตอน validation fail / transaction rollback — กันไฟล์ขยะค้าง)
  const cleanupFiles = () => {
    (req.files || []).forEach(f => { if (f.path) fs.unlink(f.path, () => {}); });
  };

  const t = await sequelize.transaction();
  try {
    const { step_id } = req.params;
    const { status, decision_date, meeting_number, notes, linked_document_ids, revision_deadline } = req.body;

    const ALLOWED_DECISIONS = [COMMITTEE_STATUS.APPROVED, COMMITTEE_STATUS.REVISION];
    if (!ALLOWED_DECISIONS.includes(status)) {
      await t.rollback(); cleanupFiles();
      return res.status(400).json({ success: false, message: 'สถานะมติไม่ถูกต้อง (ต้องเป็น approved หรือ revision)' });
    }

    // ── ล็อกแถว step + curriculum ด้วย FOR UPDATE — กัน race ตอนกดบันทึกมติซ้ำพร้อมกัน ──
    // ผู้ที่เข้ามาทีหลังจะรอจนคนแรก commit เสร็จ แล้วเห็น status ที่อัปเดตแล้ว → ไม่ advance step ซ้อน
    const step = await CommitteeStep.findByPk(step_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!step) {
      await t.rollback(); cleanupFiles();
      return res.status(404).json({ success: false, message: 'ไม่พบขั้นตอนคณะกรรมการ' });
    }
    const curriculum = await Curriculum.findByPk(step.curriculum_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!curriculum || curriculum.status !== CURRICULUM_STATUS.UNDER_COMMITTEE) {
      await t.rollback(); cleanupFiles();
      return res.status(409).json({ success: false, message: `ไม่สามารถบันทึกมติสำหรับหลักสูตรที่มีสถานะ "${curriculum?.status}" ได้` });
    }

    step.status = status;
    if (decision_date) step.decision_date = decision_date;
    if (meeting_number) step.meeting_number = meeting_number;
    if (notes) step.notes = notes;
    step.uploaded_by = req.user.id;
    await step.save({ transaction: t });

    // คำนวณ round ถัดไปสำหรับ step นี้
    const maxRound = await CommitteeDocument.max('round', {
      where: { committee_step_id: step.id }, transaction: t,
    });
    const nextRound = (maxRound || 0) + 1;

    // อัปโหลดไฟล์ใหม่ (source_type: upload) — รองรับหลายไฟล์
    if (req.files && req.files.length > 0) {
      await CommitteeDocument.bulkCreate(req.files.map(file => ({
        committee_step_id: step.id,
        original_name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        stored_name: file.filename,
        uploaded_by: req.user.id,
        source_type: 'upload',
        round: nextRound
      })), { transaction: t });
    }

    // เชื่อมเอกสารจาก workspace (source_type: workspace)
    const docIds = (() => {
      try { return JSON.parse(linked_document_ids || '[]'); } catch { return []; }
    })();
    if (docIds.length > 0) {
      const docs = await Document.findAll({
        where: { id: docIds, is_deleted: false },
        attributes: ['id', 'original_name', 'stored_name'],
        transaction: t,
      });
      if (docs.length > 0) {
        await CommitteeDocument.bulkCreate(docs.map(doc => ({
          committee_step_id: step.id,
          original_name: doc.original_name,
          stored_name: doc.stored_name,
          uploaded_by: req.user.id,
          source_type: 'workspace',
          document_id: doc.id,
          round: nextRound
        })), { transaction: t });
      }
    }

    // เตรียมข้อมูลแจ้งเตือน — DB writes (Notification) อยู่ใน transaction, email ส่งหลัง commit
    const team = await curriculum.getTeam({ transaction: t });
    const emails = await resolveTeamEmails(team);
    const teamUserIds = await resolveTeamUserIds(team);
    let sendEmail = () => {}; // กำหนดทีหลังตามผลมติ

    if (status === COMMITTEE_STATUS.APPROVED) {
      const nextStep = await CommitteeStep.findOne({
        where: { curriculum_id: curriculum.id, step_order: step.step_order + 1 },
        transaction: t,
      });

      if (nextStep) {
        curriculum.current_committee_step_id = nextStep.id;
        await curriculum.save({ transaction: t });
        if (teamUserIds.length > 0) {
          await Notification.bulkCreate(teamUserIds.map(uid => ({
            user_id: uid,
            title: `มติเห็นชอบ — ${COMMITTEE_LABELS[step.committee_type]}`,
            message: `${cName(curriculum)} ผ่านการพิจารณา ขั้นตอนถัดไป: ${COMMITTEE_LABELS[nextStep.committee_type]}`,
            type: 'success',
            curriculum_id: curriculum.id
          })), { transaction: t });
        }
        if (emails.length > 0) sendEmail = () => emailService.sendCommitteeStepApproved(
          emails, curriculum, COMMITTEE_LABELS[step.committee_type], COMMITTEE_LABELS[nextStep.committee_type]
        ).catch(err => console.error('[Email] sendCommitteeStepApproved failed:', err.message));
      } else {
        curriculum.status = CURRICULUM_STATUS.APPROVED;
        curriculum.current_committee_step_id = null;
        await curriculum.save({ transaction: t });
        if (teamUserIds.length > 0) {
          await Notification.bulkCreate(teamUserIds.map(uid => ({
            user_id: uid,
            title: 'ยินดีด้วย — หลักสูตรได้รับการอนุมัติแล้ว',
            message: `${cName(curriculum)} ได้รับการเห็นชอบจาก สป.อว. (CISA) เรียบร้อยแล้ว`,
            type: 'success',
            curriculum_id: curriculum.id
          })), { transaction: t });
        }
        if (emails.length > 0) sendEmail = () => emailService.sendFinalApproved(emails, curriculum)
          .catch(err => console.error('[Email] sendFinalApproved failed:', err.message));
      }
    } else if (status === COMMITTEE_STATUS.REVISION) {
      curriculum.status = CURRICULUM_STATUS.REVISION;
      curriculum.current_committee_step_id = step.id;
      curriculum.revision_deadline = revision_deadline || null;
      await curriculum.save({ transaction: t });

      if (teamUserIds.length > 0) {
        await Notification.bulkCreate(teamUserIds.map(uid => ({
          user_id: uid,
          title: `มติแก้ไข — ${COMMITTEE_LABELS[step.committee_type]}`,
          message: `${cName(curriculum)} ต้องดำเนินการแก้ไขตามมติคณะกรรมการ`,
          type: 'warning',
          curriculum_id: curriculum.id
        })), { transaction: t });
      }
      if (emails.length > 0) sendEmail = () => emailService.sendCommitteeRevision(
        emails, curriculum, COMMITTEE_LABELS[step.committee_type], notes, revision_deadline || null
      ).catch(err => console.error('[Email] sendCommitteeRevision failed:', err.message));
    }

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: `COMMITTEE_${status.toUpperCase()}`,
      details: { committee_type: step.committee_type, step_order: step.step_order, notes, linked_count: docIds.length },
      ip_address: req.ip
    }, { transaction: t });

    await t.commit();
    sendEmail(); // side effect — ส่งหลัง commit สำเร็จเท่านั้น (กันส่งเมลแล้ว DB rollback)
    res.json({ success: true, message: 'บันทึกมติสำเร็จ' });
  } catch (error) {
    await t.rollback();
    cleanupFiles();
    next(error);
  }
};

exports.resubmitAfterRevision = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, { include: ['team'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const allowed = await canAccessCurriculum(req.user, {
        departmentId: curriculum.department_id, team: curriculum.team,
      });
      if (!allowed) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    if (curriculum.status !== CURRICULUM_STATUS.REVISION) {
      return res.status(409).json({ success: false, message: `ไม่สามารถดำเนินการได้ (สถานะปัจจุบัน: ${curriculum.status})` });
    }

    // ส่งไปรอตรวจสอบจากงานหลักสูตรก่อน — ยังไม่รีเซ็ต step จนกว่า admin จะอนุมัติ
    curriculum.status = CURRICULUM_STATUS.PENDING_ADMIN_RECHECK;
    await curriculum.save();

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: 'RESUBMIT_AFTER_REVISION',
      details: { resume_step_id: curriculum.current_committee_step_id },
      ip_address: req.ip
    });

    // แจ้ง admin ทุกคน
    const admins = await User.findAll({ where: { role: ROLES.ADMIN, is_active: true }, attributes: ['id', 'email'] });
    if (admins.length > 0) {
      await Notification.bulkCreate(admins.map(admin => ({
        user_id: admin.id,
        title: 'หลักสูตรส่งคืนหลังแก้ไข — รอตรวจสอบ',
        message: `${cName(curriculum)} ได้รับการแก้ไขตามมติคณะกรรมการแล้ว กรุณาตรวจสอบเอกสารก่อนนำเข้าที่ประชุม`,
        type: 'warning',
        curriculum_id: curriculum.id
      })));
      emailService.sendAdminRecheckRequest?.(admins.map(a => a.email), curriculum)
        ?.catch(err => console.error('[Email] sendAdminRecheckRequest failed:', err.message));
    }

    res.json({ success: true, message: 'ส่งให้งานหลักสูตรตรวจสอบสำเร็จ' });
  } catch (error) { next(error); }
};

exports.getSteps = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const curriculum = await Curriculum.findByPk(req.params.curriculum_id, { attributes: ['id', 'department_id'] });
      if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
      const allowed = await canAccessCurriculum(req.user, {
        departmentId: curriculum.department_id, curriculumId: curriculum.id,
      });
      if (!allowed) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    const steps = await CommitteeStep.findAll({
      where: { curriculum_id: req.params.curriculum_id },
      include: [{
        model: CommitteeDocument,
        as: 'documents',
        include: [{
          model: Document,
          as: 'source_document',
          attributes: ['id', 'original_name', 'file_type']
        }]
      }],
      order: [['step_order', 'ASC']]
    });
    res.json({ success: true, data: steps });
  } catch (error) { next(error); }
};

exports.getDownloads = async (req, res, next) => {
  try {
    const serviceUnitId = await getServiceUnitDeptId();

    // กลุ่ม 1: มติคณะกรรมการตรวจวิชาศึกษาทั่วไป (ป.ตรี) — ยกเว้นหลักสูตรของงานบริการ (แสดงแยกเป็น workspace)
    const geCurriculumWhere = { degree_level: 'bachelor' };
    if (serviceUnitId) geCurriculumWhere.department_id = { [Op.ne]: serviceUnitId };

    const steps = await CommitteeStep.findAll({
      where: { committee_type: 'general_education' },
      include: [
        {
          model: Curriculum,
          as: 'curriculum',
          where: geCurriculumWhere,
          attributes: ['id', 'degree_name', 'field_of_study', 'curriculum_year', 'degree_level', 'curriculum_type'],
          include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
        },
        {
          model: CommitteeDocument,
          as: 'documents',
          attributes: ['id', 'original_name', 'stored_name', 'source_type']
        }
      ],
      order: [['decision_date', 'DESC']]
    });

    const committeeItems = steps.map(s => ({
      id: `step-${s.id}`,
      source: 'committee',
      decision_date: s.decision_date,
      meeting_number: s.meeting_number,
      curriculum: s.curriculum,
      documents: (s.documents || []).map(d => ({ id: d.id, original_name: d.original_name })),
    }));

    // กลุ่ม 2: หลักสูตรของงานบริการการศึกษา ทุกระดับ (รวม โท/เอก) — เอกสาร workspace ทั้งหมด
    let serviceItems = [];
    if (serviceUnitId) {
      const serviceCurricula = await Curriculum.findAll({
        where: { department_id: serviceUnitId },
        attributes: ['id', 'degree_name', 'field_of_study', 'curriculum_year', 'degree_level', 'curriculum_type'],
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name'] },
          {
            model: Document, as: 'documents', required: false,
            where: { is_deleted: false },
            attributes: ['id', 'original_name', 'file_type', 'file_size']
          }
        ],
        order: [['id', 'DESC']]
      });

      serviceItems = serviceCurricula.map(c => ({
        id: `curr-${c.id}`,
        source: 'workspace',
        decision_date: null,
        meeting_number: null,
        curriculum: {
          id: c.id,
          degree_name: c.degree_name,
          field_of_study: c.field_of_study,
          curriculum_year: c.curriculum_year,
          degree_level: c.degree_level,
          curriculum_type: c.curriculum_type,
          department: c.department,
        },
        documents: (c.documents || []).map(d => ({
          id: d.id, original_name: d.original_name, file_type: d.file_type, file_size: d.file_size,
        })),
      }));
    }

    res.json({ success: true, data: [...serviceItems, ...committeeItems] });
  } catch (error) { next(error); }
};

const fs = require('fs');

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await CommitteeDocument.findByPk(req.params.id, {
      include: [{
        model: CommitteeStep, as: 'step', attributes: ['id', 'committee_type'],
        include: [{ model: Curriculum, as: 'curriculum', attributes: ['id', 'department_id', 'degree_level'] }]
      }]
    });
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    // ── ตรวจสิทธิ์เข้าถึง (กัน IDOR) ──────────────────────────────────────────
    const curriculum = doc.step?.curriculum;
    const role = req.user.role;
    if (role === ROLES.EXECUTIVE) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' });
    }
    if (role === ROLES.REGISTRAR) {
      // registrar เห็นได้เฉพาะมติขั้น general_education หรือเอกสารของงานบริการการศึกษา
      const serviceUnitId = await getServiceUnitDeptId();
      const isGE = doc.step?.committee_type === 'general_education';
      const isServiceUnit = serviceUnitId != null && curriculum?.department_id === serviceUnitId;
      if (!isGE && !isServiceUnit) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' });
      }
    } else if (role === ROLES.FACULTY || role === ROLES.STAFF) {
      const allowed = await canAccessCurriculum(req.user, {
        departmentId: curriculum?.department_id, curriculumId: curriculum?.id,
      });
      if (!allowed) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' });
    }


    // source_type: 'workspace' ใช้ path uploads/documents
    // source_type: 'upload' ใช้ path uploads/committee
    const folder = doc.source_type === 'workspace' ? 'documents' : 'committee';
    const filePath = path.join(__dirname, `../../uploads/${folder}`, doc.stored_name);
    
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });
    
    const filename = Buffer.from(doc.original_name, 'utf8').toString('binary');
    const encodedFilename = encodeURIComponent(doc.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
    res.download(filePath);
  } catch (error) { next(error); }
};
