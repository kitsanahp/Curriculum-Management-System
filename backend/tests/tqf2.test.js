// Test: TQF2 supporting modules — symbol normalizer + in-process cache
const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeSymbols } = require('../src/services/tqf2SymbolNormalizer');
const tqf2Cache = require('../src/utils/tqf2Cache');

// ─── normalizeSymbols ────────────────────────────────────────────────────────

test('normalizeSymbols: แปลง PUA entity (hex/decimal) เป็นสัญลักษณ์ที่แสดงได้', () => {
  assert.equal(normalizeSymbols('<p>&#xF06C; ข้อแรก</p>'), '<p>● ข้อแรก</p>');
  assert.equal(normalizeSymbols('<p>&#61548; ข้อแรก</p>'), '<p>● ข้อแรก</p>'); // 61548 = 0xF06C
  assert.equal(normalizeSymbols('&#xF0FC;'), '✓');
});

test('normalizeSymbols: raw PUA character → สัญลักษณ์ / U+FFFD ถูกลบทิ้ง', () => {
  const puaBullet = String.fromCharCode(0xF06C); // Wingdings bullet ที่ mammoth คายออกมา
  assert.equal(normalizeSymbols(`${puaBullet} รายการ`), '● รายการ');
  assert.equal(normalizeSymbols('ก�ข'), 'กข');
});

test('normalizeSymbols: entity ปกติที่ไม่ใช่ PUA ต้องไม่ถูกแตะ', () => {
  assert.equal(normalizeSymbols('&#x2713;'), '&#x2713;');
  assert.equal(normalizeSymbols(''), '');
  assert.equal(normalizeSymbols(null), '');
});

// ─── tqf2Cache ───────────────────────────────────────────────────────────────

test('tqf2Cache: html cache set/get ตรง id และคืน null เมื่อไม่มี', () => {
  tqf2Cache.setHtml(9001, '<p>เนื้อหา</p>');
  assert.equal(tqf2Cache.getHtml(9001), '<p>เนื้อหา</p>');
  assert.equal(tqf2Cache.getHtml('9001'), '<p>เนื้อหา</p>'); // key ถูก normalize เป็น number
  assert.equal(tqf2Cache.getHtml(9999), null);
});

test('tqf2Cache: diff cache มีทิศทาง — สลับ a/b ต้องไม่ชน cache เดิม', () => {
  const sections = [{ section_number: 1, has_changes: true }];
  tqf2Cache.setDiff(9010, 9011, sections);
  assert.deepEqual(tqf2Cache.getDiff(9010, 9011), sections);
  assert.equal(tqf2Cache.getDiff(9011, 9010), null, 'สลับทิศทางห้ามได้ cache เดิม (ins/del จะกลับด้าน)');
});

test('tqf2Cache: invalidate ลบทั้ง html และ diff ทุกคู่ที่เกี่ยวข้อง', () => {
  tqf2Cache.setHtml(9020, 'x');
  tqf2Cache.setDiff(9020, 9021, ['a']);
  tqf2Cache.setDiff(9022, 9020, ['b']);
  tqf2Cache.invalidate(9020);
  assert.equal(tqf2Cache.getHtml(9020), null);
  assert.equal(tqf2Cache.getDiff(9020, 9021), null);
  assert.equal(tqf2Cache.getDiff(9022, 9020), null);
});
