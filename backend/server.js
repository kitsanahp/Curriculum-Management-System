require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { startReminderScheduler } = require('./src/services/reminderScheduler');
const { seedRelatedSystems } = require('./seeders/relatedSystems');
const { seedDegreeTitles } = require('./seeders/degreeTitles');
const { seedMajors } = require('./seeders/majors');

const PORT = process.env.PORT || 5000;

// ตรวจสอบและรัน migration ที่ยังไม่ได้ apply
// (ใช้ raw query แทน Sequelize migration เพื่อ idempotent — รันซ้ำได้ปลอดภัย)
async function runMigrations() {
  const db = process.env.DB_NAME || 'curriculum_db';

  // migration ทั้งหมดมีไว้เติม column ให้ "DB เก่า" เท่านั้น — DB ใหม่ (เช่น deploy ครั้งแรก)
  // ตารางยังไม่ถูกสร้าง ห้าม ALTER เด็ดขาด ให้ sequelize.sync() สร้างตารางพร้อม column ครบเอง
  const tableExists = async (table) => {
    const [r] = await sequelize.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = '${db}' AND TABLE_NAME = '${table}'
    `);
    return r[0].cnt > 0;
  };

  // เช็คว่า column source_type มีอยู่ใน committee_documents แล้วหรือยัง
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'committee_documents'
      AND COLUMN_NAME  = 'source_type'
  `);
  if (rows[0].cnt === 0 && await tableExists('committee_documents')) {
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
  if (curriculaRows[0].cnt === 0 && await tableExists('curricula')) {
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
  if (academicRows[0].cnt === 0 && await tableExists('users')) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN academic_position VARCHAR(100) NULL AFTER position;
    `);
    await sequelize.query(`
      UPDATE users SET academic_position = position, position = NULL WHERE role = 'faculty';
    `);
    console.log('[Migration] เพิ่ม academic_position ใน users สำเร็จ');
  }

  // เช็คว่า column token_version มีอยู่ใน users หรือยัง (JWT revocation)
  const [tvRows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'token_version'
  `);
  if (tvRows[0].cnt === 0 && await tableExists('users')) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER locked_until;
    `);
    console.log('[Migration] เพิ่ม token_version ใน users สำเร็จ');
  }

  // เช็คว่า column user_agent มีอยู่ใน audit_logs หรือยัง (forensic — รู้ว่าใช้อุปกรณ์/เบราว์เซอร์ใด)
  const [uaRows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${db}'
      AND TABLE_NAME   = 'audit_logs'
      AND COLUMN_NAME  = 'user_agent'
  `);
  if (uaRows[0].cnt === 0 && await tableExists('audit_logs')) {
    await sequelize.query(`
      ALTER TABLE audit_logs
      ADD COLUMN user_agent VARCHAR(512) NULL AFTER ip_address;
    `);
    console.log('[Migration] เพิ่ม user_agent ใน audit_logs สำเร็จ');
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

    // seed ลิงก์ "ระบบที่เกี่ยวข้อง" เริ่มต้น (idempotent — รันซ้ำปลอดภัย)
    await seedRelatedSystems();

    // seed ชื่อวุฒิเริ่มต้น (idempotent — seed เฉพาะตอนตารางว่าง)
    await seedDegreeTitles();

    // seed สาขาวิชาเริ่มต้นจากชุดเดิมใน frontend (idempotent — seed เฉพาะตอนตารางว่าง)
    await seedMajors();

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
