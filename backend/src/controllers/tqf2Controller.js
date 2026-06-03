const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const HtmlDiff = require('htmldiff-js').default;
const { sequelize, TQF2Document, Curriculum, AuditLog } = require('../models');
const { ROLES, CURRICULUM_STATUS } = require('../config/constants');
const { normalizeSymbols } = require('../services/tqf2SymbolNormalizer');
const { preprocessDocx, preprocessDocxFile } = require('../services/docxPreprocessor');
const { convertPdfToHtml, convertPdfBufferToHtml } = require('../middlewares/pdfConverterMiddleware');
const tqf2Cache = require('../cache/tqf2Cache');

// ── HTML cleaner: ตัด noise จาก Word ก่อนส่ง htmldiff-js ─────────────────────
// mammoth สร้าง class/style ตาม Word formatting — htmldiff-js นับ attribute ที่
// ต่างกันเป็น "เปลี่ยนแปลง" ทั้งที่เนื้อหาเหมือนกัน ฟังก์ชันนี้ตัดทิ้งทั้งหมด

function cleanHtmlBeforeDiff(html) {
  // ก่อนอื่น normalize symbols จาก Wingdings/Symbol/Private Use Area
  let normalized = normalizeSymbols(html);

  const $ = require('cheerio').load(normalized, { decodeEntities: false });

  // ลบ style, class, id ออกจากทุก element
  $('*').removeAttr('style').removeAttr('class').removeAttr('id');

  // ถอด <span> ที่ไม่มี attribute เหลือ (เปลือกขยะจาก Word)
  // ทำหลายรอบเพราะ span ซ้อน span ได้
  const unwrapNaked = () => {
    const queue = [];
    $('span').each((_, el) => {
      if (!el.attribs || Object.keys(el.attribs).length === 0) queue.push(el);
    });
    queue.forEach(el => $(el).replaceWith($(el).html() || ''));
    return queue.length > 0;
  };
  for (let pass = 0; pass < 8 && unwrapNaked(); pass++) {}

  let out = $('body').html() || '';
  out = out
    .replace(/&nbsp;/g, ' ')      // non-breaking space → ช่องว่างปกติ
    .replace(/>\s+</g, '> <')     // FIX #3: เดิมใช้ '>< ' ทำให้คำติดกัน → เปลี่ยนเป็น '> <' เว้น 1 เคาะ
    .replace(/[ \t]{2,}/g, ' ')   // ช่องว่างหลายตัวติดกัน → ตัวเดียว
    .replace(/\n{2,}/g, '\n')     // บรรทัดว่างซ้อน → บรรทัดเดียว
    .trim();
  return out;
}

// ── HTML-based section parser ─────────────────────────────────────────────────

function parseSectionsHtml(html, cheerio) {
  const SECTION_RE = /^\s*หมวดที่\s*([1-8๑-๘])/;
  const THAI_NUM = { '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8 };

  const $ = cheerio.load(html);

  // ── FIX #1: Unwrap single wrapper div ──────────────────────────────────────
  // mammoth อาจห่อเนื้อหาทั้งหมดใน <div> ชั้นเดียว ทำให้ $('body').children()
  // ได้แค่ element เดียว → section parser หาหมวดไม่ได้
  // วิธีแก้: ถ้า body มี child ตัวเดียวและเป็น <div> → ขยับเข้าไปดึง children ข้างใน
  let $root = $('body');
  const topChildren = $root.children();
  if (topChildren.length === 1 && topChildren.first().is('div')) {
    $root = topChildren.first();
  }

  const blocks = [];
  $root.children().each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const m = text.match(SECTION_RE);
    const num = m ? (THAI_NUM[m[1]] ?? parseInt(m[1])) : null;
    blocks.push({ sectionNum: num, title: text, html: $.html(el) });
  });

  // Two-pass: keep only the LAST occurrence of each section number (skip TOC hits)
  const lastIdx = {};
  blocks.forEach((b, i) => { if (b.sectionNum !== null) lastIdx[b.sectionNum] = i; });

  if (!Object.keys(lastIdx).length) {
    return [{ number: 0, title: 'เนื้อหาเอกสาร', html: blocks.map(b => b.html).join('') }];
  }

  const anchors = Object.entries(lastIdx)
    .map(([num, idx]) => ({
      num: parseInt(num),
      idx,
      title: blocks[idx].title.replace(/\s+\d+\s*$/, ''), // strip trailing page numbers
    }))
    .sort((a, b) => a.idx - b.idx);

  // ── FIX #2: เก็บเนื้อหาก่อนหมวดที่ 1 (ปก, สารบัญ) เป็น "ส่วนนำ" ─────────
  // เดิม: เนื้อหาก่อน anchor แรกถูกตัดทิ้ง
  // แก้ไข: กวาด blocks ก่อน anchor แรก → เก็บเป็น section 0 "ส่วนนำ"
  const result = [];
  const firstAnchorIdx = anchors[0].idx;
  if (firstAnchorIdx > 0) {
    const preambleHtml = blocks.slice(0, firstAnchorIdx).map(b => b.html).join('');
    if (preambleHtml.trim()) {
      result.push({ number: 0, title: 'ส่วนนำ', html: preambleHtml });
    }
  }

  anchors.forEach((anchor, i) => {
    const nextIdx = anchors[i + 1]?.idx ?? blocks.length;
    const contentHtml = blocks.slice(anchor.idx + 1, nextIdx).map(b => b.html).join('');
    result.push({ number: anchor.num, title: anchor.title, html: contentHtml });
  });

  return result;
}

// ── Text diff helpers ─────────────────────────────────────────────────────────

function tokenize(text) {
  return text.match(/\S+|\s+/g) || [];
}

function wordDiff(textA, textB) {
  const tokA = tokenize(textA);
  const tokB = tokenize(textB);
  const m = tokA.length, n = tokB.length;

  // Guard against O(m*n) blowup on very large sections
  if (m * n > 4000000) {
    return textA === textB
      ? [{ type: 'equal', value: textA }]
      : [{ type: 'delete', value: textA }, { type: 'insert', value: textB }];
  }

  // LCS table (backward indices)
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = tokA[i] === tokB[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Backtrack + collapse consecutive same-type tokens into one entry
  const ops = [];
  let i = 0, j = 0;
  const push = (type, value) => {
    if (ops.length && ops[ops.length - 1].type === type) ops[ops.length - 1].value += value;
    else ops.push({ type, value });
  };
  while (i < m || j < n) {
    if (i < m && j < n && tokA[i] === tokB[j]) {
      push('equal', tokA[i]); i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      push('insert', tokB[j]); j++;
    } else {
      push('delete', tokA[i]); i++;
    }
  }
  return ops;
}

function splitIntoSections(text) {
  // Require หมวดที่ at the START of the line to avoid matching inline cross-references
  const SECTION_RE = /^\s*หมวดที่\s*([1-8๑-๘])/;
  const THAI_NUM = { '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8 };
  const lines = text.split('\n');

  const occurrences = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(SECTION_RE);
    if (m) {
      const raw = m[1];
      const num = THAI_NUM[raw] ?? parseInt(raw);
      if (!occurrences[num]) occurrences[num] = [];
      occurrences[num].push({ lineIdx: i, title: lines[i].trim() });
    }
  }

  if (!Object.keys(occurrences).length) {
    return [{ number: 0, title: 'เนื้อหาเอกสาร', content: text.trim() }];
  }

  // Use the LAST occurrence of each number — body header, not table of contents
  const anchors = Object.entries(occurrences)
    .map(([num, list]) => ({
      num: parseInt(num),
      lineIdx: list[list.length - 1].lineIdx,
      // strip trailing page number digits (from TOC lines like "หมวดที่ 1 ข้อมูลทั่วไป 1")
      title: list[list.length - 1].title.replace(/\s+\d+\s*$/, ''),
    }))
    .sort((a, b) => a.lineIdx - b.lineIdx);

  return anchors.map((anchor, idx) => {
    const nextLineIdx = anchors[idx + 1]?.lineIdx ?? lines.length;
    const content = lines.slice(anchor.lineIdx + 1, nextLineIdx).join('\n').trim();
    return { number: anchor.num, title: anchor.title, content };
  });
}

exports.getAll = async (req, res, next) => {
  try {
    const { curriculum_id } = req.params;
    const { academic_year } = req.query;

    const curriculum = await Curriculum.findByPk(curriculum_id);
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const where = { curriculum_id, is_deleted: false };
    if (academic_year) where.academic_year = academic_year;

    const docs = await TQF2Document.findAll({
      where,
      include: [{ association: 'uploader', attributes: ['id', 'name', 'role'] }],
      order: [['version_number', 'DESC']],
    });

    // รายการปีที่มีเอกสาร (ใช้สร้าง dropdown filter ใน frontend)
    const { Op } = require('sequelize');
    const yearRows = await TQF2Document.findAll({
      where: { curriculum_id, is_deleted: false, academic_year: { [Op.not]: null } },
      attributes: ['academic_year'],
      group: ['academic_year'],
      order: [['academic_year', 'DESC']],
      raw: true,
    });
    const availableYears = yearRows.map(r => r.academic_year);

    res.json({ success: true, data: docs, meta: { availableYears } });
  } catch (error) { next(error); }
};

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์' });

    const { curriculum_id } = req.params;

    const curriculum = await Curriculum.findByPk(curriculum_id, { attributes: ['id', 'status'] });
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

    const FACULTY_UPLOADABLE = [CURRICULUM_STATUS.PENDING_DEPARTMENT, CURRICULUM_STATUS.REVISION];
    const ADMIN_UPLOADABLE   = [CURRICULUM_STATUS.DEPARTMENT_SUBMITTED, CURRICULUM_STATUS.UNDER_COMMITTEE, CURRICULUM_STATUS.PENDING_ADMIN_RECHECK];

    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      if (!FACULTY_UPLOADABLE.includes(curriculum.status)) {
        return res.status(403).json({ success: false, message: 'ไม่สามารถอัปโหลดได้ในขณะนี้ กรุณารอให้เจ้าหน้าที่ดำเนินการก่อน' });
      }
    }

    if (req.user.role === ROLES.ADMIN) {
      if (!ADMIN_UPLOADABLE.includes(curriculum.status)) {
        return res.status(403).json({ success: false, message: 'ไม่สามารถอัปโหลดได้ในขณะนี้' });
      }
      const count = await TQF2Document.count({ where: { curriculum_id, is_deleted: false } });
      if (count === 0) {
        return res.status(403).json({
          success: false,
          message: 'กรุณารอให้อาจารย์ผู้รับผิดชอบหลักสูตรอัปโหลดไฟล์ มคอ.2 ก่อน',
        });
      }
    }
    const { note, academic_year } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileType = ext === 'doc' ? 'docx' : ext;
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // auto-fill ปีการศึกษา (พ.ศ.) ถ้าไม่ได้ส่งมา
    const currentAcademicYear = academic_year || (new Date().getFullYear() + 543).toString();

    const latest = await TQF2Document.findOne({
      where: { curriculum_id, is_deleted: false, file_type: fileType },
      order: [['version_number', 'DESC']],
    });
    const versionNumber = latest ? latest.version_number + 1 : 1;

    const doc = await TQF2Document.create({
      curriculum_id,
      version_number: versionNumber,
      stored_name: req.file.filename,
      original_name: originalName,
      file_type: fileType,
      file_size: req.file.size,
      uploaded_by: req.user.id,
      note: note || null,
      academic_year: currentAcademicYear,
    });

    await AuditLog.create({
      curriculum_id,
      user_id: req.user.id,
      action: 'UPLOAD_TQF2',
      details: { file_name: originalName, version: versionNumber, doc_id: doc.id },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, data: doc, message: `อัปโหลด มคอ.2 เวอร์ชัน ${versionNumber} สำเร็จ` });

    // Pre-extract ใน background หลัง response ส่งแล้ว
    // ทำให้ compare ครั้งแรกเร็วขึ้น เพราะ HTML extraction เสร็จไปแล้ว
    setImmediate(async () => {
      try {
        const filePath = path.join(__dirname, '../../uploads/tqf2', doc.stored_name);
        let rawHtml = '';
        if (doc.file_type === 'docx') {
          const buf = preprocessDocxFile(filePath);
          const { value } = await mammoth.convertToHtml({ buffer: buf });
          rawHtml = value;
        } else if (doc.file_type === 'pdf') {
          rawHtml = await convertPdfToHtml(filePath);
        }
        if (rawHtml) tqf2Cache.setHtml(doc.id, cleanHtmlBeforeDiff(rawHtml));
      } catch (e) {
        console.error(`[TQF2 pre-extract] doc ${doc.id}:`, e.message);
      }
    });
  } catch (error) { next(error); }
};

exports.download = async (req, res, next) => {
  try {
    const doc = await TQF2Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    // ตรวจสิทธิ์เข้าถึง — เช่นเดียวกับ getAll
    if (req.user.role === ROLES.EXECUTIVE) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    if (req.user.role === ROLES.REGISTRAR || req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const curriculum = await Curriculum.findByPk(doc.curriculum_id, { attributes: ['degree_level', 'department_id'] });
      if (req.user.role === ROLES.REGISTRAR && curriculum?.degree_level !== 'bachelor') {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ (สิทธิ์นายทะเบียนเห็นเฉพาะ ป.ตรี)' });
      }
      if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum?.department_id !== req.user.department_id) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
      }
    }

    const filePath = path.join(__dirname, '../../uploads/tqf2', doc.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });

    const filename = Buffer.from(doc.original_name, 'utf8').toString('binary');
    const encodedFilename = encodeURIComponent(doc.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
    res.download(filePath);
  } catch (error) { next(error); }
};

exports.preview = async (req, res, next) => {
  try {
    const doc = await TQF2Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    // ตรวจสิทธิ์เข้าถึง — เช่นเดียวกับ getAll
    if (req.user.role === ROLES.EXECUTIVE) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    if (req.user.role === ROLES.REGISTRAR || req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const curriculum = await Curriculum.findByPk(doc.curriculum_id, { attributes: ['degree_level', 'department_id'] });
      if (req.user.role === ROLES.REGISTRAR && curriculum?.degree_level !== 'bachelor') {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ (สิทธิ์นายทะเบียนเห็นเฉพาะ ป.ตรี)' });
      }
      if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum?.department_id !== req.user.department_id) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
      }
    }

    const filePath = path.join(__dirname, '../../uploads/tqf2', doc.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });

    if (doc.file_type === 'pdf') {
      const encodedFilename = encodeURIComponent(doc.original_name);
      const filename = Buffer.from(doc.original_name, 'utf8').toString('binary');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
      res.setHeader('Content-Type', 'application/pdf');
      fs.createReadStream(filePath).pipe(res);
    } else {
      const processedBuffer = preprocessDocxFile(filePath);
      const { value: html } = await mammoth.convertToHtml({ buffer: processedBuffer });
      res.json({ success: true, type: 'html', html });
    }
  } catch (error) { next(error); }
};

exports.compare = async (req, res, next) => {
  try {
    const { id_a, id_b } = req.query;
    if (!id_a || !id_b) {
      return res.status(400).json({ success: false, message: 'ต้องระบุ id_a และ id_b' });
    }

    const [docA, docB] = await Promise.all([
      TQF2Document.findByPk(id_a, { include: [{ association: 'uploader', attributes: ['id', 'name', 'role'] }] }),
      TQF2Document.findByPk(id_b, { include: [{ association: 'uploader', attributes: ['id', 'name', 'role'] }] }),
    ]);
    if (!docA || !docB || docA.is_deleted || docB.is_deleted) {
      return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    }

    if (req.user.role === ROLES.EXECUTIVE) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const [currA, currB] = await Promise.all([
      Curriculum.findByPk(docA.curriculum_id, { attributes: ['department_id', 'degree_level'] }),
      Curriculum.findByPk(docB.curriculum_id, { attributes: ['department_id', 'degree_level'] }),
    ]);

    if (req.user.role === ROLES.REGISTRAR) {
      if (currA?.degree_level !== 'bachelor' || currB?.degree_level !== 'bachelor') {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ (สิทธิ์นายทะเบียนเห็นเฉพาะ ป.ตรี)' });
      }
    }

    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      if (
        currA?.department_id !== req.user.department_id ||
        currB?.department_id !== req.user.department_id
      ) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เปรียบเทียบเอกสารนี้' });
      }
    }

    // ── Level 2: diff cache hit → คืนผลทันทีโดยไม่ต้องแตะ file ────────────────
    const cachedSections = tqf2Cache.getDiff(id_a, id_b);
    if (cachedSections) {
      return res.json({
        success: true,
        data: {
          version_a: { id: docA.id, version_number: docA.version_number, original_name: docA.original_name },
          version_b: { id: docB.id, version_number: docB.version_number, original_name: docB.original_name },
          sections: cachedSections,
        },
      });
    }

    // ── Level 1: extract HTML พร้อม html cache ────────────────────────────────
    const extractCleanHtml = async (doc) => {
      const cached = tqf2Cache.getHtml(doc.id);
      if (cached) return cached;

      const filePath = path.join(__dirname, '../../uploads/tqf2', doc.stored_name);
      if (!fs.existsSync(filePath)) return null;

      let html = '';
      if (doc.file_type === 'docx') {
        const processedBuffer = preprocessDocxFile(filePath);
        const result = await mammoth.convertToHtml({ buffer: processedBuffer });
        html = result.value;
      } else if (doc.file_type === 'pdf') {
        html = await convertPdfToHtml(filePath);
      } else {
        return null;
      }
      const cleaned = cleanHtmlBeforeDiff(html);
      tqf2Cache.setHtml(doc.id, cleaned);
      return cleaned;
    };

    const [htmlA, htmlB] = await Promise.all([extractCleanHtml(docA), extractCleanHtml(docB)]);
    if (!htmlA || !htmlB) {
      return res.status(422).json({
        success: false,
        message: 'ไม่รองรับการเปรียบเทียบไฟล์ประเภทนี้ หรือไฟล์สูญหาย กรุณาเลือกไฟล์เวอร์ชันที่เป็น PDF หรือ DOCX เท่านั้น',
      });
    }

    const sectionsA = parseSectionsHtml(htmlA, cheerio);
    const sectionsB = parseSectionsHtml(htmlB, cheerio);

    const allNums = [...new Set([
      ...sectionsA.map(s => s.number),
      ...sectionsB.map(s => s.number),
    ])].sort((a, b) => a - b);

    const sections = allNums.map(num => {
      const sA = sectionsA.find(s => s.number === num);
      const sB = sectionsB.find(s => s.number === num);
      const oldHtml = sA?.html ?? '';
      const newHtml = sB?.html ?? '';
      const title = (sB ?? sA).title;

      const diffHtml = HtmlDiff.execute(oldHtml, newHtml);

      const $d = cheerio.load(diffHtml, { decodeEntities: false });
      const insLen = $d('ins').text().trim().length;
      const delLen = $d('del').text().trim().length;
      const totalLen = $d('body').text().trim().length;
      const hasChanges = insLen > 0 || delLen > 0;
      const changePercent = totalLen > 0 ? Math.min(100, Math.round((insLen + delLen) / totalLen * 100)) : 0;

      return { section_number: num, title, has_changes: hasChanges, changePercent, diffHtml };
    });

    // เก็บ diff cache ไว้ใช้ครั้งต่อไป
    tqf2Cache.setDiff(id_a, id_b, sections);

    res.json({
      success: true,
      data: {
        version_a: { id: docA.id, version_number: docA.version_number, original_name: docA.original_name },
        version_b: { id: docB.id, version_number: docB.version_number, original_name: docB.original_name },
        sections,
      },
    });
  } catch (error) { next(error); }
};

exports.compareUpload = async (req, res, next) => {
  try {
    if (!req.files?.oldDoc?.[0] || !req.files?.newDoc?.[0]) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดไฟล์ทั้งสองเวอร์ชัน (oldDoc, newDoc)' });
    }

    const extractBufferHtml = async (file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.docx' || ext === '.doc') {
        const processed = preprocessDocx(file.buffer);
        const { value: html } = await mammoth.convertToHtml({ buffer: processed });
        return cleanHtmlBeforeDiff(html);
      } else if (ext === '.pdf') {
        const html = await convertPdfBufferToHtml(file.buffer);
        return cleanHtmlBeforeDiff(html);
      }
      return null;
    };

    const [cleanOld, cleanNew] = await Promise.all([
      extractBufferHtml(req.files.oldDoc[0]),
      extractBufferHtml(req.files.newDoc[0])
    ]);

    if (!cleanOld || !cleanNew) {
      return res.status(422).json({
        success: false,
        message: 'ไม่รองรับไฟล์ประเภทนี้ กรุณาอัปโหลดเฉพาะไฟล์ PDF หรือ DOCX เท่านั้น'
      });
    }

    const sectionsOld = parseSectionsHtml(cleanOld, cheerio);
    const sectionsNew = parseSectionsHtml(cleanNew, cheerio);

    const allNums = [...new Set([
      ...sectionsOld.map(s => s.number),
      ...sectionsNew.map(s => s.number),
    ])].sort((a, b) => a - b);

    const data = allNums.map(num => {
      const sA = sectionsOld.find(s => s.number === num);
      const sB = sectionsNew.find(s => s.number === num);
      const oldSectionHtml = sA?.html ?? '';
      const newSectionHtml = sB?.html ?? '';
      const sectionName = (sB ?? sA).title;
      const diffHtml = HtmlDiff.execute(oldSectionHtml, newSectionHtml);

      const $d = cheerio.load(diffHtml, { decodeEntities: false });
      const insLen = $d('ins').text().trim().length;
      const delLen = $d('del').text().trim().length;
      const totalLen = $d('body').text().trim().length;
      const hasChanges = insLen > 0 || delLen > 0;
      const changePercent = totalLen > 0 ? Math.min(100, Math.round((insLen + delLen) / totalLen * 100)) : 0;

      return { sectionNumber: num, sectionName, hasChanges, changePercent,
               oldHtml: oldSectionHtml, newHtml: newSectionHtml, diffHtml };
    });

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.deleteDoc = async (req, res, next) => {
  try {
    const doc = await TQF2Document.findByPk(req.params.id, {
      include: [{ model: Curriculum, as: 'curriculum', attributes: ['department_id'] }]
    });
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && doc.curriculum?.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบไฟล์นี้' });
    }

    doc.is_deleted = true;
    await doc.save();
    tqf2Cache.invalidate(doc.id);

    await AuditLog.create({
      curriculum_id: doc.curriculum_id,
      user_id: req.user.id,
      action: 'DELETE_TQF2',
      details: { doc_id: doc.id, version: doc.version_number },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'ลบไฟล์สำเร็จ' });
  } catch (error) { next(error); }
};
