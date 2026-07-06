/**
 * ประกอบชื่อผู้ใช้แบบเต็มยศสำหรับ "แสดงผล" (ไม่เก็บลง DB — ประกอบสดทุกครั้ง)
 *
 * - `name` ใน DB เก็บ "[คำนำหน้า] ชื่อ นามสกุล" อยู่แล้ว (ฝังตอนสมัคร เช่น "ดร. สมชาย รักเรียน")
 * - `academic_position` (อาจารย์ / ผศ. / รศ. / ศ.) เก็บแยก → เลื่อนยศแล้วชื่อที่แสดงอัปเดตเอง
 *
 * กฎการเว้นวรรค:
 * - ยศย่อที่ลงท้ายด้วย "." (ผศ./รศ./ศ.) → ต่อชิดชื่อ  เช่น "ผศ." + "ดร. สมชาย" = "ผศ.ดร. สมชาย"
 * - ยศเต็ม (อาจารย์) → เว้นวรรค                 เช่น "อาจารย์" + "ดร. สมชาย" = "อาจารย์ ดร. สมชาย"
 *
 * @param {{ name?: string, academic_position?: string }|null|undefined} user
 * @returns {string}
 */

const SHORT_ACADEMIC_POSITIONS = {
  'ศาสตราจารย์': 'ศ.',
  'รองศาสตราจารย์': 'รศ.',
  'ผู้ช่วยศาสตราจารย์': 'ผศ.'
};

export function formatUserName(user) {
  if (!user) return '';
  const name = user.name || '';
  let ap = (user.academic_position || '').trim();
  
  if (!ap) return name;

  // แปลงตำแหน่งทางวิชาการแบบเต็มเป็นตัวย่อ
  ap = SHORT_ACADEMIC_POSITIONS[ap] || ap;

  const sep = ap.endsWith('.') ? '' : ' ';
  return `${ap}${sep}${name}`;
}
