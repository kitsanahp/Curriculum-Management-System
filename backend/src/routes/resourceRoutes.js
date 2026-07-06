const router = require('express').Router();
const { getAll, create, update, setPin, delete: del } = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadResource, verifyUploadSignature } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize(ROLES.ADMIN), uploadResource.single('file'), verifyUploadSignature, create);
router.put('/:id', authorize(ROLES.ADMIN), uploadResource.single('file'), verifyUploadSignature, update);
router.patch('/:id/pin', authorize(ROLES.ADMIN), setPin);
router.delete('/:id', authorize(ROLES.ADMIN), del);

module.exports = router;
