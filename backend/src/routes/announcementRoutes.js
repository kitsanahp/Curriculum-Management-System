const router = require('express').Router();
const { getAll, getPublic, create, update, delete: del } = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadAnnouncement } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.get('/public', getPublic);

router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize(ROLES.ADMIN), uploadAnnouncement.single('image'), create);
router.put('/:id', authorize(ROLES.ADMIN), uploadAnnouncement.single('image'), update);
router.delete('/:id', authorize(ROLES.ADMIN), del);

module.exports = router;
