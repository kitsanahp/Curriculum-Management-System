const { Department } = require('../src/models');

// ภาควิชา/หน่วยงานตั้งต้นของคณะวิทยาศาสตร์ — จำเป็นตั้งแต่หน้าสมัครสมาชิก
// (dropdown "สังกัดภาควิชา/หน่วยงาน" อ่านจากตารางนี้ DB ใหม่ต้องมีข้อมูลทันที)
const SEED = [
  { name: 'ภาควิชาคณิตศาสตร์', code: 'MATH' },
  { name: 'ภาควิชาเคมี', code: 'CHEM' },
  { name: 'ภาควิชาชีววิทยา', code: 'BIO' },
  { name: 'ภาควิชาฟิสิกส์', code: 'PHYS' },
  { name: 'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ', code: 'CSIT' },
  { name: 'งานบริการการศึกษา', code: 'EDU' },
];

/**
 * Seed ภาควิชาเริ่มต้น แบบ idempotent
 * - seed เฉพาะครั้งแรกที่ตารางยังว่าง — แอดมินแก้/ลบทีหลังได้ ไม่ถูก seed ทับ
 */
async function seedDepartments() {
  const count = await Department.count();
  if (count > 0) return;

  await Department.bulkCreate(SEED);
  console.log(`[Seed] เพิ่มภาควิชาเริ่มต้น ${SEED.length} รายการ`);
}

module.exports = { seedDepartments };
