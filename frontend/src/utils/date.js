import dayjs from 'dayjs';

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// dayjs handles MySQL "YYYY-MM-DD HH:mm:ss", ISO 8601, Date objects, etc.
function _parse(date) {
  if (!date) return null;
  const d = dayjs(date);
  return d.isValid() ? d.toDate() : null;
}

/** "15 ธันวาคม 2568" */
export function formatThaiDate(date) {
  const d = _parse(date);
  if (!d) return '-';
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** "15 ธ.ค. 2568" */
export function formatThaiDateShort(date) {
  const d = _parse(date);
  if (!d) return '-';
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** "15 ธันวาคม 2568 เวลา 09:30 น." */
export function formatThaiDateTime(date) {
  const d = _parse(date);
  if (!d) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543} เวลา ${hh}:${mm} น.`;
}

/** "15/12/2568" */
export function formatThaiDateNumeric(date) {
  const d = _parse(date);
  if (!d) return '-';
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${mon}/${d.getFullYear() + 543}`;
}

/** Is the date before today? (เทียบระดับ "วัน" — วันครบกำหนดวันนี้ยังไม่ถือว่าเกิน) */
export function isOverdue(date) {
  const d = _parse(date);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

