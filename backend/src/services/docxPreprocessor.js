/**
 * DOCX Symbol Preprocessor
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Pre-processes .docx files BEFORE passing to mammoth.convertToHtml()
 * 
 * Problem:
 *   Word documents use <w:sym> tags with Wingdings/Symbol fonts for bullets
 *   like ⚫ (black circle) and ⚪ (white circle) in Curriculum Mapping tables.
 *   mammoth.js cannot parse <w:sym> and silently drops them, resulting in
 *   empty table cells in the rendered HTML.
 *
 * Solution:
 *   1. Open the .docx as a ZIP archive (docx = zip of XML files)
 *   2. Read word/document.xml (and word/header*.xml, word/footer*.xml)
 *   3. Find all <w:sym> tags via regex
 *   4. Replace them with <w:t>⚫</w:t> or <w:t>⚪</w:t> based on char code
 *   5. Repack into a Buffer and return it for mammoth to consume
 *
 * Usage:
 *   const { preprocessDocx } = require('./docxPreprocessor');
 *   const processedBuffer = preprocessDocx(originalBuffer);
 *   const { value: html } = await mammoth.convertToHtml({ buffer: processedBuffer });
 */

const AdmZip = require('adm-zip');

// ════════════════════════════════════════════════════════════════════════════
// SYMBOL MAPPING TABLE
// ════════════════════════════════════════════════════════════════════════════
//
// <w:sym w:font="Wingdings" w:char="F06C"/> → ⚫ (Black Circle, U+26AB)
// <w:sym w:font="Symbol"    w:char="00B7"/> → ⚫ (bullet)
//
// These hex codes are the most commonly found in Thai university มคอ.2 docs.
// The mapping covers both full F0xx Private Use Area codes and stripped xx codes.

const SYM_CHAR_MAP = {
  // ─── BLACK CIRCLES (หลัก / Primary) ──────────────────────────────────
  // Wingdings
  'F06C': '●',    // Wingdings 'l' → black circle
  'F06D': '●',    // Wingdings 'm' → black circle (variant)
  'F06E': '●',    // Wingdings 'n' → black circle (variant)
  'F076': '●',    // Wingdings 'v' → filled circle
  '006C': '●',    // Stripped version of F06C
  '006D': '●',    // Stripped version of F06D
  '006E': '●',    // Stripped version of F06E
  '0076': '●',    // Stripped version of F076

  // Symbol font
  '00B7': '●',    // Middle dot (often used as primary)
  'F0B7': '●',    // Symbol bullet
  '2022': '●',    // Unicode bullet (• U+2022)
  '25CF': '●',    // Unicode black circle (● U+25CF)
  '25A0': '●',    // Unicode black square (■ U+25A0)
  '25C6': '●',    // Unicode black diamond (◆ U+25C6)
  '2666': '●',    // Unicode black diamond suit (♦ U+2666)
  '26AB': '●',    // Unicode medium black circle (⚫ U+26AB)

  // ─── WHITE CIRCLES (รอง / Secondary) ─────────────────────────────────
  // Wingdings
  'F077': '○',    // Wingdings 'w' → white circle
  'F06F': '○',    // Wingdings 'o' → white circle
  'F070': '○',    // Wingdings 'p' → white circle (variant)
  '0077': '○',    // Stripped version of F077
  '006F': '○',    // Stripped version of F06F
  '0070': '○',    // Stripped version of F070

  // Symbol font
  '25CB': '○',    // Unicode white circle (○ U+25CB)
  '25A1': '○',    // Unicode white square (□ U+25A1)
  '25C7': '○',    // Unicode white diamond (◇ U+25C7)
  '26AA': '○',    // Unicode medium white circle (⚪ U+26AA)
  '2661': '○',    // Unicode white heart suit (♡ U+2661)
  '25EF': '○',    // Unicode large circle (◯ U+25EF)
  '00A1': '○',    // Inverted exclamation (sometimes mapped to circle in Wingdings)
  '00A8': '○',    // Diaeresis (sometimes mapped to circle in Symbol)

  // ─── CHECKMARKS & OTHER SYMBOLS ──────────────────────────────────────
  'F0FC': '✓',    // Wingdings checkmark
  '00FC': '✓',    // Stripped version
  'F0FB': '✓',    // Wingdings checkmark variant
  '00FB': '✓',    // Stripped version
  '2713': '✓',    // Unicode check mark
  '2714': '✓',    // Unicode heavy check mark

  'F0FE': '☑',    // Wingdings checkbox checked
  '00FE': '☑',    // Stripped version
  'F0A8': '☐',    // Wingdings checkbox unchecked
  '00A8': '☐',    // Stripped version (override)

  // ─── CROSSES ─────────────────────────────────────────────────────────
  'F0FB': '✗',    // Wingdings cross (variant)
  '2717': '✗',    // Unicode ballot X
  '2718': '✗',    // Unicode heavy ballot X
};

/**
 * Resolve a <w:sym> character code to a Unicode replacement
 * 
 * @param {string} fontName - Font name from w:font attribute (e.g. "Wingdings", "Symbol")
 * @param {string} charCode - Hex character code from w:char attribute (e.g. "F06C")
 * @returns {string|null} Unicode replacement character, or null if unknown
 */
function resolveSymChar(fontName, charCode) {
  const upper = (charCode || '').toUpperCase();

  // 1. Direct lookup
  if (SYM_CHAR_MAP[upper]) {
    return SYM_CHAR_MAP[upper];
  }

  // 2. Try stripping F0 prefix (Wingdings uses Private Use Area F0xx)
  if (upper.startsWith('F0') && upper.length === 4) {
    const stripped = '00' + upper.substring(2);
    if (SYM_CHAR_MAP[stripped]) {
      return SYM_CHAR_MAP[stripped];
    }
  }

  // 3. Font-based heuristic for unmapped codes
  const fontLower = (fontName || '').toLowerCase();
  if (fontLower.includes('wingdings') || fontLower.includes('symbol') || fontLower.includes('dingbat')) {
    const code = parseInt(upper, 16);
    // Private Use Area range — use even/odd heuristic
    if (code >= 0xF000 && code <= 0xF0FF) {
      // Common pattern: lower range = filled, upper range = outline
      return code <= 0xF07F ? '●' : '○';
    }
    // Fallback: return a generic bullet so it's at least visible
    return '●';
  }

  return null;
}

/**
 * Process a single XML string — find and replace all <w:sym> tags
 * 
 * Regex targets patterns like:
 *   <w:sym w:font="Wingdings" w:char="F06C"/>
 *   <w:sym w:char="F06C" w:font="Wingdings"/>
 *   <w:sym w:font="Symbol" w:char="00B7" />
 * 
 * @param {string} xml - Raw XML content from document.xml
 * @returns {{ xml: string, replacements: number }} Processed XML and count
 */
function processXml(xml) {
  let replacements = 0;

  // ── Pass 1: แทนที่ <w:sym> tags ────────────────────────────────────────────
  // Simpler, more robust approach: extract attributes individually
  const pass1 = xml.replace(/<w:sym\b([^>]*?)\/>/gi, (match, attrs) => {
    const fontMatch = attrs.match(/w:font\s*=\s*["']([^"']+)["']/i);
    const font = fontMatch ? fontMatch[1] : '';

    const charMatch = attrs.match(/w:char\s*=\s*["']([^"']+)["']/i);
    const charCode = charMatch ? charMatch[1] : '';

    if (!charCode) return match;

    const replacement = resolveSymChar(font, charCode);
    if (replacement) {
      replacements++;
      return `<w:t>${replacement}</w:t>`;
    }
    return match;
  });

  // ── Pass 2: แทนที่ <w:r> ที่ใช้ฟอนต์ Wingdings/Symbol กับ text ธรรมดา ────
  // กรณีที่ Word เก็บ ● เป็นตัวอักษร 'l' ในฟอนต์ Wingdings (ไม่ใช่ <w:sym>)
  // mammoth จะแปลงออกมาเป็นตัว 'l' โดยไม่รู้ว่ามันควรเป็น ●
  const SYMBOL_FONT_RE = /w:(?:ascii|hAnsi|eastAsia|cs)\s*=\s*["'][^"']*(?:wingdings|symbol|dingbats?|webdings)[^"']*["']/i;

  const pass2 = pass1.replace(/<w:r\b([^>]*)>([\s\S]*?)<\/w:r>/gi, (runMatch, runAttrs, runContent) => {
    if (!SYMBOL_FONT_RE.test(runContent)) return runMatch;

    const fontMatch = runContent.match(/w:(?:ascii|hAnsi)\s*=\s*["']([^"']+)["']/i);
    const fontName = fontMatch ? fontMatch[1] : 'wingdings';

    const newContent = runContent.replace(/<w:t(\b[^>]*)>([^<]+)<\/w:t>/gi, (tMatch, tAttrs, text) => {
      let converted = '';
      let changed = false;
      for (const char of text) {
        const code = char.codePointAt(0);
        // ข้ามตัวอักษรปกติที่ไม่น่าจะเป็น symbol (space, digit, Thai)
        if (code > 0x0E7F || code < 0x20) { converted += char; continue; }
        const hex = code.toString(16).toUpperCase().padStart(4, '0');
        const replacement = resolveSymChar(fontName, hex);
        if (replacement && replacement !== char) {
          converted += replacement;
          changed = true;
          replacements++;
        } else {
          converted += char;
        }
      }
      return changed ? `<w:t${tAttrs}>${converted}</w:t>` : tMatch;
    });

    return `<w:r${runAttrs}>${newContent}</w:r>`;
  });

  return { xml: pass2, replacements };
}

/**
 * Main preprocessing function
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Takes a DOCX file (as Buffer or file path) and returns a processed Buffer
 * with all <w:sym> tags replaced by standard Unicode text.
 * 
 * @param {Buffer|string} input - DOCX file buffer or file path
 * @returns {Buffer} Processed DOCX buffer ready for mammoth.convertToHtml()
 */
function preprocessDocx(input) {
  const zip = new AdmZip(input);
  let totalReplacements = 0;

  // List of XML files inside the DOCX that may contain <w:sym>
  const xmlParts = [
    'word/document.xml',
    'word/header1.xml',
    'word/header2.xml',
    'word/header3.xml',
    'word/footer1.xml',
    'word/footer2.xml',
    'word/footer3.xml',
    'word/footnotes.xml',
    'word/endnotes.xml',
  ];

  for (const partPath of xmlParts) {
    const entry = zip.getEntry(partPath);
    if (!entry) continue;

    const xmlContent = entry.getData().toString('utf-8');

    // Quick check — skip files that don't contain <w:sym
    if (!xmlContent.includes('<w:sym')) continue;

    const { xml: processedXml, replacements } = processXml(xmlContent);
    totalReplacements += replacements;

    if (replacements > 0) {
      zip.updateFile(partPath, Buffer.from(processedXml, 'utf-8'));
    }
  }

  if (totalReplacements > 0) {
    console.log(`[docxPreprocessor] แปลง <w:sym> สำเร็จ ${totalReplacements} จุด`);
  }

  return zip.toBuffer();
}

/**
 * Convenience wrapper: preprocess file path → Buffer
 * 
 * @param {string} filePath - Path to .docx file
 * @returns {Buffer} Processed buffer
 */
function preprocessDocxFile(filePath) {
  const fs = require('fs');
  const buffer = fs.readFileSync(filePath);
  return preprocessDocx(buffer);
}

module.exports = {
  preprocessDocx,
  preprocessDocxFile,
  processXml,
  resolveSymChar,
  SYM_CHAR_MAP,
};
