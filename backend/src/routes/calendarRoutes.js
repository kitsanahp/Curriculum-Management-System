const router = require('express').Router();
const { getAll, create, delete: del } = require('../controllers/calendarController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/', getAll);
router.post('/', create);
router.delete('/:id', del);

module.exports = router;
