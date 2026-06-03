const { User, Department, Notification } = require('../models');
const { ROLES } = require('../config/constants');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department' }],
      order: [['name', 'ASC']]
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit, 10);
      queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const { count, rows } = await User.findAndCountAll(queryOptions);
      return res.json({ 
        success: true, 
        data: rows,
        meta: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
      });
    }

    const users = await User.findAll(queryOptions);
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, department_id } = req.body;
    const user = await User.create({ name, email, password, role, department_id });
    res.status(201).json({ success: true, data: user, message: 'สร้างผู้ใช้สำเร็จ' });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const exists = await User.findByPk(req.params.id);
    if (!exists) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    const { name, email, role, department_id, is_active, position, academic_position, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (department_id !== undefined) updates.department_id = department_id;
    if (is_active !== undefined) updates.is_active = is_active;
    if (position !== undefined) updates.position = position;
    if (academic_position !== undefined) updates.academic_position = academic_position;
    if (phone !== undefined) updates.phone = phone;
    await User.update(updates, { where: { id: req.params.id } });
    const updated = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: updated, message: 'อัปเดตผู้ใช้สำเร็จ' });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    // Soft-delete: deactivate แทน hard-delete เพื่อ preserve FK references ใน curricula/audit logs
    await User.update({ is_active: false }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) { next(error); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit, 10);
      queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const { count, rows } = await Notification.findAndCountAll(queryOptions);
      return res.json({ 
        success: true, 
        data: rows,
        meta: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
      });
    }

    queryOptions.limit = 50; // Default limit if no pagination is requested
    const notifications = await Notification.findAll(queryOptions);
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, id: req.params.id } }
    );
    res.json({ success: true, message: 'อ่านแล้ว' });
  } catch (error) { next(error); }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ success: true, message: 'อ่านทั้งหมดแล้ว' });
  } catch (error) { next(error); }
};

exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id } });
    res.json({ success: true, message: 'ลบแจ้งเตือนทั้งหมดแล้ว' });
  } catch (error) { next(error); }
};


