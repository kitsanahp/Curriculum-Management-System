/**
 * clear-curricula.js
 * ล้างข้อมูลหลักสูตรและข้อมูลที่เกี่ยวข้องทั้งหมด
 * คง users, departments, announcements, resources ไว้
 * Usage: node scripts/clear-curricula.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../src/config/database');

// ลำดับการ truncate: child tables ก่อน parent (ปิด FK check อยู่แล้ว)
const TABLES = [
  { name: 'committee_documents',  label: 'เอกสารคณะกรรมการ'         },
  { name: 'committee_steps',      label: 'ขั้นตอนคณะกรรมการ'         },
  { name: 'document_annotations', label: 'Annotations เอกสาร'        },
  { name: 'document_versions',    label: 'เวอร์ชั่นเอกสาร'            },
  { name: 'tqf2_documents',       label: 'เอกสาร มคอ.2'              },
  { name: 'documents',            label: 'เอกสาร'                    },
  { name: 'curriculum_team',      label: 'ทีมหลักสูตร'                },
  { name: 'curricula',            label: 'หลักสูตร'                  },
  { name: 'audit_logs',           label: 'Audit Logs'                },
  { name: 'notifications',        label: 'การแจ้งเตือน'               },
  { name: 'calendar_events',      label: 'ปฏิทิน'                    },
];

async function clear() {
  try {
    await sequelize.authenticate();
    console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('── ล้างข้อมูล ─────────────────────────────');
    for (const t of TABLES) {
      const [[{ count }]] = await sequelize.query(
        `SELECT COUNT(*) as count FROM \`${t.name}\``
      );
      await sequelize.query(`TRUNCATE TABLE \`${t.name}\``);
      console.log(`  ✓ ${t.label.padEnd(22)} (ลบ ${count} รายการ)`);
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n══════════════════════════════════════════════');
    console.log('  ล้างข้อมูลเสร็จสิ้น — ฐานข้อมูลพร้อมทดสอบ');
    console.log('══════════════════════════════════════════════');
    console.log('  คงไว้: users / departments / announcements / resources\n');

  } catch (err) {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    console.error('✗ เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

clear();
