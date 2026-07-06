/**
 * Thai-aware HTML diff
 * ─────────────────────────────────────────────────────────────────────────────
 * เหตุผลที่ไม่ใช้ htmldiff-js สำหรับเนื้อหาไทย:
 *   tokenizer ของ htmldiff-js ใช้ wordRegex = /[\w#@]+/ ซึ่ง \w = [A-Za-z0-9_]
 *   ไม่ครอบคลุมอักษรไทย → มองอักษรไทยทุกตัวเป็น "คำ" แยกกัน → diff ระดับ code point
 *   ทำให้ "ตัดกลาง grapheme cluster" (พยัญชนะหลุดจากสระ/วรรณยุกต์) เช่น กิน→กัน
 *   จะได้ ก<del>ิ</del><ins>ั</ins>น → สระลอยเดี่ยวเรนเดอร์เป็น ◌ิ ◌ั
 *   (ฟีเจอร์ blockExpressions ที่ควรแก้เรื่องนี้ก็พังในตัว build ของ lib — ตัวแปร
 *    `index` ไม่ถูกประกาศใน WordSplitter loop ทำให้ block grouping เป็น no-op)
 *
 * วิธีของเรา:
 *   1. tokenize HTML เป็น token อะตอม โดยจับ "พยัญชนะ/สระไทย + วรรณยุกต์/สระบน-ล่าง
 *      ที่ตามมา" เป็น token เดียว (grapheme cluster) → ตัวอักษรไทยไม่แตกกลางตัว
 *   2. Myers diff (jsdiff) ระดับ token (รักษาแท็ก HTML เป็น token อะตอม → ตารางไม่พัง)
 *      — O(N·D) scale ได้กับหมวดใหญ่จริง ต่างจาก full-matrix LCS O(N²) ที่ระเบิด memory
 *   3. ครอบ <ins>/<del> เฉพาะ token ที่เป็นเนื้อหา ไม่ครอบทับแท็กโครงสร้าง
 *      → HTML ที่ได้ยัง valid (ไม่มี <ins> คร่อม </td><td>)
 *
 * ออก element <ins>/<del> ให้ตรงกับ CSS ฝั่ง frontend (.tqf2-diff-content ins/del)
 */

const Diff = require('diff');

// Thai combining marks: ั(0E31) ิ-ฺ(0E34-0E3A) ็-๎(0E47-0E4E)
const THAI_MARK_RE = /[ัิ-ฺ็-๎]/;
const THAI_CHAR_RE = /[฀-๿]/;
const WORD_RE = /[A-Za-z0-9_]/;
const WS_RE = /\s/;

// เพดาน edit distance ของ Myers (O(N·D)) — สองเวอร์ชันที่ "ต่างกันแทบทั้งหมด"
// เท่านั้นที่จะชน แล้ว fallback เป็นลบทั้ง/เพิ่มทั้ง (กัน worst-case ค้าง event loop)
// เวอร์ชัน มคอ.2 ปกติแก้ทีละจุด D เล็ก → ไม่ชนเพดาน เทียบเร็วและเจอ common ครบ
const MAX_EDIT_DISTANCE = 8000;

/**
 * แตก HTML string เป็น token:
 *   - แท็ก <...> = 1 token (อะตอม)
 *   - ช่องว่างต่อเนื่อง = 1 token
 *   - grapheme cluster ไทย (ฐาน + mark ที่ตามมา) = 1 token
 *   - คำอังกฤษ/ตัวเลข [A-Za-z0-9_]+ = 1 token
 *   - อักขระอื่น (เครื่องหมายวรรคตอน) = 1 token ต่อตัว
 */
function tokenize(html) {
  const tokens = [];
  const n = html.length;
  let i = 0;
  while (i < n) {
    const c = html[i];

    // แท็ก
    if (c === '<') {
      let j = i + 1;
      while (j < n && html[j] !== '>') j++;
      j++; // กิน '>' (ถ้าไม่มีก็ถึงปลาย string)
      tokens.push(html.slice(i, Math.min(j, n)));
      i = Math.min(j, n);
      continue;
    }

    // ช่องว่าง
    if (WS_RE.test(c)) {
      let j = i + 1;
      while (j < n && WS_RE.test(html[j])) j++;
      tokens.push(html.slice(i, j));
      i = j;
      continue;
    }

    // อักษรไทย → ฐาน + วรรณยุกต์/สระบน-ล่างที่ตามมา = cluster เดียว
    // (สระหน้า เ-ไ เป็นฐานในที่นี้ จะกลายเป็น cluster เดี่ยว — ยอมรับได้ เพราะ
    //  bug จริงคือ "วรรณยุกต์/สระบน-ล่างหลุดจากฐาน" ซึ่งวิธีนี้แก้ได้ครบ)
    if (THAI_CHAR_RE.test(c)) {
      let j = i + 1;
      while (j < n && THAI_MARK_RE.test(html[j])) j++;
      tokens.push(html.slice(i, j));
      i = j;
      continue;
    }

    // คำอังกฤษ/ตัวเลข
    if (WORD_RE.test(c)) {
      let j = i + 1;
      while (j < n && WORD_RE.test(html[j])) j++;
      tokens.push(html.slice(i, j));
      i = j;
      continue;
    }

    // อักขระเดี่ยว
    tokens.push(c);
    i++;
  }
  return tokens;
}

const isTag = (t) => t.length > 0 && t[0] === '<';

/**
 * ครอบ token run ด้วย <ins>/<del> โดยไม่ครอบทับแท็กโครงสร้าง
 * แท็กถูกปล่อยผ่านนอกแท็ก diff → HTML ยัง valid (ไม่ตัดกลาง <table>/<tr>/<td>)
 */
function wrapRun(tokens, tag, cssClass) {
  let out = '';
  let buf = '';
  const flush = () => {
    if (buf) { out += `<${tag} class="${cssClass}">${buf}</${tag}>`; buf = ''; }
  };
  for (const t of tokens) {
    if (isTag(t)) { flush(); out += t; }
    else buf += t;
  }
  flush();
  return out;
}

/**
 * Diff ระดับ token ด้วย Myers (jsdiff) — เร็วแบบ O(N·D) เมื่อสองเวอร์ชันคล้ายกัน
 * คืน ops [{ type:'equal'|'insert'|'delete', tokens:[...] }] เรียง del ก่อน ins
 */
function diffTokens(tokA, tokB) {
  // jsdiff เทียบ array ด้วย === (token เป็น string) เรียงผล removed ก่อน added อยู่แล้ว
  const parts = Diff.diffArrays(tokA, tokB, { maxEditLength: MAX_EDIT_DISTANCE });

  if (!parts) {
    // edit distance เกินเพดาน (เวอร์ชันต่างกันแทบทั้งหมด) → ลบทั้ง/เพิ่มทั้ง
    const ops = [];
    if (tokA.length) ops.push({ type: 'delete', tokens: tokA });
    if (tokB.length) ops.push({ type: 'insert', tokens: tokB });
    return ops;
  }

  return parts.map(p => ({
    type: p.added ? 'insert' : p.removed ? 'delete' : 'equal',
    tokens: p.value,
  }));
}

/**
 * เทียบ HTML สองฝั่งแบบรู้ภาษาไทย คืน HTML ที่ฝัง <ins>/<del>
 * @param {string} oldHtml เนื้อหาเดิม (ส่วนที่หาย → <del>)
 * @param {string} newHtml เนื้อหาใหม่ (ส่วนที่เพิ่ม → <ins>)
 * @returns {string}
 */
function diffHtmlThaiAware(oldHtml, newHtml) {
  if (oldHtml === newHtml) return newHtml;

  const ops = diffTokens(tokenize(oldHtml), tokenize(newHtml));

  let out = '';
  for (const op of ops) {
    if (op.type === 'equal') out += op.tokens.join('');
    else if (op.type === 'insert') out += wrapRun(op.tokens, 'ins', 'diffins');
    else out += wrapRun(op.tokens, 'del', 'diffdel');
  }
  return out;
}

module.exports = { diffHtmlThaiAware, tokenize };
