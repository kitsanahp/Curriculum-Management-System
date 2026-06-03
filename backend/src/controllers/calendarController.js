const { CalendarEvent } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const events = await CalendarEvent.findAll({
      where: { user_id: req.user.id },
      order: [['event_date', 'ASC']]
    });
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, event_date, event_time, color } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อและวันที่' });
    }
    const event = await CalendarEvent.create({
      user_id: req.user.id, title, event_date,
      event_time: event_time || null,
      color: color || 'blue'
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    await event.destroy();
    res.json({ success: true, message: 'ลบกิจกรรมสำเร็จ' });
  } catch (error) { next(error); }
};
