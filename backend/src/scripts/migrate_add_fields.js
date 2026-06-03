/**
 * One-time migration: เพิ่ม fields และ indexes สำหรับรองรับข้อมูลระยะยาว
 *
 * รันด้วย:  node backend/src/scripts/migrate_add_fields.js
 *
 * Script นี้ idempotent — รันซ้ำได้โดยไม่เสียหาย
 * ตรวจว่า column/index มีอยู่แล้วก่อน ALTER ทุกครั้ง
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize  = require('../config/database');
const { QueryTypes } = require('sequelize');

const DB = process.env.DB_NAME || 'curriculum_db';

// ── helpers ────────────────────────────────────────────────────────────────────

async function columnExists(table, column) {
  const rows = await sequelize.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { db: DB, table, column }, type: QueryTypes.SELECT }
  );
  return rows[0].cnt > 0;
}

async function indexExists(table, indexName) {
  const rows = await sequelize.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND INDEX_NAME = :indexName`,
    { replacements: { db: DB, table, indexName }, type: QueryTypes.SELECT }
  );
  return rows[0].cnt > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`  ✓ ${table}.${column} — already exists, skip`);
    return;
  }
  await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  console.log(`  + ${table}.${column} — added`);
}

async function addIndexIfMissing(table, indexName, definition) {
  if (await indexExists(table, indexName)) {
    console.log(`  ✓ INDEX ${indexName} on ${table} — already exists, skip`);
    return;
  }
  await sequelize.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${definition}`);
  console.log(`  + INDEX ${indexName} on ${table} — created`);
}

// ── migration steps ────────────────────────────────────────────────────────────

async function run() {
  await sequelize.authenticate();
  console.log('Connected to:', DB, '\n');

  // ── tqf2_documents ──────────────────────────────────────────────────────────
  console.log('[tqf2_documents]');

  await addColumnIfMissing(
    'tqf2_documents', 'academic_year',
    '`academic_year` VARCHAR(10) NULL COMMENT "ปีการศึกษา (พ.ศ.) ที่อัปโหลด เช่น 2566" AFTER `note`'
  );

  await addIndexIfMissing(
    'tqf2_documents', 'idx_tqf2_curriculum_version',
    '(`curriculum_id`, `version_number`)'
  );

  await addIndexIfMissing(
    'tqf2_documents', 'idx_tqf2_academic_year',
    '(`academic_year`)'
  );

  await addIndexIfMissing(
    'tqf2_documents', 'idx_tqf2_curriculum_year',
    '(`curriculum_id`, `academic_year`)'
  );

  // ── curricula ───────────────────────────────────────────────────────────────
  console.log('\n[curricula]');

  await addColumnIfMissing(
    'curricula', 'is_active',
    '`is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT "หลักสูตรยังเปิดสอนอยู่" AFTER `revision_deadline`'
  );

  await addColumnIfMissing(
    'curricula', 'parent_curriculum_id',
    '`parent_curriculum_id` INT NULL COMMENT "ID ของหลักสูตรรุ่นก่อนหน้า" AFTER `is_active`'
  );

  await addIndexIfMissing(
    'curricula', 'idx_curricula_is_active',
    '(`is_active`)'
  );

  await addIndexIfMissing(
    'curricula', 'idx_curricula_year_active',
    '(`curriculum_year`, `is_active`)'
  );

  // ── audit_logs ──────────────────────────────────────────────────────────────
  console.log('\n[audit_logs]');

  await addIndexIfMissing(
    'audit_logs', 'idx_audit_curriculum_created',
    '(`curriculum_id`, `created_at`)'
  );
  // drop index ที่ migration script รันก่อนหน้า ถ้ามีอยู่ (ชื่อซ้ำ Sequelize จัดการเอง)


  await addIndexIfMissing(
    'audit_logs', 'idx_audit_action',
    '(`action`)'
  );

  console.log('\nMigration complete.');
  await sequelize.close();
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
