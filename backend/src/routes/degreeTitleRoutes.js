const router = require('express').Router();
const { DegreeTitle } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

const VALID_LEVELS = ['bachelor', 'master', 'doctoral'];

// ทุก role อ่านได้ — ใช้เป็นตัวเลือกตอนสร้าง/แก้ไขหลักสูตร
router.get('/', async (req, res, next) => {
  try {
    const titles = await DegreeTitle.findAll({
      order: [['degree_level', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: titles });
  } catch (error) { next(error); }
});

router.post('/', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const { degree_level, name, abbr } = req.body;
    if (!VALID_LEVELS.includes(degree_level) || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุระดับปริญญาและชื่อวุฒิให้ถูกต้อง' });
    }
    const dup = await DegreeTitle.findOne({ where: { degree_level, name: name.trim() } });
    if (dup) return res.status(409).json({ success: false, message: 'มีชื่อวุฒินี้ในระดับปริญญานี้อยู่แล้ว' });
    const title = await DegreeTitle.create({ degree_level, name: name.trim(), abbr: abbr?.trim() || null });
    res.status(201).json({ success: true, data: title });
  } catch (error) { next(error); }
});

router.put('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const title = await DegreeTitle.findByPk(req.params.id);
    if (!title) return res.status(404).json({ success: false, message: 'ไม่พบชื่อวุฒิ' });
    const { degree_level, name, abbr } = req.body;
    if (degree_level && !VALID_LEVELS.includes(degree_level)) {
      return res.status(400).json({ success: false, message: 'ระดับปริญญาไม่ถูกต้อง' });
    }
    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ success: false, message: 'ชื่อวุฒิห้ามเว้นว่าง' });
    }
    await title.update({
      ...(degree_level ? { degree_level } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(abbr !== undefined ? { abbr: abbr?.trim() || null } : {}),
    });
    res.json({ success: true, data: title });
  } catch (error) { next(error); }
});

// ลบได้อิสระ — เป็นเพียงรายการตัวเลือก ไม่มีตารางอื่นอ้างอิงด้วย FK
router.delete('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const title = await DegreeTitle.findByPk(req.params.id);
    if (!title) return res.status(404).json({ success: false, message: 'ไม่พบชื่อวุฒิ' });
    await title.destroy();
    res.json({ success: true, message: 'ลบชื่อวุฒิแล้ว' });
  } catch (error) { next(error); }
});

module.exports = router;
