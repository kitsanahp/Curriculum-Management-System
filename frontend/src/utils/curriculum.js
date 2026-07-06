/**
 * ชื่อหลักสูตรสำหรับแสดงผล
 * รวม pattern: c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ'
 */
export function formatCurriculumName(curriculum, fallback = 'ไม่ระบุชื่อ') {
  if (!curriculum) return fallback;
  return curriculum.field_of_study
    ? `สาขาวิชา${curriculum.field_of_study}`
    : curriculum.degree_name || fallback;
}

/** "ตรี" / "โท" / "เอก" */
const DEGREE_LABELS = { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' };
export function formatDegreeLabel(degreeLevel) {
  return DEGREE_LABELS[degreeLevel] ?? '-';
}

/**
 * แสดงวันที่เหลือ/เกิน
 * รวม pattern: daysLeft < 0 ? `เกิน X วัน` : daysLeft === 0 ? 'วันนี้' : `X วัน`
 */
export function formatDaysLeft(daysLeft) {
  if (daysLeft < 0) return `เกิน ${Math.abs(daysLeft)} วัน`;
  if (daysLeft === 0) return 'วันนี้';
  return `${daysLeft} วัน`;
}

/**
 * วงรอบการปรับปรุงหลักสูตร — มาตรฐาน 5 ปีการศึกษา
 * สร้างปี Y (พ.ศ.) → ครบวงรอบปี Y+4 (นับ 5 ปีรวมปีแรก เช่น 2570 → 2574)
 *
 * @param {string|number} curriculumYear  ปีหลักสูตร พ.ศ. เช่น "2570"
 * @returns {{ startYear:number, dueYear:number, currentYear:number,
 *            yearsLeft:number, isDue:boolean } | null}
 *          คืน null ถ้าปีไม่ถูกต้อง (parse ไม่ได้)
 */
export const CURRICULUM_CYCLE_YEARS = 5;
export function getRevisionCycle(curriculumYear) {
  const start = parseInt(curriculumYear, 10);
  if (!Number.isFinite(start)) return null;
  const dueYear = start + (CURRICULUM_CYCLE_YEARS - 1);     // Y+4
  const currentYear = new Date().getFullYear() + 543;       // CE → พ.ศ.
  const yearsLeft = dueYear - currentYear;                  // < 0 = เลยกำหนด
  return { startYear: start, dueYear, currentYear, yearsLeft, isDue: yearsLeft <= 0 };
}

/**
 * สร้าง conic-gradient style สำหรับ donut chart
 * รวม adminDonutStyle / facultyDonutStyle / donutStyle ที่ logic เหมือนกัน
 *
 * @param {{ hex: string, count: number }[]} segments
 * @param {number} total
 */
export function buildDonutStyle(segments, total) {
  if (!total || !segments.length) return { background: '#f1f5f9' };
  let pct = 0;
  const stops = segments.map(s => {
    const from = pct.toFixed(2);
    pct += (s.count / total) * 100;
    return `${s.hex} ${from}% ${pct.toFixed(2)}%`;
  });
  return { background: `conic-gradient(from -90deg, ${stops.join(', ')})` };
}
