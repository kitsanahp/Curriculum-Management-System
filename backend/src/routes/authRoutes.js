const router = require('express').Router();
const { login, register, getMe, changePassword, forgotPassword, resetPassword, devLogin, logout } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { Department } = require('../models');
const rateLimit = require('express-rate-limit');

// Rate limiter สำหรับ login เพื่อป้องกัน brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // จำกัดการล็อกอิน 10 ครั้งต่อ IP ภายใน windowMs
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter สำหรับ reset password เพื่อกัน brute-force token
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'มีการพยายามตั้งรหัสผ่านบ่อยเกินไป กรุณาลองใหม่ใน 15 นาที' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.post('/dev-login', devLogin);
router.post('/logout', authenticate, logout);
router.post('/register', register);
// cache ผ่านโมดูลกลาง — ถูก invalidate ทันทีเมื่อแอดมินเพิ่ม/แก้/ลบภาควิชา
const { cache } = require('../cache/publicCache');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

router.get('/departments-public', async (req, res, next) => {
  try {
    if (cache.departments && (Date.now() - cache.departmentsCachedAt < CACHE_TTL)) {
      return res.json({ success: true, data: cache.departments });
    }

    const all = await Department.findAll({ order: [['id', 'ASC']] });
    const seen = new Set();
    const departments = all.filter(d => seen.has(d.name) ? false : seen.add(d.name));
    departments.sort((a, b) => a.name.localeCompare(b.name, 'th'));

    cache.departments = departments;
    cache.departmentsCachedAt = Date.now();

    res.json({ success: true, data: departments });
  } catch (e) { next(e); }
});
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
