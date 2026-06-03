/**
 * TQF2 In-Process Cache
 * ─────────────────────────────────────────────────────────────────────────────
 * สองระดับ:
 *   htmlCache  — cleaned HTML ที่ extract จากไฟล์แล้ว (keyed by doc.id)
 *   diffCache  — sections diff สำเร็จรูป (keyed by "idA_idB")
 *
 * ใช้ Map แทน Redis เพราะ:
 *   1. traffic ไม่สูงพอที่จะต้องการ distributed cache
 *   2. Map เร็วกว่า Redis ~100x (ไม่มี network round-trip)
 *   3. ไม่มี Redis ติดตั้งในระบบ
 *
 * TTL: ไฟล์ TQF2 เป็น immutable (แก้ไขไม่ได้ — upload ใหม่ = row ใหม่)
 * ดังนั้น cache จึงถูกต้องตลอด ยกเว้น soft-delete ซึ่งจะ invalidate เอง
 */

const HTML_TTL_MS  = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
const DIFF_TTL_MS  = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
const MAX_HTML     = 40;  // สูงสุด 40 docs (~1-2 MB ต่อชิ้น ≈ 40-80 MB)
const MAX_DIFF     = 100; // สูงสุด 100 คู่

/** @type {Map<number, {html: string, ts: number}>} */
const htmlCache = new Map();

/** @type {Map<string, {sections: any[], ts: number}>} */
const diffCache = new Map();

// ── helpers ──────────────────────────────────────────────────────────────────

function diffKey(idA, idB) {
  const [a, b] = [Number(idA), Number(idB)].sort((x, y) => x - y);
  return `${a}_${b}`;
}

function evictOldest(map, maxSize) {
  if (map.size < maxSize) return;
  let oldest = null;
  for (const [k, v] of map) {
    if (!oldest || v.ts < oldest.ts) oldest = { k, ts: v.ts };
  }
  if (oldest) map.delete(oldest.k);
}

// ── HTML cache ────────────────────────────────────────────────────────────────

function getHtml(docId) {
  const entry = htmlCache.get(Number(docId));
  if (!entry) return null;
  if (Date.now() - entry.ts > HTML_TTL_MS) {
    htmlCache.delete(Number(docId));
    return null;
  }
  return entry.html;
}

function setHtml(docId, html) {
  evictOldest(htmlCache, MAX_HTML);
  htmlCache.set(Number(docId), { html, ts: Date.now() });
}

// ── Diff cache ────────────────────────────────────────────────────────────────

function getDiff(idA, idB) {
  const entry = diffCache.get(diffKey(idA, idB));
  if (!entry) return null;
  if (Date.now() - entry.ts > DIFF_TTL_MS) {
    diffCache.delete(diffKey(idA, idB));
    return null;
  }
  return entry.sections;
}

function setDiff(idA, idB, sections) {
  evictOldest(diffCache, MAX_DIFF);
  diffCache.set(diffKey(idA, idB), { sections, ts: Date.now() });
}

// ── Invalidation ──────────────────────────────────────────────────────────────

function invalidate(docId) {
  const id = Number(docId);
  htmlCache.delete(id);
  for (const key of diffCache.keys()) {
    const [a, b] = key.split('_').map(Number);
    if (a === id || b === id) diffCache.delete(key);
  }
}

// ── Stats (for debug/monitoring) ─────────────────────────────────────────────

function stats() {
  return {
    html:  { size: htmlCache.size,  max: MAX_HTML  },
    diffs: { size: diffCache.size,  max: MAX_DIFF  },
  };
}

module.exports = { getHtml, setHtml, getDiff, setDiff, invalidate, stats };
