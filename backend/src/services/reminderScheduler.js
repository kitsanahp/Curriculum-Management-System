const { Op } = require('sequelize');
const { Curriculum, CurriculumTeam, Notification, EmailLog } = require('../models');
const emailService = require('./emailService');
const { CURRICULUM_STATUS } = require('../config/constants');
const { resolveTeamEmails, resolveTeamUserIds } = require('../utils/teamEmailLookup');

const cName = (c) => c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || '';

async function checkDeadlines() {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const curricula = await Curriculum.findAll({
      where: {
        status: { [Op.in]: [CURRICULUM_STATUS.REVISION, CURRICULUM_STATUS.PENDING_ADMIN_RECHECK] },
        revision_deadline: { [Op.between]: [now, threeDaysLater] }
      },
      include: [{ model: CurriculumTeam, as: 'team' }]
    });

    for (const curriculum of curricula) {
      const daysLeft = Math.ceil((new Date(curriculum.revision_deadline) - now) / 86400000);

      const emails = await resolveTeamEmails(curriculum.team || []);
      if (emails.length > 0) {
        emailService.sendDeadlineReminder(emails, curriculum, daysLeft)
          .catch(err => console.error('[Reminder] email failed:', err.message));
      }

      const teamUserIds = await resolveTeamUserIds(curriculum.team || []);
      if (teamUserIds.length > 0) {
        await Notification.bulkCreate(teamUserIds.map(uid => ({
          user_id: uid,
          title: `แจ้งเตือน — กำหนดส่งอีก ${daysLeft} วัน`,
          message: `${cName(curriculum)} กำหนดส่งเอกสารอีก ${daysLeft} วัน กรุณาดำเนินการ`,
          type: 'warning',
          curriculum_id: curriculum.id
        })));
      }
    }

    if (curricula.length > 0) {
      console.log(`[Reminder] พบ ${curricula.length} หลักสูตรใกล้ถึงกำหนดส่ง`);
    }
  } catch (err) {
    console.error('[Reminder] checkDeadlines error:', err.message);
  }
}

// เก็บกวาด email_logs เก่ากว่า 90 วัน — กันตารางโตไม่มีที่สิ้นสุด
// (log ใช้มอนิเตอร์ระยะสั้น ไม่ใช่ archive ถาวร)
const EMAIL_LOG_RETENTION_DAYS = 90;
async function pruneEmailLogs() {
  try {
    const cutoff = new Date(Date.now() - EMAIL_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const removed = await EmailLog.destroy({ where: { created_at: { [Op.lt]: cutoff } } });
    if (removed) console.log(`[EmailLog] ลบ log เก่ากว่า ${EMAIL_LOG_RETENTION_DAYS} วัน ${removed} รายการ`);
  } catch (err) {
    console.error('[EmailLog] prune error:', err.message);
  }
}

function startReminderScheduler() {
  // รัน 1 ครั้งทันทีตอน startup แล้วทุก 24 ชั่วโมง
  checkDeadlines();
  pruneEmailLogs();
  setInterval(() => { checkDeadlines(); pruneEmailLogs(); }, 24 * 60 * 60 * 1000);
  console.log('[Reminder] Deadline reminder scheduler started (interval: 24h)');
}

module.exports = { startReminderScheduler };
