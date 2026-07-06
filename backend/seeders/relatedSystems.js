const { Resource, User } = require('../src/models');

// ต้องตรงกับ frontend: frontend/src/constants/resources.js (RELATED_SYSTEMS_CATEGORY)
const RELATED_SYSTEMS_CATEGORY = 'ระบบที่เกี่ยวข้อง';

// ลิงก์ระบบเริ่มต้น — ย้ายจาก hardcode ใน frontend ลง DB ให้แอดมินแก้/ลบได้
// (เดิมมี TQF/CISA เป็น placeholder '#' จึงไม่ seed — ให้แอดมินเพิ่มเองเมื่อมี URL จริง)
const SEED = [
  { title: 'CHECO',                                       link_url: 'https://www.checo.mua.go.th/' },
  { title: 'กองบริการการศึกษา มหาวิทยาลัยนเรศวร',          link_url: 'https://acad.nu.ac.th/' },
];

/**
 * Seed ลิงก์ "ระบบที่เกี่ยวข้อง" เริ่มต้น แบบ idempotent
 * - เช็คจาก link_url + category ทุก row (รวม is_active=false) → ถ้ามีแล้วไม่สร้างซ้ำ
 *   จึงเคารพการลบของแอดมิน (ลบแล้วจะไม่ถูก seed กลับมา)
 * - ต้องมี admin อย่างน้อย 1 คน เพื่อใช้เป็น created_by — ถ้ายังไม่มีก็ข้ามไปก่อน
 */
async function seedRelatedSystems() {
  const admin = await User.findOne({ where: { role: 'admin' }, order: [['id', 'ASC']] });
  if (!admin) return; // ยังไม่มีแอดมิน → ข้าม seed (ไว้รันใหม่ตอน startup ครั้งถัดไป)

  let created = 0;
  for (const s of SEED) {
    const exists = await Resource.findOne({
      where: { type: 'link', category: RELATED_SYSTEMS_CATEGORY, link_url: s.link_url },
    });
    if (exists) continue;
    await Resource.create({
      title:      s.title,
      type:       'link',
      link_url:   s.link_url,
      category:   RELATED_SYSTEMS_CATEGORY,
      created_by: admin.id,
    });
    created++;
  }
  if (created) console.log(`[Seed] เพิ่มลิงก์ระบบที่เกี่ยวข้องเริ่มต้น ${created} รายการ`);
}

module.exports = { seedRelatedSystems, RELATED_SYSTEMS_CATEGORY };
