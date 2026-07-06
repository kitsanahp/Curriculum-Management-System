<template>
 <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button type="button" @click="router.back()" aria-label="ย้อนกลับ"
        class="cursor-pointer shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="min-w-0">
        <h2 class="text-2xl font-semibold text-gray-900">สร้างหลักสูตรใหม่</h2>
        <p class="text-sm text-gray-500 mt-0.5 font-medium">กรอกข้อมูลหลักสูตรและทีมผู้รับผิดชอบหลักสูตร</p>
      </div>
    </div>

 <form @submit.prevent="handleSubmit" class="space-y-8">
 <!-- Basic Info Card -->
 <div class="bg-white rounded-2xl shadow-sm border border-gray-200">
 <div class="px-6 pt-5 pb-4 border-b border-gray-100">
 <h3 class="text-base font-bold text-gray-900">ข้อมูลหลักสูตร</h3>
 </div>
 <div class="p-6 space-y-6">

   <!-- ข้อมูลพื้นฐาน -->
   <div>
     <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
       <div>
         <label for="degree_level" class="text-sm font-semibold text-gray-700">ระดับปริญญา <span class="text-red-500" aria-label="จำเป็น">*</span></label>
         <div class="mt-2">
           <FormSelect
             id="degree_level"
             v-model="form.degree_level"
             :options="[
               { label: 'ปริญญาตรี', value: 'bachelor' },
               { label: 'ปริญญาโท', value: 'master' },
               { label: 'ปริญญาเอก', value: 'doctoral' }
             ]"
             placeholder="กรุณาเลือก"
             @change="onDegreeLevelChange"
           />
         </div>
       </div>
       <div>
         <label for="department_id" class="text-sm font-semibold text-gray-700">ภาควิชา/งานบริการการศึกษา <span class="text-red-500" aria-label="จำเป็น">*</span></label>
         <div class="mt-2">
           <FormSelect
             id="department_id"
             v-model="form.department_id"
             :options="departments.map(d => ({ label: d.name, value: d.id }))"
             placeholder="กรุณาเลือก"
             @change="onDepartmentChange"
           />
         </div>
       </div>
       <div>
         <label for="field_of_study" class="text-sm font-semibold text-gray-700">สาขาวิชา/งานบริการการศึกษา</label>
         <div class="mt-2">
           <FormSelect
             v-if="availableMajors.length > 0"
             id="field_of_study"
             v-model="form.field_of_study"
             :options="availableMajors.map(m => ({ label: m, value: m }))"
             placeholder="เลือกสาขาวิชา"
           />
           <input
             v-else
             id="field_of_study"
             v-model="form.field_of_study"
             type="text"
             :readonly="isServiceUnit"
             :placeholder="form.department_id ? 'ระบุสาขาวิชา' : 'กรุณาเลือกภาควิชาก่อน'"
             :disabled="!form.department_id"
             class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default transition-all"
           />
         </div>
       </div>
       <div>
         <label for="curriculum_type" class="text-sm font-semibold text-gray-700">ประเภทหลักสูตร <span class="text-red-500" aria-label="จำเป็น">*</span></label>
         <div class="mt-2">
           <FormSelect
             id="curriculum_type"
             v-model="form.curriculum_type"
             :options="[
               { label: 'หลักสูตรใหม่', value: 'new' },
               { label: 'หลักสูตรปรับปรุง', value: 'revised' }
             ]"
             placeholder="กรุณาเลือก"
           />
         </div>
       </div>
       <div>
          <label for="curriculum_year" class="text-sm font-semibold text-gray-700">ปีหลักสูตร (พ.ศ.) <span class="text-red-500" aria-label="จำเป็น">*</span></label>
          <div class="mt-2">
            <FormCombobox
              id="curriculum_year"
              v-model="form.curriculum_year"
              :options="yearOptions"
              placeholder="เช่น 2567"
            />
          </div>
       </div>
       <div>
         <label for="deadline" class="text-sm font-semibold text-gray-700">กำหนดส่ง</label>
         <div class="mt-2">
           <FormDatePicker id="deadline" v-model="form.deadline" placeholder="เลือกวันที่กำหนดส่ง" />
         </div>
       </div>
     </div>
   </div>

   <!-- ชื่อปริญญา (กรอกอัตโนมัติเมื่อเลือกระดับ) -->
   <div>
     <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
       <div>
         <label for="degree_name" class="text-sm font-semibold text-gray-700">ชื่อปริญญา (ภาษาไทย)</label>
         <div class="mt-2">
           <!-- เลือกจากชื่อวุฒิในระบบ (จัดการได้ที่เมนู ภาควิชาและชื่อวุฒิ) หรือพิมพ์เองได้ -->
           <FormCombobox id="degree_name" v-model="form.degree_name" :options="degreeNameOptions" placeholder="เลือกหรือพิมพ์ชื่อวุฒิ เช่น วิทยาศาสตรบัณฑิต" />
         </div>
       </div>
       <div>
         <label for="degree_name_abbr" class="text-sm font-semibold text-gray-700">ชื่อย่อปริญญา</label>
         <div class="mt-2">
           <input id="degree_name_abbr" v-model="form.degree_name_abbr" type="text" placeholder="เช่น วท.บ." class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
         </div>
       </div>
     </div>
   </div>

 </div>
 </div>

 <!-- Duplicate warning -->
 <Transition
  enter-active-class="transition-all duration-200 ease-out"
  enter-from-class="opacity-0 -translate-y-1"
  enter-to-class="opacity-100 translate-y-0"
  leave-active-class="transition-all duration-150 ease-in"
  leave-from-class="opacity-100 translate-y-0"
  leave-to-class="opacity-0 -translate-y-1"
 >
  <div v-if="duplicateWarning.length" class="flex items-start gap-3.5 rounded-2xl ring-1 ring-amber-200 bg-amber-50/70 px-4 py-3.5">
   <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
    <PhWarning class="w-5 h-5 text-amber-600" weight="fill" aria-hidden="true" />
   </div>
   <div class="flex-1 min-w-0">
    <p class="text-sm font-bold text-amber-900 leading-snug">พบหลักสูตรสาขาวิชานี้ในระบบแล้ว {{ duplicateWarning.length }} รายการ</p>
    <p class="text-xs text-amber-700 mt-0.5 leading-relaxed">กรุณาระบุ <strong class="font-semibold">ปีหลักสูตร</strong> ให้ถูกต้อง</p>
    <div class="mt-2.5 flex flex-wrap gap-1.5">
     <span v-for="c in duplicateWarning" :key="c.id"
      class="inline-flex items-center gap-1.5 rounded-lg bg-white pl-2.5 pr-1 py-1 ring-1 ring-amber-200/80 shadow-sm">
      <span class="text-xs font-bold text-amber-800 tabular-nums">ปี {{ c.curriculum_year }}</span>
      <span class="rounded-md bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 text-[11px] leading-none">
       {{ DUP_STATUS_LABELS[c.status] || c.status }}
      </span>
     </span>
    </div>
   </div>
  </div>
 </Transition>

 <!-- Team members Card -->
 <div class="bg-white rounded-2xl shadow-sm border border-gray-200">
 <div class="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between gap-4">
 <h3 class="text-base font-bold text-gray-900">อาจารย์ผู้รับผิดชอบหลักสูตร</h3>
 <label v-if="form.department_id" class="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer select-none shrink-0">
 <input type="checkbox" v-model="showAllDepts" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
 แสดงอาจารย์ทุกภาควิชา
 </label>
 </div>

 <div class="p-6">
 <div v-if="usersLoading" class="flex items-center gap-3 text-sm text-gray-500 py-4 justify-center">
 <span class="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin shrink-0"></span>
 กำลังโหลดข้อมูลผู้ใช้ระบบ…
 </div>

 <div class="space-y-6">
 <div v-for="(member, idx) in form.team" :key="idx" class="relative rounded-xl border border-gray-100 bg-gray-50/50 p-5">
 <button type="button" @click="removeMember(idx)" :disabled="form.team.length <= 1"
  :aria-label="`ลบสมาชิก ${member.name || 'รายการที่ ' + (idx + 1)}`"
  class="absolute right-4 top-4 text-gray-400 hover:text-red-500 active:scale-[0.88] transition-all duration-150 ease-ios rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 disabled:opacity-25 disabled:pointer-events-none">
 <PhTrash class="w-5 h-5" aria-hidden="true" />
 </button>
 
 <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <!-- Name with autocomplete -->
 <div class="relative">
 <label class="text-sm font-semibold text-gray-700">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
 <div class="mt-2">
 <input
 v-model="member.name"
 type="text"
 required
 class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all"
 autocomplete="off"
 @focus="focusedMember = idx"
 @blur="handleMemberBlur"
 @input="member._userSelected = false; focusedMember = idx"
 @keydown="handleNameInputKeydown($event, idx)"
 placeholder="พิมพ์ชื่อเพื่อค้นหาจากระบบ"
 />
 </div>
 <div
 v-if="focusedMember === idx && getMemberSuggestions(idx).length > 0"
 data-suggestions
 class="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
 @keydown="handleSuggestionKeydown($event, idx)"
 >
 <button
 v-for="user in getMemberSuggestions(idx)"
 :key="user.id"
 type="button"
 @mousedown.prevent="selectMember(idx, user)"
 class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3.5 transition-all duration-150 border-b border-gray-50 last:border-0"
 >
 <div class="w-10 h-10 rounded-full bg-gray-100/80 border border-gray-200/60 flex items-center justify-center shrink-0">
 <PhUser class="w-5 h-5 text-gray-400" weight="fill" />
 </div>
 <div class="flex-1 min-w-0">
 <p class="font-bold text-gray-900 truncate">{{ formatUserName(user) }}</p>
 <div class="flex items-center gap-2 mt-1 min-w-0">
   <span v-if="user.email" class="text-xs font-medium text-gray-500 truncate">
     {{ user.email }}
   </span>
   <span v-if="suggestionDeptTag(user)" class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
     {{ suggestionDeptTag(user) }}
   </span>
 </div>
 </div>
 </button>
 </div>
 </div>

 <div>
 <label class="text-sm font-semibold text-gray-700">บทบาทในหลักสูตร <span class="text-red-500">*</span></label>
 <div class="mt-2">
 <FormSelect
   v-model="member.role_in_curriculum"
   :options="[
     { label: 'ประธานหลักสูตร', value: 'president' },
     { label: 'อาจารย์ผู้รับผิดชอบหลักสูตร', value: 'responsible' }
   ]"
 />
 </div>
 </div>
 <div>
 <label class="text-sm font-semibold text-gray-700">ตำแหน่งทางวิชาการ</label>
 <div class="mt-2">
 <FormSelect
   v-model="member.position"
   :options="[
     { label: 'ไม่ระบุ', value: '' },
     { label: 'อาจารย์', value: 'อาจารย์' },
     { label: 'ผู้ช่วยศาสตราจารย์', value: 'ผู้ช่วยศาสตราจารย์' },
     { label: 'รองศาสตราจารย์', value: 'รองศาสตราจารย์' },
     { label: 'ศาสตราจารย์', value: 'ศาสตราจารย์' }
   ]"
 />
 </div>
 </div>
 <div>
 <label class="text-sm font-semibold text-gray-700">อีเมล</label>
 <div class="mt-2">
 <input v-model="member.email" type="email" placeholder="ชื่อ@nu.ac.th" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <button v-if="form.team.length === 0" type="button" @click="addMember"
 class="relative block w-full rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100 transition-all duration-150 ease-ios focus:outline-none mt-4">
 <PhUser class="mx-auto h-12 w-12 text-gray-400" />
 <span class="mt-2 block text-sm font-semibold text-gray-900">คลิกเพื่อเพิ่มอาจารย์ผู้รับผิดชอบ</span>
 </button>

 <!-- ปุ่มเพิ่มที่ด้านล่างของรายการ -->
 <button v-if="form.team.length > 0" type="button" @click="addMember"
 class="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 active:bg-primary-100 flex items-center justify-center gap-2 transition-all duration-150 ease-ios focus:outline-none">
 <PhPlusCircle class="w-4 h-4" />
 เพิ่มรายชื่ออาจารย์
 </button>
 </div>
 </div>

 <div class="flex items-center justify-end gap-3">
 <Button variant="danger-outline" type="button" @click="router.back()">ออกโดยไม่บันทึก</Button>
 <Button variant="success" size="lg" type="submit" :loading="loading" :icon-left="PhFilePlus">
   {{ loading ? 'กำลังบันทึก' : 'สร้างหลักสูตร' }}
 </Button>
 </div>
 </form>

 </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

import { useRouter } from 'vue-router';
import { useCurriculumStore } from '@/stores/curriculum';
import { useDepartmentStore } from '@/stores/department';
import { curriculumService } from '@/services/curriculumService';
import { userService } from '@/services/userService';
import { degreeTitleService } from '@/services/departmentService';
import { formatUserName } from '@/utils/user';
import {
  PhCaretLeft, PhPlusCircle, PhFilePlus, PhUser, PhTrash, PhWarning,
} from '@phosphor-icons/vue';
import { DEPARTMENT_MAJORS } from '@/constants/departments';
import FormSelect from '@/components/common/FormSelect.vue';
import FormCombobox from '@/components/common/FormCombobox.vue';
import Button from '@/components/common/Button.vue';
import FormDatePicker from '@/components/common/FormDatePicker.vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const curriculumStore = useCurriculumStore();
const deptStore = useDepartmentStore();
const toast = useToast();

const departments = computed(() => deptStore.departments);
const allUsers = ref([]);
const showAllDepts = ref(false); // true = แสดงอาจารย์ทุกภาควิชาใน dropdown (เผื่อทีมสหวิทยาการ)
const loading = ref(false);
const usersLoading = ref(false);
const focusedMember = ref(-1);

const ROLE_LABELS = {
 president: 'ประธานหลักสูตร',
 secretary: 'เลขานุการหลักสูตร',
 responsible: 'อาจารย์ผู้รับผิดชอบ'
};
const ROLE_COLORS = {
 president: 'bg-indigo-50 text-indigo-700 border-indigo-200',
 secretary: 'bg-blue-50 text-blue-700 border-blue-200',
 responsible: 'bg-gray-50 text-gray-600 border-gray-200'
};

// fallback เมื่อยังโหลดชื่อวุฒิจากระบบไม่สำเร็จ — ชุดหลักจัดการได้ที่เมนู "ภาควิชาและชื่อวุฒิ"
const DEGREE_DEFAULTS = {
 bachelor: { degree_name: 'วิทยาศาสตรบัณฑิต', degree_name_abbr: 'วท.บ.' },
 master: { degree_name: 'วิทยาศาสตรมหาบัณฑิต', degree_name_abbr: 'วท.ม.' },
 doctoral: { degree_name: 'ปรัชญาดุษฎีบัณฑิต', degree_name_abbr: 'ปร.ด.' }
};

// ชื่อวุฒิจากฐานข้อมูล (master data)
const degreeTitles = ref([]);
degreeTitleService.getAll()
  .then(({ data }) => { degreeTitles.value = data.data || []; })
  .catch(() => { /* ใช้ DEGREE_DEFAULTS แทน */ });

// ตัวเลือกชื่อวุฒิ — กรองตามระดับปริญญาที่เลือก (ยังไม่เลือก = แสดงทั้งหมด)
const degreeNameOptions = computed(() => {
  const list = form.value.degree_level
    ? degreeTitles.value.filter(t => t.degree_level === form.value.degree_level)
    : degreeTitles.value;
  return list.map(t => ({ label: t.abbr ? `${t.name} (${t.abbr})` : t.name, value: t.name }));
});

const currentYear = new Date().getFullYear() + 543;
const yearOptions = [
  currentYear + 2,
  currentYear + 1,
  currentYear,
  currentYear - 1,
  currentYear - 2
].map(y => ({ label: String(y), value: String(y) }));

const form = ref({
 degree_level: '', curriculum_type: '', department_id: '',
 curriculum_year: '', degree_name: '', degree_name_abbr: '',
 field_of_study: '', deadline: '',
 team: [{ name: '', role_in_curriculum: 'president', position: '', email: '', _userSelected: false }]
});

const duplicateWarning = ref([]);
// ป้ายสถานะในชิปหลักสูตรซ้ำ — ใช้คำสื่อความชัด (แนวเดียวกับ StatusBadge)
const DUP_STATUS_LABELS = {
  pending_department:    'รอภาควิชาส่งเอกสาร',
  department_submitted:  'รอตรวจสอบเอกสาร',
  pending_admin_recheck: 'รอเจ้าหน้าที่ตรวจสอบ',
  under_committee:       'อยู่ระหว่างพิจารณา',
  revision:              'ส่งกลับแก้ไข',
  approved:              'อนุมัติแล้ว',
  draft:                 'ร่างหลักสูตร',
};
let dupTimer = null;
watch(
 [() => form.value.field_of_study, () => form.value.degree_level, () => form.value.department_id],
 ([fos, deg, dept]) => {
  duplicateWarning.value = [];
  clearTimeout(dupTimer);
  if (!fos?.trim() || !deg || !dept) return;
  dupTimer = setTimeout(async () => {
   try {
    const { data } = await curriculumService.getAll(
     { search: fos.trim(), degree: deg, department_id: dept, limit: 20 }
    );
    duplicateWarning.value = (data.data || []).filter(c =>
     c.field_of_study?.trim().toLowerCase() === fos.trim().toLowerCase() &&
     c.degree_level === deg &&
     String(c.department_id) === String(dept)
    );
   } catch { /* silent */ }
  }, 600);
 }
);

const SERVICE_UNIT_NAME = 'งานบริการการศึกษา';

const selectedDepartmentName = computed(() => {
 const dept = departments.value.find(d => d.id === form.value.department_id);
 return dept?.name || '';
});

// งานบริการการศึกษา ไม่มีสาขาวิชาย่อย — สาขา = ชื่อหน่วยงานเสมอ (ทุกระดับปริญญา)
const isServiceUnit = computed(() => selectedDepartmentName.value === SERVICE_UNIT_NAME);

const availableMajors = computed(() => {
 const level = form.value.degree_level;
 const dept = departments.value.find(d => d.id === form.value.department_id);
 if (!level || !dept) return [];
 // สาขาจากฐานข้อมูล (จัดการได้ที่เมนู ภาควิชาและชื่อวุฒิ) — ถ้ายังไม่มีใช้ชุด fallback เดิม
 const fromDb = (dept.majors || []).filter(m => m.degree_level === level).map(m => m.name);
 if (fromDb.length) return fromDb;
 return DEPARTMENT_MAJORS[level]?.[dept.name] || [];
});

// เลือก/พิมพ์ชื่อวุฒิที่ตรงกับในระบบ → เติมชื่อย่อให้อัตโนมัติ
watch(() => form.value.degree_name, (name) => {
  const match = degreeTitles.value.find(t => t.name === name);
  if (match?.abbr) form.value.degree_name_abbr = match.abbr;
});

const onDegreeLevelChange = () => {
 // ใช้ชื่อวุฒิตัวแรกของระดับนั้นจากระบบก่อน — ถ้าโหลดไม่ได้ค่อยใช้ค่า fallback
 const fromDb = degreeTitles.value.find(t => t.degree_level === form.value.degree_level);
 if (fromDb) {
 form.value.degree_name = fromDb.name;
 form.value.degree_name_abbr = fromDb.abbr || '';
 return;
 }
 const defaults = DEGREE_DEFAULTS[form.value.degree_level];
 if (defaults) {
 form.value.degree_name = defaults.degree_name;
 form.value.degree_name_abbr = defaults.degree_name_abbr;
 }
};

const onDepartmentChange = () => {
 form.value.field_of_study = isServiceUnit.value ? SERVICE_UNIT_NAME : '';
};

const getMemberSuggestions = (idx) => {
 const query = form.value.team[idx]?.name?.trim().toLowerCase() || '';
 if (!query || query.length < 1) return [];
 const deptId = form.value.department_id;
 const matched = allUsers.value
 .filter(u => u.role === 'faculty')
 .filter(u => u.name.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query));
 if (showAllDepts.value || !deptId) return matched.slice(0, 8);
 // คนภาคเดียวกับหลักสูตรขึ้นก่อน — แต่ถ้าในภาคไม่มีชื่อที่ตรงเลย fallback เป็นทุกภาค
 // (กัน dropdown ว่างทั้งที่ชื่ออยู่ในระบบ เช่น ทีมสหวิทยาการ/หลักสูตรของงานบริการการศึกษา)
 const inDept = matched.filter(u => u.department_id === deptId);
 return (inDept.length > 0 ? inDept : matched).slice(0, 8);
};

// ชื่อภาคแบบย่อสำหรับ tag ใน dropdown — โชว์เฉพาะคนต่างภาคกับหลักสูตรที่เลือก
const suggestionDeptTag = (user) => {
 if (!form.value.department_id || user.department_id === form.value.department_id) return null;
 return user.department?.name || null;
};

const selectMember = (idx, user) => {
 form.value.team[idx].name     = user.name;
 form.value.team[idx].email    = user.email             || '';
 // ตำแหน่งวิชาการ: อ่าน academic_position ก่อน, fallback position สำหรับ user seed เก่า
 form.value.team[idx].position = user.academic_position || user.position || '';
 form.value.team[idx]._userSelected = true;
 focusedMember.value = -1;
};

const handleMemberBlur = () => { setTimeout(() => { focusedMember.value = -1; }, 200); };

const handleNameInputKeydown = (e, idx) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const wrapper = e.target.closest('.relative');
    const firstBtn = wrapper?.querySelector('[data-suggestions] button');
    firstBtn?.focus();
  } else if (e.key === 'Escape') {
    focusedMember.value = -1;
  }
};

const handleSuggestionKeydown = (e, idx) => {
  const btns = Array.from(e.currentTarget.querySelectorAll('button'));
  const cur = btns.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    btns[Math.min(cur + 1, btns.length - 1)]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cur === 0) {
      e.currentTarget.closest('.relative')?.querySelector('input')?.focus();
    } else {
      btns[cur - 1]?.focus();
    }
  } else if (e.key === 'Escape') {
    focusedMember.value = -1;
    e.currentTarget.closest('.relative')?.querySelector('input')?.focus();
  }
};

const addMember = () => form.value.team.push({ name: '', role_in_curriculum: 'responsible', position: '', email: '', _userSelected: false });
const removeMember = (idx) => form.value.team.splice(idx, 1);

const handleSubmit = async () => {
 loading.value = true;
 try {
 const payload = {
 ...form.value,
 deadline: form.value.deadline || null,  // กันส่ง '' → backend date error
 team: form.value.team.map(({ _userSelected, ...m }) => m)
 };
 const curriculum = await curriculumStore.create(payload);
 router.replace(`/curricula/${curriculum.id}`);
 } catch (e) {
 toast.error('สร้างหลักสูตรไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
 } finally {
 loading.value = false;
 }
};

onMounted(async () => {
  usersLoading.value = true;
  try {
    const [, usersRes] = await Promise.all([
      deptStore.fetchDepartments(),
      userService.getAll(),
    ]);
    allUsers.value = usersRes.data.data || [];
  } finally {
    usersLoading.value = false;
  }
});

onUnmounted(() => clearTimeout(dupTimer));
</script>

