// Test: โครงสร้าง COMMITTEE_FLOW ต้องตรงตาม business rule
//   - ทุกระดับปริญญามี 7 ขั้น เรียง order 1..7 ไม่ซ้ำ
//   - general_education เฉพาะปริญญาตรี / graduate_school เฉพาะโท-เอก
//   - ทุกขั้นจบที่ CISA และเริ่มที่ faculty_academic → faculty_board
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COMMITTEE_FLOW, COMMITTEE_TYPES, COMMITTEE_LABELS, COMMITTEE_LEVELS,
  CURRICULUM_STATUS, CURRICULUM_STATUS_LABELS, ROLES, DEGREE_LEVELS,
} = require('../src/config/constants');

test('ทุกระดับปริญญามี flow 7 ขั้น เรียง step_order 1..7 ไม่ซ้ำ', () => {
  for (const level of Object.values(DEGREE_LEVELS)) {
    const flow = COMMITTEE_FLOW[level];
    assert.ok(Array.isArray(flow), `ไม่มี flow สำหรับ ${level}`);
    assert.equal(flow.length, 7, `${level} ต้องมี 7 ขั้น`);
    const orders = flow.map((s) => s.order);
    assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7], `${level} order ต้องเรียง 1..7`);
    const types = new Set(flow.map((s) => s.type));
    assert.equal(types.size, 7, `${level} ห้ามมี committee ซ้ำ`);
  }
});

test('general_education มีเฉพาะปริญญาตรี', () => {
  const has = (level, type) => COMMITTEE_FLOW[level].some((s) => s.type === type);
  assert.ok(has('bachelor', 'general_education'));
  assert.ok(!has('master', 'general_education'));
  assert.ok(!has('doctoral', 'general_education'));
});

test('graduate_school มีเฉพาะโท/เอก', () => {
  const has = (level, type) => COMMITTEE_FLOW[level].some((s) => s.type === type);
  assert.ok(!has('bachelor', 'graduate_school'));
  assert.ok(has('master', 'graduate_school'));
  assert.ok(has('doctoral', 'graduate_school'));
});

test('ทุก flow เริ่ม faculty_academic → faculty_board และจบที่ CISA', () => {
  for (const level of Object.values(DEGREE_LEVELS)) {
    const flow = COMMITTEE_FLOW[level];
    assert.equal(flow[0].type, 'faculty_academic', `${level} ขั้นแรกต้องเป็น faculty_academic`);
    assert.equal(flow[1].type, 'faculty_board', `${level} ขั้นสองต้องเป็น faculty_board`);
    assert.equal(flow[6].type, 'cisa', `${level} ขั้นสุดท้ายต้องเป็น cisa`);
  }
});

test('committee ทุกชนิดมี label และ level กำกับครบ', () => {
  for (const type of Object.values(COMMITTEE_TYPES)) {
    assert.ok(COMMITTEE_LABELS[type], `ไม่มี label ของ ${type}`);
    assert.ok(COMMITTEE_LEVELS[type], `ไม่มี level ของ ${type}`);
  }
});

test('สถานะหลักสูตรทุกตัวมี label ภาษาไทย', () => {
  for (const status of Object.values(CURRICULUM_STATUS)) {
    assert.ok(CURRICULUM_STATUS_LABELS[status], `ไม่มี label ของสถานะ ${status}`);
  }
});

test('ระบบมี 5 role ตามสเปค', () => {
  assert.deepEqual(
    Object.values(ROLES).sort(),
    ['admin', 'executive', 'faculty', 'registrar', 'staff']
  );
});
