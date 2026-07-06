const router = require('express').Router();
const { Department, User, Curriculum, Major } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');
const { invalidateDepartments } = require('../cache/publicCache');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: Major, as: 'majors', attributes: ['id', 'degree_level', 'name'] }],
      order: [
        ['name', 'ASC'],
        [{ model: Major, as: 'majors' }, 'name', 'ASC'],
      ],
    });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
});

router.post('/', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const code = req.body.code?.trim() || null;
    if (!name) return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อภาควิชา' });
    const dup = await Department.findOne({ where: { name } });
    if (dup) return res.status(409).json({ success: false, message: 'มีภาควิชาชื่อนี้อยู่แล้ว' });
    const dept = await Department.create({ name, code });
    invalidateDepartments();
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
});

router.put('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'ไม่พบภาควิชา' });
    const name = req.body.name?.trim();
    if (req.body.name !== undefined && !name) {
      return res.status(400).json({ success: false, message: 'ชื่อภาควิชาห้ามเว้นว่าง' });
    }
    if (name && name !== dept.name) {
      const dup = await Department.findOne({ where: { name } });
      if (dup) return res.status(409).json({ success: false, message: 'มีภาควิชาชื่อนี้อยู่แล้ว' });
    }
    await dept.update({
      ...(name ? { name } : {}),
      ...(req.body.code !== undefined ? { code: req.body.code?.trim() || null } : {}),
    });
    invalidateDepartments();
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
});

// ลบได้เฉพาะภาควิชาที่ยังไม่มีผู้ใช้/หลักสูตรอ้างอิง — กันข้อมูลกำพร้า
router.delete('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'ไม่พบภาควิชา' });

    const [userCount, curriculumCount] = await Promise.all([
      User.count({ where: { department_id: dept.id } }),
      Curriculum.count({ where: { department_id: dept.id } }),
    ]);
    if (userCount > 0 || curriculumCount > 0) {
      return res.status(409).json({
        success: false,
        message: `ลบไม่ได้ — มีผู้ใช้ ${userCount} คน และหลักสูตร ${curriculumCount} รายการ สังกัดภาควิชานี้อยู่`,
      });
    }

    // ลบสาขาในสังกัดก่อน (เป็น master data ไม่มีตารางอื่นอ้างอิง)
    await Major.destroy({ where: { department_id: dept.id } });
    await dept.destroy();
    invalidateDepartments();
    res.json({ success: true, message: 'ลบภาควิชาแล้ว' });
  } catch (error) { next(error); }
});

module.exports = router;
