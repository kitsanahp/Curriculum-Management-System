// Test: Thai-aware HTML diff — grapheme cluster ไทยห้ามแตกกลางตัว + โครงสร้าง HTML ต้อง valid
const test = require('node:test');
const assert = require('node:assert/strict');

const { diffHtmlThaiAware, tokenize } = require('../src/utils/htmlDiffThai');

// ─── tokenize ────────────────────────────────────────────────────────────────

test('tokenize: พยัญชนะ + สระบน/วรรณยุกต์ รวมเป็น cluster เดียว', () => {
  assert.deepEqual(tokenize('กัน'), ['กั', 'น']);
  assert.deepEqual(tokenize('กิน'), ['กิ', 'น']);
  assert.deepEqual(tokenize('เขื่อน'), ['เ', 'ขื่', 'อ', 'น']); // ข + ื + ่ ต้องติดกัน
});

test('tokenize: แท็ก HTML เป็น token อะตอม / คำอังกฤษเป็นก้อนเดียว', () => {
  assert.deepEqual(tokenize('<p>Hello</p>'), ['<p>', 'Hello', '</p>']);
  assert.deepEqual(tokenize('ab 12'), ['ab', ' ', '12']);
});

// ─── diffHtmlThaiAware ───────────────────────────────────────────────────────

test('diff: เอกสารเหมือนกัน → คืนค่าเดิม ไม่มี ins/del', () => {
  const html = '<p>หมวดที่ 1 ข้อมูลทั่วไป</p>';
  const out = diffHtmlThaiAware(html, html);
  assert.equal(out, html);
});

test('diff: กิน → กัน ต้องไม่มีสระ/วรรณยุกต์ลอยเดี่ยว (ตัดทั้ง cluster)', () => {
  const out = diffHtmlThaiAware('<p>กิน</p>', '<p>กัน</p>');
  assert.ok(out.includes('<del class="diffdel">กิ</del>'), `del ต้องเป็นทั้ง cluster: ${out}`);
  assert.ok(out.includes('<ins class="diffins">กั</ins>'), `ins ต้องเป็นทั้ง cluster: ${out}`);
  assert.ok(!/<del[^>]*>[ัิ-ฺ็-๎]<\/del>/.test(out), 'ห้ามมี combining mark ลอยเดี่ยวใน del');
  assert.ok(!/<ins[^>]*>[ัิ-ฺ็-๎]<\/ins>/.test(out), 'ห้ามมี combining mark ลอยเดี่ยวใน ins');
});

test('diff: ทิศทางถูกต้อง — ของเดิมหาย = del, ของใหม่เพิ่ม = ins', () => {
  const out = diffHtmlThaiAware('<p>วิชาบังคับ</p>', '<p>วิชาเลือก</p>');
  const delText = (out.match(/<del[^>]*>([^<]*)<\/del>/g) || []).join('');
  const insText = (out.match(/<ins[^>]*>([^<]*)<\/ins>/g) || []).join('');
  assert.ok(delText.includes('บังคับ'), `del ต้องมีคำเดิม: ${out}`);
  assert.ok(insText.includes('เลือก'), `ins ต้องมีคำใหม่: ${out}`);
});

test('diff: แท็กโครงสร้างตาราง ห้ามโดนครอบใน ins/del (HTML ยัง valid)', () => {
  const oldHtml = '<table><tr><td>ก</td><td>ข</td></tr></table>';
  const newHtml = '<table><tr><td>ก</td><td>ค</td></tr></table>';
  const out = diffHtmlThaiAware(oldHtml, newHtml);
  assert.ok(!/<(ins|del)[^>]*>[^<]*<(table|tr|td|\/table|\/tr|\/td)/.test(out),
    `แท็กตารางหลุดเข้าไปใน ins/del: ${out}`);
  assert.ok(out.includes('<table>') && out.includes('</table>'));
});

test('diff: เพิ่มเนื้อหาอย่างเดียว → มีแต่ ins ไม่มี del', () => {
  const out = diffHtmlThaiAware('<p>หมวดที่ 1</p>', '<p>หมวดที่ 1</p><p>เพิ่มใหม่</p>');
  assert.ok(out.includes('<ins'));
  assert.ok(!out.includes('<del'));
});
