<template>
  <div class="max-w-5xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button @click="router.back()"
        class="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="min-w-0">
        <div v-if="!pageLoading" class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-xs font-bold uppercase tracking-widest"
            :class="{
              'text-gray-500': COMMITTEE_LEVEL_LABELS[step?.committee_type] === 'ระดับคณะ',
              'text-primary-600': COMMITTEE_LEVEL_LABELS[step?.committee_type] === 'ระดับมหาวิทยาลัย',
              'text-purple-600': COMMITTEE_LEVEL_LABELS[step?.committee_type] === 'ระดับอุดมศึกษา',
            }">
            บันทึกมติที่ประชุม
          </span>
          <span class="text-gray-300">·</span>
          <span class="text-xs font-medium text-gray-400">{{ COMMITTEE_LEVEL_LABELS[step?.committee_type] }}</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 tracking-tight leading-snug truncate">
          {{ pageLoading ? 'กำลังโหลด…' : (COMMITTEE_LABELS[step?.committee_type] || 'บันทึกมติที่ประชุม') }}
        </h2>
        <p v-if="!pageLoading && curriculum" class="text-sm text-gray-500 mt-0.5 truncate">
          สาขาวิชา{{ curriculum.field_of_study || curriculum.degree_name }}
        </p>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="pageLoading" class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      <div class="bg-white rounded-xl border border-gray-200 h-96 animate-pulse"></div>
      <div class="bg-white rounded-xl border border-gray-200 h-96 animate-pulse"></div>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

      <!-- LEFT: form -->
      <div class="space-y-6">

        <!-- มติที่ประชุม -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
            <h3 class="text-base font-semibold text-gray-900">มติที่ประชุม <span class="text-red-500">*</span></h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-3">
              <button type="button" @click="form.status = 'approved'"
                :class="['flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200 ease-ios text-left active:scale-[0.98]',
                  form.status === 'approved' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50']">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                  form.status === 'approved' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400']">
                  <PhCheckCircle class="w-5 h-5" />
                </div>
                <div>
                  <p :class="['text-sm font-bold', form.status === 'approved' ? 'text-emerald-800' : 'text-gray-700']">เห็นชอบ</p>
                  <p class="text-xs text-gray-400 mt-0.5">ผ่านการพิจารณา</p>
                </div>
                <div v-if="form.status === 'approved'" class="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <PhCheck class="w-3 h-3 text-white" />
                </div>
              </button>

              <button type="button" @click="form.status = 'revision'"
                :class="['flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200 ease-ios text-left active:scale-[0.98]',
                  form.status === 'revision' ? 'border-orange-400 bg-orange-50/60' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50']">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                  form.status === 'revision' ? 'bg-orange-400 text-white shadow-sm' : 'bg-gray-100 text-gray-400']">
                  <PhArrowCounterClockwise class="w-5 h-5" />
                </div>
                <div>
                  <p :class="['text-sm font-bold', form.status === 'revision' ? 'text-orange-800' : 'text-gray-700']">มีมติแก้ไข</p>
                  <p class="text-xs text-gray-400 mt-0.5">ส่งกลับแก้ไข</p>
                </div>
                <div v-if="form.status === 'revision'" class="ml-auto w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center shrink-0">
                  <PhCheck class="w-3 h-3 text-white" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- รายละเอียดการประชุม -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
            <h3 class="text-base font-semibold text-gray-900">รายละเอียดการประชุม</h3>
          </div>
          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">วันที่มีมติ</label>
                <FormDatePicker v-model="form.decision_date" placeholder="เลือกวันที่" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">ครั้งที่ประชุม</label>
                <input v-model="form.meeting_number" type="text" placeholder="เช่น 3/2567"
                  class="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
            </div>

            <!-- Revision deadline (conditional) -->
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
              <div v-if="form.status === 'revision'" class="rounded-xl bg-orange-50/60 ring-1 ring-inset ring-orange-200 p-4 space-y-2">
                <label class="block text-sm font-semibold text-orange-800">
                  กำหนดส่งแก้ไข <span class="font-normal text-orange-400">(ไม่บังคับ)</span>
                </label>
                <p v-if="curriculum?.revision_deadline" class="text-xs text-orange-600">
                  ครั้งก่อนกำหนดไว้: <span class="font-bold">{{ formatThaiDate(curriculum.revision_deadline) }}</span>
                </p>
                <FormDatePicker v-model="form.revision_deadline" placeholder="เลือกวันที่กำหนดส่ง" />
              </div>
            </Transition>
          </div>
        </div>

        <!-- ไฟล์รายงาน -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
            <h3 class="text-base font-semibold text-gray-900">
              ไฟล์รายงานการประชุม
              <span class="text-sm font-normal text-gray-400 ml-1">(ไม่บังคับ)</span>
            </h3>
          </div>
          <div class="p-6">
            <div v-if="!decisionFile"
              class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-primary-400 hover:bg-primary-50/40 group"
              @click="$refs.fileInput.click()">
              <div class="w-12 h-12 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <PhPaperclip class="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <p class="text-sm font-semibold text-gray-600 group-hover:text-primary-700 transition-colors">คลิกเพื่อเลือกไฟล์</p>
              <p class="text-xs text-gray-400 mt-1">PDF หรือ DOCX</p>
            </div>
            <div v-else class="flex items-center gap-3.5 px-4 py-3.5 bg-primary-50 border border-primary-200 rounded-xl">
              <FileIcon :file-type="decisionFile.name.split('.').pop()" size="md" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-semibold text-primary-800 block break-all">{{ decisionFile.name }}</span>
              </div>
              <button type="button" @click="decisionFile = null; $refs.fileInput.value = ''"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-primary-500 hover:text-red-600 hover:bg-red-50 active:scale-[0.88] transition-all ease-ios shrink-0">
                <PhX class="w-4 h-4" />
              </button>
            </div>
            <input ref="fileInput" type="file" accept=".pdf,.docx" @change="decisionFile = $event.target.files[0]" class="hidden" />
          </div>
        </div>

      </div>

      <!-- RIGHT: workspace documents -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style="max-height: 680px">
        <div class="shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-gray-800">เอกสารนำเสนอต่อคณะกรรมการ</p>
            <p class="text-xs text-gray-500 mt-0.5">เลือกไฟล์จาก workspace ที่ใช้ในการประชุม</p>
          </div>
          <span v-if="workspaceDocs.length > 0" class="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
            :class="selectedDocIds.size > 0 ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-gray-100 text-gray-500 border border-gray-200'">
            {{ selectedDocIds.size }} / {{ workspaceDocs.length }}
          </span>
        </div>

        <!-- Loading docs -->
        <div v-if="docsLoading" class="flex-1 flex flex-col items-center justify-center gap-3 p-5">
          <div class="w-6 h-6 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p class="text-sm text-gray-500 font-medium">กำลังโหลดเอกสาร…</p>
        </div>

        <!-- Empty docs -->
        <div v-else-if="workspaceDocs.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <PhFile class="w-7 h-7 text-gray-300" />
          </div>
          <p class="text-sm font-semibold text-gray-600">ยังไม่มีเอกสารใน workspace</p>
          <p class="text-xs text-gray-400">อัปโหลดเอกสารก่อนบันทึกมติ</p>
        </div>

        <!-- Doc list -->
        <div v-else class="flex flex-col overflow-hidden flex-1">
          <div class="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox"
                :checked="selectedDocIds.size === workspaceDocs.length && workspaceDocs.length > 0"
                @change="selectedDocIds.size === workspaceDocs.length ? clearAllDocs() : selectAllDocs()"
                class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-gray-300" />
              <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">เลือกทั้งหมด</span>
            </label>
            <button v-if="selectedDocIds.size > 0" type="button" @click="clearAllDocs"
              class="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors ease-ios">
              ล้างทั้งหมด
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <label v-for="doc in workspaceDocs" :key="doc.id"
              class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer select-none transition-all duration-150 border"
              :class="selectedDocIds.has(doc.id) ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'">
              <input type="checkbox" :checked="selectedDocIds.has(doc.id)" @change="toggleDoc(doc.id)"
                class="rounded text-primary-600 focus:ring-primary-500 shrink-0 w-4 h-4 border-gray-300" />
              <FileIcon :file-type="doc.file_type" size="sm" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 leading-snug break-all">{{ doc.original_name }}</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{{ doc.file_type?.toUpperCase() }}</p>
              </div>
              <PhCheck v-if="selectedDocIds.has(doc.id)" class="w-4 h-4 text-primary-600 shrink-0" />
            </label>
          </div>
        </div>
      </div>

    </div>

    <!-- Action buttons -->
    <div v-if="!pageLoading" class="flex items-center justify-end gap-3 pb-8">
      <button type="button" @click="router.back()"
        class="px-5 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios">
        ยกเลิก
      </button>
      <button @click="handleSubmit" :disabled="submitting"
        :class="['inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-all ease-ios active:scale-[0.97] disabled:opacity-60',
          form.status === 'revision' ? 'bg-orange-500 hover:bg-orange-400' : 'bg-emerald-600 hover:bg-emerald-500']">
        <span v-if="submitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0"></span>
        <PhCheckCircle v-else-if="form.status === 'approved'" class="w-4 h-4" />
        <PhArrowCounterClockwise v-else class="w-4 h-4" />
        {{ submitting ? 'กำลังบันทึก…' : form.status === 'approved' ? 'บันทึกมติเห็นชอบ' : 'บันทึกมติแก้ไข' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';
import FileIcon from '@/components/common/FileIcon.vue';
import FormDatePicker from '@/components/common/FormDatePicker.vue';
import { formatThaiDate } from '@/utils/date';
import { useToast } from '@/composables/useToast';
import {
  PhCaretLeft, PhCheck, PhCheckCircle, PhArrowCounterClockwise,
  PhX, PhPaperclip, PhFile,
} from '@phosphor-icons/vue';

const router = useRouter();
const route  = useRoute();
const toast  = useToast();

const COMMITTEE_LABELS = {
  faculty_academic:          'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์',
  faculty_board:             'คณะกรรมการประจำคณะวิทยาศาสตร์',
  general_education:         'คณะกรรมการตรวจวิชาศึกษาทั่วไป',
  university_academic:       'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร',
  graduate_school:           'คณะกรรมการประจำบัณฑิตวิทยาลัย',
  university_council_academic:'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร',
  university_council:        'คณะกรรมการสภามหาวิทยาลัย',
  cisa:                      'CISA',
};

const COMMITTEE_LEVEL_LABELS = {
  faculty_academic: 'ระดับคณะ', faculty_board: 'ระดับคณะ', general_education: 'ระดับคณะ',
  university_academic: 'ระดับมหาวิทยาลัย', graduate_school: 'ระดับมหาวิทยาลัย',
  university_council_academic: 'ระดับมหาวิทยาลัย', university_council: 'ระดับมหาวิทยาลัย',
  cisa: 'ระดับอุดมศึกษา',
};

const curriculum     = ref(null);
const step           = ref(null);
const workspaceDocs  = ref([]);
const selectedDocIds = ref(new Set());
const decisionFile   = ref(null);
const fileInput      = ref(null);

const form = ref({ status: 'approved', decision_date: '', meeting_number: '', notes: '', revision_deadline: '' });

const pageLoading = ref(false);
const docsLoading = ref(false);
const submitting  = ref(false);

onMounted(async () => {
  const { id, stepId } = route.params;
  pageLoading.value = true;
  docsLoading.value = true;
  try {
    const [curRes, stepsRes, docsRes] = await Promise.all([
      api.get(`/curricula/${id}`),
      api.get(`/curricula/${id}/committee-steps`),
      api.get(`/curricula/${id}/documents`),
    ]);
    curriculum.value    = curRes.data.data;
    const steps         = stepsRes.data.data || [];
    step.value          = steps.find(s => String(s.id) === String(stepId)) || null;
    workspaceDocs.value = docsRes.data.data || [];
    selectedDocIds.value = new Set(workspaceDocs.value.map(d => d.id));
  } finally {
    pageLoading.value = false;
    docsLoading.value = false;
  }
});

const toggleDoc    = (id) => { const s = new Set(selectedDocIds.value); s.has(id) ? s.delete(id) : s.add(id); selectedDocIds.value = s; };
const selectAllDocs = () => { selectedDocIds.value = new Set(workspaceDocs.value.map(d => d.id)); };
const clearAllDocs  = () => { selectedDocIds.value = new Set(); };

const handleSubmit = async () => {
  if (!step.value) return;
  submitting.value = true;
  try {
    const fd = new FormData();
    Object.entries(form.value).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (decisionFile.value) fd.append('file', decisionFile.value);
    fd.append('linked_document_ids', JSON.stringify([...selectedDocIds.value]));
    await api.post(`/curricula/committee-steps/${step.value.id}/decision`, fd);
    const label = form.value.status === 'approved' ? 'บันทึกมติเห็นชอบสำเร็จ' : 'บันทึกมติแก้ไขสำเร็จ';
    toast.success(label, COMMITTEE_LABELS[step.value.committee_type]);
    router.push(`/curricula/${route.params.id}`);
  } catch (e) {
    toast.error('บันทึกไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    submitting.value = false;
  }
};
</script>
