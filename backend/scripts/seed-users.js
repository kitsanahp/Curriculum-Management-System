/**
 * seed-users.js
 * ลบ users ทั้งหมด แล้วสร้าง mock user บทบาทละ 1 คน สำหรับทดสอบ
 * (เก็บประกาศ/แบบฟอร์มไว้ — reassign เจ้าของไป admin ใหม่ กัน orphan)
 * Usage: node scripts/seed-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../src/config/database');
const { User, Department, Announcement, Resource } = require('../src/models');

// ─── ภาควิชาทั้งหมดในคณะ ────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'ภาควิชาคณิตศาสตร์',                                    code: 'MATH' },
  { name: 'ภาควิชาเคมี',                                          code: 'CHEM' },
  { name: 'ภาควิชาชีววิทยา',                                       code: 'BIO'  },
  { name: 'ภาควิชาฟิสิกส์',                                       code: 'PHYS' },
  { name: 'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',       code: 'CSIT' },
  { name: 'งานบริการการศึกษา',                                    code: 'EDU'  },
];

// ─── Mock users — บทบาทละ 1 คน — password ทุกคน: password123 ────────────────
// หมายเหตุเรื่อง field ตำแหน่ง (สำคัญ):
//   - faculty → ใช้ academic_position (ตำแหน่งวิชาการ), position = null
//   - role อื่น → ใช้ position (ตำแหน่งงาน/บริหาร), academic_position = null
const MOCK_USERS = [
  {
    name:              'นางสาวแอดมิน ทดสอบ',
    position:          'นักวิชาการศึกษา',
    academic_position: null,
    email:             'admin@sci.nu.ac.th',
    role:              'admin',
    dept_code:         null,
  },
  {
    name:              'ดร. อาจารย์ ทดสอบ',          // formatUserName จะเติมยศ → "รศ.ดร. อาจารย์ ทดสอบ"
    position:          null,
    academic_position: 'รองศาสตราจารย์',
    email:             'faculty@sci.nu.ac.th',
    role:              'faculty',
    dept_code:         'MATH',
  },
  {
    name:              'นายเจ้าหน้าที่ ทดสอบ',
    position:          'เจ้าหน้าที่บริหารงานทั่วไป',
    academic_position: null,
    email:             'staff@sci.nu.ac.th',
    role:              'staff',
    dept_code:         'MATH',
  },
  {
    name:              'นางนายทะเบียน ทดสอบ',
    position:          'นักวิชาการศึกษา',
    academic_position: null,
    email:             'registrar@nu.ac.th',
    role:              'registrar',
    dept_code:         null,
  },
  {
    name:              'ศ.ดร. ผู้บริหาร ทดสอบ',
    position:          'คณบดีคณะวิทยาศาสตร์',
    academic_position: null,
    email:             'executive@sci.nu.ac.th',
    role:              'executive',
    dept_code:         null,
  },
];

const PASSWORD = 'password123';

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

    // 1. ลบ users ทั้งหมด (ปิด FK check ชั่วคราว)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await User.destroy({ where: {}, truncate: true, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ ลบ users เดิมทั้งหมดแล้ว');

    // 2. สร้าง / ตรวจสอบ departments
    console.log('\n── สร้างภาควิชา ──────────────────────────');
    const deptMap = {};
    for (const d of DEPARTMENTS) {
      const [dept] = await Department.findOrCreate({
        where: { code: d.code },
        defaults: { name: d.name, code: d.code },
      });
      deptMap[d.code] = dept.id;
      console.log(`  ✓ ${d.name} (id: ${dept.id})`);
    }

    // 3. สร้าง mock users (password ผ่าน hook hash ของ model)
    console.log('\n── สร้าง mock users (บทบาทละ 1 คน) ───────');
    let adminId = null;
    for (const u of MOCK_USERS) {
      const user = await User.create({
        name:              u.name,
        position:          u.position,
        academic_position: u.academic_position,
        email:             u.email,
        password:          PASSWORD,
        role:              u.role,
        department_id:     u.dept_code ? deptMap[u.dept_code] : null,
        is_active:         true,
      });
      if (u.role === 'admin') adminId = user.id;
      console.log(`  ✓ [${u.role.padEnd(10)}] ${u.name} — ${u.email}`);
    }

    // 4. reassign เจ้าของประกาศ/แบบฟอร์มไป admin ใหม่ (เจ้าของเดิมถูกลบ)
    if (adminId) {
      const [annCount] = [await Announcement.update({ created_by: adminId }, { where: {} })];
      const [resCount] = [await Resource.update({ created_by: adminId }, { where: {} })];
      console.log(`\n✓ reassign เจ้าของ ประกาศ(${annCount[0]}) + แบบฟอร์ม(${resCount[0]}) → admin ใหม่`);
    }

    // 5. สรุป
    console.log('\n══════════════════════════════════════════════');
    console.log('  seed เสร็จสิ้น — ข้อมูล login สำหรับทดสอบ');
    console.log('══════════════════════════════════════════════');
    console.log(`  password ทุกคน: ${PASSWORD}\n`);
    MOCK_USERS.forEach(u => console.log(`  ${u.role.toUpperCase().padEnd(10)} ${u.email}`));
    console.log('');

  } catch (err) {
    console.error('✗ เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
