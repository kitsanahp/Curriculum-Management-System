const path = require('path');
const fs = require('fs');
const { sequelize, Document, DocumentVersion, Curriculum, AuditLog, Notification, User } = require('../models');
const { ROLES, CURRICULUM_STATUS } = require('../config/constants');
const { normalizeSymbols } = require('../services/tqf2SymbolNormalizer');
const { preprocessDocxFile } = require('../services/docxPreprocessor');

exports.getDocuments = async (req, res, next) => {
  try {
    const { curriculum_id } = req.params;
    const curriculum = await Curriculum.findByPk(curriculum_id);
    if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });
    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && curriculum.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }
    if (req.user.role === ROLES.REGISTRAR && curriculum.degree_level !== 'bachelor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ (สิทธิ์นายทะเบียนเห็นเฉพาะ ป.ตรี)' });
    }

    const { page, limit } = req.query;
    
    const queryOptions = {
      where: { curriculum_id, is_deleted: false },
      include: [
        {
          model: DocumentVersion, as: 'versions',
          include: [{ association: 'uploader', attributes: ['id', 'name', 'role'] }],
          order: [['version_number', 'DESC']]
        },
        { association: 'uploader', attributes: ['id', 'name', 'role'] }
      ],
      order: [['created_at', 'DESC']]
    };

    if (page && limit) {
      const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
      const { count, rows } = await Document.findAndCountAll(queryOptions);
      return res.json({
        success: true,
        data: rows,
        meta: { total: count, page: parsedPage, limit: parsedLimit }
      });
    }

    const documents = await Document.findAll(queryOptions);
    res.json({ success: true, data: documents });
  } catch (error) { next(error); }
};

exports.upload = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์' });
  const { curriculum_id } = req.params;

  const curriculum = await Curriculum.findByPk(curriculum_id, { attributes: ['id', 'status', 'department_id'] });
  if (!curriculum) return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตร' });

  const FACULTY_UPLOADABLE = [CURRICULUM_STATUS.PENDING_DEPARTMENT, CURRICULUM_STATUS.REVISION];
  const ADMIN_UPLOADABLE   = [CURRICULUM_STATUS.DEPARTMENT_SUBMITTED, CURRICULUM_STATUS.UNDER_COMMITTEE, CURRICULUM_STATUS.PENDING_ADMIN_RECHECK];

  if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
    if (!FACULTY_UPLOADABLE.includes(curriculum.status)) {
      return res.status(403).json({ success: false, message: 'ไม่สามารถอัปโหลดได้ในขณะนี้ กรุณารอให้เจ้าหน้าที่ดำเนินการก่อน' });
    }
  }

  if (req.user.role === ROLES.ADMIN) {
    if (!ADMIN_UPLOADABLE.includes(curriculum.status)) {
      return res.status(403).json({ success: false, message: 'ไม่สามารถอัปโหลดได้ในขณะนี้' });
    }
    const count = await Document.count({ where: { curriculum_id, is_deleted: false } });
    if (count === 0) {
      return res.status(403).json({
        success: false,
        message: 'กรุณารอให้อาจารย์ผู้รับผิดชอบหลักสูตรอัปโหลดเอกสารก่อน',
      });
    }
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  const fileType = ext === 'doc' ? 'docx' : ext;
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const docType = ['tqf2', 'reference'].includes(req.body.document_type) ? req.body.document_type : 'reference';

  // ใช้ transaction เพื่อป้องกัน orphan version record ถ้า doc.save() fail
  const t = await sequelize.transaction();
  try {
    let doc = await Document.findOne({
      where: { curriculum_id, original_name: originalName, is_deleted: false },
      transaction: t,
      lock: t.LOCK.UPDATE // ล็อก Row นี้ไว้ชั่วคราว ป้องกัน Race Condition (ผู้ใช้หลายคนอัปโหลดพร้อมกัน)
    });

    if (doc) {
      // หา version ล่าสุดด้วย method max() ของ Sequelize ซึ่งเร็วและได้ผลลัพธ์เป็นตัวเลขโดยตรง
      const maxVer = await DocumentVersion.max('version_number', {
        where: { document_id: doc.id },
        transaction: t
      });
      await DocumentVersion.create({
        document_id: doc.id,
        version_number: (maxVer || 0) + 1,
        stored_name: doc.stored_name,
        original_name: doc.original_name,
        file_size: doc.file_size,
        uploaded_by: doc.uploaded_by,
        note: null
      }, { transaction: t });

      doc.stored_name = req.file.filename;
      doc.file_size = req.file.size;
      doc.uploaded_by = req.user.id;
      await doc.save({ transaction: t });
    } else {
      doc = await Document.create({
        curriculum_id, original_name: originalName,
        stored_name: req.file.filename, file_type: fileType,
        file_size: req.file.size, uploaded_by: req.user.id,
        document_type: docType
      }, { transaction: t });
    }

    await AuditLog.create({
      curriculum_id, user_id: req.user.id,
      action: 'UPLOAD_DOCUMENT',
      details: { file_name: originalName, document_id: doc.id },
      ip_address: req.ip
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: doc, message: 'อัปโหลดไฟล์สำเร็จ' });
  } catch (error) {
    await t.rollback();
    // ถ้า Transaction พัง ต้องลบไฟล์ที่ Multer อัปโหลดไปแล้วทิ้ง ป้องกัน Orphaned File (ไฟล์ขยะค้างในเครื่อง)
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/documents', req.file.filename);
      fs.unlink(filePath, err => {
        if (err) console.error('Failed to cleanup orphaned file:', err);
      });
    }
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id, {
      include: [{ model: Curriculum, as: 'curriculum', attributes: ['department_id'] }]
    });
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    // ตรวจ ownership — faculty/staff ลบได้เฉพาะ doc ของ dept ตัวเอง
    if ((req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) && doc.curriculum?.department_id !== req.user.department_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบไฟล์นี้' });
    }

    doc.is_deleted = true;
    await doc.save();
    await AuditLog.create({
      curriculum_id: doc.curriculum_id, user_id: req.user.id,
      action: 'DELETE_DOCUMENT', details: { document_id: doc.id, file_name: doc.original_name },
      ip_address: req.ip
    });
    res.json({ success: true, message: 'ลบไฟล์สำเร็จ' });
  } catch (error) { next(error); }
};

exports.download = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });
    const filePath = path.join(__dirname, '../../uploads/documents', doc.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });
    
    // Handle UTF-8 filename for all browsers
    const filename = Buffer.from(doc.original_name, 'utf8').toString('binary');
    const encodedFilename = encodeURIComponent(doc.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
    res.download(filePath);
  } catch (error) { next(error); }
};

exports.preview = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });

    const filePath = path.join(__dirname, '../../uploads/documents', doc.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });

    if (doc.file_type === 'pdf') {
      const encodedFilename = encodeURIComponent(doc.original_name);
      const filename = Buffer.from(doc.original_name, 'utf8').toString('binary');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
      res.setHeader('Content-Type', 'application/pdf');
      fs.createReadStream(filePath).pipe(res);
    } else {
      const cachePath = `${filePath}.cache.html`;
      if (fs.existsSync(cachePath)) {
        // ใช้ fs.promises.readFile แทน fs.readFileSync เพื่อไม่ให้ Block Event Loop
        const cachedHtml = await fs.promises.readFile(cachePath, 'utf8');
        return res.json({ success: true, type: 'docx', html: cachedHtml });
      }

      const mammoth = require('mammoth');
      // Pre-process DOCX to convert <w:sym> (Wingdings/Symbol) → Unicode
      const processedBuffer = preprocessDocxFile(filePath);
      const result = await mammoth.convertToHtml({ buffer: processedBuffer });
      const normalizedHtml = normalizeSymbols(result.value);
      
      fs.writeFile(cachePath, normalizedHtml, 'utf8', err => {
        if (err) console.error('Failed to write html cache:', err);
      });
      res.json({ success: true, type: 'docx', html: normalizedHtml });
    }
  } catch (error) { next(error); }
};

exports.previewVersion = async (req, res, next) => {
  try {
    const version = await DocumentVersion.findByPk(req.params.version_id);
    if (!version) return res.status(404).json({ success: false, message: 'ไม่พบ version' });

    const filePath = path.join(__dirname, '../../uploads/documents', version.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });

    const fileType = version.original_name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx';
    if (fileType === 'pdf') {
      const encodedFilename = encodeURIComponent(version.original_name);
      const filename = Buffer.from(version.original_name, 'utf8').toString('binary');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
      res.setHeader('Content-Type', 'application/pdf');
      fs.createReadStream(filePath).pipe(res);
    } else {
      const cachePath = `${filePath}.cache.html`;
      if (fs.existsSync(cachePath)) {
        // ใช้ fs.promises.readFile แทน fs.readFileSync เพื่อไม่ให้ Block Event Loop
        const cachedHtml = await fs.promises.readFile(cachePath, 'utf8');
        return res.json({ success: true, type: 'docx', html: cachedHtml });
      }

      const mammoth = require('mammoth');
      // Pre-process DOCX to convert <w:sym> (Wingdings/Symbol) → Unicode
      const processedBuffer = preprocessDocxFile(filePath);
      const result = await mammoth.convertToHtml({ buffer: processedBuffer });
      const normalizedHtml = normalizeSymbols(result.value);
      
      fs.writeFile(cachePath, normalizedHtml, 'utf8', err => {
        if (err) console.error('Failed to write html cache:', err);
      });
      res.json({ success: true, type: 'docx', html: normalizedHtml });
    }
  } catch (error) { next(error); }
};

exports.downloadVersion = async (req, res, next) => {
  try {
    const version = await DocumentVersion.findByPk(req.params.version_id, { include: ['document'] });
    if (!version) return res.status(404).json({ success: false, message: 'ไม่พบ version' });
    const filePath = path.join(__dirname, '../../uploads/documents', version.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'ไฟล์ไม่พบในระบบ' });
    
    // Handle UTF-8 filename for all browsers
    const filename = Buffer.from(version.original_name, 'utf8').toString('binary');
    const encodedFilename = encodeURIComponent(version.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=utf-8''${encodedFilename}`);
    res.download(filePath);
  } catch (error) { next(error); }
};
