const pdf = require('pdf-parse');
const fs = require('fs').promises;

/**
 * PDF Converter Service
 * ─────────────────────────────────────────────────────────────────────────────
 * แปลงไฟล์ PDF เป็น HTML String พื้นฐานเพื่อใช้ในระบบเปรียบเทียบ (TQF2 Comparator)
 * พยายามรักษาโครงสร้างบรรทัดและการแบ่งหมวดหมู่ (Sectioning) ให้ใกล้เคียง DOCX
 */

/**
 * แปลงไฟล์ PDF จาก Path ให้เป็น HTML
 * @param {string} filePath - Path ของไฟล์ PDF
 * @returns {Promise<string>} HTML string
 */
async function convertPdfToHtml(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);

    // text จาก pdf-parse จะเป็น plain text ที่มี \n แบ่งบรรทัด
    // เราจะแปลง \n เป็น <p> หรือ <h1> เพื่อให้เข้ากับ Logic การ parse section ของระบบ
    
    const lines = data.text.split('\n');
    let htmlResult = '';
    const SECTION_RE = /^\s*หมวดที่\s*[1-8๑-๘]/;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        // ถ้าเป็นหัวข้อหมวด ให้ใช้ <h1> เพื่อให้ Frontend สร้าง TOC ได้
        if (SECTION_RE.test(trimmed)) {
          htmlResult += `<h1>${escapeHtml(trimmed)}</h1>`;
        } else {
          // ห่อด้วย <p> สำหรับเนื้อหาทั่วไป
          htmlResult += `<p>${escapeHtml(trimmed)}</p>`;
        }
      }
    });

    return htmlResult;
  } catch (error) {
    console.error('[PDF Converter] Error:', error);
    throw new Error('ไม่สามารถอ่านข้อมูลจากไฟล์ PDF ได้');
  }
}

/**
 * Helper สำหรับล้างอักขระพิเศษที่อาจกวน HTML
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * แปลง Buffer ของไฟล์ PDF ให้เป็น HTML
 * @param {Buffer} buffer - Buffer ของไฟล์ PDF
 * @returns {Promise<string>} HTML string
 */
async function convertPdfBufferToHtml(buffer) {
  try {
    const data = await pdf(buffer);
    const lines = data.text.split('\n');
    let htmlResult = '';
    const SECTION_RE = /^\s*หมวดที่\s*[1-8๑-๘]/;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        if (SECTION_RE.test(trimmed)) {
          htmlResult += `<h1>${escapeHtml(trimmed)}</h1>`;
        } else {
          htmlResult += `<p>${escapeHtml(trimmed)}</p>`;
        }
      }
    });

    return htmlResult;
  } catch (error) {
    console.error('[PDF Converter] Buffer Error:', error);
    throw new Error('ไม่สามารถอ่านข้อมูลจาก Buffer PDF ได้');
  }
}

module.exports = { convertPdfToHtml, convertPdfBufferToHtml };
