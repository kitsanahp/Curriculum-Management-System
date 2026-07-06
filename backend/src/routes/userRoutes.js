const router = require('express').Router();
const { getAll, create, update, deleteUser, sendPasswordReset, getNotifications, markNotificationRead, markAllNotificationsRead, deleteAllNotifications } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.get('/', authorize(ROLES.ADMIN), getAll);
router.post('/', authorize(ROLES.ADMIN), create);
router.put('/:id', authorize(ROLES.ADMIN), update);
router.delete('/:id', authorize(ROLES.ADMIN), deleteUser);
router.post('/:id/send-reset', authorize(ROLES.ADMIN), sendPasswordReset);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.delete('/notifications/clear-all', deleteAllNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
