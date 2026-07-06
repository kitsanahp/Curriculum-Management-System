const { Department } = require('../models');
const { DEGREE_LEVELS } = require('../config/constants');

/**
 * สิทธิ์การเข้าถึงหลักสูตรของ registrar (เจ้าหน้าที่กองบริการการศึกษา)
 *
 * registrar เห็นเอกสารได้ใน 2 กรณี:
 *   1. หลักสูตรปริญญาตรี ทุกภาควิชา (ผ่านคณะกรรมการตรวจวิชาศึกษาทั่วไป)
 *   2. หลักสูตรของ "งานบริการการศึกษา" ทุกระดับปริญญา (รวม โท/เอก ที่ไม่มีขั้น general_education)
 */

const SERVICE_UNIT_DEPT_NAME = 'งานบริการการศึกษา';
let _serviceUnitDeptId; // cache เฉพาะเมื่อพบแล้ว (id ไม่เปลี่ยน)

async function getServiceUnitDeptId() {
  if (_serviceUnitDeptId) return _serviceUnitDeptId;
  const dept = await Department.findOne({
    where: { name: SERVICE_UNIT_DEPT_NAME },
    attributes: ['id'],
  });
  if (dept) _serviceUnitDeptId = dept.id;
  return _serviceUnitDeptId || null;
}

// เงื่อนไข OR สำหรับ list query (ใช้กับ { [Op.or]: ... })
async function registrarScopeOr() {
  const serviceId = await getServiceUnitDeptId();
  const or = [{ degree_level: DEGREE_LEVELS.BACHELOR }];
  if (serviceId) or.push({ department_id: serviceId });
  return or;
}

// ตรวจสิทธิ์กับหลักสูตรเดี่ยว — ต้องมี degree_level + department_id
function registrarCanAccess(curriculum, serviceUnitId) {
  if (!curriculum) return false;
  return curriculum.degree_level === DEGREE_LEVELS.BACHELOR
    || (serviceUnitId != null && curriculum.department_id === serviceUnitId);
}

module.exports = { SERVICE_UNIT_DEPT_NAME, getServiceUnitDeptId, registrarScopeOr, registrarCanAccess };
