const nodemailer = require('nodemailer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d69b057dca07e9",
    pass: "2f904436df7554"
  }
});

const FROM    = '"ระบบบริหารจัดการหลักสูตร คณะวิทยาศาสตร์" <no-reply@sci.nu.ac.th>';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// CID inline attachments — logos
let LOGO_ATTACHMENTS = [];

(async () => {
  try {
    const nuBuf  = await sharp(path.join(__dirname, '../assets/logo-nu.png'))
      .resize({ height: 96, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const sciBuf = await sharp(path.join(__dirname, '../assets/logo-sci.png'))
      .resize({ height: 96, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    LOGO_ATTACHMENTS = [
      { filename: 'nu_logo.png',  content: nuBuf,  cid: 'logo_nu',  contentDisposition: 'inline' },
      { filename: 'sci_logo.png', content: sciBuf, cid: 'logo_sci', contentDisposition: 'inline' },
    ];
    console.log('[Email] Logos ready (CID inline)');
  } catch (err) {
    console.warn('[Email] Logo load failed (logos will be hidden):', err.message);
  }
})();

transporter.verify().then(() => {
  console.log('[Email] SMTP connection OK — sandbox.smtp.mailtrap.io:2525');
}).catch(err => {
  console.error('[Email] SMTP connection FAILED:', err.message);
});

// ─── Constants ────────────────────────────────────────────────────────────────

const DEGREE_LEVEL_TH    = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };
const CURRICULUM_TYPE_TH = { new: 'หลักสูตรใหม่', revised: 'หลักสูตรปรับปรุง', update: 'หลักสูตรปรับปรุง' };
const ROLE_LABEL_TH      = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่สาขา',
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

// ─── Shared HTML blocks ───────────────────────────────────────────────────────

const emailHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px;">
    <tr>
      <td style="padding: 24px 36px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <div style="width: 48px; height: 48px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: middle; line-height: 48px;">
                      <img src="cid:logo_nu" alt="NU" style="max-width: 32px; max-height: 32px; vertical-align: middle;">
                    </div>
                  </td>
                  <td style="padding-right: 20px;">
                    <div style="width: 48px; height: 48px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; vertical-align: middle; line-height: 48px;">
                      <img src="cid:logo_sci" alt="SCI" style="max-width: 32px; max-height: 32px; vertical-align: middle;">
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">ระบบบริหารจัดการหลักสูตร</p>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">${formatThaiDateShort()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const heroSection = (category, headline) => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
    <tr>
      <td style="padding-right: 8px; vertical-align: middle; color: #6b7280;">
        ${ICONS.doc}
      </td>
      <td style="vertical-align: middle;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #6b7280;">${category}</p>
      </td>
    </tr>
  </table>
  <h1 style="margin: 0 0 32px; font-size: 26px; font-weight: 800; color: #111827; line-height: 1.4;">${headline}</h1>`;

const curriculumBlock = (c, { showDeadline = true } = {}) => {
  const days = daysLeft(c.deadline);
  const name = curriculumName(c);
  const abbr = c.degree_name_abbr ? ` (${c.degree_name_abbr})` : '';
  const level = DEGREE_LEVEL_TH[c.degree_level] || c.degree_level || '';
  const type  = CURRICULUM_TYPE_TH[c.curriculum_type] || c.curriculum_type || '';
  const year  = c.curriculum_year ? `ปีการศึกษา ${c.curriculum_year}` : '';

  const tags = [level, type, year].filter(Boolean).map(t => 
    `<span style="display:inline-block;padding:8px 16px;background-color:#f9fafb;color:#4b5563;font-size:13px;border-radius:4px;margin-right:12px;margin-bottom:12px;">${t}</span>`
  ).join('');

  let deadlineSection = '';
  if (showDeadline && c.deadline) {
    deadlineSection = `
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
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
            <td style="vertical-align:middle;text-align:right;">
              <span style="display:inline-block;background-color:#F59E0B;color:#ffffff;font-size:13px;font-weight:700;padding:8px 16px;border-radius:4px;">เหลืออีก ${days} วัน</span>
            </td>` : ''}
          </tr>
        </table>
      </div>`;
  }

  return `
  <div style="margin:40px 0;padding:32px;border:1px solid #d1d5db;border-radius:8px;background-color:#ffffff;">
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">${name}${abbr}</p>
    <div style="margin-bottom:8px;">
      ${tags}
    </div>
    ${deadlineSection}
  </div>`;
};

const ctaButton = (url, label) => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:48px 0 20px;">
    <tr>
      <td align="center">
        <a href="${url}"
          style="display:inline-block;background-color:#F59E0B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);"
          target="_blank">${label}</a>
      </td>
    </tr>
  </table>`;

const baseTemplate = (iconTheme, bodyHtml) => `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>ระบบบริหารจัดการหลักสูตร</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body,table,td,th,p,div,span,a{font-family:'Noto Sans Thai',Tahoma,'Arial Unicode MS',Arial,sans-serif!important;}</style>
</head>
<body style="margin:0;padding:0;background-color:#f1f3f9;font-family:'Noto Sans Thai',Tahoma,'Arial Unicode MS',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f3f9">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!--[if mso]>
        <table align="center" width="680" border="0" cellpadding="0" cellspacing="0">
        <tr><td style="border:1px solid #e2e8f0;">
        <![endif]-->
        <div style="max-width:680px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">

          ${emailHeader()}

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:0 36px 24px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>

        </div>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

const noteBox = (note, color = '#b91c1c', bg = '#fef2f2', borderColor = '#fecaca') => note ? `
  <div style="background-color:${bg};border:1px solid ${borderColor};border-radius:8px;padding:16px 18px;margin:0 0 20px;">
    <p style="margin:0 0 5px;font-size:12px;font-weight:700;color:${color};letter-spacing:0.05em;">ข้อเสนอแนะ / เหตุผล</p>
    <p style="margin:0;color:#111827;font-size:14px;line-height:1.7;word-break:break-word;">${note}</p>
  </div>` : '';

const userBlock = (user, departmentName) => {
  const lines = [
    `<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">${user.name}</p>`,
    `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${user.email}</p>`,
    `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${ROLE_LABEL_TH[user.role] || user.role}${user.position ? `  ${user.position}` : ''}</p>`,
    departmentName ? `<p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${departmentName}</p>` : '',
    `<p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">ลงทะเบียน ${formatThaiDateFull(new Date())}</p>`,
  ].filter(Boolean).join('');

  return `
  <div style="margin:32px 0;padding:24px;border:1px solid #d1d5db;border-radius:8px;background-color:#ffffff;">
    ${lines}
  </div>`;
};

const deadlineBanner = (revisionDeadline) => {
  if (!revisionDeadline) return '';
  const days = daysLeft(revisionDeadline);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
    <tr>
      <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="18" style="vertical-align:top;padding-top:3px;">
              <div style="width:10px;height:10px;background-color:#f97316;border-radius:50%;"></div>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#d97706;letter-spacing:0.05em;">กำหนดส่งเอกสารแก้ไข</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111827;">${formatThaiDateFull(revisionDeadline)}${days ? `<span style="margin-left:16px;font-size:13px;color:#d97706;font-weight:600;">เหลืออีก ${days} วัน</span>` : ''}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
};

const nextStepBanner = (nextCommitteeName) => {
  if (!nextCommitteeName) return '';
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
    <tr>
      <td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="18" style="vertical-align:top;padding-top:3px;">
              <div style="width:10px;height:10px;background-color:#22c55e;border-radius:50%;"></div>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#15803d;letter-spacing:0.05em;">ขั้นตอนถัดไป</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111827;">${nextCommitteeName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
};

// Paragraph style used in functions
const pStyle = `margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.8;`;
const pGreeting = (text) => `<p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">${text}</p>`;

// ─── Core send ────────────────────────────────────────────────────────────────

const send = async (to, subject, html, extraAttachments = []) => {
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  await transporter.sendMail({
    from: FROM,
    to: recipients,
    subject,
    html,
    attachments: [...LOGO_ATTACHMENTS, ...extraAttachments],
  });
};

// ─── 1. สร้างหลักสูตรใหม่ → แจ้งทีมผู้รับผิดชอบ ────────────────────────────

exports.sendCurriculumCreated = (emails, curriculum) => {
  const html = baseTemplate('created',
    `${heroSection('หลักสูตรใหม่', 'หลักสูตรของท่านพร้อมดำเนินการแล้ว')}
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
    `${heroSection('หลักสูตรรอตรวจสอบ', `${departmentName || 'ภาควิชา'} ส่งเอกสารเข้าระบบแล้ว`)}
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
    `${heroSection('ผ่านการตรวจสอบ', 'เอกสารหลักสูตรถูกต้องครบถ้วนแล้ว')}
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
    `${heroSection('ส่งกลับแก้ไข', 'มีบางส่วนที่ต้องปรับแก้ก่อนดำเนินการต่อ')}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">ตรวจสอบเอกสารแล้ว พบว่ายังมีส่วนที่ต้องแก้ไข กรุณาแก้ไขและส่งกลับเข้าระบบภายในกำหนด</p>
     ${curriculumBlock({ ...(curriculum.toJSON ? curriculum.toJSON() : curriculum), deadline: revisionDeadline || curriculum.deadline })}
     ${noteBox(note)}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อแก้ไขเอกสาร')}`
  );
  return send(emails,
    `[ส่งกลับแก้ไข] ${curriculumName(curriculum)} ระดับ${DEGREE_LEVEL_TH[curriculum.degree_level] || ''}`,
    html);
};

// ─── 5. มติคณะกรรมการ — มีข้อแก้ไข ─────────────────────────────────────────

exports.sendCommitteeRevision = (emails, curriculum, committeeName, note, revisionDeadline) => {
  const html = baseTemplate('committeeRevision',
    `${heroSection('มติคณะกรรมการ', `${committeeName} มีมติให้แก้ไข`)}
     ${pGreeting("เรียน คณะผู้รับผิดชอบหลักสูตร")}
     <p style="${pStyle}">โปรดอ่านข้อเสนอแนะด้านล่าง แล้วแก้ไขเอกสารให้เรียบร้อย จากนั้นส่งกลับเข้าระบบ คณะกรรมการชุดเดิมจะพิจารณาต่อ</p>
     ${curriculumBlock({ ...(curriculum.toJSON ? curriculum.toJSON() : curriculum), deadline: revisionDeadline || curriculum.deadline })}
     ${noteBox(note, '#d97706', '#fffbeb', '#fde68a')}
     ${ctaButton(`${APP_URL}/curricula`, 'เข้าสู่ระบบเพื่อแก้ไขเอกสาร')}`
  );
  return send(emails,
    `[มติแก้ไข] ${curriculumName(curriculum)} — ${committeeName}`,
    html);
};

// ─── 6. มติคณะกรรมการ — เห็นชอบ (มีขั้นถัดไป) ───────────────────────────────

exports.sendCommitteeStepApproved = (emails, curriculum, committeeName, nextCommitteeName) => {
  const html = baseTemplate('committeeApproved',
    `${heroSection('มติคณะกรรมการ', `${committeeName} เห็นชอบหลักสูตรแล้ว`)}
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
    `${heroSection('ยินดีด้วย', 'หลักสูตรได้รับการอนุมัติแล้ว')}
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
    `${heroSection('ผู้ใช้ใหม่', 'มีผู้ใช้ใหม่รอการอนุมัติ')}
     ${pGreeting("เรียน เจ้าหน้าที่หลักสูตรคณะ")}
     <p style="${pStyle}">กรุณาตรวจสอบข้อมูลด้านล่าง และอนุมัติเพื่อให้ผู้ใช้เข้าระบบได้</p>
     ${userBlock(newUser, departmentName)}
     ${ctaButton(`${APP_URL}/users`, 'ไปยังหน้าจัดการผู้ใช้เพื่ออนุมัติ')}`
  );
  return send(adminEmails,
    `[รอการอนุมัติ] ผู้ใช้งานใหม่: ${newUser.name}`,
    html);
};

// ─── 9. Admin recheck request ─────────────────────────────────────────────────

exports.sendAdminRecheckRequest = (adminEmails, curriculum) => {
  const html = baseTemplate('recheck',
    `${heroSection('รอตรวจสอบ', 'เอกสารถูกแก้ไขแล้ว รอการตรวจสอบ')}
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
  const html = baseTemplate('revision',
    `${heroSection('แจ้งเตือนกำหนดส่ง', `เหลือเวลาอีก ${daysLeft} วัน อย่าลืมส่งเอกสาร`)}
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
    `${heroSection('ประกาศจากคณะวิทยาศาสตร์', title)}
     ${imageSrc ? `<div style="font-size:0;line-height:0;margin:0 0 20px;overflow:hidden;border-radius:8px;border:1px solid #e5e7eb;"><img src="${imageSrc}" alt="${title}" width="100%" style="width:100%;height:auto;display:block;border-radius:8px;"></div>` : ''}
     <p style="${pStyle}white-space:pre-wrap;">${content}</p>
     ${linkUrl ? ctaButton(linkUrl, 'ดูรายละเอียดเพิ่มเติม') : ''}`
  );
  return send(emails, `[ประกาศ] ${title}`, html, attachment ? [attachment] : []);
};
