const { DocumentAnnotation, Document, TQF2Document, Curriculum, User } = require('../models');
const { Op } = require('sequelize');
const { ROLES } = require('../config/constants');

exports.getAnnotations = async (req, res, next) => {
  try {
    const { document_id, document_type } = req.query;
    if (!document_id || !document_type) {
      return res.status(400).json({ success: false, message: 'ต้องระบุ document_id และ document_type' });
    }

    // ตรวจสอบว่า document ยังมีอยู่และไม่ถูก soft-delete
    const docModel = document_type === 'tqf2' ? TQF2Document : Document;
    const doc = await docModel.findOne({ where: { id: document_id, is_deleted: false } });
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const annotations = await DocumentAnnotation.findAll({
      where: { document_id, document_type },
      include: [{ association: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: annotations });
  } catch (error) { next(error); }
};

exports.createAnnotation = async (req, res, next) => {
  try {
    const { document_id, document_type, selected_text, context_before, context_after, comment, color } = req.body;
    if (!document_id || !document_type || !selected_text) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    // ตรวจสอบว่า document ยังมีอยู่และไม่ถูก soft-delete
    const docModel = document_type === 'tqf2' ? TQF2Document : Document;
    const doc = await docModel.findOne({ where: { id: document_id, is_deleted: false } });
    if (!doc) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });

    const annotation = await DocumentAnnotation.create({
      document_id, document_type,
      selected_text, context_before, context_after,
      comment, color: color || 'yellow',
      author_id: req.user.id,
    });
    const withAuthor = await DocumentAnnotation.findByPk(annotation.id, {
      include: [{ association: 'author', attributes: ['id', 'name', 'role'] }],
    });
    res.status(201).json({ success: true, data: withAuthor });
  } catch (error) { next(error); }
};

exports.resolveAnnotation = async (req, res, next) => {
  try {
    const ann = await DocumentAnnotation.findByPk(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'ไม่พบความเห็น' });
    ann.is_resolved = !ann.is_resolved;
    await ann.save();
    res.json({ success: true, data: ann });
  } catch (error) { next(error); }
};

exports.getCounts = async (req, res, next) => {
  try {
    const { document_type, document_ids } = req.query;
    if (!document_type || !document_ids) return res.json({ success: true, data: {} });

    const ids = String(document_ids).split(',').map(Number).filter(Boolean);
    if (!ids.length) return res.json({ success: true, data: {} });

    const { fn, col } = require('sequelize');
    const rows = await DocumentAnnotation.findAll({
      where: { document_type, document_id: { [Op.in]: ids } },
      attributes: ['document_id', [fn('COUNT', col('id')), 'count']],
      group: ['document_id'],
      raw: true,
    });
    const data = Object.fromEntries(rows.map(r => [r.document_id, parseInt(r.count, 10)]));
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.getSummary = async (req, res, next) => {
  try {
    let curriculumFilter = {};
    if (req.user.role === ROLES.FACULTY || req.user.role === ROLES.STAFF) {
      const curricula = await Curriculum.findAll({
        where: { department_id: req.user.department_id },
        attributes: ['id'],
      });
      const ids = curricula.map(c => c.id);
      if (!ids.length) return res.json({ success: true, data: [] });
      curriculumFilter = { curriculum_id: { [Op.in]: ids } };
    }

    const curriculumAttrs = ['id', 'degree_name', 'field_of_study', 'curriculum_year', 'degree_level'];
    const curriculumInclude = { model: Curriculum, as: 'curriculum', attributes: curriculumAttrs };

    const [documents, tqf2Docs] = await Promise.all([
      Document.findAll({
        where: { ...curriculumFilter, is_deleted: false },
        include: [curriculumInclude],
        attributes: ['id', 'original_name', 'file_type'],
      }),
      TQF2Document.findAll({
        where: { ...curriculumFilter, is_deleted: false },
        include: [curriculumInclude],
        attributes: ['id', 'original_name', 'file_type', 'academic_year', 'version_number'],
      }),
    ]);

    const docIds  = documents.map(d => d.id);
    const tqf2Ids = tqf2Docs.map(d => d.id);

    const annOpts = {
      include: [{ association: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']],
    };
    const [docAnns, tqf2Anns] = await Promise.all([
      docIds.length
        ? DocumentAnnotation.findAll({ where: { document_type: 'document', document_id: { [Op.in]: docIds } }, ...annOpts })
        : Promise.resolve([]),
      tqf2Ids.length
        ? DocumentAnnotation.findAll({ where: { document_type: 'tqf2', document_id: { [Op.in]: tqf2Ids } }, ...annOpts })
        : Promise.resolve([]),
    ]);

    const docMap  = Object.fromEntries(documents.map(d => [d.id, d]));
    const tqf2Map = Object.fromEntries(tqf2Docs.map(d => [d.id, d]));

    const fileGroups = {};
    const addAnns = (anns, type, map) => {
      for (const ann of anns) {
        const key = `${type}_${ann.document_id}`;
        if (!fileGroups[key]) {
          const info = map[ann.document_id];
          if (!info) continue;
          fileGroups[key] = {
            document_id: ann.document_id,
            document_type: type,
            file_name: info.original_name,
            file_type: info.file_type,
            curriculum: info.curriculum,
            ...(type === 'tqf2' ? { academic_year: info.academic_year, version_number: info.version_number } : {}),
            annotations: [],
          };
        }
        fileGroups[key].annotations.push({
          id: ann.id,
          selected_text: ann.selected_text,
          comment: ann.comment,
          color: ann.color,
          is_resolved: ann.is_resolved,
          author: ann.author,
          created_at: ann.created_at,
        });
      }
    };

    addAnns(docAnns,  'document', docMap);
    addAnns(tqf2Anns, 'tqf2',    tqf2Map);

    res.json({ success: true, data: Object.values(fileGroups) });
  } catch (error) { next(error); }
};

exports.deleteAnnotation = async (req, res, next) => {
  try {
    const ann = await DocumentAnnotation.findByPk(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'ไม่พบความเห็น' });
    if (ann.author_id !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบความเห็นนี้' });
    }
    await ann.destroy();
    res.json({ success: true });
  } catch (error) { next(error); }
};
