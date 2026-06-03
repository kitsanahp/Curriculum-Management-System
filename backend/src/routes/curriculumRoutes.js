const router = require('express').Router();
const curriculumCtrl = require('../controllers/curriculumController');
const documentCtrl = require('../controllers/documentController');
const tqf2Ctrl = require('../controllers/tqf2Controller');
const annotationCtrl = require('../controllers/annotationController');
const committeeCtrl = require('../controllers/committeeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { uploadDocument, uploadCommittee, uploadTQF2, uploadTQF2Compare } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Annotations — must come BEFORE /:id or Express will treat 'annotations' as a curriculum id
router.get('/annotations/summary', annotationCtrl.getSummary);
router.get('/annotations/counts',  annotationCtrl.getCounts);
router.get('/annotations', annotationCtrl.getAnnotations);
router.post('/annotations', annotationCtrl.createAnnotation);
router.patch('/annotations/:id/resolve', annotationCtrl.resolveAnnotation);
router.delete('/annotations/:id', annotationCtrl.deleteAnnotation);

// Archived Curricula (must be before /:id)
router.get('/archived', authorize(ROLES.ADMIN), curriculumCtrl.getArchived);
router.post('/:id/restore', authorize(ROLES.ADMIN), curriculumCtrl.restore);

// Curriculum CRUD
router.get('/', curriculumCtrl.getAll);
router.get('/:id', curriculumCtrl.getById);
router.get('/:id/audit-logs', curriculumCtrl.getAuditLogs);
router.get('/:id/timeline', curriculumCtrl.getTimeline);
router.post('/', authorize(ROLES.ADMIN), curriculumCtrl.create);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), curriculumCtrl.update);
router.put('/:id/team', authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), curriculumCtrl.updateTeam);
router.delete('/:id', authorize(ROLES.ADMIN), curriculumCtrl.delete);

// Workflow actions
router.post('/:id/submit',          authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), curriculumCtrl.submitByDepartment);
router.post('/:id/reject',          authorize(ROLES.ADMIN), curriculumCtrl.rejectByAdmin);
router.post('/:id/approve',         authorize(ROLES.ADMIN), curriculumCtrl.approveByAdmin);
router.post('/:id/resubmit',        authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), committeeCtrl.resubmitAfterRevision);
router.post('/:id/approve-recheck', authorize(ROLES.ADMIN), curriculumCtrl.approveRecheck);
router.post('/:id/reject-recheck',  authorize(ROLES.ADMIN), curriculumCtrl.rejectRecheck);

// Documents
router.get('/:curriculum_id/documents', documentCtrl.getDocuments);
router.post('/:curriculum_id/documents', authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), uploadDocument.single('file'), documentCtrl.upload);
router.delete('/documents/:id', authorize(ROLES.ADMIN, ROLES.FACULTY), documentCtrl.deleteDocument);
router.get('/documents/:id/download', documentCtrl.download);
router.get('/documents/:id/preview', documentCtrl.preview);
router.get('/documents/:id/versions/:version_id/download', documentCtrl.downloadVersion);
router.get('/documents/:id/versions/:version_id/preview', documentCtrl.previewVersion);

// TQF2 documents
router.get('/tqf2/compare', tqf2Ctrl.compare); // must be before /tqf2/:id routes
router.post('/tqf2/compare-upload',
  uploadTQF2Compare.fields([{ name: 'oldDoc', maxCount: 1 }, { name: 'newDoc', maxCount: 1 }]),
  tqf2Ctrl.compareUpload,
);
router.get('/:curriculum_id/tqf2', tqf2Ctrl.getAll);
router.post('/:curriculum_id/tqf2', authorize(ROLES.ADMIN, ROLES.FACULTY, ROLES.STAFF), uploadTQF2.single('file'), tqf2Ctrl.upload);
router.get('/tqf2/:id/download', tqf2Ctrl.download);
router.get('/tqf2/:id/preview', tqf2Ctrl.preview);
router.delete('/tqf2/:id', authorize(ROLES.ADMIN), tqf2Ctrl.deleteDoc);

// Committee steps
router.get('/:curriculum_id/committee-steps', committeeCtrl.getSteps);
router.post('/committee-steps/:step_id/decision', authorize(ROLES.ADMIN),
  uploadCommittee.single('file'), committeeCtrl.uploadDecision);
router.get('/committee-documents/:id/download', committeeCtrl.downloadDocument);

module.exports = router;
