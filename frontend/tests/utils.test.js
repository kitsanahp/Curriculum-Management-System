// Test: frontend utils (date / curriculum / user) — รันด้วย `npm test` (node --test)
import test from 'node:test';
import assert from 'node:assert/strict';

import { formatThaiDate, formatThaiDateNumeric, formatThaiDateShort, isOverdue } from '../src/utils/date.js';
import { formatCurriculumName, formatDegreeLabel, formatDaysLeft, getRevisionCycle, buildDonutStyle } from '../src/utils/curriculum.js';
import { formatUserName } from '../src/utils/user.js';

// ─── date utils ──────────────────────────────────────────────────────────────

test('formatThaiDate: แปลงเป็นวันที่ไทย พ.ศ.', () => {
  assert.equal(formatThaiDate('2026-01-15'), '15 มกราคม 2569');
  assert.equal(formatThaiDateShort('2026-01-15'), '15 ม.ค. 2569');
  assert.equal(formatThaiDateNumeric('2026-01-15'), '15/01/2569');
  assert.equal(formatThaiDate(null), '-');
  assert.equal(formatThaiDate('ไม่ใช่วันที่'), '-');
});

test('isOverdue: เทียบระดับวัน — วันครบกำหนด "วันนี้" ยังไม่เกิน', () => {
  const d = (offsetDays) => {
    const x = new Date();
    x.setDate(x.getDate() + offsetDays);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  assert.equal(isOverdue(d(-1)), true, 'เมื่อวาน = เกินกำหนด');
  assert.equal(isOverdue(d(0)), false, 'วันนี้ = ยังไม่เกิน');
  assert.equal(isOverdue(d(1)), false, 'พรุ่งนี้ = ยังไม่เกิน');
  assert.equal(isOverdue(null), false);
});

// ─── curriculum utils ────────────────────────────────────────────────────────

test('formatCurriculumName: ใช้สาขาก่อน แล้ว fallback ชื่อปริญญา', () => {
  assert.equal(formatCurriculumName({ field_of_study: 'เคมี' }), 'สาขาวิชาเคมี');
  assert.equal(formatCurriculumName({ degree_name: 'วท.บ.' }), 'วท.บ.');
  assert.equal(formatCurriculumName({}), 'ไม่ระบุชื่อ');
  assert.equal(formatCurriculumName(null), 'ไม่ระบุชื่อ');
});

test('formatDegreeLabel / formatDaysLeft', () => {
  assert.equal(formatDegreeLabel('bachelor'), 'ตรี');
  assert.equal(formatDegreeLabel('master'), 'โท');
  assert.equal(formatDegreeLabel('unknown'), '-');
  assert.equal(formatDaysLeft(-3), 'เกิน 3 วัน');
  assert.equal(formatDaysLeft(0), 'วันนี้');
  assert.equal(formatDaysLeft(5), '5 วัน');
});

test('getRevisionCycle: วงรอบ 5 ปี — สร้าง 2565 ครบกำหนด 2569', () => {
  const cycle = getRevisionCycle('2565');
  assert.equal(cycle.startYear, 2565);
  assert.equal(cycle.dueYear, 2569);
  assert.equal(getRevisionCycle('ไม่ใช่ปี'), null);
});

test('buildDonutStyle: ไม่มีข้อมูล → พื้นเทา / มีข้อมูล → conic-gradient ครบ 100%', () => {
  assert.deepEqual(buildDonutStyle([], 0), { background: '#f1f5f9' });
  const style = buildDonutStyle([{ hex: '#111', count: 1 }, { hex: '#222', count: 3 }], 4);
  assert.ok(style.background.startsWith('conic-gradient'));
  assert.ok(style.background.includes('100.00%'));
});

// ─── user utils ──────────────────────────────────────────────────────────────

test('formatUserName: ยศย่อลงท้ายจุดต่อชิด / ยศเต็มเว้นวรรค / ไม่มียศคืนชื่อเดิม', () => {
  assert.equal(formatUserName({ name: 'ดร. สมชาย รักเรียน', academic_position: 'ผู้ช่วยศาสตราจารย์' }), 'ผศ.ดร. สมชาย รักเรียน');
  assert.equal(formatUserName({ name: 'ดร. สมชาย รักเรียน', academic_position: 'รศ.' }), 'รศ.ดร. สมชาย รักเรียน');
  assert.equal(formatUserName({ name: 'ดร. สมชาย รักเรียน', academic_position: 'อาจารย์' }), 'อาจารย์ ดร. สมชาย รักเรียน');
  assert.equal(formatUserName({ name: 'สมหญิง ใจดี' }), 'สมหญิง ใจดี');
  assert.equal(formatUserName(null), '');
});
