/**
 * TQF2 Symbol Normalizer
 * ─────────────────────────────────────────────────────────────────────────────
 * ทำงานหลังจาก mammoth.convertToHtml() — แก้ไข HTML ที่ mammoth สร้างออกมา
 *
 * ปัญหา:
 *   แม้จะใช้ docxPreprocessor.js แก้ไข <w:sym> ก่อนแล้ว บางครั้ง mammoth ยัง
 *   แปลงตัวอักษร Wingdings/Symbol ออกมาเป็น Private Use Area (PUA) เช่น
 *   U+F06C, U+F077 หรือ HTML entity &#xF06C; ซึ่งแสดงผลเป็นสี่เหลี่ยมว่าง
 *
 * วิธีแก้:
 *   scan HTML string หาตัวอักษร PUA และ HTML entities ที่ยังค้างอยู่
 *   แล้ว map กลับเป็น Unicode ที่แสดงได้ถูกต้อง (●, ○, ✓ ฯลฯ)
 */

// ─── Symbol map (ใช้ร่วมกับ docxPreprocessor.js) ───────────────────────────
// key = Unicode codepoint (decimal) ของ PUA character ที่ mammoth อาจสร้าง
const PUA_MAP = {
  // Wingdings — black circles
  0xF06C: '●', 0xF06D: '●', 0xF06E: '●', 0xF076: '●',
  // Wingdings — white circles
  0xF077: '○', 0xF06F: '○', 0xF070: '○',
  // Wingdings — checkmarks
  0xF0FC: '✓', 0xF0FB: '✓',
  // Wingdings — checkbox
  0xF0FE: '☑', 0xF0A8: '☐',
  // Symbol font — bullets
  0xF0B7: '●',
};

// HTML entity regex: จับ &#xF06C; หรือ &#61548; (decimal)
const ENTITY_HEX_RE = /&#x([0-9A-Fa-f]{1,6});/g;
const ENTITY_DEC_RE = /&#([0-9]{1,7});/g;

/**
 * แปลง HTML entity ที่ยังเป็น PUA ให้เป็น Unicode ที่แสดงได้
 * @param {string} html - HTML จาก mammoth.convertToHtml()
 * @returns {string} HTML ที่แก้ไขแล้ว
 */
function normalizeSymbols(html) {
  if (!html) return '';

  let result = html;

  // 1. แทนที่ hex entity เช่น &#xF06C; → ●
  result = result.replace(ENTITY_HEX_RE, (_match, hex) => {
    const code = parseInt(hex, 16);
    return PUA_MAP[code] || _match;
  });

  // 2. แทนที่ decimal entity เช่น &#61548; → ●
  result = result.replace(ENTITY_DEC_RE, (_match, dec) => {
    const code = parseInt(dec, 10);
    return PUA_MAP[code] || _match;
  });

  // 3. แทนที่ PUA characters ที่ผ่านมาเป็น raw string character
  result = result.replace(/[-]/g, (char) => {
    const code = char.codePointAt(0);
    return PUA_MAP[code] || char;
  });

  // 4. ลบ Unicode Replacement Character (U+FFFD) ที่เกิดจาก encoding ผิดพลาด
  result = result.replace(/�/g, '');

  return result;
}

module.exports = { normalizeSymbols };
