const router = require('express').Router();
const { getAll, getPublic, create, update, delete: del, downloadAttachment } = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadAnnouncement, verifyUploadSignature } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

// รูปปก (image, 1) + ไฟล์แนบเอกสาร (attachments, สูงสุด 10)
const announcementUpload = uploadAnnouncement.fields([
  { name: 'image', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]);

router.get('/public', getPublic);
// ดาวน์โหลดไฟล์แนบ — public เพื่อให้คงชื่อไฟล์เดิม และเปิดได้โดยไม่ต้องแนบ token
router.get('/attachments/:id/download', downloadAttachment);

router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize(ROLES.ADMIN), announcementUpload, verifyUploadSignature, create);
router.put('/:id', authorize(ROLES.ADMIN), announcementUpload, verifyUploadSignature, update);
router.delete('/:id', authorize(ROLES.ADMIN), del);

module.exports = router;
