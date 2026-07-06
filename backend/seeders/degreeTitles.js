const { DegreeTitle } = require('../src/models');

// ชื่อวุฒิเริ่มต้น — ย้ายจาก hardcode ใน frontend (CurriculumCreateView) ลง DB ให้แอดมินเพิ่ม/แก้/ลบได้
const SEED = [
  { degree_level: 'bachelor', name: 'วิทยาศาสตรบัณฑิต',      abbr: 'วท.บ.' },
  { degree_level: 'master',   name: 'วิทยาศาสตรมหาบัณฑิต',  abbr: 'วท.ม.' },
  { degree_level: 'doctoral', name: 'ปรัชญาดุษฎีบัณฑิต',     abbr: 'ปร.ด.' },
];

/**
 * Seed ชื่อวุฒิเริ่มต้น แบบ idempotent
 * - seed เฉพาะครั้งแรกที่ตารางยังว่าง — ถ้าแอดมินลบรายการใด จะไม่ถูก seed กลับมา
 */
async function seedDegreeTitles() {
  const count = await DegreeTitle.count();
  if (count > 0) return;
  await DegreeTitle.bulkCreate(SEED);
  console.log(`[Seed] เพิ่มชื่อวุฒิเริ่มต้น ${SEED.length} รายการ`);
}

module.exports = { seedDegreeTitles };
