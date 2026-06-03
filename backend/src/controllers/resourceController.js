const { Resource, User } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      where: { is_active: true },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']]
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit, 10);
      queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const { count, rows } = await Resource.findAndCountAll(queryOptions);
      return res.json({ 
        success: true, 
        data: rows,
        meta: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
      });
    }

    const resources = await Resource.findAll(queryOptions);
    res.json({ success: true, data: resources });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, type, link_url, description, category } = req.body;
    const file_url = req.file ? `/uploads/resources/${req.file.filename}` : null;

    if (type === 'file' && !file_url) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบไฟล์' });
    }
    if (type === 'link' && !link_url) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุลิงก์' });
    }

    const resource = await Resource.create({
      title, type,
      file_url: file_url || null,
      link_url: link_url || null,
      description: description || null,
      category: category || null,
      created_by: req.user.id
    });
    res.status(201).json({ success: true, data: resource, message: 'เพิ่มแบบฟอร์มสำเร็จ' });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'ไม่พบแบบฟอร์ม' });
    resource.is_active = false;
    await resource.save();
    res.json({ success: true, message: 'ลบแบบฟอร์มสำเร็จ' });
  } catch (error) { next(error); }
};
