const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Announcement, User, Notification } = require('../models');
const emailService = require('../services/emailService');

// Re-encode uploaded image with sharp — validates file is genuine image, strips EXIF
async function sanitizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const outFormat = ext === '.png' ? 'png' : ext === '.gif' ? 'gif' : ext === '.webp' ? 'webp' : 'jpeg';
  const tmpPath = `${filePath}.tmp`;
  try {
    await sharp(filePath)[outFormat]({ quality: 90 }).withMetadata(false).toFile(tmpPath);
    fs.renameSync(tmpPath, filePath);
  } catch {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error('ไฟล์รูปภาพไม่ถูกต้องหรือเสียหาย');
  }
}

let cachedPublicAnnouncements = null;
let lastPublicAnnouncementCacheTime = 0;
const PUBLIC_ANNOUNCEMENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

exports.getPublic = async (req, res, next) => {
  try {
    if (cachedPublicAnnouncements && (Date.now() - lastPublicAnnouncementCacheTime < PUBLIC_ANNOUNCEMENT_CACHE_TTL)) {
      return res.json({ success: true, data: cachedPublicAnnouncements });
    }

    const announcements = await Announcement.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'content', 'image_url', 'link_url', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    cachedPublicAnnouncements = announcements;
    lastPublicAnnouncementCacheTime = Date.now();

    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const queryOptions = {
      where: { is_active: true },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit, 10);
      queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const { count, rows } = await Announcement.findAndCountAll(queryOptions);
      return res.json({ 
        success: true, 
        data: rows,
        meta: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
      });
    }

    const announcements = await Announcement.findAll(queryOptions);
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, content, link_url } = req.body;
    let image_url = null;
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/announcements', req.file.filename);
      await sanitizeImage(filePath);
      image_url = `/uploads/announcements/${req.file.filename}`;
    }

    const announcement = await Announcement.create({
      title, content, link_url: link_url || null, image_url,
      created_by: req.user.id
    });

    const users = await User.findAll({ where: { is_active: true }, attributes: ['id', 'email'] });

    if (users.length > 0) {
      await Notification.bulkCreate(
        users.map((u) => ({
          user_id: u.id, title: `ประกาศใหม่: ${title}`,
          message: content.substring(0, 200), type: 'info', curriculum_id: null,
          announcement_id: announcement.id
        }))
      );
    }

    const emails = users.filter((u) => u.email).map((u) => u.email);
    if (emails.length > 0) {
      emailService.sendAnnouncement(emails, title, content, link_url, image_url)
        .catch((err) => console.error('[Announcement] email FAILED:', err.message));
    }

    // Invalidate public cache
    cachedPublicAnnouncements = null;

    res.status(201).json({ success: true, data: announcement, message: 'สร้างประกาศสำเร็จ' });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'ไม่พบประกาศ' });
    const { title, content, link_url, is_active } = req.body;
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (link_url !== undefined) announcement.link_url = link_url;
    if (is_active !== undefined) announcement.is_active = is_active;
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/announcements', req.file.filename);
      await sanitizeImage(filePath);
      announcement.image_url = `/uploads/announcements/${req.file.filename}`;
    }
    await announcement.save();

    // Invalidate public cache
    cachedPublicAnnouncements = null;

    res.json({ success: true, data: announcement, message: 'อัปเดตประกาศสำเร็จ' });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'ไม่พบประกาศ' });
    announcement.is_active = false;
    await announcement.save();

    // Invalidate public cache
    cachedPublicAnnouncements = null;

    res.json({ success: true, message: 'ลบประกาศสำเร็จ' });
  } catch (error) { next(error); }
};
