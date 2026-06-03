/**
 * seed-users.js
 * ลบ users ทั้งหมดแล้วสร้าง mock users สำหรับ testing ทุก role
 * Usage: node scripts/seed-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../src/config/database');
const User       = require('../src/models/User');
const Department = require('../src/models/Department');

// ─── ภาควิชาทั้งหมดในคณะ ────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'ภาควิชาคณิตศาสตร์',                                    code: 'MATH' },
  { name: 'ภาควิชาเคมี',                                          code: 'CHEM' },
  { name: 'ภาควิชาชีววิทยา',                                       code: 'BIO'  },
  { name: 'ภาควิชาฟิสิกส์',                                       code: 'PHYS' },
  { name: 'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',       code: 'CSIT' },
];

// ─── Mock users — password ทุกคน: password123 ───────────────────────────────
const MOCK_USERS = [
  // ── Admin (นักวิชาการศึกษาคณะ) ──────────────────────────────────
  {
    name:        'บียอนเซ่ โนลส์',
    position:    'นักวิชาการศึกษา',
    email:       'admin@sci.nu.ac.th',
    password:    'password123',
    role:        'admin',
    dept_code:   null,
    is_active:   true,
  },

  // ── Faculty (อาจารย์ผู้รับผิดชอบหลักสูตร) — หนึ่งต่อภาควิชา ─────
  {
    name:        'ผศ.ดร. อลิเชีย คุก',             // Alicia Keys
    position:    'ผู้ช่วยศาสตราจารย์',
    email:       'faculty.math@sci.nu.ac.th',
    password:    'password123',
    role:        'faculty',
    dept_code:   'MATH',
    is_active:   true,
  },
  {
    name:        'รศ.ดร. มาไรอาห์ คาเรย์',          // Mariah Carey
    position:    'รองศาสตราจารย์',
    email:       'faculty.chem@sci.nu.ac.th',
    password:    'password123',
    role:        'faculty',
    dept_code:   'CHEM',
    is_active:   true,
  },
  {
    name:        'อ.ดร. โอลิเวีย โรดริโก',          // Olivia Rodrigo
    position:    'อาจารย์',
    email:       'faculty.bio@sci.nu.ac.th',
    password:    'password123',
    role:        'faculty',
    dept_code:   'BIO',
    is_active:   true,
  },
  {
    name:        'ผศ.ดร. บริทนีย์ สเปียร์ส',
    position:    'ผู้ช่วยศาสตราจารย์',
    email:       'faculty.phys@sci.nu.ac.th',
    password:    'password123',
    role:        'faculty',
    dept_code:   'PHYS',
    is_active:   true,
  },
  {
    name:        'อ.ดร. สเตฟานี เจอร์มาโนตตา',   // Lady Gaga
    position:    'อาจารย์',
    email:       'faculty.csit@sci.nu.ac.th',
    password:    'password123',
    role:        'faculty',
    dept_code:   'CSIT',
    is_active:   true,
  },

  // ── Staff (เจ้าหน้าที่สาขา) — หนึ่งต่อภาควิชา ───────────────────
  {
    name:        'โรบิน เฟนตี้',                 // Rihanna
    position:    'เจ้าหน้าที่บริหารงานทั่วไป',
    email:       'staff.math@sci.nu.ac.th',
    password:    'password123',
    role:        'staff',
    dept_code:   'MATH',
    is_active:   true,
  },
  {
    name:        'แคทเธอริน ฮัดสัน',             // Katy Perry
    position:    'เจ้าหน้าที่บริหารงานทั่วไป',
    email:       'staff.chem@sci.nu.ac.th',
    password:    'password123',
    role:        'staff',
    dept_code:   'CHEM',
    is_active:   true,
  },
  {
    name:        'เมลิสซา เจฟเฟอร์สัน',             // Lizzo
    position:    'เจ้าหน้าที่บริหารงานทั่วไป',
    email:       'staff.bio@sci.nu.ac.th',
    password:    'password123',
    role:        'staff',
    dept_code:   'BIO',
    is_active:   true,
  },
  {
    name:        'เทย์เลอร์ สวิฟต์',
    position:    'เจ้าหน้าที่บริหารงานทั่วไป',
    email:       'staff.phys@sci.nu.ac.th',
    password:    'password123',
    role:        'staff',
    dept_code:   'PHYS',
    is_active:   true,
  },
  {
    name:        'อาริอานา กรานเด',
    position:    'เจ้าหน้าที่บริหารงานทั่วไป',
    email:       'staff.csit@sci.nu.ac.th',
    password:    'password123',
    role:        'staff',
    dept_code:   'CSIT',
    is_active:   true,
  },

  // ── Registrar (เจ้าหน้าที่กองบริการการศึกษา) ──────────────────────
  {
    name:        'เมแกน เทรนเนอร์',                // Meghan Trainor
    position:    'นักวิชาการศึกษา',
    email:       'registrar@nu.ac.th',
    password:    'password123',
    role:        'registrar',
    dept_code:   null,
    is_active:   true,
  },

  // ── Executive (ผู้บริหารคณะ) ─────────────────────────────────────
  {
    name:        'ศ.ดร. ซาบรีนา คาร์เพนเตอร์',
    position:    'คณบดีคณะวิทยาศาสตร์',
    email:       'dean@sci.nu.ac.th',
    password:    'password123',
    role:        'executive',
    dept_code:   null,
    is_active:   true,
  },
  {
    name:        'รศ.ดร. โอนิกา มาราช',           // Nicki Minaj
    position:    'รองคณบดีฝ่ายวิชาการ',
    email:       'vdean@sci.nu.ac.th',
    password:    'password123',
    role:        'executive',
    dept_code:   null,
    is_active:   true,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

    // 1. ลบ users ทั้งหมด (ปิด FK check ชั่วคราว)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const deleted = await User.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`✓ ลบ users เดิมทั้งหมดแล้ว (${deleted} รายการ)`);

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

    // 3. สร้าง mock users
    console.log('\n── สร้าง mock users ──────────────────────');
    for (const u of MOCK_USERS) {
      const user = await User.create({
        name:        u.name,
        position:    u.position,
        email:       u.email,
        password:    u.password,
        role:        u.role,
        department_id: u.dept_code ? deptMap[u.dept_code] : null,
        is_active:   u.is_active,
      });
      console.log(`  ✓ [${u.role.padEnd(10)}] ${u.name} — ${u.email}`);
    }

    // 4. สรุป
    console.log('\n══════════════════════════════════════════════');
    console.log('  seed เสร็จสิ้น — ข้อมูล login สำหรับทดสอบ');
    console.log('══════════════════════════════════════════════');
    console.log('  password ทุกคน: password123\n');

    const groups = ['admin', 'faculty', 'staff', 'registrar', 'executive'];
    for (const role of groups) {
      const users = MOCK_USERS.filter(u => u.role === role);
      console.log(`  ${role.toUpperCase()}`);
      users.forEach(u => console.log(`    ${u.email}`));
    }
    console.log('');

  } catch (err) {
    console.error('✗ เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
