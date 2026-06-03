<template>
 <Teleport to="body">
 <Transition name="modal-premium" appear>
 <div class="fixed inset-0 z-50 flex flex-col">
 <!-- Backdrop -->
 <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" @click="$emit('close')" />

 <div class="relative flex flex-col w-full h-full">

 <!-- ── Top bar ── -->
 <div class="modal-topbar flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-2.5 shrink-0 z-[200]">
 <FileIcon :file-type="doc.file_type" size="sm" />

 <!-- File identity -->
 <div class="flex-1 min-w-0">
 <p class="text-sm font-semibold text-gray-900 truncate leading-tight">{{ doc.original_name }}</p>
 <div class="flex items-center gap-1.5 mt-0.5">
 <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{{ doc.file_type }}</span>
 <span v-if="versionLabel" class="text-[10px] font-semibold text-primary-600">{{ versionLabel }}</span>
 <span v-if="doc.file_size" class="text-[10px] text-gray-400">· {{ formatFileSize(doc.file_size) }}</span>
 </div>
 </div>

 <!-- Actions (right) -->
 <div class="flex items-center gap-1 shrink-0">

 <!-- Annotation count (DOCX only) -->
 <div
 v-if="doc.file_type !== 'pdf' && !loading && !error"
 class="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded mr-1"
 >
 <PhChatCircleDots class="w-3.5 h-3.5" />
 {{ annotations.length }} ความเห็น
 </div>

 <!-- Print -->
 <button
 v-if="!loading && !error"
 @click="handlePrint"
 class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-150"
 >
 <PhPrinter class="w-4 h-4" />
 </button>

 <!-- Download -->
 <button @click="$emit('download')" class="btn-secondary text-xs py-1.5 px-3 ml-0.5">
 <PhDownloadSimple class="w-3.5 h-3.5" />
 ดาวน์โหลด
 </button>

 <!-- Admin review actions -->
 <template v-if="canReject || canApprove">
 <div class="w-px h-6 bg-gray-200 mx-2"></div>
 <button v-if="canReject" @click="$emit('reject')" class="btn-danger text-xs py-1.5 px-3">
 <PhArrowsClockwise class="w-3.5 h-3.5" />
 ส่งกลับแก้ไข
 </button>
 <button v-if="canApprove" @click="$emit('approve')" class="btn-primary text-xs py-1.5 px-3">
 <PhUsersThree class="w-3.5 h-3.5" />
 นำเข้าคณะกรรมการ
 </button>
 </template>

 <!-- Close -->
 <div class="w-px h-6 bg-gray-200 mx-2"></div>
 <button
 @click="$emit('close')"
 class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-150"
 >
 <PhX class="w-5 h-5" />
 </button>
 </div>
 </div>

 <!-- ── Body ── -->
 <div class="flex-1 overflow-hidden relative min-h-0">

 <!-- Loading -->
 <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center gap-3">
 <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
 <p class="text-sm text-white/70">กำลังโหลดตัวอย่าง…</p>
 </div>

 <!-- Error -->
 <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
 <PhWarning class="w-12 h-12 text-accent-400" />
 <p class="text-sm text-white/80">{{ error }}</p>
 <button @click="$emit('download')" class="btn-primary text-sm mt-1">
 <PhDownloadSimple class="w-4 h-4" />
 ดาวน์โหลดแทน
 </button>
 </div>

 <!-- PDF: full-width iframe -->
 <iframe
 v-else-if="doc.file_type === 'pdf' && pdfUrl"
 :src="pdfUrl"
 class="w-full h-full border-0"
 />

 <!-- DOCX: content + annotation sidebar -->
 <div v-else-if="htmlContent" class="flex h-full min-h-0">

 <!-- Document content area -->
 <div
 class="flex-1 overflow-y-auto bg-gray-50 relative"
 ref="docAreaRef"
 @mouseup="handleMouseUp"
 >
 <!-- DOCX header note -->
 <div class="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-1.5 flex items-center gap-2">
 <PhInfo class="w-3 h-3 text-gray-400 shrink-0" />
 <span class="text-[11px] text-gray-500">เลือกข้อความเพื่อ <strong class="text-gray-700 font-semibold">ไฮไลท์</strong> หรือ <strong class="text-gray-700 font-semibold">เพิ่มความเห็น</strong></span>
 </div>

 <div class="max-w-[860px] mx-auto my-5 bg-white doc-paper rounded shadow overflow-y-auto overflow-x-hidden">
 <div
 ref="docContentRef"
 class="px-12 py-10 prose prose-sm max-w-none select-text font-document
 prose-headings:font-semibold prose-headings:text-gray-900
 prose-p:text-gray-700 prose-p:leading-relaxed
 prose-table:text-sm prose-td:py-2 prose-th:py-2
 prose-strong:text-gray-900"
 v-html="htmlContent"
 />
 </div>
 <div class="h-8"></div>

 <!-- ── Floating selection toolbar ── -->
 <div
 v-if="selectionInfo && !showCommentInput"
 class="fixed z-30 pointer-events-none"
 :style="{ top: selectionInfo.toolbarY + 'px', left: selectionInfo.toolbarX + 'px', transform: 'translateX(-50%)' }"
 >
 <div class="pointer-events-auto bg-gray-900 rounded px-2.5 py-2 flex items-center gap-2 shadow shadow-black/50 border border-white/10">
 <!-- Label -->
 <span class="text-[10px] text-gray-400 font-medium pl-0.5 whitespace-nowrap">ไฮไลท์:</span>
 <!-- Color buttons — click = highlight immediately -->
 <div class="flex items-center gap-1">
 <button
 v-for="c in colorOptions"
 :key="c.value"
 @mousedown.prevent="quickHighlight(c.value)"
 class="w-8 h-8 rounded transition-all hover:scale-110 active:scale-95 ring-2 ring-offset-1 ring-offset-gray-900 ring-transparent hover:ring-white/50"
 :style="{ backgroundColor: c.hex }"
 />
 </div>
 <div class="w-px h-6 bg-white/20"></div>
 <!-- Comment button -->
 <button
 @mousedown.prevent="openCommentInput"
 class="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-white/15 active:bg-white/25 transition-colors whitespace-nowrap"
 >
 <PhChatCircle class="w-3.5 h-3.5" />
 + ความเห็น
 </button>
 </div>
 <div class="flex justify-center">
 <div class="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1 rounded"></div>
 </div>
 </div>
 </div>

 <!-- ── Annotations sidebar ── -->
 <div class="doc-sidebar w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0">
 <!-- Sidebar header -->
 <div class="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/60">
 <div class="flex items-center gap-2">
 <PhChatCircleDots class="w-3.5 h-3.5 text-gray-400" />
 <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">ความเห็น</span>
 <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{{ unresolvedCount }}</span>
 </div>
 <button
 @click="showResolved = !showResolved"
 class="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
 >
 {{ showResolved ? 'ซ่อนที่แก้แล้ว' : 'ดูที่แก้แล้ว' }}
 </button>
 </div>

 <!-- Comment composer (appears in sidebar when comment button clicked) -->
 <div v-if="showCommentInput" class="border-b border-primary-200 bg-primary-200/20 p-3 shrink-0">
 <div class="rounded px-3 py-2 text-xs text-gray-600 font-document line-clamp-2 mb-2.5 border border-black/5"
 :style="{ backgroundColor: currentColorHex + '80' }">
 "{{ selectionInfo?.text }}"
 </div>
 <!-- Color selector -->
 <div class="flex items-center gap-1.5 mb-2.5">
 <span class="text-[10px] text-gray-500 font-medium">สีไฮไลท์</span>
 <div class="flex gap-1 ml-1">
 <button
 v-for="c in colorOptions"
 :key="c.value"
 @click="pendingColor = c.value"
 :class="['w-6 h-6 rounded-full transition-all hover:scale-110', pendingColor === c.value ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : '']"
 :style="{ backgroundColor: c.hex }"
 />
 </div>
 </div>
 <!-- Textarea -->
 <textarea
 ref="commentInputRef"
 v-model="newCommentText"
 rows="3"
 placeholder="พิมพ์ความเห็น... (ไม่บังคับ)"
 class="input-base text-sm resize-none w-full"
 @keydown.ctrl.enter="submitComment"
 @keydown.escape="cancelComment"
 />
 <p class="text-[10px] text-gray-400 mt-1 mb-2">Ctrl+Enter เพื่อบันทึก</p>
 <div class="flex gap-2">
 <button @click="cancelComment" class="flex-1 btn-secondary text-xs py-1.5">ยกเลิก</button>
 <button @click="submitComment" :disabled="submitting" class="flex-1 btn-primary text-xs py-1.5">
 {{ submitting ? '...' : 'บันทึก' }}
 </button>
 </div>
 </div>

 <!-- Empty state -->
 <div v-if="visibleAnnotations.length === 0 && !showCommentInput" class="flex-1 flex flex-col items-center justify-center text-gray-400 px-4 text-center">
 <PhChatCircle class="w-8 h-8 mb-2 text-gray-300" />
 <p class="text-sm font-medium">ยังไม่มีความเห็น</p>
 <p class="text-xs mt-1">เลือกข้อความในเอกสารเพื่อเพิ่มข้อเสนอแนะ</p>
 </div>

 <!-- Annotation cards -->
 <div v-if="visibleAnnotations.length > 0" ref="sidebarRef" class="flex-1 overflow-y-auto">
 <div
 v-for="ann in visibleAnnotations"
 :key="ann.id"
 :data-card-id="ann.id"
 :class="[
 'px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-100',
 activeAnnotationId === ann.id ? 'bg-primary-50/50' : 'hover:bg-gray-50/60',
 ann.is_resolved ? 'opacity-50' : ''
 ]"
 @click="focusAnnotation(ann.id)"
 >
 <!-- Color dot + quoted text -->
 <div class="flex items-start gap-2 mb-2.5">
 <span
 class="w-2 h-2 rounded-full mt-1.5 shrink-0"
 :style="{ backgroundColor: getColorHex(ann.color) }"
 />
 <p class="text-[11px] text-gray-500 font-document line-clamp-2 italic leading-relaxed">"{{ ann.selected_text }}"</p>
 </div>

 <!-- Author + date row -->
 <div class="flex items-center gap-1.5 mb-1.5 pl-4">
 <div class="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
 <PhUser class="w-3 h-3 text-gray-500" />
 </div>
 <span class="text-xs font-medium text-gray-700 flex-1 truncate">{{ ann.author?.name }}</span>
 <span class="text-[10px] text-gray-400 shrink-0">{{ formatDate(ann.createdAt) }}</span>
 </div>

 <!-- Comment text -->
 <p v-if="ann.comment" class="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap pl-4 mb-1.5">{{ ann.comment }}</p>

 <!-- Actions + resolved state -->
 <div class="flex items-center gap-2 pl-4 mt-2">
 <PhCheckCircle v-if="ann.is_resolved" class="w-3 h-3 text-emerald-500 shrink-0" />
 <button
 @click.stop="toggleResolve(ann)"
 :class="['text-[10px] font-medium transition-colors', ann.is_resolved ? 'text-gray-400 hover:text-gray-600' : 'text-primary-600 hover:text-primary-700']"
 >
 {{ ann.is_resolved ? 'เปิดใหม่' : 'แก้ไขแล้ว' }}
 </button>
 <button
 v-if="canDeleteAnnotation(ann)"
 @click.stop="deleteModalId = ann.id"
 class="text-[10px] text-gray-400 hover:text-rose-500 transition-colors ml-auto"
 >
 ลบ
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 </div>
 </div>
 </Transition>

 <!-- Delete Confirmation Modal -->
 <Teleport to="body">
 <Transition name="modal-premium">
 <div v-if="deleteModalId" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
 <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100">
 <div class="p-6 text-center">
 <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-inset ring-red-100">
 <PhWarning class="w-8 h-8 text-red-600" />
 </div>
 <h3 class="text-lg font-bold text-gray-900 mb-2">ลบความเห็น</h3>
 <p class="text-sm text-gray-500 mb-1">ความเห็นนี้จะถูกลบออกจากระบบถาวร</p>
 </div>
 <div class="px-6 pb-6 flex gap-3">
 <button
 @click="deleteModalId = null"
 class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all ease-ios whitespace-nowrap"
 >
 ยกเลิก
 </button>
 <button
 @click="deleteAnnotation(deleteModalId)"
 class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-sm transition-all ease-ios active:scale-[0.97] whitespace-nowrap"
 >
 ลบความเห็น
 </button>
 </div>
 </div>
 </div>
 </Transition>
 </Teleport>
 </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import { formatThaiDateTime } from '@/utils/date';
import { sanitizeHtml } from '@/utils/sanitize';
import {
 PhFile, PhDownloadSimple, PhX,
 PhWarning, PhChatCircle,
 PhChatCircleDots, PhInfo, PhCheckCircle, PhUser,
 PhArrowsClockwise, PhUsersThree, PhPrinter
} from '@phosphor-icons/vue';
import FileIcon from '@/components/common/FileIcon.vue';

const props = defineProps({
 doc: { type: Object, required: true },
 apiPath: { type: String, required: true },
 versionLabel: { type: String, default: '' },
 documentType: { type: String, default: 'document' },
 canReject: { type: Boolean, default: false },
 canApprove: { type: Boolean, default: false },
 focusAnnotationId: { type: Number, default: null },
});
const emit = defineEmits(['close', 'download', 'reject', 'approve']);

const authStore = useAuthStore();

const handlePrint = () => {
  if (props.doc.file_type === 'pdf' && pdfUrl.value) {
    const win = window.open(pdfUrl.value, '_blank');
    if (win) win.addEventListener('load', () => win.print());
  } else if (htmlContent.value) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="th"><head>
      <meta charset="UTF-8">
      <title>${props.doc.original_name}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Sarabun', sans-serif; font-size: 14px; line-height: 1.8;
               color: #111; margin: 0; padding: 2cm 2.5cm; }
        h1, h2, h3, h4 { font-weight: 700; margin: 1.2em 0 0.5em; line-height: 1.4; }
        h1 { font-size: 1.4rem; } h2 { font-size: 1.2rem; } h3 { font-size: 1.05rem; }
        p { margin: 0.6em 0; }
        table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 13px; }
        td, th { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; font-weight: 700; }
        ins { background: none !important; text-decoration: none; }
        del { display: none !important; }
        a { color: inherit; text-decoration: none; outline: none; border: none; }
        a[name] { display: inline; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${htmlContent.value}</body></html>`);
    win.document.close();
    win.addEventListener('load', () => { win.print(); });
  }
};

// ── Preview state ──
const loading = ref(true);
const error = ref('');
const pdfUrl = ref('');
const rawHtml = ref('');
const htmlContent = ref(''); // rawHtml + highlight spans baked in

// ── Annotation state ──
const annotations = ref([]);
const activeAnnotationId = ref(null);
const deleteModalId = ref(null);
const showResolved = ref(false);
const selectionInfo = ref(null);
const showCommentInput = ref(false);
const newCommentText = ref('');
const pendingColor = ref('yellow');
const submitting = ref(false);

// ── Refs ──
const docContentRef = ref(null);
const docAreaRef = ref(null);
const sidebarRef = ref(null);
const commentInputRef = ref(null);

// ── Colors ──
const colorOptions = [
 { value: 'yellow', label: 'เหลือง', hex: '#fef08a' },
 { value: 'green', label: 'เขียว', hex: '#bbf7d0' },
 { value: 'blue', label: 'น้ำเงิน', hex: '#bfdbfe' },
 { value: 'pink', label: 'ชมพู', hex: '#fbcfe8' },
];
const getColorHex = (color) => colorOptions.find(c => c.value === color)?.hex ?? '#fef08a';
const currentColorHex = computed(() => getColorHex(pendingColor.value));

// ── Computed ──
const unresolvedCount = computed(() => annotations.value.filter(a => !a.is_resolved).length);
const visibleAnnotations = computed(() =>
 showResolved.value ? annotations.value : annotations.value.filter(a => !a.is_resolved)
);

// ── Auth helpers ──
const canDeleteAnnotation = (ann) =>
 ann.author_id === authStore.user?.id || authStore.user?.role === 'admin';

const authorAvatarClass = (ann) => {
 const role = ann.author?.role;
 if (role === 'admin') return 'bg-primary-300 text-primary-800';
 if (role === 'faculty') return 'bg-primary-200 text-primary-800';
 return 'bg-gray-200 text-gray-500';
};

// ── Load preview ──
const loadPreview = async () => {
 loading.value = true;
 error.value = ''; pdfUrl.value = ''; htmlContent.value = ''; rawHtml.value = '';
 try {
 if (props.doc.file_type === 'pdf') {
 const res = await api.get(props.apiPath, { responseType: 'blob' });
 pdfUrl.value = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
 } else {
 // DOCX (both regular and TQF2): mammoth HTML → annotation system
 const res = await api.get(props.apiPath);
 let fetchedHtml = res.data.html || '';
 
 if (fetchedHtml) {
 // Pre-process HTML to ensure table headers are correct BEFORE displaying
 const parser = new DOMParser();
 const detached = parser.parseFromString(fetchedHtml, 'text/html');
 enhanceTableHeaders(detached);
 fetchedHtml = detached.body.innerHTML;
 }
 
 rawHtml.value = sanitizeHtml(fetchedHtml);
 htmlContent.value = rawHtml.value;
 if (!rawHtml.value) error.value = 'ไม่สามารถแสดงตัวอย่างเอกสารนี้ได้';
 }
 } catch {
 error.value = 'ไม่สามารถโหลดตัวอย่างได้ กรุณาดาวน์โหลดเพื่อดูไฟล์';
 } finally { loading.value = false; }

 if (rawHtml.value) {
 await loadAnnotations();
 }
};

// ── Load annotations ──
const loadAnnotations = async () => {
 try {
 const { data } = await api.get('/curricula/annotations', {
 params: { document_id: props.doc.id, document_type: props.documentType }
 });
 annotations.value = data.data;
 rebuildHighlightedHtml();
 if (props.focusAnnotationId) {
   await nextTick();
   setTimeout(() => focusAnnotation(props.focusAnnotationId), 350);
 }
 } catch { /* silent */ }
};

// ── ใช้วิธีวิเคราะห์ตารางอัตโนมัติ เพื่อสร้าง <thead> ──
const enhanceTableHeaders = (detached) => {
 detached.querySelectorAll('table').forEach(table => {
 // ถ้า Word มี thead มาให้แล้ว ให้ข้ามไป
 if (!table.querySelector('thead')) {
 const rows = Array.from(table.querySelectorAll('tr'));
 if (rows.length > 1) {
 let maxRowSpan = 1;
 let hasColSpan = false;
 
 // วิเคราะห์เฉพาะแถวแรกสุด
 const firstRowCells = Array.from(rows[0].querySelectorAll('td, th'));
 firstRowCells.forEach(cell => {
 const rs = parseInt(cell.getAttribute('rowspan') || '1', 10);
 const cs = parseInt(cell.getAttribute('colspan') || '1', 10);
 
 if (rs > maxRowSpan && rs <= 4) maxRowSpan = rs;
 if (cs > 1) hasColSpan = true;
 });
 
 // Heuristic: 
 // 1. ถ้าตารางมี colspan และ rowspan > 1 โอกาสสูงมากที่จะเป็นตาราง Curriculum Mapping ที่มีหัวข้อหลายชั้น
 // 2. ถ้าตารางมีจำนวนคอลัมน์เยอะมากๆ (> 6 คอลัมน์) อนุมานว่าเป็นตารางซับซ้อน ให้ล็อกแถวแรกไว้
 // 3. ถ้าไม่เข้าเงื่อนไขเลย (เช่น ตารางรายชื่ออาจารย์ หรือหมวดวิชาที่มี 2-4 คอลัมน์) ไม่ต้องสร้าง thead
 let headerCount = 0;
 const colCount = firstRowCells.length;
 
 if (hasColSpan && maxRowSpan > 1) {
 headerCount = maxRowSpan;
 } else if (colCount > 5) {
 headerCount = 1;
 }

 if (headerCount > 0) {
 const thead = detached.createElement('thead');
 for (let i = 0; i < headerCount; i++) {
 Array.from(rows[i].querySelectorAll('td')).forEach(td => {
 const th = detached.createElement('th');
 th.innerHTML = td.innerHTML;
 Array.from(td.attributes).forEach(attr => th.setAttribute(attr.name, attr.value));
 td.parentNode.replaceChild(th, td);
 });
 thead.appendChild(rows[i]);
 }
 table.insertBefore(thead, table.firstChild);
 }
 }
 }
 });
};

// ── Rebuild htmlContent with highlights baked in (DOMParser approach) ──
// Operates entirely in a detached document so Vue's v-html rendering is never raced.
const rebuildHighlightedHtml = () => {
 if (!rawHtml.value) return;
 const parser = new DOMParser();
 const detached = parser.parseFromString(rawHtml.value, 'text/html');

 annotations.value.forEach(ann => {
 if (!ann.is_resolved) highlightInDom(detached.body, ann);
 });
 htmlContent.value = detached.body.innerHTML;
};

const highlightInDom = (container, ann) => {
 const doc = container.ownerDocument;

 // เก็บ text node ทั้งหมดที่ไม่อยู่ใน highlight เดิม
 const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
 const textNodes = [];
 while (walker.nextNode()) {
 if (!walker.currentNode.parentElement?.closest('.annotation-mark'))
 textNodes.push(walker.currentNode);
 }
 if (!textNodes.length) return;

 // สร้าง position map: starts[i] = ตำแหน่งเริ่มต้นของ textNodes[i] ใน fullText
 const starts = [];
 let pos = 0;
 for (const n of textNodes) { starts.push(pos); pos += n.textContent.length; }

 // normalize   (non-breaking space) → regular space (1-to-1, index stays valid)
 const norm = (s) => s.replace(/ /g, ' ');
 const fullText = norm(textNodes.map(n => n.textContent).join(''));
 const target = norm(ann.selected_text);

 const matchStart = fullText.indexOf(target);
 if (matchStart === -1) return;
 const matchEnd = matchStart + target.length;

 const color = getColorHex(ann.color);
 const annotationId = String(ann.id);

 // หา segment ของแต่ละ text node ที่ตกอยู่ในช่วง [matchStart, matchEnd)
 // เก็บไว้ก่อน แล้วค่อย modify (ห้าม modify ขณะ iterate)
 const segments = [];
 for (let i = 0; i < textNodes.length; i++) {
 const ns = starts[i];
 const ne = ns + textNodes[i].textContent.length;
 if (ne <= matchStart || ns >= matchEnd) continue;
 segments.push({
 node: textNodes[i],
 from: Math.max(0, matchStart - ns),
 to: Math.min(textNodes[i].textContent.length, matchEnd - ns),
 });
 }
 if (!segments.length) return;

 // แทนที่แต่ละ text node ด้วย [before][<span>match</span>][after]
 // ไม่ใช้ Range API เลย → ทำงานได้แม้ selection ข้าม element boundary
 for (const { node, from, to } of segments) {
 const text = node.textContent;
 const parent = node.parentNode;
 if (!parent) continue;

 const span = doc.createElement('span');
 span.className = 'annotation-mark';
 span.dataset.annotationId = annotationId;
 span.setAttribute('style',
 `background-color:${color};cursor:pointer;border-radius:2px;transition:background-color 0.15s;-webkit-box-decoration-break:clone;box-decoration-break:clone`
 );
 span.textContent = text.slice(from, to);

 // DocumentFragment ทำให้ replaceChild atomic — ไม่ต้อง insertBefore หลายครั้ง
 const frag = doc.createDocumentFragment();
 if (from > 0) frag.appendChild(doc.createTextNode(text.slice(0, from)));
 frag.appendChild(span);
 if (to < text.length) frag.appendChild(doc.createTextNode(text.slice(to)));
 parent.replaceChild(frag, node);
 }
};

// ── Text selection handling ──
const handleMouseUp = () => {
 if (showCommentInput.value) return;
 const sel = window.getSelection();
 if (!sel || sel.isCollapsed) { selectionInfo.value = null; return; }

 const container = docContentRef.value;
 if (!container || !container.contains(sel.anchorNode)) {
 selectionInfo.value = null;
 return;
 }

 const range = sel.getRangeAt(0);

 // ใช้ range.cloneContents() แทน sel.toString()
 // sel.toString() เพิ่ม \n ระหว่าง block element แต่ text node จริงๆ ไม่มี \n
 // ถ้าเก็บ \n ไว้แล้วไป indexOf ใน fullText (ที่ไม่มี \n) จะ match ไม่ได้เลย
 const frag = range.cloneContents();
 const tw = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
 const parts = [];
 while (tw.nextNode()) parts.push(tw.currentNode.textContent);
 const text = parts.join('').trim();

 if (text.length < 2) { selectionInfo.value = null; return; }

 const rect = range.getBoundingClientRect();
 const contextBefore = (range.startContainer.textContent || '')
 .substring(Math.max(0, range.startOffset - 60), range.startOffset);
 const contextAfter = (range.endContainer.textContent || '')
 .substring(range.endOffset, range.endOffset + 60);

 selectionInfo.value = {
 text,
 range: range.cloneRange(),
 contextBefore,
 contextAfter,
 toolbarX: rect.left + rect.width / 2,
 toolbarY: rect.top > 60 ? rect.top - 54 : rect.bottom + 8,
 };
};

// Quick highlight — click color in toolbar = immediate annotation, no comment required
const quickHighlight = async (color) => {
 if (!selectionInfo.value || submitting.value) return;
 pendingColor.value = color;
 submitting.value = true;
 try {
 const { data } = await api.post('/curricula/annotations', {
 document_id: props.doc.id,
 document_type: props.documentType,
 selected_text: selectionInfo.value.text,
 context_before: selectionInfo.value.contextBefore,
 context_after: selectionInfo.value.contextAfter,
 comment: '',
 color,
 });
 annotations.value.push(data.data);
 rebuildHighlightedHtml();
 activeAnnotationId.value = data.data.id;
 await nextTick();
 sidebarRef.value?.querySelector(`[data-card-id="${data.data.id}"]`)
 ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
 } catch { /* silent */ } finally {
 submitting.value = false;
 selectionInfo.value = null;
 window.getSelection()?.removeAllRanges();
 }
};

const openCommentInput = async () => {
 showCommentInput.value = true;
 await nextTick();
 commentInputRef.value?.focus();
};

const cancelComment = () => {
 showCommentInput.value = false;
 newCommentText.value = '';
 selectionInfo.value = null;
 window.getSelection()?.removeAllRanges();
};

const submitComment = async () => {
 if (!selectionInfo.value || submitting.value) return;
 submitting.value = true;
 try {
 const { data } = await api.post('/curricula/annotations', {
 document_id: props.doc.id,
 document_type: props.documentType,
 selected_text: selectionInfo.value.text,
 context_before: selectionInfo.value.contextBefore,
 context_after: selectionInfo.value.contextAfter,
 comment: newCommentText.value.trim(),
 color: pendingColor.value,
 });
 annotations.value.push(data.data);
 rebuildHighlightedHtml();
 activeAnnotationId.value = data.data.id;
 await nextTick();
 docContentRef.value?.querySelector(`[data-annotation-id="${data.data.id}"]`)
 ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
 sidebarRef.value?.querySelector(`[data-card-id="${data.data.id}"]`)
 ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
 } catch { /* silent */ } finally {
 submitting.value = false;
 showCommentInput.value = false;
 newCommentText.value = '';
 selectionInfo.value = null;
 window.getSelection()?.removeAllRanges();
 }
};

// ── Focus overlays (แนวทางที่ 3: Range.getClientRects per line) ──
const OVERLAY_CLASS = 'annotation-focus-overlay';
let overlayCleanupTimer = null;

const clearFocusOverlays = () => {
  document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());
  clearTimeout(overlayCleanupTimer);
};

const drawFocusOverlays = (span) => {
  clearFocusOverlays();

  const range = document.createRange();
  range.selectNodeContents(span);
  const rects = Array.from(range.getClientRects()).filter(r => r.width > 0);

  rects.forEach(rect => {
    const el = document.createElement('div');
    el.className = OVERLAY_CLASS;
    el.style.cssText = [
      'position:fixed',
      `left:${rect.left - 2}px`,
      `top:${rect.top - 2}px`,
      `width:${rect.width + 4}px`,
      `height:${rect.height + 4}px`,
      'border:2px solid #4752C4',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'transition:opacity 0.35s ease',
    ].join(';');
    document.body.appendChild(el);
  });

  // Fade out then remove
  overlayCleanupTimer = setTimeout(() => {
    document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => {
      el.style.opacity = '0';
    });
    setTimeout(clearFocusOverlays, 380);
  }, 1200);
};

// ── Sidebar interactions ──
const focusAnnotation = (id) => {
  activeAnnotationId.value = id;

  const span = docContentRef.value?.querySelector(`[data-annotation-id="${id}"]`);
  if (!span) {
    sidebarRef.value?.querySelector(`[data-card-id="${id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  span.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // รอ scroll settle ก่อนวัด rect (smooth scroll ใช้เวลา ~300ms)
  setTimeout(() => drawFocusOverlays(span), 320);

  sidebarRef.value?.querySelector(`[data-card-id="${id}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

const toggleResolve = async (ann) => {
 try {
 await api.patch(`/curricula/annotations/${ann.id}/resolve`);
 ann.is_resolved = !ann.is_resolved;
 rebuildHighlightedHtml();
 } catch { /* silent */ }
};

const deleteAnnotation = async (id) => {
 try {
 await api.delete(`/curricula/annotations/${id}`);
 annotations.value = annotations.value.filter(a => a.id !== id);
 if (activeAnnotationId.value === id) activeAnnotationId.value = null;
 rebuildHighlightedHtml();
 } catch { /* silent */ } finally {
 deleteModalId.value = null;
 }
};

// ── Annotation mark click delegation + toolbar dismissal ──
const handleDocClick = (e) => {
 // Delegate clicks on highlight spans (rendered via v-html, so no addEventListener on them)
 const mark = e.target.closest('.annotation-mark');
 if (mark) {
 const id = parseInt(mark.dataset.annotationId);
 if (id) focusAnnotation(id);
 return;
 }
 if (showCommentInput.value) return;
 if (!e.target.closest('[data-card-id]')) {
 if (window.getSelection()?.isCollapsed) selectionInfo.value = null;
 }
};

// ── Helpers ──
const formatDate = formatThaiDateTime;
const formatFileSize = (bytes) => {
 if (!bytes) return '';
 if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ── Lifecycle ──
const handleKeydown = (e) => { if (e.key === 'Escape') emit('close'); };
onMounted(() => {
 document.addEventListener('keydown', handleKeydown);
 document.addEventListener('click', handleDocClick);
 loadPreview();
});
onUnmounted(() => {
 document.removeEventListener('keydown', handleKeydown);
 document.removeEventListener('click', handleDocClick);
 if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
 clearFocusOverlays();
});
</script>

<style scoped>
.annotation-mark:hover {
 filter: brightness(0.92);
}

/* ── FIX #4: ป้องกันตาราง/เนื้อหาทะลุกรอบ และบีบตัวอักษร ────────────────────── */
/* ตาราง Word ให้เลื่อนขอดูได้ (Horizontal Scroll) และไม่ตัดคำ */
:deep(.prose table) {
 display: block;
 width: 100% !important;
 max-width: 100% !important;
 max-height: 65vh; /* จำกัดความสูงตาราง ให้มี Scrollbar แนวนอนอยู่ในจอเสมอ */
 overflow: auto;
 white-space: nowrap;
 border: 1px solid #e5e7eb; /* เพิ่มกรอบให้ตารางดูเป็นสัดส่วน */
 border-collapse: separate; /* เพื่อให้ sticky ล็อกได้สวยงาม */
 border-spacing: 0;
}

:deep(.prose img) {
 max-width: 100% !important;
 height: auto !important;
}

:deep(.prose td),
:deep(.prose th) {
 padding: 8px 12px;
 border-bottom: 1px solid #e5e7eb;
 border-right: 1px solid #e5e7eb;
}

/* ล็อกหัวตารางทุกแถวใน thead ให้อยู่กับที่ (รองรับหัวข้อตารางแบบ 2-3 บรรทัดของ มคอ.2) */
:deep(.prose thead) {
 position: sticky;
 top: 0;
 z-index: 10;
}

:deep(.prose thead th),
:deep(.prose thead td) {
 background-color: #F5F5F5;
 font-weight: 600;
 box-shadow: 0 2px 0 #E5E5E5;
}

/* ลบ outline/border ของ anchor tags จาก DOCX (Word bookmarks & hyperlinks) */
:deep(.prose a) {
 color: inherit;
 text-decoration: none;
 outline: none;
 border: none;
 box-shadow: none;
}
</style>

