const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const path         = require('path');
const helmet       = require('helmet');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

const routes          = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { authenticate } = require('./middlewares/authMiddleware');

const app = express();

// production อยู่หลัง reverse proxy (nginx) — เชื่อ X-Forwarded-For เพียง 1 ชั้น
// เพื่อให้ req.ip / rate-limit / audit log ได้ IP จริงของผู้ใช้ (ไม่ใช่ IP ของ proxy)
// ตั้งเป็น 1 (ไม่ใช่ true) เพื่อกันการปลอม IP มา bypass rate limit
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(compression());
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // อนุญาตให้ frontend โหลดรูปจาก /uploads ได้
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // preview PDF ใช้ <iframe src="blob:..."> — default-src 'self' ไม่ครอบ blob:
      // ถ้าไม่เปิด Chrome จะบล็อก iframe ("เนื้อหานี้ถูกบล็อก")
      'frame-src': ["'self'", 'blob:'],
      'img-src': ["'self'", 'data:', 'blob:'],
    },
  },
}));

// อนุญาต cross-origin จาก frontend เท่านั้น (กำหนดใน .env → FRONTEND_URL)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// log requests — dev mode แสดงสี, production ใช้ combined format
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// parse request body เป็น JSON และ URL-encoded พร้อม charset utf8
app.use(express.json({ charset: 'utf8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf8' }));

// ─── Static file serving ─────────────────────────────────────────────────────
// หลักการ: เปิด static เฉพาะไฟล์ที่ "ไม่ผูกสิทธิ์รายหลักสูตร" เท่านั้น
//   • announcements → public (หน้า Login ต้องโหลดรูปโดยไม่มี token)
//   • resources     → แบบฟอร์มกลาง ทุก role ที่ login เข้าถึงได้ (ไม่มี scope รายภาควิชา)
//
// ⚠️ ไฟล์ที่ผูกสิทธิ์รายหลักสูตร (documents / tqf2 / committee) ห้าม serve แบบ static
//    เพราะ express.static ตรวจได้แค่ "login แล้วหรือยัง" — ไม่รู้ว่าไฟล์เป็นของหลักสูตรไหน
//    จึงข้าม authorization รายหลักสูตร (canAccessCurriculum / canReadCurriculumFile) → IDOR
//    ไฟล์กลุ่มนี้ต้องดาวน์โหลดผ่าน controller endpoint ที่เช็คสิทธิ์เท่านั้น
//    (/api/curricula/documents/:id/download, /tqf2/:id/download, /committee-documents/:id/download)
app.use('/uploads/announcements', express.static(path.join(__dirname, '../uploads/announcements')));
app.use('/uploads/resources', authenticate, express.static(path.join(__dirname, '../uploads/resources')));
// serve assets ของ backend (โลโก้มหาวิทยาลัย/คณะ สำหรับ email)
app.use('/assets',  express.static(path.join(__dirname, 'assets')));

// ─── Global API rate limit ───────────────────────────────────────────────────
// กัน DoS / abuse / brute-force ระดับแอป (login/reset มี limiter เข้มเฉพาะของตัวเองอยู่แล้ว)
// ตั้งเพดานสูงพอสำหรับการใช้งานปกติของเจ้าหน้าที่ แต่ตัด traffic ผิดปกติ
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,                 // 600 req / 15 นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'มีคำขอเข้ามามากเกินไป กรุณาลองใหม่ในภายหลัง' },
});

// limiter เข้มเฉพาะ endpoint ที่กิน CPU หนัก (แปลง DOCX/PDF + diff O(m·n)) — กันยิงรัวจนเครื่องล่ม
const heavyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,                  // 30 req / 5 นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'เปรียบเทียบเอกสารถี่เกินไป กรุณาเว้นระยะสักครู่' },
});

app.use('/api', apiLimiter);
// ครอบ compare/compare-upload ด้วย limiter เข้ม (path จริงคือ /api/curricula/tqf2/compare*)
app.use('/api/curricula/tqf2/compare', heavyLimiter);

// routes หลักทั้งหมดอยู่ใต้ /api
app.use('/api', routes);

// ─── Production: เสิร์ฟ frontend build จาก service เดียวกัน (Railway / single-server) ──
// dev ไม่เข้าเงื่อนไขนี้ — Vite dev server เสิร์ฟ frontend แยกที่ :5173 อยู่แล้ว
const distDir = path.join(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production' && require('fs').existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: router เป็น history mode — path ที่ไม่ใช่ api/uploads/assets ต้องได้ index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// error handler ส่วนกลาง — ต้องอยู่หลัง routes เสมอ
app.use(errorMiddleware);

module.exports = app;
