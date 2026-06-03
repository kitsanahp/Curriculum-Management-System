const path = require('path');
const {
  CommitteeStep, CommitteeDocument, Curriculum, Document, AuditLog, Notification, User, Department
} = require('../models');
const { COMMITTEE_STATUS, CURRICULUM_STATUS, COMMITTEE_LABELS, ROLES } = require('../config/constants');
const emailService = require('../services/emailService');
const { resolveTeamEmails, resolveTeamUserIds } = require('../utils/teamEmailLookup');

const cName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '';

exports.uploadDecision = async (req, res, next) => {
  try {
    const { step_id } = req.params;
    const { status, decision_date, meeting_number, notes, linked_document_ids, revision_deadline } = req.body;

    const step = await CommitteeStep.findByPk(step_id, { include: ['curriculum'] });
    if (!step) return res.status(404).json({ success: false, message: 'ไม่พบขั้นตอนคณะกรรมการ' });

    step.status = status;
    if (decision_date) step.decision_date = decision_date;
    if (meeting_number) step.meeting_number = meeting_number;
    if (notes) step.notes = notes;
    step.uploaded_by = req.user.id;
    await step.save();

    // คำนวณ round ถัดไปสำหรับ step นี้
    const existingDocs = await CommitteeDocument.findAll({
      where: { committee_step_id: step.id },
      attributes: ['round'],
      raw: true
    });
    const maxRound = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.round)) : 0;
    const nextRound = maxRound + 1;

    // อัปโหลดไฟล์ใหม่ (source_type: upload)
    if (req.file) {
      await CommitteeDocument.create({
        committee_step_id: step.id,
        original_name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        stored_name: req.file.filename,
        uploaded_by: req.user.id,
        source_type: 'upload',
        round: nextRound
      });
    }

    // เชื่อมเอกสารจาก workspace (source_type: workspace)
    const docIds = (() => {
      try { return JSON.parse(linked_document_ids || '[]'); } catch { return []; }
    })();
    if (docIds.length > 0) {
      const docs = await Document.findAll({
        where: { id: docIds, is_deleted: false },
        attributes: ['id', 'original_name', 'stored_name']
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
        })));
      }
    }

    const curriculum = step.curriculum;

    if (curriculum.status !== CURRICULUM_STATUS.UNDER_COMMITTEE) {
      return res.status(409).json({ success: false, message: `ไม่สามารถบันทึกมติสำหรับหลักสูตรที่มีสถานะ "${curriculum.status}" ได้` });
    }

    if (status === COMMITTEE_STATUS.APPROVED) {
      const nextStep = await CommitteeStep.findOne({
        where: { curriculum_id: curriculum.id, step_order: step.step_order + 1 }
      });

      const team = await curriculum.getTeam();
      const emails = await resolveTeamEmails(team);
      const teamUserIds = await resolveTeamUserIds(team);

      if (nextStep) {
        curriculum.current_committee_step_id = nextStep.id;
        await curriculum.save();
        if (emails.length > 0) {
          emailService.sendCommitteeStepApproved(
            emails, curriculum,
            COMMITTEE_LABELS[step.committee_type],
            COMMITTEE_LABELS[nextStep.committee_type]
          ).catch(err => console.error('[Email] sendCommitteeStepApproved failed:', err.message));
        }
        if (teamUserIds.length > 0) {
          await Notification.bulkCreate(teamUserIds.map(uid => ({
            user_id: uid,
            title: `มติเห็นชอบ — ${COMMITTEE_LABELS[step.committee_type]}`,
            message: `${cName(curriculum)} ผ่านการพิจารณา ขั้นตอนถัดไป: ${COMMITTEE_LABELS[nextStep.committee_type]}`,
            type: 'success',
            curriculum_id: curriculum.id
          })));
        }
      } else {
        curriculum.status = CURRICULUM_STATUS.APPROVED;
        curriculum.current_committee_step_id = null;
        await curriculum.save();
        if (emails.length > 0) {
          emailService.sendFinalApproved(emails, curriculum)
            .catch(err => console.error('[Email] sendFinalApproved failed:', err.message));
        }
        if (teamUserIds.length > 0) {
          await Notification.bulkCreate(teamUserIds.map(uid => ({
            user_id: uid,
            title: 'ยินดีด้วย — หลักสูตรได้รับการอนุมัติแล้ว',
            message: `${cName(curriculum)} ได้รับการเห็นชอบจาก สป.อว. (CISA) เรียบร้อยแล้ว`,
            type: 'success',
            curriculum_id: curriculum.id
          })));
        }
      }
    } else if (status === COMMITTEE_STATUS.REVISION) {
      curriculum.status = CURRICULUM_STATUS.REVISION;
      curriculum.current_committee_step_id = step.id;
      curriculum.revision_deadline = revision_deadline || null;
      await curriculum.save();

      const team = await curriculum.getTeam();
      const emails = await resolveTeamEmails(team);
      const teamUserIds = await resolveTeamUserIds(team);
      if (emails.length > 0) {
        emailService.sendCommitteeRevision(emails, curriculum, COMMITTEE_LABELS[step.committee_type], notes, revision_deadline || null)
          .catch(err => console.error('[Email] sendCommitteeRevision failed:', err.message));
      }
      if (teamUserIds.length > 0) {
        await Notification.bulkCreate(teamUserIds.map(uid => ({
          user_id: uid,
          title: `มติแก้ไข — ${COMMITTEE_LABELS[step.committee_type]}`,
          message: `${cName(curriculum)} ต้องดำเนินการแก้ไขตามมติคณะกรรมการ`,
          type: 'warning',
          curriculum_id: curriculum.id
        })));
      }
    }

    await AuditLog.create({
      curriculum_id: curriculum.id, user_id: req.user.id,
      action: `COMMITTEE_${status.toUpperCase()}`,
      details: { committee_type: step.committee_type, step_order: step.step_order, notes, linked_count: docIds.length },
      ip_address: req.ip
    });

    res.json({ success: true, message: 'บันทึกมติสำเร็จ' });
  } catch (error) { next(error); }
};

exports.resubmitAfterRevision = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id, { include: ['team'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
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
    const steps = await CommitteeStep.findAll({
      where: { committee_type: 'general_education' },
      include: [
        {
          model: Curriculum,
          as: 'curriculum',
          where: { degree_level: 'bachelor' },
          attributes: ['id', 'degree_name', 'field_of_study', 'curriculum_year', 'degree_level'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: CommitteeDocument,
          as: 'documents',
          attributes: ['id', 'original_name', 'stored_name', 'source_type']
        }
      ],
      order: [['decision_date', 'DESC']]
    });
    res.json({ success: true, data: steps });
  } catch (error) { next(error); }
};

const fs = require('fs');

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await CommitteeDocument.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });
    
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
