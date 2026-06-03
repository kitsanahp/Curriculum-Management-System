<template>
 <div class="space-y-4">
 <div v-if="loading" class="space-y-4">
 <div v-for="i in 3" :key="i" class="h-20 rounded-xl bg-gray-100 animate-pulse"></div>
 </div>
 <div v-else-if="fetchError" class="p-5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-4">
 <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
 <PhWarning class="w-5 h-5 text-red-500" />
 </div>
 <div>
 <p class="font-bold text-base text-red-700">ไม่สามารถโหลดข้อมูลคณะกรรมการได้</p>
 <p class="text-xs text-red-500 mt-1">{{ fetchError }}</p>
 <button @click="fetchSteps" class="mt-3 text-xs font-bold px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 active:scale-[0.97] transition-all duration-150 ease-ios">ลองใหม่อีกครั้ง</button>
 </div>
 </div>
 <div v-else class="space-y-3">


 <div v-for="(step, idx) in steps" :key="step.id" class="flex gap-4">
 <div class="flex flex-col items-center">
 <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 z-10 transition-all shadow-sm"
 :class="{
 'bg-emerald-500 text-white': step.status === 'approved',
 'bg-orange-400 text-white': step.status === 'revision',
 'bg-primary-600 text-white ring-4 ring-primary-50': step.id === props.curriculum?.current_committee_step_id && step.status === 'pending',
 'bg-gray-100 text-gray-400': step.status === 'pending' && step.id !== props.curriculum?.current_committee_step_id
 }">
 <PhCheck v-if="step.status === 'approved'" class="w-5 h-5" />
 <PhArrowCounterClockwise v-else-if="step.status === 'revision'" class="w-4 h-4" />
 <span v-else>{{ step.step_order }}</span>
 </div>
 <div v-if="idx < steps.length - 1" class="w-1 flex-1 mt-2 min-h-[2rem]" :class="step.status === 'approved' ? 'bg-emerald-100' : 'bg-gray-100'"></div>
 </div>

 <div class="flex-1 mb-4 rounded-xl border p-5 transition-all shadow-sm"
 :class="{
 'border-emerald-200 bg-emerald-50/40': step.status === 'approved',
 'border-orange-200 bg-orange-50/40': step.status === 'revision',
 'border-primary-200 bg-primary-50/50': step.id === props.curriculum?.current_committee_step_id && step.status === 'pending',
 'border-gray-200 bg-white': step.status === 'pending' && step.id !== props.curriculum?.current_committee_step_id
 }">
 <div class="flex items-start justify-between gap-4">
 <div class="flex-1 min-w-0">
 <div class="flex items-center gap-3 flex-wrap">
 <p class="font-bold text-gray-900 text-base leading-tight">{{ COMMITTEE_LABELS[step.committee_type] }}</p>
 <span class="text-[10px] px-2.5 py-1 rounded border font-bold uppercase tracking-wider"
 :class="{
 'bg-gray-100 text-gray-600 border-gray-200': COMMITTEE_LEVEL_LABELS[step.committee_type] === 'ระดับคณะ',
 'bg-primary-100 text-primary-700 border-primary-200': COMMITTEE_LEVEL_LABELS[step.committee_type] === 'ระดับมหาวิทยาลัย',
 'bg-purple-100 text-purple-700 border-purple-200': COMMITTEE_LEVEL_LABELS[step.committee_type] === 'ระดับอุดมศึกษา'
 }">
 {{ COMMITTEE_LEVEL_LABELS[step.committee_type] }}
 </span>
 </div>
 <p v-if="step.decision_date" class="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1.5">
 <PhClock class="w-3.5 h-3.5" />
 มติวันที่ {{ formatDate(step.decision_date) }}
 <span v-if="step.meeting_number" class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-0.5">ครั้งที่ {{ step.meeting_number }}</span>
 </p>
 <div v-if="step.notes" class="mt-2.5 bg-white/60 rounded-lg p-3 border border-gray-200">
 <p class="text-xs text-gray-600 leading-relaxed font-document">"{{ step.notes }}"</p>
 </div>
 </div>
 <div class="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
 <span class="text-xs font-bold px-3 py-1.5 rounded-lg border"
 :class="{
 'bg-emerald-50 text-emerald-700 border-emerald-200': step.status === 'approved',
 'bg-orange-50 text-orange-700 border-orange-200': step.status === 'revision',
 'bg-primary-50 text-primary-700 border-primary-200': step.id === props.curriculum?.current_committee_step_id && step.status === 'pending',
 'bg-gray-50 text-gray-500 border-gray-200': step.status === 'pending' && step.id !== props.curriculum?.current_committee_step_id
 }">{{ getStatusLabel(step) }}</span>
 <button v-if="authStore.isAdmin && step.status === 'pending' && step.id === props.curriculum?.current_committee_step_id"
 @click="router.push(`/curricula/${props.curriculum.id}/decision/${step.id}`)"
 class="text-sm font-semibold px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 shadow-sm transition-all ease-ios active:scale-[0.97]">
 บันทึกมติ
 </button>
 </div>
 </div>

 <div v-if="step.documents?.length > 0" class="mt-4 pt-4 border-t border-gray-200 space-y-3">
 <!-- Current round (latest) -->
 <div>
  <div class="flex items-center gap-2 mb-2">
  <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ผลมติล่าสุด</p>
  <span v-if="getDocRounds(step).length > 1" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">รอบที่ {{ getDocRounds(step).at(-1) }}</span>
  </div>
  <div class="flex flex-col gap-1.5">
  <a v-for="doc in getCurrentRoundDocs(step)" :key="doc.id" href="#" @click.prevent="downloadDoc(doc)"
  class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white shadow-sm border border-gray-200 transition-all ease-ios text-xs hover:border-primary-300 hover:bg-primary-50/50 active:bg-primary-50">
  <FileIcon :file-type="doc.original_name.split('.').pop()" size="sm" class="shrink-0" />
  <span class="flex-1 min-w-0 break-all text-gray-700 group-hover:text-gray-900 font-semibold leading-snug">{{ doc.original_name }}</span>
  <span class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
  :class="doc.source_type === 'workspace' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'">
  {{ doc.source_type === 'workspace' ? 'เอกสาร' : 'แนบ' }}
  </span>
  </a>
  </div>
 </div>

 <!-- Previous rounds (history) -->
 <div v-if="getDocRounds(step).length > 1">
  <button type="button" @click="toggleHistory(step.id)"
  class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-all duration-150 ease-ios uppercase tracking-wider">
  <PhCaretRight class="w-3.5 h-3.5 transition-transform" :class="expandedHistory.has(step.id) ? 'rotate-90' : ''" />
  ประวัติการพิจารณา ({{ getDocRounds(step).length - 1 }} รอบก่อนหน้า)
  </button>
  <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
  <div v-if="expandedHistory.has(step.id)" class="mt-2 space-y-2.5">
   <div v-for="round in getPreviousRounds(step)" :key="round" class="rounded-lg bg-gray-50 border border-gray-200 p-3">
   <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">รอบที่ {{ round }}</p>
   <div class="flex flex-col gap-1">
    <a v-for="doc in getDocsByRound(step, round)" :key="doc.id" href="#" @click.prevent="downloadDoc(doc)"
    class="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-[11px] hover:border-gray-300 transition-all">
    <FileIcon :file-type="doc.original_name.split('.').pop()" size="sm" class="shrink-0" />
    <span class="flex-1 min-w-0 break-all text-gray-500 group-hover:text-gray-700 leading-snug">{{ doc.original_name }}</span>
    </a>
   </div>
   </div>
  </div>
  </Transition>
 </div>
 </div>
 </div>
 </div>
 </div>

 </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import FileIcon from '@/components/common/FileIcon.vue';
import { formatThaiDate } from '@/utils/date';
import { useToast } from '@/composables/useToast';
import { PhCheck, PhArrowCounterClockwise, PhWarning, PhClock, PhCaretRight } from '@phosphor-icons/vue';

const props = defineProps({ curriculum: { type: Object, required: true } });
const emit = defineEmits(['curriculum-updated']);
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const steps = ref([]);
const loading = ref(false);
const fetchError = ref('');

// Document versioning helpers
const expandedHistory = ref(new Set());
const toggleHistory = (stepId) => {
  const s = new Set(expandedHistory.value);
  if (s.has(stepId)) s.delete(stepId); else s.add(stepId);
  expandedHistory.value = s;
};
const getDocRounds = (step) => {
  const rounds = [...new Set((step.documents || []).map(d => d.round ?? 1))].sort((a, b) => a - b);
  return rounds;
};
const getCurrentRoundDocs = (step) => {
  const rounds = getDocRounds(step);
  const maxRound = rounds.at(-1) ?? 1;
  return (step.documents || []).filter(d => (d.round ?? 1) === maxRound);
};
const getPreviousRounds = (step) => {
  const rounds = getDocRounds(step);
  return rounds.slice(0, -1).reverse();
};
const getDocsByRound = (step, round) => {
  return (step.documents || []).filter(d => (d.round ?? 1) === round);
};

const COMMITTEE_LABELS = {
 faculty_academic: 'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์',
 faculty_board: 'คณะกรรมการประจำคณะวิทยาศาสตร์',
 general_education: 'คณะกรรมการตรวจวิชาศึกษาทั่วไป',
 university_academic: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร',
 graduate_school: 'คณะกรรมการประจำบัณฑิตวิทยาลัย',
 university_council_academic: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร',
 university_council: 'คณะกรรมการสภามหาวิทยาลัย',
 cisa: 'CISA'
};
const COMMITTEE_LEVEL_LABELS = {
 faculty_academic: 'ระดับคณะ', faculty_board: 'ระดับคณะ', general_education: 'ระดับคณะ',
 university_academic: 'ระดับมหาวิทยาลัย', graduate_school: 'ระดับมหาวิทยาลัย',
 university_council_academic: 'ระดับมหาวิทยาลัย', university_council: 'ระดับมหาวิทยาลัย',
 cisa: 'ระดับอุดมศึกษา'
};
const getStatusLabel = (step) => {
 if (step.status === 'approved') return 'เห็นชอบ';
 if (step.status === 'revision') return 'มีมติแก้ไข';
 if (step.id === props.curriculum?.current_committee_step_id) return 'กำลังพิจารณา';
 return 'รอดำเนินการ';
};

const downloadDoc = (doc) => {
 if (doc.source_type === 'workspace' && doc.document_id) { window.open(`/api/curricula/documents/${doc.document_id}/download`, '_blank'); }
 else { window.open(`/uploads/committee/${doc.stored_name}`, '_blank'); }
};

const formatDate = formatThaiDate;
const fetchSteps = async () => {
 loading.value = true;
 fetchError.value = '';
 try {
 const { data } = await api.get(`/curricula/${props.curriculum.id}/committee-steps`);
 steps.value = data.data;
 } catch (e) { fetchError.value = e.response?.data?.message || e.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'; }
 finally { loading.value = false; }
};
onMounted(fetchSteps);
</script>
