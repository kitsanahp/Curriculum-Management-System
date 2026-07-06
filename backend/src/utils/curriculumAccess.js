const { sequelize, Curriculum, CurriculumTeam } = require('../models');
const { ROLES } = require('../config/constants');
const { getServiceUnitDeptId, registrarCanAccess } = require('./registrarAccess');
const ApiError = require('./apiError');

/**
 * Role scope สำหรับการ "เห็น/เข้าถึง" หลักสูตร แยกระหว่าง 2 บทบาทฝั่งสาขา:
 *
 * - อาจารย์ (FACULTY) → เห็นเฉพาะหลักสูตรที่ตนมีชื่ออยู่ในทีม (team.email == user.email)
 * - เจ้าหน้าที่สาขา (STAFF) → เห็นทุกหลักสูตรในภาควิชา/สาขาของตน (department_id)
 *
 * บทบาทอื่น (admin/executive/registrar) ใช้เงื่อนไขเฉพาะของ caller เอง
 */

const sameEmail = (a, b) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * ตรวจสิทธิ์เข้าถึงหลักสูตรหนึ่ง ๆ สำหรับ faculty/staff
 * รองรับทั้งกรณีที่ team ถูก include มาแล้ว (ส่ง team) หรือยังไม่โหลด (ส่ง curriculumId แล้ว query ให้)
 *
 * @param {object} user        req.user (role, email, department_id)
 * @param {object} target      { departmentId, curriculumId, team }
 * @returns {Promise<boolean>}
 */
async function canAccessCurriculum(user, { departmentId, curriculumId, team } = {}) {
  if (user.role === ROLES.STAFF) {
    // กัน null === null (staff ที่ยังไม่ผูกสังกัด เข้าถึงหลักสูตรที่ไม่มีภาควิชาไม่ได้)
    return user.department_id != null && departmentId === user.department_id;
  }
  if (user.role === ROLES.FACULTY) {
    if (Array.isArray(team)) {
      return team.some(m => sameEmail(m.email, user.email));
    }
    if (!curriculumId) return false;
    const member = await CurriculumTeam.findOne({
      where: { curriculum_id: curriculumId, email: user.email },
      attributes: ['id'],
    });
    return !!member;
  }
  return true; // role อื่นไม่ถูกจำกัดด้วย helper นี้
}

/**
 * ตรวจสิทธิ์ "เข้าถึงเอกสาร/ทรัพยากรของหลักสูตรหนึ่ง ๆ" แบบครบทุก role ในที่เดียว
 * ใช้เป็นด่านกลางสำหรับ endpoint ที่ resource ผูกกับหลักสูตร (download/preview/annotation)
 *
 *   admin     → เข้าถึงได้ทุกหลักสูตร
 *   executive → ไม่ได้ (view-only dashboard เท่านั้น)
 *   registrar → เฉพาะหลักสูตรที่ผ่านเงื่อนไขงานบริการ/ศึกษาทั่วไป (registrarCanAccess)
 *   faculty   → เฉพาะหลักสูตรที่ตนอยู่ในทีม
 *   staff     → เฉพาะหลักสูตรในภาควิชาตน
 *
 * รวม logic ที่เดิมกระจายอยู่ตาม controller (canReadCurriculumFile ฯลฯ) ไว้จุดเดียว
 * เพื่อกัน drift — แก้/เพิ่ม role ที่นี่ที่เดียว ทุก endpoint ได้เหมือนกันหมด
 *
 * @param {object} user        req.user
 * @param {object} curriculum  instance ที่มีอย่างน้อย { id, department_id, degree_level }
 * @returns {Promise<boolean>}
 */
async function canAccessCurriculumFile(user, curriculum) {
  if (!curriculum) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.EXECUTIVE) return false;
  if (user.role === ROLES.REGISTRAR) {
    return registrarCanAccess(curriculum, await getServiceUnitDeptId());
  }
  // faculty / staff
  return canAccessCurriculum(user, {
    departmentId: curriculum.department_id,
    curriculumId: curriculum.id,
  });
}

/**
 * เงื่อนไข where สำหรับ list query ของ faculty/staff
 * - staff → กรองด้วย department_id
 * - faculty → กรองด้วย team.email (ต้อง include alias 'team' เมื่อ needsTeam === true)
 * - role อื่น → คืน null (ไม่จำกัด scope)
 *
 * @param {object} user req.user
 * @returns {{ condition: object, needsTeam: boolean } | null}
 */
function listScope(user) {
  if (user.role === ROLES.STAFF) {
    return { condition: { department_id: user.department_id }, needsTeam: false };
  }
  if (user.role === ROLES.FACULTY) {
    return {
      condition: sequelize.where(sequelize.col('team.email'), user.email),
      needsTeam: true,
    };
  }
  return null;
}

/**
 * โหลดหลักสูตรตาม req.params.id + ตรวจสิทธิ์การเข้าถึงในก้าวเดียว
 *
 * รวม 3 อย่างที่เดิมเขียนซ้ำในแทบทุก handler ของ curriculumController:
 *   1. Curriculum.findByPk(...)
 *   2. โยน 404 ถ้าไม่พบ
 *   3. ตรวจสิทธิ์ faculty/staff (canAccessCurriculum) และ registrar (ถ้าเปิด checkRegistrar)
 *
 * @param {object} req                  Express req (ใช้ req.params.id, req.user)
 * @param {object} [opts]
 * @param {Array|object} [opts.include] include ส่งต่อ findByPk (เช่น ['team'])
 * @param {Array} [opts.attributes]     attributes ส่งต่อ findByPk (เช่น ['id','department_id'])
 * @param {boolean} [opts.checkRegistrar=false] ตรวจสิทธิ์ registrar ด้วยหรือไม่
 *        (เปิดเฉพาะ endpoint ที่ registrar เข้าถึงได้ เช่น getById — endpoint อื่น
 *         registrar ถูกกันด้วย route authorize อยู่แล้ว จึงคง behavior เดิมไว้)
 * @returns {Promise<object>} curriculum instance
 * @throws {ApiError} 404 ถ้าไม่พบ / 403 ถ้าไม่มีสิทธิ์
 */
async function loadAuthorizedCurriculum(req, { include, attributes, checkRegistrar = false } = {}) {
  const curriculum = await Curriculum.findByPk(req.params.id, { include, attributes });
  if (!curriculum) throw new ApiError(404, 'ไม่พบหลักสูตร');

  const { user } = req;
  if (user.role === ROLES.FACULTY || user.role === ROLES.STAFF) {
    // ส่งทั้ง team (ถ้า include มา) และ curriculumId — canAccessCurriculum
    // จะใช้ team ก่อนถ้าเป็น array ไม่งั้น fallback ไป query ด้วย curriculumId
    const allowed = await canAccessCurriculum(user, {
      departmentId: curriculum.department_id,
      curriculumId: curriculum.id,
      team: curriculum.team,
    });
    if (!allowed) throw new ApiError(403, 'ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้');
  }

  if (checkRegistrar && user.role === ROLES.REGISTRAR
      && !registrarCanAccess(curriculum, await getServiceUnitDeptId())) {
    throw new ApiError(403, 'ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้');
  }

  return curriculum;
}

module.exports = { canAccessCurriculum, canAccessCurriculumFile, listScope, sameEmail, loadAuthorizedCurriculum };
