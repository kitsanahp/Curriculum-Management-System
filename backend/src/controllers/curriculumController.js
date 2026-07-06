const { Department, User, CurriculumTeam, Document, CommitteeStep } = require('../models');
const { ROLES } = require('../config/constants');
const { loadAuthorizedCurriculum } = require('../utils/curriculumAccess');
const curriculumService = require('../services/curriculumService');

// ข้อมูลผู้กระทำที่ service ต้องใช้ (audit + อีเมลผู้สร้าง)
const actorFrom = (req) => ({ id: req.user.id, email: req.user.email, ip: req.ip });

// include สำหรับหน้ารายละเอียด (โหลด team + steps + จำนวนเอกสารครบ)
const DETAIL_INCLUDE = [
  { model: Department, as: 'department' },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'academic_position'] },
  { model: CurriculumTeam, as: 'team' },
  { model: Document, as: 'documents', attributes: ['id'] },
  { model: CommitteeStep, as: 'committee_steps', order: [['step_order', 'ASC']] },
];

// ─── Read ─────────────────────────────────────────────────────────────────────

exports.getAll = async (req, res, next) => {
  try {
    const { data, meta } = await curriculumService.listCurricula(req.user, req.query);
    const body = { success: true, data };
    if (meta) body.meta = meta;
    res.json(body);
  } catch (error) { next(error); }
};

exports.getYears = async (req, res, next) => {
  try {
    const years = await curriculumService.listCurriculumYears(req.user);
    res.json({ success: true, data: years });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, {
      include: DETAIL_INCLUDE, checkRegistrar: true,
    });
    res.json({ success: true, data: curriculum });
  } catch (error) { next(error); }
};

exports.getTimeline = async (req, res, next) => {
  try {
    // faculty/staff ต้องผ่านการตรวจสิทธิ์ก่อน — role อื่นดู timeline ได้เลย (คง behavior เดิม)
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      await loadAuthorizedCurriculum(req, { attributes: ['id', 'department_id'] });
    }
    const timeline = await curriculumService.buildTimeline(req.params.id);
    res.json({ success: true, data: timeline });
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    await loadAuthorizedCurriculum(req, { attributes: ['id', 'department_id'] });
    const { data, meta } = await curriculumService.listAuditLogs(req.params.id, req.query);
    res.json({ success: true, data, meta });
  } catch (error) { next(error); }
};

exports.getArchived = async (req, res, next) => {
  try {
    const curricula = await curriculumService.listArchived();
    res.json({ success: true, data: curricula });
  } catch (error) { next(error); }
};

// ─── Create / Update ────────────────────────────────────────────────────────

exports.create = async (req, res, next) => {
  try {
    const created = await curriculumService.createCurriculum(req.body, actorFrom(req));
    res.status(201).json({ success: true, data: created, message: 'สร้างหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req);
    const updated = await curriculumService.updateCurriculumInfo(curriculum, req.body, actorFrom(req));
    res.json({ success: true, data: updated, message: 'อัปเดตหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

exports.updateTeam = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req);
    const team = await curriculumService.updateCurriculumTeam(curriculum, req.body.team, actorFrom(req));
    res.json({ success: true, data: team, message: 'อัปเดตทีมสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Workflow actions ─────────────────────────────────────────────────────────

exports.submitByDepartment = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, { include: ['team', 'department'] });
    await curriculumService.submitByDepartment(curriculum, actorFrom(req));
    res.json({ success: true, message: 'ส่งหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

exports.rejectByAdmin = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, { include: ['team'] });
    await curriculumService.rejectByAdmin(curriculum, req.body, actorFrom(req));
    res.json({ success: true, message: 'ส่งกลับแก้ไขสำเร็จ' });
  } catch (error) { next(error); }
};

exports.approveByAdmin = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, {
      include: [
        { model: CommitteeStep, as: 'committee_steps' },
        { model: CurriculumTeam, as: 'team' },
      ],
    });
    await curriculumService.approveByAdmin(curriculum, actorFrom(req));
    res.json({ success: true, message: 'อนุมัติและส่งต่อคณะกรรมการสำเร็จ' });
  } catch (error) { next(error); }
};

exports.approveRecheck = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, { include: ['team'] });
    await curriculumService.approveRecheck(curriculum, actorFrom(req));
    res.json({ success: true, message: 'ผ่านการตรวจสอบ — ส่งกลับคณะกรรมการสำเร็จ' });
  } catch (error) { next(error); }
};

exports.rejectRecheck = async (req, res, next) => {
  try {
    const curriculum = await loadAuthorizedCurriculum(req, { include: ['team'] });
    await curriculumService.rejectRecheck(curriculum, req.body, actorFrom(req));
    res.json({ success: true, message: 'ส่งกลับแก้ไขสำเร็จ' });
  } catch (error) { next(error); }
};

// ─── Delete / Restore ─────────────────────────────────────────────────────────

exports.delete = async (req, res, next) => {
  try {
    await curriculumService.softDelete(req.params.id, actorFrom(req));
    res.json({ success: true, message: 'ลบหลักสูตรสำเร็จ (Soft Delete)' });
  } catch (error) { next(error); }
};

exports.restore = async (req, res, next) => {
  try {
    await curriculumService.restore(req.params.id, actorFrom(req));
    res.json({ success: true, message: 'กู้คืนหลักสูตรสำเร็จ' });
  } catch (error) { next(error); }
};

exports.forceDelete = async (req, res, next) => {
  try {
    await curriculumService.forceDelete(req.params.id, actorFrom(req));
    res.json({ success: true, message: 'ลบหลักสูตรถาวรสำเร็จ' });
  } catch (error) { next(error); }
};

exports.forceDeleteAll = async (req, res, next) => {
  try {
    const count = await curriculumService.forceDeleteAll(actorFrom(req));
    res.json({ success: true, message: `ลบหลักสูตรถาวรทั้งหมด ${count} รายการสำเร็จ`, count });
  } catch (error) { next(error); }
};
