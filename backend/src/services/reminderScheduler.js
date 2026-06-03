const { Op } = require('sequelize');
const { Curriculum, CurriculumTeam, Notification } = require('../models');
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

function startReminderScheduler() {
  // รัน 1 ครั้งทันทีตอน startup แล้วทุก 24 ชั่วโมง
  checkDeadlines();
  setInterval(checkDeadlines, 24 * 60 * 60 * 1000);
  console.log('[Reminder] Deadline reminder scheduler started (interval: 24h)');
}

module.exports = { startReminderScheduler };
