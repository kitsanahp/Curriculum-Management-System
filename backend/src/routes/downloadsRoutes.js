const router = require('express').Router();
const committeeCtrl = require('../controllers/committeeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.get('/', authorize(ROLES.ADMIN, ROLES.REGISTRAR), committeeCtrl.getDownloads);

module.exports = router;
