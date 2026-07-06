const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// Handle UTF-8 filenames properly
const normalizeFilename = (filename) => {
  return filename.replace(/\0/g, '');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const committeeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/committee');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const announcementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/announcements');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else {
    const err = new Error('รองรับเฉพาะไฟล์ PDF และ DOCX เท่านั้น');
    err.status = 400;
    cb(err, false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExt.includes(ext) && allowedMime.includes(file.mimetype)) cb(null, true);
  else {
    const err = new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP) เท่านั้น');
    err.status = 400;
    cb(err, false);
  }
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB

const tqf2Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/tqf2');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/resources');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const resourceFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else {
    const err = new Error('รองรับไฟล์ PDF, DOCX, XLSX, PPTX, ZIP เท่านั้น');
    err.status = 400;
    cb(err, false);
  }
};

// ประกาศรับได้ทั้งรูปปก (field: image) และไฟล์แนบเอกสาร (field: attachments)
// เลือกตัวกรองตาม fieldname — รูปใช้ imageFilter, ไฟล์แนบใช้ resourceFilter
const announcementCombinedFilter = (req, file, cb) => {
  if (file.fieldname === 'image') return imageFilter(req, file, cb);
  if (file.fieldname === 'attachments') return resourceFilter(req, file, cb);
  cb(null, false);
};

// Memory storage for in-memory processing (compare without writing to disk)
const uploadTQF2Compare = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

// ─── Magic-byte verification (กันไฟล์ปลอมนามสกุล) ───────────────────────────
// fileFilter เช็คได้แค่ "นามสกุล" ซึ่งผู้ใช้ปลอมได้ง่าย (เช่น script.html → report.pdf)
// middleware นี้อ่าน byte จริงต้นไฟล์ เทียบกับ signature ของชนิดที่อนุญาต
// รันหลัง multer (ไฟล์ถูกเขียนลง disk แล้ว) — ถ้าไม่ผ่าน ลบไฟล์ทั้ง request ทิ้งทันที
const FILE_SIGNATURES = {
  pdf:  [[0x25, 0x50, 0x44, 0x46]],                                    // "%PDF"
  zip:  [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]], // ZIP/OOXML (docx,xlsx,pptx)
  ole2: [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],            // OLE2 (doc,xls,ppt รุ่นเก่า)
};
// .docx/.xlsx/.pptx คือ zip ข้างใน; .doc/.xls/.ppt ยอมรับทั้ง OLE2 และ zip (เผื่อ user rename docx → doc)
const EXT_SIGNATURE_GROUP = {
  '.pdf': ['pdf'],
  '.docx': ['zip'], '.xlsx': ['zip'], '.pptx': ['zip'], '.zip': ['zip'],
  '.doc': ['zip', 'ole2'], '.xls': ['zip', 'ole2'], '.ppt': ['zip', 'ole2'],
};

// รวบรวม file object จาก multer ทุกรูปแบบ: .single → req.file, .array → req.files[],
// .fields → req.files{ field: [] }
const collectUploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') return Object.values(req.files).flat();
  return [];
};

const headBytes = (file) => {
  if (file.buffer) return file.buffer.subarray(0, 8);          // memoryStorage
  const fd = fs.openSync(file.path, 'r');                       // diskStorage
  try { const b = Buffer.alloc(8); fs.readSync(fd, b, 0, 8, 0); return b; }
  finally { fs.closeSync(fd); }
};

const cleanupUploadedFiles = (files) => {
  for (const f of files) {
    if (f.path) { try { fs.unlinkSync(f.path); } catch { /* best-effort */ } }
  }
};

const verifyUploadSignature = (req, res, next) => {
  try {
    const files = collectUploadedFiles(req);
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const groups = EXT_SIGNATURE_GROUP[ext];
      if (!groups) continue; // รูปภาพ ฯลฯ — ผ่าน (sharp re-encode ตรวจของจริงให้แล้ว)
      const head = headBytes(file);
      const ok = groups.some(g => FILE_SIGNATURES[g].some(sig => sig.every((byte, i) => head[i] === byte)));
      if (!ok) {
        cleanupUploadedFiles(files); // ลบทุกไฟล์ใน request นี้ ป้องกันไฟล์อันตราย/ขยะค้าง
        return res.status(400).json({
          success: false,
          message: `ไฟล์ "${file.originalname}" ไม่ใช่ไฟล์ ${ext.replace('.', '').toUpperCase()} จริง (เนื้อไฟล์ไม่ตรงกับนามสกุล)`,
        });
      }
    }
    next();
  } catch (err) { next(err); }
};

const uploadDocument = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadCommittee = multer({ storage: committeeStorage, fileFilter, limits: { fileSize: MAX_SIZE } });
// limit รวม 50MB (รูปจะถูก sharp re-encode ให้เล็กลงภายหลังอยู่แล้ว, ไฟล์แนบรองรับเอกสารใหญ่ได้)
const uploadAnnouncement = multer({ storage: announcementStorage, fileFilter: announcementCombinedFilter, limits: { fileSize: MAX_SIZE } });
const uploadTQF2 = multer({ storage: tqf2Storage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadResource = multer({ storage: resourceStorage, fileFilter: resourceFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadDocument, uploadCommittee, uploadAnnouncement, uploadTQF2, uploadResource, uploadTQF2Compare, verifyUploadSignature };
