<template>
  <div class="tqf2-side-by-side-container">

    <!-- Header with metadata -->
    <div class="tqf2-comparison-header">
      <div class="grid grid-cols-2 gap-4">
        <!-- Left document -->
        <div class="flex items-start gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <span class="text-xs font-bold text-gray-600">ก่อน</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">เวอร์ชันที่ {{ leftDoc.version_number }}</p>
            <p class="text-sm font-bold text-gray-900 truncate mt-0.5">{{ leftDoc.original_name }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ leftDoc.uploader?.name || 'N/A' }}</p>
          </div>
        </div>
        <!-- Right document -->
        <div class="flex items-start gap-3 px-4 py-3 bg-white rounded-xl border border-primary-200 shadow-sm">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <span class="text-xs font-bold text-primary-700">หลัง</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-bold text-primary-500 uppercase tracking-wider">เวอร์ชันที่ {{ rightDoc.version_number }}</p>
            <p class="text-sm font-bold text-gray-900 truncate mt-0.5">{{ rightDoc.original_name }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ rightDoc.uploader?.name || 'N/A' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TOC Navigation Bar -->
    <div v-if="sections.length > 0" class="tqf2-toc-bar">
      <div class="tqf2-toc-scroll">
        <button
          v-for="(sec, i) in sections"
          :key="i"
          @click="scrollToSection(i)"
          :class="['tqf2-toc-btn', activeSection === i ? 'active' : '']"
        >
          <span class="tqf2-toc-index">{{ i + 1 }}</span>
          <span class="tqf2-toc-label">{{ sec.title }}</span>
        </button>
      </div>
      <!-- Section counter -->
      <div class="tqf2-toc-counter">
        <span class="text-xs font-bold text-gray-400 tabular-nums whitespace-nowrap">
          {{ activeSection + 1 }} / {{ sections.length }}
        </span>
      </div>
    </div>

    <!-- Side-by-side comparison container -->
    <div class="tqf2-side-by-side-wrapper">
      <!-- Left panel -->
      <div class="tqf2-document-panel tqf2-left-panel" ref="leftPanelRef">
        <div class="tqf2-document-inner">
          <div class="tqf2-document-content left-content" v-html="enhancedLeftHtml" />
        </div>
      </div>

      <!-- Divider -->
      <div class="tqf2-divider"></div>

      <!-- Right panel -->
      <div class="tqf2-document-panel tqf2-right-panel" ref="rightPanelRef">
        <div class="tqf2-document-inner">
          <div class="tqf2-document-content right-content" v-html="enhancedRightHtml" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { sanitizeHtml } from '@/utils/sanitize';

const props = defineProps({
  leftDoc:  { type: Object, required: true },
  rightDoc: { type: Object, required: true },
  leftHtml:  { type: String, default: '' },
  rightHtml: { type: String, default: '' },
});

const leftPanelRef  = ref(null);
const rightPanelRef = ref(null);
const activeSection = ref(0);

// ── Enhance HTML: add IDs to headings + fix tables ───────────────────────────
const enhanceHtml = (html, prefix) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // ID headings for scroll-to
  doc.querySelectorAll('h1, h2, h3, h4').forEach((h, i) => {
    h.id = `${prefix}-section-${i}`;
  });

  // Fix tables without <thead>
  doc.querySelectorAll('table').forEach(table => {
    if (!table.querySelector('thead')) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length > 1) {
        let maxRowSpan = 1, hasColSpan = false;
        Array.from(rows[0].querySelectorAll('td, th')).forEach(cell => {
          const rs = parseInt(cell.getAttribute('rowspan') || '1', 10);
          const cs = parseInt(cell.getAttribute('colspan') || '1', 10);
          if (rs > maxRowSpan && rs <= 4) maxRowSpan = rs;
          if (cs > 1) hasColSpan = true;
        });
        const colCount = rows[0].querySelectorAll('td, th').length;
        let headerCount = 0;
        if (hasColSpan && maxRowSpan > 1) headerCount = maxRowSpan;
        else if (colCount > 5) headerCount = 1;

        if (headerCount > 0) {
          const thead = doc.createElement('thead');
          for (let i = 0; i < headerCount; i++) {
            Array.from(rows[i].querySelectorAll('td')).forEach(td => {
              const th = doc.createElement('th');
              th.innerHTML = td.innerHTML;
              Array.from(td.attributes).forEach(a => th.setAttribute(a.name, a.value));
              td.parentNode.replaceChild(th, td);
            });
            thead.appendChild(rows[i]);
          }
          table.insertBefore(thead, table.firstChild);
        }
      }
    }
  });

  return sanitizeHtml(doc.body.innerHTML);
};

const enhancedLeftHtml  = computed(() => enhanceHtml(props.leftHtml,  'left'));
const enhancedRightHtml = computed(() => enhanceHtml(props.rightHtml, 'right'));

// ── Build TOC from left document headings ────────────────────────────────────
const sections = computed(() => {
  if (!props.leftHtml) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(props.leftHtml, 'text/html');
  return Array.from(doc.querySelectorAll('h1, h2, h3, h4'))
    .map((h, i) => ({
      id: i,
      title: h.textContent.trim().slice(0, 40),
      level: parseInt(h.tagName[1]),
    }))
    .filter(s => s.title.length > 0);
});

// ── Scroll both panels to section ────────────────────────────────────────────
const scrollToSection = async (index) => {
  activeSection.value = index;
  await nextTick();

  const leftInner  = leftPanelRef.value?.querySelector('.tqf2-document-inner');
  const rightInner = rightPanelRef.value?.querySelector('.tqf2-document-inner');

  const leftEl  = leftInner?.querySelector(`#left-section-${index}`);
  const rightEl = rightInner?.querySelector(`#right-section-${index}`);

  if (leftEl && leftInner) {
    leftInner.scrollTo({ top: leftEl.offsetTop - 16, behavior: 'smooth' });
  }
  if (rightEl && rightInner) {
    rightInner.scrollTo({ top: rightEl.offsetTop - 16, behavior: 'smooth' });
  }
};

onMounted(() => {
  const leftInner  = leftPanelRef.value?.querySelector('.tqf2-document-inner');
  const rightInner = rightPanelRef.value?.querySelector('.tqf2-document-inner');
  if (!leftInner || !rightInner) return;

  // BUG-01 fix: bidirectional scroll sync
  let syncing = false;
  leftInner.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    const ratio = leftInner.scrollTop / (leftInner.scrollHeight - leftInner.clientHeight || 1);
    rightInner.scrollTop = ratio * (rightInner.scrollHeight - rightInner.clientHeight);
    syncing = false;
  });
  rightInner.addEventListener('scroll', () => {
    if (syncing) return;
    syncing = true;
    const ratio = rightInner.scrollTop / (rightInner.scrollHeight - rightInner.clientHeight || 1);
    leftInner.scrollTop = ratio * (leftInner.scrollHeight - leftInner.clientHeight);
    syncing = false;
  });

  // BUG-02 fix: active section tracks inner scroll (not outer panel)
  leftInner.addEventListener('scroll', () => {
    if (!sections.value.length) return;
    const scrollTop = leftInner.scrollTop + 40;
    let current = 0;
    sections.value.forEach((_, i) => {
      const el = leftInner.querySelector(`#left-section-${i}`);
      if (el && el.offsetTop <= scrollTop) current = i;
    });
    activeSection.value = current;
  });
});
</script>

<style scoped src="./TQF2SideBySideComparison.css" />
