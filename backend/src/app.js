const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const path         = require('path');
const helmet       = require('helmet');
const compression  = require('compression');
const cookieParser = require('cookie-parser');

const routes          = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { authenticate } = require('./middlewares/authMiddleware');

const app = express();

app.use(compression());
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // อนุญาตให้ frontend โหลดรูปจาก /uploads ได้
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

// serve ไฟล์ที่ upload (เอกสาร, รูปภาพ ฯลฯ) แบบ static
// เปิดให้โฟลเดอร์ประกาศเป็นสาธารณะ เพื่อให้หน้า Login ดึงรูปไปแสดงได้โดยไม่ต้องมี Token
app.use('/uploads/announcements', express.static(path.join(__dirname, '../uploads/announcements')));
app.use('/uploads', authenticate, express.static(path.join(__dirname, '../uploads')));
// serve assets ของ backend (โลโก้มหาวิทยาลัย/คณะ สำหรับ email)
app.use('/assets',  express.static(path.join(__dirname, 'assets')));

// routes หลักทั้งหมดอยู่ใต้ /api
app.use('/api', routes);

// error handler ส่วนกลาง — ต้องอยู่หลัง routes เสมอ
app.use(errorMiddleware);

module.exports = app;
