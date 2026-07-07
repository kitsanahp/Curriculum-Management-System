const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// บันทึกผลการส่งอีเมล "รายฉบับ-รายผู้รับ" — เขียนจากจุดส่งกลางใน emailService.send()
// ใช้มอนิเตอร์ย้อนหลังว่าเมลส่งถึงใคร สำเร็จ/ล้มเหลวเพราะอะไร (ดูผ่านหน้า admin /email-logs)
const EmailLog = sequelize.define('EmailLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recipient: { type: DataTypes.STRING(255), allowNull: false },
  subject: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.ENUM('sent', 'failed'), allowNull: false },
  // ข้อความ error จาก SMTP/Brevo — มีค่าเฉพาะ status: failed
  error: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'email_logs',
  timestamps: true,
  updatedAt: false, // log เขียนครั้งเดียว ไม่มีการแก้ไข
  indexes: [
    { fields: ['status'] },
    { fields: ['created_at'] },
  ]
});

module.exports = EmailLog;
