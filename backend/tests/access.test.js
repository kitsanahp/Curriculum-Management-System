// Test: logic สิทธิ์การเข้าถึงหลักสูตร (curriculumAccess + registrarAccess)
// รันได้โดยไม่ต้องต่อ MySQL — ทดสอบเฉพาะเส้นทางที่ตัดสินได้จากข้อมูลใน memory
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-dummy-key'; // กัน SMTP verify ตอน require
const test = require('node:test');
const assert = require('node:assert/strict');

const { sameEmail, canAccessCurriculum, listScope } = require('../src/utils/curriculumAccess');
const { registrarCanAccess } = require('../src/utils/registrarAccess');

// ─── sameEmail ────────────────────────────────────────────────────────────────

test('sameEmail: เทียบแบบไม่สน case และช่องว่างหัวท้าย', () => {
  assert.ok(sameEmail('A@nu.ac.th', 'a@nu.ac.th'));
  assert.ok(sameEmail(' a@nu.ac.th ', 'a@nu.ac.th'));
  assert.ok(!sameEmail('a@nu.ac.th', 'b@nu.ac.th'));
  assert.ok(!sameEmail(null, 'a@nu.ac.th'));
  assert.ok(!sameEmail('', ''));
});

// ─── canAccessCurriculum ─────────────────────────────────────────────────────

test('staff: เข้าถึงได้เฉพาะหลักสูตรในภาควิชาตัวเอง', async () => {
  const staff = { role: 'staff', department_id: 3 };
  assert.equal(await canAccessCurriculum(staff, { departmentId: 3 }), true);
  assert.equal(await canAccessCurriculum(staff, { departmentId: 4 }), false);
});

test('staff ที่ไม่มีสังกัด: เข้าหลักสูตรที่ไม่มีภาควิชาไม่ได้ (กัน null === null)', async () => {
  const staff = { role: 'staff', department_id: null };
  assert.equal(await canAccessCurriculum(staff, { departmentId: null }), false);
});

test('faculty: เข้าถึงได้เฉพาะหลักสูตรที่มีชื่อในทีม (เทียบ email ไม่สน case)', async () => {
  const faculty = { role: 'faculty', email: 'Ajarn@nu.ac.th', department_id: 3 };
  const team = [{ email: 'other@nu.ac.th' }, { email: 'ajarn@nu.ac.th ' }];
  assert.equal(await canAccessCurriculum(faculty, { departmentId: 3, team }), true);
  assert.equal(await canAccessCurriculum(faculty, { departmentId: 3, team: [{ email: 'x@nu.ac.th' }] }), false);
});

test('faculty: ไม่มีทั้ง team และ curriculumId → ปฏิเสธ', async () => {
  const faculty = { role: 'faculty', email: 'a@nu.ac.th' };
  assert.equal(await canAccessCurriculum(faculty, {}), false);
});

test('role อื่น (admin/registrar/executive) ไม่ถูกจำกัดด้วย helper นี้', async () => {
  assert.equal(await canAccessCurriculum({ role: 'admin' }, { departmentId: 99 }), true);
});

// ─── listScope ────────────────────────────────────────────────────────────────

test('listScope: staff กรองด้วย department_id / faculty ต้อง join team / role อื่นคืน null', () => {
  const staffScope = listScope({ role: 'staff', department_id: 7 });
  assert.deepEqual(staffScope.condition, { department_id: 7 });
  assert.equal(staffScope.needsTeam, false);

  const facultyScope = listScope({ role: 'faculty', email: 'a@nu.ac.th' });
  assert.equal(facultyScope.needsTeam, true);

  assert.equal(listScope({ role: 'admin' }), null);
  assert.equal(listScope({ role: 'registrar' }), null);
  assert.equal(listScope({ role: 'executive' }), null);
});

// ─── registrarCanAccess ──────────────────────────────────────────────────────

test('registrar: เห็นปริญญาตรีทุกภาควิชา', () => {
  assert.ok(registrarCanAccess({ degree_level: 'bachelor', department_id: 5 }, 99));
  assert.ok(registrarCanAccess({ degree_level: 'bachelor', department_id: 5 }, null));
});

test('registrar: โท/เอก เห็นเฉพาะของงานบริการการศึกษา', () => {
  const serviceUnitId = 12;
  assert.ok(registrarCanAccess({ degree_level: 'master', department_id: 12 }, serviceUnitId));
  assert.ok(!registrarCanAccess({ degree_level: 'master', department_id: 5 }, serviceUnitId));
  assert.ok(!registrarCanAccess({ degree_level: 'doctoral', department_id: 5 }, serviceUnitId));
  // ยังไม่มีภาควิชางานบริการในระบบ → โท/เอก เข้าไม่ได้เลย
  assert.ok(!registrarCanAccess({ degree_level: 'master', department_id: 12 }, null));
});

test('registrar: curriculum ไม่มีอยู่ → ปฏิเสธ', () => {
  assert.ok(!registrarCanAccess(null, 12));
});
