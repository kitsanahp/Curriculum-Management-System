// Test: state-machine guard ของ workflow หลักสูตร
// ทดสอบเฉพาะเส้นทางที่ "ต้องโดนปฏิเสธ" ซึ่ง throw ก่อนแตะ DB — รันได้โดยไม่ต้องมี MySQL
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-dummy-key'; // กัน SMTP verify ตอน require
const test = require('node:test');
const assert = require('node:assert/strict');

const svc = require('../src/services/curriculumService');
const { CURRICULUM_STATUS } = require('../src/config/constants');

const actor = { id: 1, email: 'admin@nu.ac.th', ip: '127.0.0.1' };
const rejects409 = (promise, messagePart) =>
  assert.rejects(promise, (err) => {
    assert.equal(err.status, 409, `ต้องเป็น 409 แต่ได้ ${err.status}: ${err.message}`);
    if (messagePart) assert.match(err.message, messagePart);
    return true;
  });

// ─── submitByDepartment ──────────────────────────────────────────────────────

test('submit: ส่งไม่ได้ถ้าสถานะไม่ใช่ pending_department/revision', async () => {
  for (const status of ['department_submitted', 'under_committee', 'pending_admin_recheck', 'approved', 'draft']) {
    await rejects409(svc.submitByDepartment({ status }, actor));
  }
});

test('submit: ตีกลับจาก "คณะกรรมการ" ต้องไปทาง resubmit เท่านั้น (กันรีเซ็ต step)', async () => {
  const curriculum = { status: CURRICULUM_STATUS.REVISION, current_committee_step_id: 42 };
  await rejects409(svc.submitByDepartment(curriculum, actor), /ตีกลับจากคณะกรรมการ/);
});

// ─── approveByAdmin ──────────────────────────────────────────────────────────

test('approve: อนุมัติได้เฉพาะสถานะ department_submitted', async () => {
  for (const status of ['pending_department', 'revision', 'under_committee', 'pending_admin_recheck', 'approved']) {
    await rejects409(svc.approveByAdmin({ status }, actor));
  }
});

// ─── rejectByAdmin ───────────────────────────────────────────────────────────

test('reject: ตีกลับได้เฉพาะ department_submitted/under_committee', async () => {
  for (const status of ['pending_department', 'revision', 'pending_admin_recheck', 'approved']) {
    await rejects409(svc.rejectByAdmin({ status }, {}, actor));
  }
});

// ─── approveRecheck / rejectRecheck ─────────────────────────────────────────

test('recheck (approve/reject): ทำได้เฉพาะสถานะ pending_admin_recheck', async () => {
  for (const status of ['pending_department', 'revision', 'department_submitted', 'under_committee', 'approved']) {
    await rejects409(svc.approveRecheck({ status }, actor));
    await rejects409(svc.rejectRecheck({ status }, {}, actor));
  }
});
