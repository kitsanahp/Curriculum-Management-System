const { Resource, User } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      where: { is_active: true },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'role', 'academic_position'] }],
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

exports.update = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource || !resource.is_active) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบฟอร์ม' });
    }

    const { title, link_url, description, category } = req.body;

    if (title !== undefined)       resource.title       = title;
    if (description !== undefined) resource.description = description || null;
    if (category !== undefined)    resource.category    = category || null;

    // ลิงก์ → แก้ URL ได้ / ไฟล์ → แนบไฟล์ใหม่ทับ (ถ้ามี) ไม่ส่งมา = คงไฟล์เดิม
    if (resource.type === 'link' && link_url !== undefined) {
      if (!link_url) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุลิงก์' });
      }
      resource.link_url = link_url;
    }
    if (resource.type === 'file' && req.file) {
      resource.file_url = `/uploads/resources/${req.file.filename}`;
    }

    await resource.save();
    res.json({ success: true, data: resource, message: 'แก้ไขรายการสำเร็จ' });
  } catch (error) { next(error); }
};

exports.setPin = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource || !resource.is_active) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    }
    resource.is_pinned = !!req.body.is_pinned;
    await resource.save();
    res.json({
      success: true,
      data: resource,
      message: resource.is_pinned ? 'ปักหมุดรายการแล้ว' : 'ยกเลิกปักหมุดแล้ว'
    });
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
