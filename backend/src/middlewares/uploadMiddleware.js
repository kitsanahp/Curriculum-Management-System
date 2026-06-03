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

// Memory storage for in-memory processing (compare without writing to disk)
const uploadTQF2Compare = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

const uploadDocument = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadCommittee = multer({ storage: committeeStorage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadAnnouncement = multer({ storage: announcementStorage, fileFilter: imageFilter, limits: { fileSize: 5242880 } });
const uploadTQF2 = multer({ storage: tqf2Storage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadResource = multer({ storage: resourceStorage, fileFilter: resourceFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadDocument, uploadCommittee, uploadAnnouncement, uploadTQF2, uploadResource, uploadTQF2Compare };
