const router = require('express').Router();
const { getAll, create, delete: del } = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadResource } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize(ROLES.ADMIN), uploadResource.single('file'), create);
router.delete('/:id', authorize(ROLES.ADMIN), del);

module.exports = router;
