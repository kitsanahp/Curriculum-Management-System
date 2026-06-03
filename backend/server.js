require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { startReminderScheduler } = require('./src/services/reminderScheduler');

const PORT = process.env.PORT || 5000;

// ตรวจสอบและรัน migration ที่ยังไม่ได้ apply
// (ใช้ raw query แทน Sequelize migration เพื่อ idempotent — รันซ้ำได้ปลอดภัย)
async function runMigrations() {
  const db = process.env.DB_NAME || 'curriculum_db';

  // เช็คว่า column source_type มีอยู่ใน committee_documents แล้วหรือยัง
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'committee_documents'
      AND COLUMN_NAME  = 'source_type'
  `);
  if (rows[0].cnt === 0) {
    // เพิ่ม source_type และ document_id เพื่อรองรับเอกสารจาก workspace
    await sequelize.query(`
      ALTER TABLE committee_documents
        ADD COLUMN source_type ENUM('upload','workspace') NOT NULL DEFAULT 'upload' AFTER uploaded_by,
        ADD COLUMN document_id INT NULL AFTER source_type,
        ADD CONSTRAINT fk_committee_doc_source
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    `);
    console.log('[Migration] เพิ่ม source_type + document_id ใน committee_documents สำเร็จ');
  }

  // เช็คว่า column status_changed_at มีอยู่ใน curricula หรือยัง (Aging Management)
  const [curriculaRows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'curricula'
      AND COLUMN_NAME  = 'status_changed_at'
  `);
  if (curriculaRows[0].cnt === 0) {
    await sequelize.query(`
      ALTER TABLE curricula 
      ADD COLUMN status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status;
    `);
    await sequelize.query(`
      UPDATE curricula SET status_changed_at = updated_at;
    `);
    console.log('[Migration] เพิ่ม status_changed_at ใน curricula สำเร็จ');
  }

  // เช็คว่า column academic_position มีอยู่ใน users หรือยัง
  const [academicRows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'academic_position'
  `);
  if (academicRows[0].cnt === 0) {
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN academic_position VARCHAR(100) NULL AFTER position;
    `);
    await sequelize.query(`
      UPDATE users SET academic_position = position, position = NULL WHERE role = 'faculty';
    `);
    console.log('[Migration] เพิ่ม academic_position ใน users สำเร็จ');
  }
}

async function startServer() {
  try {
    // ทดสอบการเชื่อมต่อฐานข้อมูล
    await sequelize.authenticate();
    console.log('[DB] เชื่อมต่อฐานข้อมูลสำเร็จ');

    // รัน migration ก่อน sync
    await runMigrations();

    // sync schema — ห้ามใช้ alter:true เพราะทำลาย column ที่มีอยู่
    await sequelize.sync({ alter: false });
    console.log('[DB] Sync schema สำเร็จ');

    startReminderScheduler();

    app.listen(PORT, () => {
      console.log(`[Server] รันอยู่ที่ http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] เริ่มต้นระบบล้มเหลว:', error);
    process.exit(1);
  }
}

startServer();
