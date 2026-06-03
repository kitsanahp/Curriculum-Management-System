const { Sequelize } = require('sequelize');

// เชื่อมต่อ MySQL ผ่าน Sequelize ORM
// ค่าทั้งหมดอ่านจาก .env — ไม่ hardcode รหัสผ่านในโค้ด
const sequelize = new Sequelize(
  process.env.DB_NAME     || 'curriculum_db',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',

    // แสดง SQL query เฉพาะ development เพื่อ debug
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // connection pool: รองรับ concurrent request ได้สูงสุด 10 connection
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },

    timezone: '+07:00',       // เวลาไทย (UTC+7)
    charset:  'utf8mb4',      // รองรับภาษาไทยและ emoji
    collate:  'utf8mb4_unicode_ci',

    define: {
      underscored: true,  // ชื่อ column ใช้ snake_case อัตโนมัติ
      timestamps:  true   // เพิ่ม created_at / updated_at ทุก table
    }
  }
);

module.exports = sequelize;
