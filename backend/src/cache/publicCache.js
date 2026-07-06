// Cache ข้อมูลสาธารณะ (เช่น รายชื่อภาควิชาในหน้าลงทะเบียน)
// แยกเป็นโมดูลกลางเพื่อให้ route ที่แก้ master data สั่งล้าง cache ได้ทันที
const cache = {
  departments: null,
  departmentsCachedAt: 0,
};

function invalidateDepartments() {
  cache.departments = null;
  cache.departmentsCachedAt = 0;
}

module.exports = { cache, invalidateDepartments };
