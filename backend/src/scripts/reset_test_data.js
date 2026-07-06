// Reset ข้อมูลทดสอบ: ล้างหลักสูตร + กิจกรรมทั้งหมด + user seed
// เก็บไว้: ภาควิชา, ประกาศ, แบบฟอร์ม (reassign เจ้าของไป admin ใหม่)
//          + user จริง 1 ราย (KEEP_EMAIL) + สร้าง admin ใหม่ไว้ login
//
// ดูก่อน (ไม่ลบจริง):  node src/scripts/reset_test_data.js --dry
// ลบจริง:             node src/scripts/reset_test_data.js
require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  User, Curriculum, CurriculumTeam, CommitteeStep, CommitteeDocument,
  Document, DocumentVersion, DocumentAnnotation, TQF2Document,
  AuditLog, Notification, Announcement, Resource,
} = require('../models');

const KEEP_EMAIL = 'test4@nu.ac.th';                 // user จริงที่เก็บไว้ (ดร. ทดสอบ 4)
const ADMIN = { name: 'ผู้ดูแลระบบ', email: 'admin@sci.nu.ac.th', password: 'password123', role: 'admin' };

const isDryRun = process.argv.includes('--dry');

// ตารางที่ล้างทั้งหมด (เรียงลึก→ตื้นตาม FK เผื่อกรณีไม่ปิด FK check)
const PURGE_MODELS = [
  ['CommitteeDocument', CommitteeDocument],
  ['DocumentVersion', DocumentVersion],
  ['DocumentAnnotation', DocumentAnnotation],
  ['CommitteeStep', CommitteeStep],
  ['Document', Document],
  ['TQF2Document', TQF2Document],
  ['CurriculumTeam', CurriculumTeam],
  ['Curriculum', Curriculum],
  ['AuditLog', AuditLog],
  ['Notification', Notification],
];

(async () => {
  try {
    // ── สรุปสิ่งที่จะทำ ──────────────────────────────────────────────
    console.log('── ตารางที่จะล้างทั้งหมด ─────────────────────');
    for (const [name, Model] of PURGE_MODELS) {
      const n = await Model.count({ paranoid: false });
      console.log(`  ${name.padEnd(20)} ${n} แถว → ลบ`);
    }

    const usersToDelete = await User.count({ where: { email: { [Op.ne]: KEEP_EMAIL } } });
    const keptUser = await User.findOne({ where: { email: KEEP_EMAIL }, attributes: ['id', 'name'] });
    const annCount = await Announcement.count();
    const resCount = await Resource.count();

    console.log('\n── Users ────────────────────────────────────');
    console.log(`  ลบ user ${usersToDelete} ราย (ทุกคนยกเว้น ${KEEP_EMAIL})`);
    console.log(`  เก็บไว้: ${keptUser ? `[${keptUser.id}] ${keptUser.name}` : '⚠ ไม่พบ ' + KEEP_EMAIL}`);
    console.log(`  สร้าง/ตรวจสอบ admin: ${ADMIN.email} (password: ${ADMIN.password})`);
    console.log('\n── เก็บไว้ (reassign เจ้าของไป admin ใหม่) ──────');
    console.log(`  ประกาศ ${annCount} รายการ, แบบฟอร์ม ${resCount} รายการ`);

    if (isDryRun) {
      console.log('\n(โหมด --dry: ยังไม่ลบจริง) รันอีกครั้งโดยไม่ใส่ --dry เพื่อ reset จริง');
      return;
    }

    // ── ลบจริง (ปิด FK check ชั่วคราว กันลำดับ FK พลาด) ──────────────
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const [, Model] of PURGE_MODELS) {
        await Model.destroy({ where: {}, force: true, truncate: true });
      }
      await User.destroy({ where: { email: { [Op.ne]: KEEP_EMAIL } }, force: true });
    } finally {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // สร้าง admin ใหม่ (hash password ผ่าน hook ของ model) — ใช้ create เพื่อให้ผ่าน beforeCreate
    let admin = await User.findOne({ where: { email: ADMIN.email } });
    if (!admin) {
      admin = await User.create({ ...ADMIN, department_id: null, is_active: true });
    }

    // reassign เจ้าของประกาศ/แบบฟอร์มไป admin ใหม่ (เจ้าของเดิมถูกลบไปแล้ว)
    await Announcement.update({ created_by: admin.id }, { where: {} });
    await Resource.update({ created_by: admin.id }, { where: {} });

    const remaining = await User.count();
    console.log(`\n✓ reset สำเร็จ — เหลือ users ${remaining} ราย`);
    console.log(`  login admin: ${ADMIN.email} / ${ADMIN.password}`);
  } catch (err) {
    console.error('✗ reset ล้มเหลว:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
