const router = require('express').Router();
const { Department } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
});

router.post('/', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
});

router.put('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'ไม่พบภาควิชา' });
    await dept.update(req.body);
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
});

module.exports = router;
