const { Major, Department } = require('../src/models');

// สาขาวิชาเริ่มต้น — ย้ายจาก hardcode ใน frontend (constants/departments.js DEPARTMENT_MAJORS)
// ลง DB ให้แอดมินเพิ่ม/แก้/ลบได้เอง
const SEED = {
  bachelor: {
    'ภาควิชาคณิตศาสตร์': ['คณิตศาสตร์', 'สถิติ', 'วิทยาการข้อมูลและการวิเคราะห์'],
    'ภาควิชาเคมี': ['เคมี'],
    'ภาควิชาชีววิทยา': ['ชีววิทยา'],
    'ภาควิชาฟิสิกส์': ['ฟิสิกส์', 'ฟิสิกส์ประยุกต์', 'เทคโนโลยีนวัตกรรมพลังงานและสิ่งแวดล้อม', 'เทคโนโลยีการวัดและระบบอัจฉริยะ'],
    'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ': ['วิทยาการคอมพิวเตอร์', 'เทคโนโลยีสารสนเทศ'],
  },
  master: {
    'ภาควิชาคณิตศาสตร์': ['คณิตศาสตร์', 'สถิติ'],
    'ภาควิชาเคมี': ['เคมี', 'เคมีอุตสาหกรรม'],
    'ภาควิชาชีววิทยา': ['เทคโนโลยีชีวภาพ', 'วิทยาศาสตร์ชีวภาพ'],
    'ภาควิชาฟิสิกส์': ['ฟิสิกส์', 'ฟิสิกส์ประยุกต์'],
    'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ': ['วิทยาการคอมพิวเตอร์', 'เทคโนโลยีสารสนเทศ', 'วิทยาการข้อมูลและการเรียนรู้ของเครื่อง'],
  },
  doctoral: {
    'ภาควิชาคณิตศาสตร์': ['คณิตศาสตร์', 'สถิติ'],
    'ภาควิชาเคมี': ['เคมี'],
    'ภาควิชาชีววิทยา': ['เทคโนโลยีชีวภาพ'],
    'ภาควิชาฟิสิกส์': ['ฟิสิกส์', 'ฟิสิกส์ประยุกต์'],
    'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ': ['วิทยาการคอมพิวเตอร์', 'เทคโนโลยีสารสนเทศ'],
  },
};

/**
 * Seed สาขาวิชาเริ่มต้น แบบ idempotent
 * - seed เฉพาะครั้งแรกที่ตารางยังว่าง — ถ้าแอดมินลบรายการใด จะไม่ถูก seed กลับมา
 * - ภาควิชาที่ยังไม่มีในระบบจะถูกข้าม (ไว้ seed รอบถัดไปเมื่อภาควิชาถูกสร้าง)
 */
async function seedMajors() {
  const count = await Major.count();
  if (count > 0) return;

  const departments = await Department.findAll();
  const byName = new Map(departments.map(d => [d.name, d.id]));

  const rows = [];
  for (const [level, deptMap] of Object.entries(SEED)) {
    for (const [deptName, majors] of Object.entries(deptMap)) {
      const deptId = byName.get(deptName);
      if (!deptId) continue;
      for (const name of majors) rows.push({ department_id: deptId, degree_level: level, name });
    }
  }
  if (!rows.length) return;
  await Major.bulkCreate(rows);
  console.log(`[Seed] เพิ่มสาขาวิชาเริ่มต้น ${rows.length} รายการ`);
}

module.exports = { seedMajors };
