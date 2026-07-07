const { Resource } = require('../src/models');

// ต้องตรงกับ frontend: frontend/src/constants/resources.js (RELATED_SYSTEMS_CATEGORY)
const RELATED_SYSTEMS_CATEGORY = 'ระบบที่เกี่ยวข้อง';

// เดิมไฟล์นี้ seed ลิงก์เริ่มต้น (CHECO, กองบริการการศึกษา มน.) ให้อัตโนมัติตอน boot
// ผู้ใช้ตัดสินใจไม่เอาลิงก์ชุดนี้บน production แล้ว — เปลี่ยนหน้าที่เป็น "เก็บกวาด":
// ปิดใช้งาน (is_active=false ตาม convention การลบ resource) แถวที่เคย seed ไว้ในทุก DB
// ที่ deploy ไปแล้ว แบบ idempotent — รันซ้ำได้ และไม่กระทบลิงก์อื่นที่แอดมินเพิ่มเอง
const REMOVED_SEED_URLS = [
  'https://www.checo.mua.go.th/',
  'https://acad.nu.ac.th/',
];

async function seedRelatedSystems() {
  const [count] = await Resource.update(
    { is_active: false },
    {
      where: {
        type: 'link',
        category: RELATED_SYSTEMS_CATEGORY,
        link_url: REMOVED_SEED_URLS,
        is_active: true,
      },
    }
  );
  if (count) console.log(`[Seed] ปิดใช้งานลิงก์ระบบที่เกี่ยวข้องที่เคย seed ไว้ ${count} รายการ`);
}

module.exports = { seedRelatedSystems, RELATED_SYSTEMS_CATEGORY };
