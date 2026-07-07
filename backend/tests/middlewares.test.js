// Test: authorize / authenticate (เส้นทางไม่แตะ DB) / errorMiddleware / verifyUploadSignature
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-dummy-key';
const test = require('node:test');
const assert = require('node:assert/strict');

const { authenticate, authorize } = require('../src/middlewares/authMiddleware');
const errorMiddleware = require('../src/middlewares/errorMiddleware');
const { verifyUploadSignature } = require('../src/middlewares/uploadMiddleware');
const ApiError = require('../src/utils/apiError');

// mock res แบบเก็บผลลัพธ์
const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

// ─── authorize ───────────────────────────────────────────────────────────────

test('authorize: role ตรง → next / role ไม่ตรง → 403', () => {
  const mw = authorize('admin', 'faculty');

  let called = false;
  mw({ user: { role: 'admin' } }, mockRes(), () => { called = true; });
  assert.ok(called, 'admin ต้องผ่าน');

  const res = mockRes();
  let blocked = true;
  mw({ user: { role: 'registrar' } }, res, () => { blocked = false; });
  assert.ok(blocked, 'registrar ต้องไม่ผ่าน');
  assert.equal(res.statusCode, 403);
});

test('สเปค executive: whitelist ของ /curricula (admin/faculty/staff/registrar) ต้องปัด executive', () => {
  // ตรงกับ router.use(authorize(...)) ใน routes/curriculumRoutes.js —
  // executive เป็น view-only dashboard เท่านั้น ห้ามเข้าถึง endpoint หลักสูตร/เอกสารทุกเส้น
  const mw = authorize('admin', 'faculty', 'staff', 'registrar');

  const res = mockRes();
  let blocked = true;
  mw({ user: { role: 'executive' } }, res, () => { blocked = false; });
  assert.ok(blocked, 'executive ต้องไม่ผ่าน');
  assert.equal(res.statusCode, 403);

  for (const role of ['admin', 'faculty', 'staff', 'registrar']) {
    let called = false;
    mw({ user: { role } }, mockRes(), () => { called = true; });
    assert.ok(called, `${role} ต้องผ่าน`);
  }
});

// ─── authenticate ────────────────────────────────────────────────────────────

test('authenticate: ไม่มี token → 401', async () => {
  const res = mockRes();
  await authenticate({ headers: {}, cookies: {} }, res, () => assert.fail('ห้ามเรียก next'));
  assert.equal(res.statusCode, 401);
});

test('authenticate: token ปลอม → 401 (jwt.verify fail ก่อนแตะ DB)', async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const res = mockRes();
  await authenticate(
    { headers: { authorization: 'Bearer not-a-real-token' }, cookies: {} },
    res,
    () => assert.fail('ห้ามเรียก next')
  );
  assert.equal(res.statusCode, 401);
});

// ─── errorMiddleware ─────────────────────────────────────────────────────────

test('errorMiddleware: map error → status code ที่ถูกต้อง', () => {
  const cases = [
    [new ApiError(404, 'ไม่พบหลักสูตร'), 404],
    [new ApiError(409, 'สถานะไม่ถูกต้อง'), 409],
    [Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' }), 409],
    [Object.assign(new Error('bad'), { name: 'SequelizeValidationError', errors: [{ message: 'x' }] }), 400],
    [Object.assign(new Error('too big'), { code: 'LIMIT_FILE_SIZE' }), 400],
    [new Error('boom'), 500],
  ];
  for (const [err, expected] of cases) {
    const res = mockRes();
    errorMiddleware(err, {}, res, () => {});
    assert.equal(res.statusCode, expected, `${err.name || err.code || 'generic'} ควรได้ ${expected}`);
    assert.equal(res.body.success, false);
  }
});

// ─── verifyUploadSignature (magic bytes) ─────────────────────────────────────

test('verifyUploadSignature: PDF จริงผ่าน / ไฟล์ปลอมนามสกุล pdf โดนปัด 400', () => {
  // PDF จริง — ขึ้นต้น %PDF
  const okRes = mockRes();
  let passed = false;
  verifyUploadSignature(
    { file: { originalname: 'report.pdf', buffer: Buffer.from('%PDF-1.7 test') } },
    okRes, () => { passed = true; }
  );
  assert.ok(passed, 'PDF จริงต้องผ่าน');

  // HTML ปลอมเป็น .pdf — ต้องโดนปัด
  const badRes = mockRes();
  verifyUploadSignature(
    { file: { originalname: 'evil.pdf', buffer: Buffer.from('<html><script>') } },
    badRes, () => assert.fail('ไฟล์ปลอมห้ามผ่าน')
  );
  assert.equal(badRes.statusCode, 400);
});

test('verifyUploadSignature: DOCX (zip) และ DOC (OLE2) ผ่านตาม signature', () => {
  let count = 0;
  verifyUploadSignature(
    { file: { originalname: 'มคอ2.docx', buffer: Buffer.from([0x50, 0x4B, 0x03, 0x04, 0, 0]) } },
    mockRes(), () => { count++; }
  );
  verifyUploadSignature(
    { file: { originalname: 'old.doc', buffer: Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) } },
    mockRes(), () => { count++; }
  );
  assert.equal(count, 2);
});

test('verifyUploadSignature: นามสกุลนอกกลุ่มตรวจ (รูปภาพ) → ผ่านโดยไม่เช็ค', () => {
  let passed = false;
  verifyUploadSignature(
    { file: { originalname: 'cover.png', buffer: Buffer.from('anything') } },
    mockRes(), () => { passed = true; }
  );
  assert.ok(passed);
});

test('verifyUploadSignature: หลายไฟล์ (array) — ไฟล์เสียไฟล์เดียวทั้ง request โดนปัด', () => {
  const res = mockRes();
  verifyUploadSignature(
    {
      files: [
        { originalname: 'ok.pdf', buffer: Buffer.from('%PDF-1.4') },
        { originalname: 'fake.docx', buffer: Buffer.from('not-a-zip') },
      ],
    },
    res, () => assert.fail('ห้ามผ่าน')
  );
  assert.equal(res.statusCode, 400);
});
