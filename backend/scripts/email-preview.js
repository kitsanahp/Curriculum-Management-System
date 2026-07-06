/**
 * Email preview generator — render ทุกเมลจาก emailService.js เป็นไฟล์ HTML
 * โดยไม่ส่งจริง (stub ตัว SMTP) เปิดดูในเบราว์เซอร์ได้ไม่จำกัด
 *
 *   npm run email:preview
 *   → backend/email-previews/index.html  (เปิดไฟล์นี้)
 *
 * ใช้ของจริงจาก emailService.js ทั้งหมด — เห็นตรงกับเมลที่ส่งจริง 100%
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

// ── 1. Stub ตัวส่ง SMTP: เก็บ html แทนการส่งจริง (ต้องทำก่อน require emailService) ──
const captured = [];
nodemailer.createTransport = () => ({
  verify: () => Promise.resolve(),
  sendMail: (opts) => { captured.push(opts); return Promise.resolve({ messageId: 'preview' }); },
});

const email = require('../src/services/emailService');

// ── 2. ข้อมูลตัวอย่าง ──────────────────────────────────────────────────────────
const inDays = (n) => new Date(Date.now() + n * 86400000);
const curriculum = {
  field_of_study:   'คณิตศาสตร์',
  degree_name:      'วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์',
  degree_name_abbr: 'วท.บ.',
  degree_level:     'bachelor',
  curriculum_type:  'new',
  curriculum_year:  2570,
  deadline:         inDays(5),
  revision_deadline: inDays(7),
};
const newUser = { name: 'สมชาย ใจดี', email: 'somchai@nu.ac.th', role: 'faculty', position: 'ผศ.', academic_position: 'ผศ. ดร.' };
const dept = 'ภาควิชาคณิตศาสตร์';
const note = 'หมวด 3 ข้อ 3.1.2 ปรับคำอธิบายรายวิชาให้สอดคล้องกับ ผลลัพธ์การเรียนรู้ (PLO) และตรวจสอบหน่วยกิตรวมให้ตรงกับเกณฑ์';
const C1 = 'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์';
const C2 = 'คณะกรรมการประจำคณะวิทยาศาสตร์';

// ลำดับนี้ต้องตรงกับลำดับการเรียก captured (เรียงตาม run ด้านล่าง)
const DEFS = [
  { name: '01-created',           label: 'สร้างหลักสูตรใหม่',         run: () => email.sendCurriculumCreated([T], curriculum) },
  { name: '02-submitted',         label: 'สาขาส่งเอกสาร → admin',     run: () => email.sendDepartmentSubmitted([T], curriculum, dept) },
  { name: '03-admin-approved',    label: 'admin ผ่านการตรวจสอบ',       run: () => email.sendAdminApproved([T], curriculum) },
  { name: '04-revision',          label: 'admin ตีกลับแก้ไข',          run: () => email.sendRevisionRequired([T], curriculum, note, curriculum.revision_deadline) },
  { name: '05-committee-revision',label: 'มติคณะกรรมการ — แก้ไข',      run: () => email.sendCommitteeRevision([T], curriculum, C1, note, curriculum.revision_deadline) },
  { name: '06-committee-approved',label: 'มติคณะกรรมการ — เห็นชอบ',    run: () => email.sendCommitteeStepApproved([T], curriculum, C1, C2) },
  { name: '07-final-approved',    label: 'อนุมัติขั้นสุดท้าย (CISA)',  run: () => email.sendFinalApproved([T], curriculum) },
  { name: '08-new-user',          label: 'ผู้ใช้ใหม่รอการอนุมัติ',     run: () => email.sendNewUserRegistration([T], newUser, dept) },
  { name: '09-recheck',           label: 'รอตรวจสอบหลังแก้ไข',         run: () => email.sendAdminRecheckRequest([T], curriculum) },
  { name: '10-deadline-reminder', label: 'แจ้งเตือนกำหนดส่ง',          run: () => email.sendDeadlineReminder([T], curriculum, 2) },
  { name: '11-announcement',      label: 'ประกาศแจ้งเวียน',            run: () => email.sendAnnouncement([T], 'ปิดปรับปรุงระบบชั่วคราว 20 มิ.ย. 2569', 'ระบบจะปิดปรับปรุงเพื่อเพิ่มประสิทธิภาพ ในวันที่ 20 มิถุนายน 2569 เวลา 22:00 - 24:00 น. ขออภัยในความไม่สะดวก', 'https://sci.nu.ac.th', null) },
];
const T = 'preview@nu.ac.th';

// ── 3. โลโก้ → data URI (แทน cid: ให้รูปโชว์ในเบราว์เซอร์) ────────────────────
const logoDataUri = async (file) => {
  const buf = await sharp(path.join(__dirname, '../assets', file))
    .resize({ height: 96, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
};

const OUT_DIR = path.join(__dirname, '../email-previews');

(async () => {
  // run ทุกเมลตามลำดับ DEFS
  for (const def of DEFS) await def.run();

  const [nu, sci] = await Promise.all([logoDataUri('logo-nu.png'), logoDataUri('logo-sci.png')]);
  const resolveCids = (html) => html
    .replace(/cid:logo_nu/g, nu)
    .replace(/cid:logo_sci/g, sci);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const items = DEFS.map((def, i) => {
    const mail = captured[i];
    const html = resolveCids(mail.html);
    fs.writeFileSync(path.join(OUT_DIR, `${def.name}.html`), html);
    return { ...def, subject: mail.subject };
  });

  // ── index.html: grid + iframe thumbnail ──
  const cards = items.map(it => `
    <a class="card" href="./${it.name}.html" target="preview">
      <div class="thumb"><iframe src="./${it.name}.html" scrolling="no" tabindex="-1"></iframe></div>
      <div class="meta">
        <p class="label">${it.label}</p>
        <p class="subject">${it.subject.replace(/</g, '&lt;')}</p>
      </div>
    </a>`).join('');

  const index = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Email Previews — ระบบบริหารจัดการหลักสูตร</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:'Noto Sans Thai',system-ui,sans-serif;background:#eef1f6;color:#0f172a}
  header{padding:28px 32px;background:#fff;border-bottom:1px solid #e6e9ef}
  header h1{margin:0;font-size:20px;font-weight:800} header p{margin:6px 0 0;font-size:13px;color:#64748b}
  .wrap{display:grid;grid-template-columns:340px 1fr;gap:0;height:calc(100vh - 89px)}
  .list{overflow-y:auto;padding:18px;border-right:1px solid #e6e9ef;background:#f8fafc}
  .grid{display:flex;flex-direction:column;gap:14px}
  .card{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid #e6e9ef;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.05);transition:box-shadow .2s,border-color .2s}
  .card:hover{border-color:#c7d2fe;box-shadow:0 6px 18px rgba(15,23,42,.10)}
  .thumb{height:150px;overflow:hidden;background:#eef1f6;border-bottom:1px solid #eef0f4;position:relative}
  .thumb iframe{width:680px;height:900px;border:0;transform:scale(.5);transform-origin:top left;pointer-events:none}
  .meta{padding:12px 14px} .label{margin:0;font-size:13px;font-weight:700} .subject{margin:4px 0 0;font-size:11px;color:#94a3b8;line-height:1.5}
  .stage{background:#eef1f6;overflow:hidden} .stage iframe{width:100%;height:100%;border:0}
</style></head>
<body>
  <header><h1>Email Previews</h1><p>${items.length} เมล · render จาก emailService.js จริง · คลิกการ์ดเพื่อดูเต็มทางขวา</p></header>
  <div class="wrap">
    <div class="list"><div class="grid">${cards}</div></div>
    <div class="stage"><iframe name="preview" src="./${items[0].name}.html"></iframe></div>
  </div>
</body></html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), index);

  console.log(`\n  ✓ สร้าง ${items.length} เมล + index.html`);
  console.log(`  → เปิด: ${path.relative(process.cwd(), path.join(OUT_DIR, 'index.html'))}\n`);
  process.exit(0);
})().catch(err => { console.error('preview failed:', err); process.exit(1); });
