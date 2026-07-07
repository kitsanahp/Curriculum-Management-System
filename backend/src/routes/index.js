const router = require('express').Router();
const { authenticate } = require('../middlewares/authMiddleware');
const dashboardCtrl = require('../controllers/dashboardController');

// ─── Dashboard summary (single endpoint, role-aware) ───────────────────────
router.get('/dashboard/summary', authenticate, dashboardCtrl.getSummary);

// ─── ลงทะเบียน route ทั้งหมด ──────────────────────────────────────────────
router.use('/auth',           require('./authRoutes'));        // login, register, getMe
router.use('/users',          require('./userRoutes'));        // จัดการผู้ใช้ + notification
router.use('/departments',    require('./departmentRoutes')); // ข้อมูลภาควิชา/สาขา
router.use('/degree-titles',  require('./degreeTitleRoutes')); // ชื่อวุฒิ/ชื่อปริญญา (master data)
router.use('/majors',         require('./majorRoutes'));       // สาขาวิชาในภาควิชา (master data)
router.use('/curricula',      require('./curriculumRoutes')); // หลักสูตร + เอกสาร + committee + TQF2
router.use('/announcements',  require('./announcementRoutes')); // ประกาศแจ้งเวียน
router.use('/resources',      require('./resourceRoutes'));   // แบบฟอร์มและเอกสารดาวน์โหลด
router.use('/calendar-events',require('./calendarRoutes'));   // ปฏิทินกิจกรรม
router.use('/downloads',      require('./downloadsRoutes')); // เอกสาร general_education สำหรับ registrar
router.use('/email-logs',     require('./emailLogRoutes'));  // มอนิเตอร์การส่งอีเมล (admin)

// health check — ใช้ตรวจสอบว่า API ยังทำงานอยู่
router.get('/health', (_req, res) => res.json({ success: true, message: 'API is running' }));

module.exports = router;
