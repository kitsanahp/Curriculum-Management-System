<template>
 <div class="pb-10"
  @dragover.prevent="isDragging = true"
  @dragleave.prevent="isDragging = false"
  @drop.prevent="handleDrop">



  <!-- Main card -->
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm">

   <!-- Card header -->
   <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
    <div>
     <h2 class="text-base font-bold text-gray-900">เอกสารหลักสูตร</h2>
     <div v-if="documents.length" class="flex items-center gap-1.5 mt-0.5">
      <span class="text-xs font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ documents.length }} ไฟล์</span>
      <span class="text-xs text-gray-500">อัปเดต {{ formatDate(documents[0]?.updatedAt || documents[0]?.createdAt) }}</span>
     </div>
    </div>
    <!-- Upload button -->
    <label v-if="canUpload"
     class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50 active:scale-[0.97] transition-all ease-ios cursor-pointer">
     <PhUploadSimple class="w-4 h-4" aria-hidden="true" />
     อัปโหลดไฟล์
     <input type="file" class="hidden" accept=".pdf,.docx,.doc" @change="handleUpload($event, 'reference')" />
    </label>
    <!-- อัปโหลดไม่ได้ — แสดง disabled พร้อม tooltip -->
    <span
     v-else-if="['faculty', 'staff'].includes(authStore.user?.role) && !canUpload"
     :data-tooltip="docUploadBlockedReason"
     data-tooltip-bottom
     class="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-200 cursor-not-allowed select-none">
     <PhUploadSimple class="w-4 h-4" aria-hidden="true" />
     อัปโหลดไฟล์
    </span>
   </div>

   <!-- Loading skeleton -->
   <div v-if="loading" class="px-6 py-6 space-y-3">
    <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-gray-100 animate-pulse" :style="{ opacity: Math.max(0.2, 1 - (i - 1) * 0.3) }"></div>
   </div>

   <!-- Error state -->
   <div v-else-if="fetchError"
    class="flex items-start gap-4 m-6 p-5 rounded-xl bg-red-50 ring-1 ring-inset ring-red-100 text-red-700">
    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
     <PhWarning class="w-5 h-5 text-red-500" />
    </div>
    <div class="flex-1 min-w-0">
     <p class="font-bold text-sm">ไม่สามารถโหลดรายการเอกสารได้</p>
     <p class="text-xs text-red-500 mt-0.5">{{ fetchError }}</p>
     <button @click="fetchDocuments"
      class="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 active:scale-[0.97] transition-all ease-ios">
      ลองใหม่อีกครั้ง
     </button>
    </div>
   </div>

   <!-- Empty state: admin waiting -->
   <div v-else-if="documents.length === 0 && authStore.user?.role === 'admin'"
    class="px-6 py-16 flex flex-col items-center text-center gap-3">
    <div class="bg-gray-100 p-4 rounded-full mb-2">
     <PhClock class="w-10 h-10 text-gray-400" />
    </div>
    <h3 class="text-base font-bold text-gray-900">รอภาควิชาส่งเอกสาร</h3>
    <p class="text-sm text-gray-500 font-medium">ยังไม่มีเอกสารในระบบ</p>
   </div>

   <!-- UP01 — drag-drop zone พร้อม border pulse animation -->
   <div v-else-if="documents.length === 0"
    class="m-4 rounded-xl border-2 border-dashed"
    :class="isDragging ? 'animate-drag-pulse' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors duration-200'">
    <div class="flex flex-col items-center justify-center py-14 px-8 text-center">
     <!-- icon spring เมื่อ drag เข้ามา -->
     <div :class="[
      'w-14 h-14 rounded-full flex items-center justify-center mb-4',
      isDragging
        ? 'bg-primary-100 text-primary-600 scale-110 transition-transform duration-200 ease-out'
        : 'bg-gray-100 text-gray-400 transition-all duration-200'
     ]">
      <PhFolderOpen class="w-7 h-7" />
     </div>
     <h3 class="font-bold text-gray-900 text-lg mb-1">{{ isDragging ? 'วางไฟล์ที่นี่' : 'ยังไม่มีเอกสาร' }}</h3>
     <p class="text-sm text-gray-500">{{ isDragging ? 'วางไฟล์ที่นี่เพื่อส่ง' : 'ลากไฟล์มาวางที่นี่ หรือคลิกปุ่มอัปโหลดด้านบน' }}</p>
    </div>
   </div>

   <!-- Document list -->
   <template v-else>

    <!-- UP01 Drag overlay — scale spring in -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
     <div v-if="isDragging"
      class="fixed inset-0 z-50 bg-primary-600/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div class="bg-white rounded-2xl shadow-xl px-10 py-10 text-center border-2 border-primary-400 border-dashed animate-drag-pulse">
       <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <!-- UP03 icon bounce -->
        <PhUploadSimple class="w-8 h-8 text-primary-600 animate-bounce" />
       </div>
       <p class="text-xl font-bold text-primary-900">วางไฟล์เพื่ออัปโหลด</p>
      </div>
     </div>
    </Transition>

    <!-- 2-level grouped sections: document_type → file_type -->
    <template v-for="group in groupedDocuments" :key="group.type">

     <!-- Level 1: document type header -->
     <div :class="['px-6 py-3 border-b flex items-center gap-3',
      group.type === 'tqf2' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-200']">
      <span :class="['text-xs font-bold px-2.5 py-1 rounded-md ring-1 ring-inset',
       group.type === 'tqf2' ? 'bg-indigo-100 text-indigo-700 ring-indigo-200' : 'bg-gray-100 text-gray-600 ring-gray-300']">
       {{ group.label }}
      </span>
      <span class="text-xs text-gray-400">{{ group.totalCount }} ไฟล์</span>
     </div>

     <!-- Level 2: file type sub-groups -->
     <template v-for="sub in group.subGroups" :key="`${group.type}-${sub.fileType}`">

      <!-- File type sub-header -->
      <div :class="['px-6 py-2 border-b flex items-center gap-2',
       sub.fileType === 'pdf' ? 'bg-red-50/40 border-red-100/70' : 'bg-indigo-50/20 border-indigo-100/50']">
       <span :class="['text-xs font-bold uppercase tracking-wider', sub.fileType === 'pdf' ? 'text-red-600' : 'text-indigo-600']">
        {{ sub.fileType === 'pdf' ? 'PDF' : 'DOCX' }}
       </span>
       <span :class="['text-xs font-medium', sub.fileType === 'pdf' ? 'text-red-500' : 'text-indigo-500']">
        {{ sub.docs.length }} ไฟล์
       </span>
      </div>

      <!-- Document rows -->
      <TransitionGroup tag="div" name="list" class="divide-y divide-gray-50">
       <div v-for="doc in sub.docs" :key="doc.id" class="group">
       <!-- Main row -->
       <div class="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/80 active:bg-gray-100 transition-all ease-ios">
        <!-- File icon -->
        <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
         doc.file_type === 'pdf' ? 'bg-red-50 text-red-500' :
         doc.file_type === 'docx' || doc.file_type === 'doc' ? 'bg-indigo-50 text-indigo-500' :
         'bg-gray-100 text-gray-500']">
         <FileIcon :file-type="doc.file_type" size="md" />
        </div>

        <!-- Name + metadata (two lines) -->
        <div class="flex-1 min-w-0">
         <!-- Line 1: filename + version badge -->
         <div class="flex items-center gap-2 min-w-0 mb-0.5">
          <p class="text-sm font-semibold text-gray-900 truncate">{{ doc.original_name }}</p>
          <span v-if="currentVersionNumber(doc) > 1"
           class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20 whitespace-nowrap">
           เวอร์ชันที่ {{ currentVersionNumber(doc) }}
          </span>
         </div>
         <!-- Line 2: metadata -->
         <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-medium text-gray-500">{{ formatUserName(doc.uploader) || 'ไม่ระบุ' }}</span>
          <span v-if="uploaderLabel(doc.uploader)" class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ uploaderLabel(doc.uploader) }}</span>
          <span class="text-xs text-gray-500">{{ formatDate(doc.createdAt) }}</span>
          <span v-if="annotationCounts[doc.id]"
           class="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wide ml-1">
           <PhHighlighter class="w-2.5 h-2.5" />
           {{ annotationCounts[doc.id] }}
          </span>
         </div>
        </div>

        <!-- Actions — p-2.5 ให้ touch area ≥ 44px โดยไม่เปลี่ยน visual -->
        <div class="flex items-center shrink-0">
         <button v-if="!isLocked"
          :aria-label="`ดูตัวอย่าง ${doc.original_name}`"
          @click="openPreview(doc, `/curricula/documents/${doc.id}/preview`, `เวอร์ชันที่ ${currentVersionNumber(doc)}`)"
          class="p-2.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios">
          <PhPencilSimple class="w-4 h-4" aria-hidden="true" />
         </button>
         <button
          :aria-label="`ดาวน์โหลด ${doc.original_name}`"
          @click="downloadDoc(doc)"
          class="p-2.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios">
          <PhDownloadSimple class="w-4 h-4" aria-hidden="true" />
         </button>
         <button v-if="doc.versions?.length > 0"
          :aria-label="showVersions[doc.id] ? 'ซ่อนประวัติเวอร์ชัน' : 'ดูประวัติเวอร์ชัน'"
          :aria-expanded="!!showVersions[doc.id]"
          @click="showVersions[doc.id] = !showVersions[doc.id]"
          :class="['p-2.5 rounded-lg transition-all', showVersions[doc.id] ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50']">
          <PhClock class="w-4 h-4" aria-hidden="true" />
         </button>
         <button v-if="canDelete && !isLocked"
          :aria-label="`ลบ ${doc.original_name}`"
          @click="handleDelete(doc)"
          class="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.88] transition-all ease-ios opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
          <PhTrash class="w-4 h-4" aria-hidden="true" />
         </button>
        </div>
       </div>

       <!-- Version history accordion -->
       <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[1000px]"
        leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 max-h-[1000px]" leave-to-class="opacity-0 max-h-0">
        <div v-if="showVersions[doc.id] && doc.versions?.length > 0"
         class="mx-6 mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
         <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <p class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
           <PhClock class="w-3.5 h-3.5 text-gray-400" />
           ประวัติทั้งหมด {{ doc.versions.length + 1 }} เวอร์ชัน
          </p>
          <button @click="showVersions[doc.id] = false" aria-label="ซ่อนประวัติเวอร์ชัน" class="text-gray-400 hover:text-gray-600 active:scale-[0.88] transition-all duration-150 ease-ios p-1.5 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
           <PhX class="w-4 h-4" aria-hidden="true" />
          </button>
         </div>
         <!-- Current version -->
         <div class="flex items-center gap-3 px-4 py-3 bg-primary-50/40 border-b border-gray-100">
          <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-primary-600 text-white shrink-0">ล่าสุด</span>
          <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0">เวอร์ชันที่ {{ currentVersionNumber(doc) }}</span>
          <p class="text-sm font-medium text-gray-800 flex-1 truncate">{{ doc.original_name }}</p>
          <div class="hidden sm:flex items-center gap-1 shrink-0 flex-wrap justify-end">
           <span class="text-xs font-medium text-gray-600">{{ formatUserName(doc.uploader) }}</span>
           <span v-if="uploaderLabel(doc.uploader)" class="text-xs font-medium bg-gray-100 text-gray-500 px-1 py-px rounded">{{ uploaderLabel(doc.uploader) }}</span>
           <span class="text-xs text-gray-500">{{ formatDate(doc.updatedAt || doc.createdAt) }}</span>
          </div>
         </div>
         <!-- Older versions -->
         <div v-for="v in doc.versions" :key="v.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-all ease-ios group/v">
          <span class="text-xs font-semibold text-gray-500 bg-white ring-1 ring-inset ring-gray-200 px-2 py-0.5 rounded-lg shrink-0">เวอร์ชันที่ {{ v.version_number }}</span>
          <p class="text-sm text-gray-600 flex-1 truncate font-medium">{{ v.original_name }}</p>
          <div class="hidden sm:flex items-center gap-1 shrink-0 flex-wrap justify-end">
           <span v-if="v.uploader?.name" class="text-xs font-medium text-gray-600">{{ formatUserName(v.uploader) }}</span>
           <span v-if="v.uploader && uploaderLabel(v.uploader)" class="text-xs font-medium bg-gray-100 text-gray-500 px-1 py-px rounded">{{ uploaderLabel(v.uploader) }}</span>
           <span class="text-xs text-gray-500">{{ formatDate(getVersionUploadTime(doc, v)) }}</span>
          </div>
          <div class="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/v:opacity-100 sm:focus-within:opacity-100 transition-opacity">
           <button @click="openPreview({ ...v, file_type: doc.file_type }, `/curricula/documents/${doc.id}/versions/${v.id}/preview`, `เวอร์ชันที่ ${v.version_number}`)"
            :aria-label="`ดูตัวอย่างเวอร์ชันที่ ${v.version_number}`"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <PhPencilSimple class="w-4 h-4" aria-hidden="true" />
           </button>
           <button @click="downloadVersion(doc.id, v.id, v.original_name)"
            :aria-label="`ดาวน์โหลดเวอร์ชันที่ ${v.version_number}`"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <PhDownloadSimple class="w-4 h-4" aria-hidden="true" />
           </button>
          </div>
         </div>
        </div>
       </Transition>
       </div>
      </TransitionGroup>

     </template>
    </template>
   </template>

  </div>
 </div>

 <!-- Preview Modal -->
 <DocumentPreviewModal v-if="previewState" :doc="previewState.doc" :api-path="previewState.apiPath"
  :version-label="previewState.versionLabel" document-type="document"
  :can-reject="isAdminReview" :can-approve="isAdminReview"
  @close="previewState = null; fetchAnnotationCounts(documents)" @download="handlePreviewDownload"
  @reject="emit('reject')" @approve="emit('approve')" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { documentService } from '@/services/documentService';
import api from '@/services/api';
import { formatThaiDateTime } from '@/utils/date';
import { formatUserName } from '@/utils/user';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import {
 PhUploadSimple, PhDownloadSimple, PhFolderOpen, PhTrash,
 PhClock, PhPencilSimple, PhWarning, PhCheckCircle, PhX,
 PhUsersThree, PhInfo, PhHighlighter
} from '@phosphor-icons/vue';
import FileIcon from '@/components/common/FileIcon.vue';
import DocumentPreviewModal from './DocumentPreviewModal.vue';

const props = defineProps({
 curriculumId: { type: [Number, String], required: true },
 curriculum: { type: Object, default: null },
});
const emit = defineEmits(['reject', 'approve', 'uploaded']);
const authStore = useAuthStore();
const toast = useToast();
const { open: confirm } = useConfirm();

const documents = ref([]);
const loading = ref(false);
const fetchError = ref('');
const showVersions = ref({});
const annotationCounts = ref({});
const isDragging = ref(false);
const previewState = ref(null);

const FACULTY_UPLOADABLE = ['pending_department', 'revision'];
const ADMIN_UPLOADABLE   = ['department_submitted', 'under_committee', 'pending_admin_recheck'];
const canUpload = computed(() => {
 const role = authStore.user?.role;
 const status = props.curriculum?.status;
 // staff อัปโหลดได้เหมือนอาจารย์ (ช่วงภาควิชาเตรียม/แก้ไขเอกสาร)
 if (role === 'faculty' || role === 'staff') return FACULTY_UPLOADABLE.includes(status);
 if (role === 'admin') return ADMIN_UPLOADABLE.includes(status) && documents.value.length > 0;
 return false;
});
const canDelete = computed(() => ['admin', 'faculty', 'staff'].includes(authStore.user?.role));

const docUploadBlockedReason = computed(() => {
  const status = props.curriculum?.status;
  if (status === 'department_submitted')  return 'รอเจ้าหน้าที่ตรวจสอบ ยังอัปโหลดไม่ได้ในขณะนี้';
  if (status === 'pending_admin_recheck') return 'รอเจ้าหน้าที่ตรวจสอบเอกสารที่แก้ไข';
  if (status === 'under_committee')       return 'อยู่ระหว่างการพิจารณา ไม่สามารถแก้ไขเอกสารได้';
  if (status === 'approved')             return 'หลักสูตรได้รับการอนุมัติแล้ว';
  return 'ไม่สามารถอัปโหลดได้ในขณะนี้';
});
const isAdminReview = computed(() =>
 authStore.user?.role === 'admin' && props.curriculum?.status === 'department_submitted'
);

const FACULTY_LOCKED = ['department_submitted', 'pending_admin_recheck', 'under_committee', 'approved'];
const ADMIN_LOCKED   = ['under_committee', 'approved'];
const isLocked = computed(() => {
 const role   = authStore.user?.role;
 const status = props.curriculum?.status;
 if (role === 'faculty' || role === 'staff') return FACULTY_LOCKED.includes(status);
 if (role === 'admin')   return ADMIN_LOCKED.includes(status);
 return false;
});
const currentVersionNumber = (doc) => (doc.versions?.length ?? 0) + 1;

// versions is sorted DESC by version_number, so versions[last] = v1
// v1 was uploaded when doc was first created → doc.createdAt
// vN (N>1) was uploaded when v(N-1) was archived → versions[i+1].createdAt
const getVersionUploadTime = (doc, v) => {
  if (v.version_number === 1) return doc.createdAt;
  const idx = (doc.versions ?? []).findIndex(x => x.id === v.id);
  return doc.versions[idx + 1]?.createdAt ?? doc.createdAt;
};

const ROLE_LABELS = {
 admin:     'เจ้าหน้าที่หลักสูตรคณะ',
 faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
 staff:     'เจ้าหน้าที่สาขาวิชา',
 registrar: 'เจ้าหน้าที่กองบริการการศึกษา',
 executive: 'ผู้บริหารคณะ',
};
const uploaderLabel = (u) => ROLE_LABELS[u?.role] || '';

const groupedDocuments = computed(() => {
 const makeSubGroups = (docs) => {
  const pdf = docs.filter(d => d.file_type === 'pdf');
  const docx = docs.filter(d => d.file_type !== 'pdf');
  const sub = [];
  if (pdf.length) sub.push({ fileType: 'pdf', docs: pdf });
  if (docx.length) sub.push({ fileType: 'docx', docs: docx });
  return sub;
 };
 const tqf2Docs = documents.value.filter(d => d.document_type === 'tqf2');
 const refDocs = documents.value.filter(d => d.document_type !== 'tqf2');
 const groups = [];
 if (tqf2Docs.length) groups.push({ type: 'tqf2', label: 'ร่างหลักสูตร (มคอ.2)', totalCount: tqf2Docs.length, subGroups: makeSubGroups(tqf2Docs) });
 if (refDocs.length) groups.push({ type: 'reference', label: 'เอกสารอ้างอิง', totalCount: refDocs.length, subGroups: makeSubGroups(refDocs) });
 return groups;
});

const formatDate = formatThaiDateTime;

const fetchAnnotationCounts = async (docs) => {
 const ids = docs.map(d => d.id).join(',');
 if (!ids) return;
 try {
  const { data } = await documentService.getAnnotationCounts('document', ids);
  annotationCounts.value = data.data ?? {};
 } catch { /* non-critical */ }
};

const fetchDocuments = async () => {
 loading.value = true;
 fetchError.value = '';
 try {
  const { data } = await documentService.getDocuments(props.curriculumId);
  documents.value = data.data;
  fetchAnnotationCounts(data.data);
 } catch (e) {
  fetchError.value = e.response?.data?.message || 'ไม่สามารถโหลดรายการเอกสารได้';
 } finally { loading.value = false; }
};

const uploadFile = async (file, docType = 'reference') => {
 if (!file) return;
 if (!canUpload.value) return;
 const form = new FormData();
 form.append('file', file);
 form.append('document_type', docType);
 try {
  await documentService.upload(props.curriculumId, form);
  toast.success('อัปโหลดสำเร็จ', file.name);
  await fetchDocuments();
  emit('uploaded');
 } catch (err) {
  toast.error('อัปโหลดไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
 }
};

const handleUpload = (e, docType) => { uploadFile(e.target.files[0], docType); e.target.value = ''; };
const handleDrop = (e) => {
 isDragging.value = false;
 if (!canUpload.value) return;
 const file = e.dataTransfer?.files?.[0];
 if (!file) return;
 uploadFile(file, 'reference');
};

const handleDelete = async (doc) => {
 const ok = await confirm({
  title: 'ลบเอกสาร',
  message: `${doc.original_name} จะถูกลบออกจากระบบถาวร รวมถึงประวัติเวอร์ชันทั้งหมด`,
  confirmLabel: 'ลบเอกสาร',
  type: 'danger',
 });
 if (!ok) return;
 try {
  await documentService.remove(doc.id);
  toast.success('ลบเอกสารสำเร็จ');
  await fetchDocuments();
 } catch {
  toast.error('ลบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
 }
};

const downloadFile = async (url, filename) => {
 try {
  const response = await api.get(url, { responseType: 'blob' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(new Blob([response.data]));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
 } catch { uploadError.value = 'ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'; }
};

const downloadDoc = (doc) => downloadFile(`/curricula/documents/${doc.id}/download`, doc.original_name);
const downloadVersion = (docId, versionId, filename) => downloadFile(`/curricula/documents/${docId}/versions/${versionId}/download`, filename);

const openPreview = (doc, apiPath, versionLabel = '') => { previewState.value = { doc, apiPath, versionLabel }; };
const handlePreviewDownload = () => {
 if (!previewState.value) return;
 const { doc, apiPath } = previewState.value;
 downloadFile(apiPath.replace('/preview', '/download'), doc.original_name);
};

onMounted(() => { fetchDocuments(); });
</script>

