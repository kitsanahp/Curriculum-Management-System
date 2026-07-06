const router = require('express').Router();
const { Major, Department } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN)); // การอ่านใช้ GET /departments (แนบ majors มาแล้ว) — ที่นี่มีแต่เขียน

const VALID_LEVELS = ['bachelor', 'master', 'doctoral'];

router.post('/', async (req, res, next) => {
  try {
    const { department_id, degree_level, name } = req.body;
    if (!department_id || !VALID_LEVELS.includes(degree_level) || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุภาควิชา ระดับปริญญา และชื่อสาขาให้ครบ' });
    }
    const dept = await Department.findByPk(department_id);
    if (!dept) return res.status(404).json({ success: false, message: 'ไม่พบภาควิชา' });
    const dup = await Major.findOne({ where: { department_id, degree_level, name: name.trim() } });
    if (dup) return res.status(409).json({ success: false, message: 'มีสาขานี้ในระดับปริญญานี้อยู่แล้ว' });
    const major = await Major.create({ department_id, degree_level, name: name.trim() });
    res.status(201).json({ success: true, data: major });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (!major) return res.status(404).json({ success: false, message: 'ไม่พบสาขาวิชา' });
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ success: false, message: 'ชื่อสาขาห้ามเว้นว่าง' });
    if (name !== major.name) {
      const dup = await Major.findOne({
        where: { department_id: major.department_id, degree_level: major.degree_level, name },
      });
      if (dup) return res.status(409).json({ success: false, message: 'มีสาขานี้ในระดับปริญญานี้อยู่แล้ว' });
    }
    await major.update({ name });
    res.json({ success: true, data: major });
  } catch (error) { next(error); }
});

// ลบได้อิสระ — เป็นเพียงรายการตัวเลือก (หลักสูตรเก็บชื่อสาขาเป็นข้อความ ไม่ได้อ้างอิงด้วย FK)
router.delete('/:id', async (req, res, next) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (!major) return res.status(404).json({ success: false, message: 'ไม่พบสาขาวิชา' });
    await major.destroy();
    res.json({ success: true, message: 'ลบสาขาวิชาแล้ว' });
  } catch (error) { next(error); }
});

module.exports = router;
