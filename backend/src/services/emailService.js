const nodemailer = require('nodemailer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Node 17+ เรียง DNS แบบ IPv6 ก่อน — บนคลาวด์บางเจ้า (เช่น Railway) เส้น IPv6 ไป
// SMTP ค้างจน Connection timeout ทั้งที่ IPv4 ปกติ → บังคับใช้ IPv4 ก่อนเสมอ
require('dns').setDefaultResultOrder('ipv4first');

const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

// ── Transport switch: Brevo HTTP API ─────────────────────────────────────────
// บาง host (เช่น Railway) บล็อก outbound SMTP ทุกพอร์ต → ตั้ง BREVO_API_KEY ใน env
// เพื่อส่งเมลผ่าน HTTPS แทน; ลบ key ออกเมื่อย้ายไป host ที่ SMTP ใช้ได้ (กลับมาใช้ SMTP อัตโนมัติ)
const BREVO_API_KEY = process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim();

// ค่าทั้งหมดอ่านจาก .env — ห้าม hardcode credential ในโค้ด (กันรั่วผ่าน git/source map)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT, 10) || 2525,
  secure: SMTP_SECURE, // true เมื่อใช้ port 465 (SMTPS)
  requireTLS: !SMTP_SECURE, // บังคับ STARTTLS เมื่อใช้ port 587 (ไม่เกี่ยวกับโหมด 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // ตัดปัญหาแขวนยาว: ต่อไม่ได้ให้ fail เร็ว ๆ พร้อม error ชัด ๆ ใน log
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

// เมลหลักของระบบ — ผู้ส่งทุกฉบับ และกล่องรับคำขอลงทะเบียน/แจ้งเตือนถึงระบบ (สลับบัญชีได้ผ่าน .env)
const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL || process.env.SMTP_USER || 'curriculum.noreply@gmail.com';
const FROM    = process.env.EMAIL_FROM || `"ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์" <${SYSTEM_EMAIL}>`;
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

exports.SYSTEM_EMAIL = SYSTEM_EMAIL;

// CID inline attachments — logos (โหมด SMTP) + ไฟล์ย่อสำหรับโหมด API (อ้างเป็น URL)
let LOGO_ATTACHMENTS = [];

(async () => {
  try {
    const nuBuf  = await sharp(path.join(__dirname, '../../assets/logo-nu.png'))
      .resize({ height: 96, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const sciBuf = await sharp(path.join(__dirname, '../../assets/logo-sci.png'))
      .resize({ height: 96, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    LOGO_ATTACHMENTS = [
      { filename: 'nu_logo.png',  content: nuBuf,  cid: 'logo_nu',  contentDisposition: 'inline' },
      { filename: 'sci_logo.png', content: sciBuf, cid: 'logo_sci', contentDisposition: 'inline' },
    ];
    // โหมด API แนบไฟล์ inline ไม่ได้ → วางโลโก้ขนาดย่อไว้ใน src/assets/email
    // ซึ่งถูกเสิร์ฟ public ผ่าน /assets อยู่แล้ว (app.js) แล้วอ้างจากเมลเป็น URL เต็ม
    const emailAssetDir = path.join(__dirname, '../assets/email');
    fs.mkdirSync(emailAssetDir, { recursive: true });
    fs.writeFileSync(path.join(emailAssetDir, 'logo-nu.png'), nuBuf);
    fs.writeFileSync(path.join(emailAssetDir, 'logo-sci.png'), sciBuf);
    console.log('[Email] Logos ready (CID inline + hosted copies)');
  } catch (err) {
    console.warn('[Email] Logo load failed (logos will be hidden):', err.message);
  }
})();

if (BREVO_API_KEY) {
  console.log('[Email] ใช้ Brevo HTTP API (ข้าม SMTP — host นี้บล็อกพอร์ตเมล)');
} else {
  transporter.verify().then(() => {
    console.log(`[Email] SMTP connection OK — ${process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io'}:${process.env.SMTP_PORT || 2525}`);
  }).catch(err => {
    console.error('[Email] SMTP connection FAILED:', err.message);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEGREE_LEVEL_TH    = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };
const CURRICULUM_TYPE_TH = { new: 'หลักสูตรใหม่', revised: 'หลักสูตรปรับปรุง', update: 'หลักสูตรปรับปรุง' };
const ROLE_LABEL_TH      = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่สาขาวิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'คณบดี / รองคณบดี',
};

// ─── SVG Icons (white fill, 24×24 viewBox) ────────────────────────────────────


// ─── SVG Icons (new UI) ────────────────────────────────────
const ICONS = {
  doc: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
};

const formatThaiDateFull = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${date.getDate()} ${months[date.getMonth()]} พ.ศ. ${date.getFullYear() + 543}`;
};

const formatThaiDateShort = () => {
  const d = new Date();
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `วันที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const curriculumName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '—';

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const d = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return d > 0 ? d : null;
};

// ─── Theme system (per-email status accent) ───────────────────────────────────
// accent = แถบบน + จุด badge | soft = พื้น badge | label = ตัวอักษร badge
const THEMES = {
  created:           { accent: '#4f46e5', soft: '#eef2ff', label: '#4338ca' }, // indigo
  submitted:         { accent: '#0891b2', soft: '#ecfeff', label: '#0e7490' }, // cyan
  adminApproved:     { accent: '#059669', soft: '#ecfdf5', label: '#047857' }, // green
  revision:          { accent: '#dc2626', soft: '#fef2f2', label: '#b91c1c' }, // red
  committeeRevision: { accent: '#d97706', soft: '#fffbeb', label: '#b45309' }, // amber
  committeeApproved: { accent: '#059669', soft: '#ecfdf5', label: '#047857' }, // green
  finalApproved:     { accent: '#7c3aed', soft: '#f5f3ff', label: '#6d28d9' }, // violet (celebrate)
  newUser:           { accent: '#2563eb', soft: '#eff6ff', label: '#1d4ed8' }, // blue
  recheck:           { accent: '#0891b2', soft: '#ecfeff', label: '#0e7490' }, // cyan
  reminder:          { accent: '#dc2626', soft: '#fef2f2', label: '#b91c1c' }, // red (urgent)
  announcement:      { accent: '#312e81', soft: '#eef2ff', label: '#312e81' }, // brand indigo
  default:           { accent: '#4f46e5', soft: '#eef2ff', label: '#4338ca' },
};
const themeOf = (name) => THEMES[name] || THEMES.default;

// ─── Badge icons (Lucide line icons, inner paths) — สื่อความหมายตามประเภทเมล ──
const BADGE_ICON_PATHS = {
  created:           '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>', // file-plus
  submitted:         '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>', // inbox
  adminApproved:     '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>', // circle-check
  revision:          '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>', // pencil
  committeeRevision: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', // message-square (committee verdict)
  committeeApproved: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>', // circle-check
  finalApproved:     '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>', // award
  newUser:           '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>', // user-plus
  recheck:           '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>', // clipboard-check
  reminder:          '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', // clock
  announcement:      '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>', // megaphone
  default:           '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
};
const badgeIcon = (themeName) => {
  const t = themeOf(themeName);
  const inner = BADGE_ICON_PATHS[themeName] || BADGE_ICON_PATHS.default;
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${t.label}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">${inner}</svg>`;
};

// ─── Shared HTML blocks ───────────────────────────────────────────────────────

const emailHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 0;">
    <tr>
      <td class="sm-px" style="padding: 22px 36px; border-bottom: 1px solid #eef0f4; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <div class="sm-logo" style="width: 48px; height: 48px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: middle; line-height: 48px;">
                      <img src="cid:logo_nu" alt="NU" style="max-width: 32px; max-height: 32px; vertical-align: middle;">
                    </div>
                  </td>
                  <td style="padding-right: 20px;">
                    <div class="sm-logo" style="width: 48px; height: 48px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: middle; line-height: 48px;">
                      <img src="cid:logo_sci" alt="SCI" style="max-width: 32px; max-height: 32px; vertical-align: middle;">
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <p class="sm-title" style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">ระบบบริหารจัดการหลักสูตร</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
                  </td>
                </tr>
              </table>
            </td>
            <td class="sm-hide" style="vertical-align: middle; text-align: right;">
              <span style="display:inline-block;font-size: 12px; color: #64748b; font-weight: 600; background-color:#f8fafc; border:1px solid #eef0f4; border-radius:999px; padding:5px 12px;">${formatThaiDateShort()}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const emailFooter = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="sm-px" style="padding:24px 36px 28px;border-top:1px solid #eef0f4;background-color:#fafbfc;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#374151;">ระบบบริหารจัดการหลักสูตร</p>
        <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#64748b;">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">อีเมลฉบับนี้ส่งจากระบบโดยอัตโนมัติ กรุณาอย่าตอบกลับ<br>หากมีข้อสงสัย โปรดติดต่อเจ้าหน้าที่หลักสูตรคณะวิทยาศาสตร์</p>
      </td>
    </tr>
  </table>`;

const heroSection = (category, headline, themeName) => {
  const t = themeOf(themeName);
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px;">
    <tr>
      <td style="background-color:${t.soft};border-radius:999px;padding:7px 15px;">
        <span style="display:inline-block;vertical-align:middle;margin-right:7px;line-height:0;">${badgeIcon(themeName)}</span><span style="font-size:12px;font-weight:700;color:${t.label};vertical-align:middle;">${category}</span>
      </td>
    </tr>
  </table>
  <h1 class="sm-h1" style="margin: 0 0 28px; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.45;">${headline}</h1>`;
};

const curriculumBlock = (c, { showDeadline = true } = {}) => {
  const days = daysLeft(c.deadline);
  const name = curriculumName(c);
  const abbr = c.degree_name_abbr ? ` (${c.degree_name_abbr})` : '';
  const level = DEGREE_LEVEL_TH[c.degree_level] || c.degree_level || '';
  const type  = CURRICULUM_TYPE_TH[c.curriculum_type] || c.curriculum_type || '';
  const year  = c.curriculum_year ? `ปีการศึกษา ${c.curriculum_year}` : '';

  const tags = [level, type, year].filter(Boolean).map(t =>
    `<span style="display:inline-block;padding:6px 14px;background-color:#f8fafc;color:#475569;font-size:13px;font-weight:600;border:1px solid #e2e8f0;border-radius:999px;margin-right:8px;margin-bottom:8px;">${t}</span>`
  ).join('');

  let deadlineSection = '';
  if (showDeadline && c.deadline) {
    deadlineSection = `
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="sm-block" style="vertical-align:middle;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">${ICONS.calendar}</td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#B45309;">กำหนดส่ง ${formatThaiDateFull(c.deadline)}</p>
                  </td>
                </tr>
              </table>
            </td>
            ${days !== null ? `
            <td class="sm-block sm-left" style="vertical-align:middle;text-align:right;">
              <span style="display:inline-block;background-color:#F59E0B;color:#ffffff;font-size:13px;font-weight:700;padding:8px 16px;border-radius:4px;">เหลืออีก ${days} วัน</span>
            </td>` : ''}
          </tr>
        </table>
      </div>`;
  }

  return `
  <div class="sm-card" style="margin:28px 0;padding:26px 28px;border:1px solid #eaecf0;border-radius:14px;background-color:#ffffff;box-shadow:0 1px 3px rgba(15,23,42,0.04);">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#94a3b8;">หลักสูตร</p>
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;line-height:1.45;">${name}${abbr}</p>
    <div style="margin-bottom:0;">
      ${tags}
    </div>
    ${deadlineSection}
  </div>`;
};

const ctaButton = (url, label) => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:36px 0 8px;">
    <tr>
      <td align="center">
        <a href="${url}" class="sm-cta"
          style="display:inline-block;background-color:#F59E0B;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 46px;border-radius:10px;box-shadow:0 2px 4px rgba(15,23,42,0.12);"
          target="_blank">${label}</a>
      </td>
    </tr>
  </table>`;

const baseTemplate = (themeName, bodyHtml) => {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>ระบบบริหารจัดการหลักสูตร</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body,table,td,th,p,div,span,a{font-family:'Noto Sans Thai',Tahoma,'Arial Unicode MS',Arial,sans-serif!important;}
    /* Mobile (<600px): ลด padding, ย่อโลโก้, ซ่อน date pill, stack แถวที่เบียดกัน — ต้อง !important เพื่อชนะ inline style */
    @media only screen and (max-width:600px){
      .sm-shell{padding:16px 10px!important;}
      .sm-px{padding-left:20px!important;padding-right:20px!important;}
      .sm-hide{display:none!important;}
      .sm-h1{font-size:20px!important;margin-bottom:20px!important;}
      .sm-title{font-size:15px!important;}
      .sm-logo{width:40px!important;height:40px!important;line-height:40px!important;}
      .sm-logo img{max-width:26px!important;max-height:26px!important;}
      .sm-card{padding:20px 18px!important;}
      .sm-block{display:block!important;width:100%!important;}
      .sm-left{text-align:left!important;padding-top:12px!important;}
      .sm-cta{display:block!important;padding:15px 20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;font-family:'Noto Sans Thai',Tahoma,'Arial Unicode MS',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f6">
    <tr>
      <td align="center" class="sm-shell" style="padding:40px 20px;">
        <!--[if mso]>
        <table align="center" width="680" border="0" cellpadding="0" cellspacing="0">
        <tr><td style="border:1px solid #e2e8f0;">
        <![endif]-->
        <div style="max-width:680px;margin:0 auto;background-color:#ffffff;border:1px solid #e6e9ef;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,0.08);">

          ${emailHeader()}

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="sm-px" style="padding:30px 36px 32px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>

          ${emailFooter()}

        </div>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const userBlock = (user, departmentName) => {
  const lines = [
    `<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">${user.name}</p>`,
    `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${user.email}</p>`,
    `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${ROLE_LABEL_TH[user.role] || user.role}${user.position ? `  ${user.position}` : ''}</p>`,
    departmentName ? `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${departmentName}</p>` : '',
    `<p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">ลงทะเบียน ${formatThaiDateFull(new Date())}</p>`,
  ].filter(Boolean).join('');

  return `
  <div class="sm-card" style="margin:28px 0;padding:24px 26px;border:1px solid #eaecf0;border-radius:14px;background-color:#ffffff;box-shadow:0 1px 3px rgba(15,23,42,0.04);">
    ${lines}
  </div>`;
};

const deadlineBanner = (revisionDeadline) => {
  if (!revisionDeadline) return '';
  const days = daysLeft(revisionDeadline);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
    <tr>
      <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#d97706;">กำหนดส่งเอกสารแก้ไข</p>
        <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111827;">${formatThaiDateFull(revisionDeadline)}${days ? `<span style="margin-left:16px;font-size:13px;color:#d97706;font-weight:600;">เหลืออีก ${days} วัน</span>` : ''}</p>
      </td>
    </tr>
  </table>`;
};

const nextStepBanner = (nextCommitteeName) => {
  if (!nextCommitteeName) return '';
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
    <tr>
      <td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#15803d;">ขั้นตอนถัดไป</p>
        <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111827;">${nextCommitteeName}</p>
      </td>
    </tr>
  </table>`;
};

// Paragraph style used in functions
const pStyle = `margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.8;`;
const pGreeting = (text) => `<p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">${text}</p>`;

// ─── Core send ────────────────────────────────────────────────────────────────

// ชื่อผู้ส่ง (display name) — ดึงจาก EMAIL_FROM รูปแบบ "ชื่อ" <email>
const FROM_NAME = (FROM.match(/^"?([^"<]+?)"?\s*</) || [])[1]?.trim()
  || 'ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์';

const sendViaBrevo = async (emails, subject, html) => {
  // โหมด API: เปลี่ยนโลโก้จาก CID attachment เป็นรูป hosted บนเว็บเราเอง
  const htmlContent = html
    .replace(/cid:logo_nu/g, `${APP_URL}/assets/email/logo-nu.png`)
    .replace(/cid:logo_sci/g, `${APP_URL}/assets/email/logo-sci.png`);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: SYSTEM_EMAIL },
      to: emails.map((email) => ({ email })),
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) throw new Error(`Brevo API ${res.status}: ${await res.text()}`);
};

const send = async (to, subject, html, extraAttachments = []) => {
  const original = Array.isArray(to) ? to.join(', ') : to;
  // Dev safety: ถ้าตั้ง EMAIL_TEST_TO ไว้ เมลทุกฉบับจะ redirect มาที่ address เดียว
  // กันยิงเมลจริงไปหาผู้รับจริงตอนทดสอบ — ลบ/เว้นว่าง EMAIL_TEST_TO ตอน production
  const testTo = process.env.EMAIL_TEST_TO && process.env.EMAIL_TEST_TO.trim();
  const finalSubject = testTo ? `[TEST→${original}] ${subject}` : subject;

  // ส่งแยกรายคนเสมอ — ห้ามยัดผู้รับหลายคนในฉบับเดียว เพราะทุกคนจะเห็นอีเมล
  // ของกันและกันในช่อง to (privacy) และ log ชี้ตัวได้ว่าส่งถึงใครพลาด
  const recipients = testTo
    ? [testTo]
    : [...new Set((Array.isArray(to) ? to : String(to).split(',')).map((s) => String(s).trim()).filter(Boolean))];

  const sendOne = (email) => BREVO_API_KEY
    ? sendViaBrevo([email], finalSubject, html)
    : transporter.sendMail({
        from: FROM,
        to: email,
        subject: finalSubject,
        html,
        attachments: [...LOGO_ATTACHMENTS, ...extraAttachments],
      });

  // ทีละชุดเล็ก ๆ กันชน rate limit ของ Brevo/Gmail เวลาประกาศถึงผู้ใช้จำนวนมาก
  const BATCH = 8;
  const failures = [];
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(sendOne));
    results.forEach((r, j) => {
      if (r.status === 'rejected') failures.push(`${batch[j]} (${r.reason?.message || r.reason})`);
    });
  }
  if (failures.length > 0) {
    throw new Error(`ส่งไม่ถึง ${failures.length}/${recipients.length} ราย: ${failures.join('; ')}`);
  }
};

// ─── 0. ตั้งรหัสผ่านใหม่ (admin ส่งลิงก์ให้ผู้ใช้) ───────────────────────────

exports.sendPasswordReset = (to, name, link) => {
  const html = baseTemplate('created',
    `${heroSection('ตั้งรหัสผ่านใหม่', 'คำขอตั้งรหัสผ่านบัญชีของท่าน', 'created')}
     ${pGreeting(`เรียน ${name || 'ผู้ใช้งาน'}`)}
     <p style="${pStyle}">เจ้าหน้าที่ได้ส่งคำขอตั้งรหัสผ่านใหม่ให้บัญชีของท่าน กรุณาคลิกปุ่มด้านล่างเพื่อกำหนดรหัสผ่านใหม่ ลิงก์นี้ใช้ได้ครั้งเดียวและจะหมดอายุภายใน 1 ชั่วโมง</p>
     ${ctaButton(link, 'ตั้งรหัสผ่านใหม่')}
     <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">หากท่านไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลฉบับนี้ รหัสผ่านเดิมจะยังใช้งานได้ตามปกติ</p>`
  );
  return send(to, '[ตั้งรหัสผ่านใหม่] ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์', html);
};

// ─── 1. สร้างหลักสูตรใหม่ → แจ้งทีมผู้รับผิดชอบ ────────────────────────────

exports.sendCurriculumCreated = (emails, curriculum) => {
  const html = baseTemplate('created',
    `${heroSection('หลักสูตรใหม่', 'หลักสูตรของท่านพร้อมดำเนินการแล้ว', 'created')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">สร้างหลักสูตรในระบบเรียบร้อยแล้ว กรุณาจัดเตรียมเอกสารให้ครบถ้วนและส่งภายในกำหนดที่ระบุด้านล่าง</p>
     ${curriculumBlock(curriculum)}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อดำเนินการ')}`
  );
  return send(emails,
    `[แจ้งสร้างหลักสูตร] ${curriculumName(curriculum)} ระดับ${DEGREE_LEVEL_TH[curriculum.degree_level] || ''}`,
    html);
};

// ─── 2. สาขาส่งหลักสูตร → แจ้งเจ้าหน้าที่ (admin) ─────────────────────────

exports.sendDepartmentSubmitted = (adminEmails, curriculum, departmentName) => {
  const html = baseTemplate('submitted',
    `${heroSection('หลักสูตรรอตรวจสอบ', `${departmentName || 'ภาควิชา'} ส่งเอกสารเข้าระบบแล้ว`, 'submitted')}
     ${pGreeting("เรียน เจ้าหน้าที่หลักสูตรคณะ")}
     <p style="${pStyle}"><strong>${departmentName || 'ภาควิชา'}</strong> ส่งเอกสารหลักสูตรเข้าระบบแล้ว กรุณาตรวจสอบและดำเนินการต่อไป</p>
     ${curriculumBlock(curriculum, { showDeadline: false })}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อตรวจสอบ')}`
  );
  return send(adminEmails,
    `[ส่งหลักสูตร] ${curriculumName(curriculum)} — ${departmentName || 'ภาควิชา'}`,
    html);
};

// ─── 3. admin อนุมัติเบื้องต้น → แจ้งทีมผู้รับผิดชอบ ───────────────────────

exports.sendAdminApproved = (emails, curriculum) => {
  const html = baseTemplate('adminApproved',
    `${heroSection('ผ่านการตรวจสอบ', 'เอกสารหลักสูตรถูกต้องครบถ้วนแล้ว', 'adminApproved')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">เอกสารถูกต้องและครบถ้วนแล้ว หลักสูตรเข้าสู่กระบวนการพิจารณาของคณะกรรมการแล้ว ระบบจะแจ้งให้ทราบทุกครั้งที่มีมติ</p>
     ${curriculumBlock(curriculum)}
     ${ctaButton(`${APP_URL}/curricula`, 'ติดตามความคืบหน้าในระบบ')}`
  );
  return send(emails,
    `[ผ่านการตรวจสอบ] ${curriculumName(curriculum)} — เข้าสู่กระบวนการคณะกรรมการ`,
    html);
};

// ─── 4. ตีกลับแก้ไขโดย admin → แจ้งทีมผู้รับผิดชอบ ────────────────────────

exports.sendRevisionRequired = (emails, curriculum, note, revisionDeadline) => {
  const html = baseTemplate('revision',
    `${heroSection('ส่งกลับแก้ไข', 'มีบางส่วนที่ต้องปรับแก้ก่อนดำเนินการต่อ', 'revision')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">ตรวจสอบเอกสารแล้ว พบว่ายังมีส่วนที่ต้องแก้ไข กรุณาแก้ไขและส่งกลับเข้าระบบภายในกำหนด</p>
     ${curriculumBlock({ ...(curriculum.toJSON ? curriculum.toJSON() : curriculum), deadline: revisionDeadline || curriculum.deadline })}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อแก้ไขเอกสาร')}`
  );
  return send(emails,
    `[ส่งกลับแก้ไข] ${curriculumName(curriculum)} ระดับ${DEGREE_LEVEL_TH[curriculum.degree_level] || ''}`,
    html);
};

// ─── 5. มติคณะกรรมการ — มีข้อแก้ไข ─────────────────────────────────────────

exports.sendCommitteeRevision = (emails, curriculum, committeeName, note, revisionDeadline) => {
  const html = baseTemplate('committeeRevision',
    `${heroSection('มติคณะกรรมการ', `${committeeName} มีมติให้แก้ไข`, 'committeeRevision')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">โปรดแก้ไขเอกสารตามมติคณะกรรมการให้เรียบร้อย แล้วส่งกลับเข้าระบบภายในกำหนด คณะกรรมการชุดเดิมจะพิจารณาต่อ</p>
     ${curriculumBlock({ ...(curriculum.toJSON ? curriculum.toJSON() : curriculum), deadline: revisionDeadline || curriculum.deadline })}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อแก้ไขเอกสาร')}`
  );
  return send(emails,
    `[มติแก้ไข] ${curriculumName(curriculum)} — ${committeeName}`,
    html);
};

// ─── 6. มติคณะกรรมการ — เห็นชอบ (มีขั้นถัดไป) ───────────────────────────────

exports.sendCommitteeStepApproved = (emails, curriculum, committeeName, nextCommitteeName) => {
  const html = baseTemplate('committeeApproved',
    `${heroSection('มติคณะกรรมการ', `${committeeName} เห็นชอบหลักสูตรแล้ว`, 'committeeApproved')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">หลักสูตรผ่านการพิจารณาขั้นตอนนี้แล้ว ระบบจะแจ้งให้ทราบอีกครั้งเมื่อมีมติในขั้นตอนถัดไป</p>
     ${curriculumBlock(curriculum, { showDeadline: false })}
     ${nextStepBanner(nextCommitteeName)}
     ${ctaButton(`${APP_URL}/curricula`, 'ติดตามความคืบหน้าในระบบ')}`
  );
  return send(emails,
    `[เห็นชอบ] ${curriculumName(curriculum)} — ผ่าน${committeeName}`,
    html);
};

// ─── 7. อนุมัติขั้นสุดท้าย (CISA) → แจ้งทีม ─────────────────────────────────

exports.sendFinalApproved = (emails, curriculum) => {
  const html = baseTemplate('finalApproved',
    `${heroSection('ยินดีด้วย', 'หลักสูตรได้รับการอนุมัติแล้ว', 'finalApproved')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">หลักสูตรได้รับการอนุมัติจาก สป.อว. ผ่าน CISA แล้ว ขอแสดงความยินดีกับความสำเร็จนี้ด้วย</p>
     ${curriculumBlock(curriculum, { showDeadline: false })}
     ${ctaButton(`${APP_URL}/curricula`, 'ดูรายละเอียดหลักสูตรในระบบ')}`
  );
  return send(emails,
    `[อนุมัติแล้ว] ${curriculumName(curriculum)} — ผ่านการพิจารณาจาก สป.อว. (CISA)`,
    html);
};

// ─── 8. ผู้ใช้ใหม่รอการอนุมัติ → แจ้ง admin ────────────────────────────────

exports.sendNewUserRegistration = (adminEmails, newUser, departmentName) => {
  const html = baseTemplate('newUser',
    `${heroSection('ผู้ใช้ใหม่', 'มีผู้ใช้ใหม่รอการอนุมัติ', 'newUser')}
     ${pGreeting("เรียน เจ้าหน้าที่หลักสูตรคณะ")}
     <p style="${pStyle}">กรุณาตรวจสอบข้อมูลด้านล่าง และอนุมัติเพื่อให้ผู้ใช้เข้าระบบได้</p>
     ${userBlock(newUser, departmentName)}
     ${ctaButton(`${APP_URL}/users`, 'ไปยังหน้าจัดการผู้ใช้เพื่ออนุมัติ')}`
  );
  return send(adminEmails,
    `[รอการอนุมัติ] ผู้ใช้งานใหม่: ${newUser.name}`,
    html);
};

// ─── 8.1 ผลการลงทะเบียน — อนุมัติ → แจ้งผู้สมัคร ────────────────────────────

exports.sendAccountApproved = (to, name) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const html = baseTemplate('adminApproved',
    `${heroSection('บัญชีพร้อมใช้งาน', 'บัญชีของท่านได้รับการอนุมัติแล้ว', 'adminApproved')}
     ${pGreeting(`เรียน ${name || 'ผู้ใช้งาน'}`)}
     <p style="${pStyle}">เจ้าหน้าที่ได้ตรวจสอบและอนุมัติคำขอลงทะเบียนของท่านเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ลงทะเบียนไว้ได้ทันที</p>
     ${ctaButton(loginUrl, 'เข้าสู่ระบบ')}`
  );
  return send(to, '[อนุมัติบัญชี] ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์', html);
};

// ─── 8.2 ผลการลงทะเบียน — ไม่อนุมัติ → แจ้งผู้สมัคร ─────────────────────────

exports.sendAccountRejected = (to, name) => {
  const html = baseTemplate('revision',
    `${heroSection('ผลการลงทะเบียน', 'คำขอลงทะเบียนไม่ได้รับการอนุมัติ', 'revision')}
     ${pGreeting(`เรียน ${name || 'ผู้สมัครใช้งาน'}`)}
     <p style="${pStyle}">เจ้าหน้าที่ได้ตรวจสอบคำขอลงทะเบียนของท่านแล้ว และไม่สามารถอนุมัติบัญชีนี้ได้ หากท่านเห็นว่าเป็นความผิดพลาด หรือต้องการสอบถามเหตุผลเพิ่มเติม โปรดติดต่อเจ้าหน้าที่หลักสูตรคณะวิทยาศาสตร์โดยตรง</p>
     <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">ท่านสามารถลงทะเบียนใหม่อีกครั้งได้ หากข้อมูลเดิมไม่ถูกต้องหรือไม่ครบถ้วน</p>`
  );
  return send(to, '[ผลการลงทะเบียน] ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์', html);
};

// ─── 9. Admin recheck request ─────────────────────────────────────────────────

exports.sendAdminRecheckRequest = (adminEmails, curriculum) => {
  const html = baseTemplate('recheck',
    `${heroSection('รอตรวจสอบ', 'เอกสารถูกแก้ไขแล้ว รอการตรวจสอบ', 'recheck')}
     ${pGreeting("เรียน เจ้าหน้าที่หลักสูตรคณะ")}
     <p style="${pStyle}">ทีมผู้รับผิดชอบแก้ไขเอกสารตามมติคณะกรรมการแล้ว กรุณาตรวจสอบก่อนนำเข้าที่ประชุมคณะกรรมการต่อไป</p>
     ${curriculumBlock(curriculum, { showDeadline: false })}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อตรวจสอบ')}`
  );
  return send(adminEmails,
    `[รอตรวจสอบ] ${curriculumName(curriculum)} — หลังแก้ไขตามมติคณะกรรมการ`,
    html);
};

// ─── 10. แจ้งเตือนกำหนดส่งใกล้ถึง ───────────────────────────────────────────

exports.sendDeadlineReminder = (emails, curriculum, daysLeft) => {
  const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 2 ? '#d97706' : '#2563eb';
  const html = baseTemplate('reminder',
    `${heroSection('แจ้งเตือนกำหนดส่ง', `เหลือเวลาอีก ${daysLeft} วัน อย่าลืมส่งเอกสาร`, 'reminder')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">กรุณาส่งเอกสารที่แก้ไขแล้วเข้าระบบให้ทันกำหนด</p>
     <div style="margin:0 0 20px;padding:14px 18px;border-radius:8px;background-color:#fef2f2;border:1px solid #fecaca;">
       <p style="margin:0;font-size:13px;font-weight:700;color:${urgencyColor};">เหลือเวลา ${daysLeft} วัน</p>
     </div>
     ${curriculumBlock(curriculum)}
     ${deadlineBanner(curriculum.revision_deadline)}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อแก้ไขเอกสาร')}`
  );
  return send(emails,
    `[แจ้งเตือน] กำหนดส่ง ${curriculumName(curriculum)} อีก ${daysLeft} วัน`,
    html);
};

// ─── 11. ประกาศแจ้งเวียน ─────────────────────────────────────────────────────

const prepareAnnouncementImage = async (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith('http')) return { imageSrc: imageUrl, attachment: null };
  // โหมด API แนบรูป inline ไม่ได้ → อ้างรูปจากเว็บเราตรง ๆ (/uploads/announcements เปิด public)
  if (BREVO_API_KEY) return { imageSrc: `${APP_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`, attachment: null };
  const filePath = path.join(__dirname, '../..', imageUrl);
  if (!fs.existsSync(filePath)) return { imageSrc: null, attachment: null };
  try {
    const buf = await sharp(filePath)
      .resize({ width: 520, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return {
      imageSrc: 'cid:announcement_img',
      attachment: { filename: 'image.jpg', content: buf, cid: 'announcement_img', contentDisposition: 'inline' },
    };
  } catch (err) {
    console.warn('[Email] announcement image processing failed:', err.message);
    return { imageSrc: null, attachment: null };
  }
};

exports.sendAnnouncement = async (emails, title, content, linkUrl, imageUrl) => {
  const { imageSrc, attachment } = await prepareAnnouncementImage(imageUrl);

  const html = baseTemplate('announcement',
    `${heroSection('ประกาศจากคณะวิทยาศาสตร์', title, 'announcement')}
     ${imageSrc ? `<div style="font-size:0;line-height:0;margin:0 0 20px;overflow:hidden;border-radius:8px;border:1px solid #e5e7eb;"><img src="${imageSrc}" alt="${title}" width="100%" style="width:100%;height:auto;display:block;border-radius:8px;"></div>` : ''}
     <p style="${pStyle}white-space:pre-wrap;">${content}</p>
     ${linkUrl ? ctaButton(linkUrl, 'ดูรายละเอียดเพิ่มเติม') : ''}`
  );
  return send(emails, `[ประกาศ] ${title}`, html, attachment ? [attachment] : []);
};
