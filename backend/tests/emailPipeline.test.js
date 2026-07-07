// Test: email pipeline (send per-recipient, log, redirect, escaping) + email log hook
// รันโดยไม่ยิงเมลจริง: บังคับโหมด Brevo แล้ว mock global.fetch / mock EmailLog.create
process.env.BREVO_API_KEY = 'test-key-123'; // ต้องตั้งก่อน require — โมดูลอ่านค่าตอน load
delete process.env.EMAIL_TEST_TO;

const test = require('node:test');
const assert = require('node:assert/strict');

const EmailLog = require('../src/models/EmailLog');
const emailService = require('../src/services/emailService');

// ─── mocks ───────────────────────────────────────────────────────────────────

let fetchCalls = [];   // [{ to: [..], subject, htmlContent }]
let failFor = new Set(); // อีเมลที่ให้ mock ตอบ error
let logRows = [];      // แถวที่ถูกเขียนลง email_logs

global.fetch = async (_url, opts) => {
  const body = JSON.parse(opts.body);
  fetchCalls.push(body);
  const recipient = body.to[0]?.email;
  if (failFor.has(recipient)) {
    return { ok: false, status: 400, text: async () => 'mock rejection' };
  }
  return { ok: true };
};

EmailLog.create = async (row) => { logRows.push(row); return row; };

const reset = () => { fetchCalls = []; logRows = []; failFor = new Set(); };

const CURRICULUM = {
  field_of_study: 'เคมี', degree_name: 'วท.บ.', degree_name_abbr: 'วท.บ.',
  degree_level: 'bachelor', curriculum_type: 'new', curriculum_year: '2569',
};

// ─── ส่งแยกรายผู้รับ + dedupe + log ──────────────────────────────────────────

test('ส่งแยกรายผู้รับเสมอ (privacy) + ตัดอีเมลซ้ำ + log ทุกฉบับเป็น sent', async () => {
  reset();
  await emailService.sendAdminApproved(['a@nu.ac.th', 'b@nu.ac.th', ' a@nu.ac.th '], CURRICULUM);

  assert.equal(fetchCalls.length, 2, 'ซ้ำต้องถูก dedupe เหลือ 2 ฉบับ');
  for (const call of fetchCalls) {
    assert.equal(call.to.length, 1, 'ห้ามยัดผู้รับหลายคนในฉบับเดียว');
  }
  assert.deepEqual(fetchCalls.map(c => c.to[0].email).sort(), ['a@nu.ac.th', 'b@nu.ac.th']);

  assert.equal(logRows.length, 2);
  assert.ok(logRows.every(r => r.status === 'sent' && r.error === null));
  assert.ok(logRows[0].subject.includes('[ผ่านการตรวจสอบ]'));
});

// ─── ล้มเหลวบางฉบับ → โยน error + log แยกสถานะถูกตัว ────────────────────────

test('ส่งไม่ถึงบางคน: reject พร้อมยอดรวม และ log แยก sent/failed ถูกคน', async () => {
  reset();
  failFor.add('bad@nu.ac.th');

  await assert.rejects(
    emailService.sendAdminApproved(['ok@nu.ac.th', 'bad@nu.ac.th'], CURRICULUM),
    /ส่งไม่ถึง 1\/2/
  );

  const sent = logRows.filter(r => r.status === 'sent');
  const failed = logRows.filter(r => r.status === 'failed');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].recipient, 'ok@nu.ac.th');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].recipient, 'bad@nu.ac.th');
  assert.match(failed[0].error, /mock rejection/, 'log ต้องเก็บสาเหตุที่ล้มเหลว');
});

// ─── EMAIL_TEST_TO redirect ──────────────────────────────────────────────────

test('EMAIL_TEST_TO: เมลทุกฉบับถูก redirect ไป address เดียว พร้อม prefix [TEST→...]', async () => {
  reset();
  process.env.EMAIL_TEST_TO = 'dev@test.local';
  try {
    await emailService.sendAdminApproved(['a@nu.ac.th', 'b@nu.ac.th'], CURRICULUM);
    assert.equal(fetchCalls.length, 1, 'redirect แล้วต้องเหลือฉบับเดียว');
    assert.equal(fetchCalls[0].to[0].email, 'dev@test.local');
    assert.ok(fetchCalls[0].subject.startsWith('[TEST→'), 'subject ต้องบอกผู้รับเดิม');
  } finally {
    delete process.env.EMAIL_TEST_TO;
  }
});

// ─── ผู้รับไม่ valid ─────────────────────────────────────────────────────────

test('ผู้รับว่าง/ไม่ใช่อีเมล → จบเงียบ ไม่ยิง ไม่ log (กันผู้รับ "undefined")', async () => {
  reset();
  await emailService.sendAccountApproved(undefined, 'สมชาย');
  await emailService.sendAccountApproved('not-an-email', 'สมชาย');
  await emailService.sendAdminApproved([], CURRICULUM);
  assert.equal(fetchCalls.length, 0);
  assert.equal(logRows.length, 0);
});

// ─── HTML injection ──────────────────────────────────────────────────────────

test('ชื่อ/ตำแหน่งจากฟอร์มสมัคร (public) ต้องถูก escape ก่อนฝังลงเมลแจ้ง admin', async () => {
  reset();
  await emailService.sendNewUserRegistration(
    ['admin@nu.ac.th'],
    {
      name: '<script>alert(1)</script>',
      email: 'evil@x.com',
      role: 'faculty',
      position: '<img src=x onerror=steal()>',
    },
    '<b>ภาคปลอม</b>'
  );
  const html = fetchCalls[0].htmlContent;
  assert.ok(!html.includes('<script>'), 'script ดิบห้ามหลุดลงเมล');
  assert.ok(!html.includes('<img src=x'), 'แท็กจาก position ห้ามหลุดลงเมล');
  assert.ok(!html.includes('<b>ภาคปลอม</b>'), 'แท็กจากชื่อภาคห้ามหลุดลงเมล');
  assert.ok(html.includes('&lt;script&gt;'), 'ต้องเห็นเป็นข้อความ escape แล้ว');
});

test('ประกาศ: title/content ถูก escape แต่ยังคง newline (pre-wrap)', async () => {
  reset();
  await emailService.sendAnnouncement(
    ['u@nu.ac.th'],
    'ประกาศ <u>ด่วน</u>',
    'บรรทัดแรก\nบรรทัดสอง <script>x</script>',
    null, null
  );
  const html = fetchCalls[0].htmlContent;
  assert.ok(!html.includes('<u>ด่วน</u>'));
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('บรรทัดแรก\nบรรทัดสอง'), 'newline ต้องคงอยู่ให้ pre-wrap จัดการ');
  assert.ok(fetchCalls[0].subject.includes('[ประกาศ]'));
});

// ─── เมลตีกลับ = แจ้งเหตุการณ์เท่านั้น ───────────────────────────────────────

test('เมลตีกลับต้องไม่แสดง note ของผู้ตรวจ (ตัดสินใจ: เมลมีหน้าที่แจ้งเฉย ๆ ดูรายละเอียดในระบบ)', async () => {
  reset();
  await emailService.sendRevisionRequired(['t@nu.ac.th'], CURRICULUM, 'แก้หมวดที่ 3', null);
  assert.ok(!fetchCalls[0].htmlContent.includes('แก้หมวดที่ 3'), 'note ห้ามโผล่ในเมล');
  assert.ok(!fetchCalls[0].htmlContent.includes('ข้อเสนอแนะจากผู้ตรวจ'));

  reset();
  await emailService.sendCommitteeRevision(['t@nu.ac.th'], CURRICULUM, 'คณะกรรมการวิชาการ', 'ปรับตาราง <b>หมวด 4</b>', null);
  assert.ok(!fetchCalls[0].htmlContent.includes('หมวด 4'), 'note ห้ามโผล่ในเมล');
  assert.ok(fetchCalls[0].htmlContent.includes('คณะกรรมการวิชาการ'), 'ชื่อคณะกรรมการยังต้องแสดงตามปกติ');
});

// ─── subject ใน log ถูกตัดที่ 500 ตัวอักษร ───────────────────────────────────

test('log: subject ยาวเกินถูกตัดที่ 500 ตัวอักษร (กันชน STRING(500))', async () => {
  reset();
  const longName = 'ก'.repeat(600);
  await emailService.sendAnnouncement(['u@nu.ac.th'], longName, 'เนื้อหา', null, null);
  assert.ok(logRows[0].subject.length <= 500);
});
