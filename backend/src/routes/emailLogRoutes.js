const router = require('express').Router();
const { Op } = require('sequelize');
const { EmailLog } = require('../models');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN)); // มอนิเตอร์การส่งเมล — admin เท่านั้น

// GET /api/email-logs?page=1&limit=50&status=failed&search=xxx
// คืนรายการ log แบ่งหน้า + สถิติรวม (ทั้งหมด / 24 ชม.ล่าสุด)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    const where = {};
    if (status === 'sent' || status === 'failed') where.status = status;
    if (search) {
      const safe = String(search).replace(/[\\%_]/g, '\\$&');
      where[Op.or] = [
        { recipient: { [Op.like]: `%${safe}%` } },
        { subject: { [Op.like]: `%${safe}%` } },
      ];
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ count, rows }, sentTotal, failedTotal, sent24h, failed24h] = await Promise.all([
      EmailLog.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parsedLimit,
        offset: (parsedPage - 1) * parsedLimit,
      }),
      EmailLog.count({ where: { status: 'sent' } }),
      EmailLog.count({ where: { status: 'failed' } }),
      EmailLog.count({ where: { status: 'sent', created_at: { [Op.gte]: dayAgo } } }),
      EmailLog.count({ where: { status: 'failed', created_at: { [Op.gte]: dayAgo } } }),
    ]);

    res.json({
      success: true,
      data: rows,
      meta: { total: count, page: parsedPage, limit: parsedLimit },
      stats: { sentTotal, failedTotal, sent24h, failed24h },
    });
  } catch (error) { next(error); }
});

module.exports = router;
