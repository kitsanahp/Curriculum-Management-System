const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Department, Notification } = require('../models');
const { ROLES } = require('../config/constants');
const emailService = require('../services/emailService');

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

    // แจ้งผู้สมัครเฉพาะตอนอนุมัติบัญชี (is_active: false → true) — ไม่ยิงเมลตอนแก้ข้อมูลทั่วไป
    if (updates.is_active === true && !exists.is_active && updated.email) {
      emailService.sendAccountApproved(updated.email, updated.name)
        .catch(err => console.error('[Email] sendAccountApproved failed:', err.message));
    }

    res.json({ success: true, data: updated, message: 'อัปเดตผู้ใช้สำเร็จ' });
  } catch (error) { next(error); }
};

// admin ส่งอีเมลลิงก์ตั้งรหัสผ่านใหม่ให้ผู้ใช้ (token แบบ stateless: เซ็นด้วย hash รหัสปัจจุบัน → ใช้ครั้งเดียว, หมดอายุ 1 ชม.)
exports.sendPasswordReset = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    if (!user.email) return res.status(400).json({ success: false, message: 'ผู้ใช้นี้ไม่มีอีเมล จึงส่งลิงก์ไม่ได้' });

    const secret = process.env.JWT_SECRET + user.password;
    const token  = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    const base   = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link   = `${base}/reset-password?token=${token}`;

    // fire-and-forget เหมือน notification อื่น ๆ
    emailService.sendPasswordReset(user.email, user.name, link)
      .catch(err => console.error('sendPasswordReset email error:', err.message));

    res.json({ success: true, message: `ส่งอีเมลตั้งรหัสผ่านใหม่ไปที่ ${user.email} แล้ว` });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    if (!user.is_active) {
      // pending user ยังไม่มี FK references — hard delete ได้เลย
      const { email, name } = user; // เก็บก่อน destroy
      await user.destroy();
      // ลบ user ที่ pending = ปฏิเสธคำขอลงทะเบียน → แจ้งผลให้ผู้สมัครทราบ
      if (email) {
        emailService.sendAccountRejected(email, name)
          .catch(err => console.error('[Email] sendAccountRejected failed:', err.message));
      }
    } else {
      // active user อาจมี FK references ใน curricula/audit logs — soft delete แทน
      await User.update({ is_active: false }, { where: { id: req.params.id } });
    }
    res.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) { next(error); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      where: { 
        user_id: req.user.id,
        created_at: { [Op.gte]: req.user.created_at }
      },
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


