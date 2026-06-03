<template>
 <div class="max-w-4xl mx-auto space-y-8">
 <!-- Header -->
 <div class="flex items-center gap-4">
 <button @click="router.back()" class="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
 <PhCaretLeft class="w-5 h-5" />
 </button>
 <div>
 <h2 class="text-2xl font-bold text-gray-900 tracking-tight">สร้างหลักสูตรใหม่</h2>
 <p class="text-sm text-gray-500 mt-1">กรอกข้อมูลหลักสูตรและทีมผู้รับผิดชอบหลักสูตร</p>
 </div>
 </div>

 <form @submit.prevent="handleSubmit" class="space-y-8">
 <!-- Basic Info Card -->
 <div class="bg-white rounded-xl shadow-sm border border-gray-200">
 <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
 <h3 class="text-lg font-bold text-gray-900">ข้อมูลรายละเอียดหลักสูตร</h3>
 <p class="text-sm text-gray-400 mt-0.5">กรอกข้อมูลพื้นฐานที่จำเป็นก่อน จากนั้นระบุชื่อปริญญา</p>
 </div>
 <div class="p-6 space-y-6">

   <!-- กลุ่ม 1: ข้อมูลพื้นฐาน (required fields) -->
   <div>
     <p class="text-xs font-semibold text-gray-400 mb-4">ข้อมูลพื้นฐาน <span class="text-red-400">*</span> จำเป็นต้องกรอก</p>
     <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
       <div>
         <label for="degree_level" class="block text-sm font-semibold text-gray-700">ระดับปริญญา <span class="text-red-500" aria-label="จำเป็น">*</span></label>
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
         <label for="curriculum_type" class="block text-sm font-semibold text-gray-700">ประเภทหลักสูตร <span class="text-red-500" aria-label="จำเป็น">*</span></label>
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
         <label for="department_id" class="block text-sm font-semibold text-gray-700">ภาควิชา <span class="text-red-500" aria-label="จำเป็น">*</span></label>
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
         <label for="field_of_study" class="block text-sm font-semibold text-gray-700">สาขาวิชา</label>
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
             placeholder="กรุณาเลือกภาควิชาก่อน"
             :disabled="!form.department_id"
             class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-all"
           />
         </div>
       </div>
       <div>
         <label for="curriculum_year" class="block text-sm font-semibold text-gray-700">ปีหลักสูตร (พ.ศ.) <span class="text-red-500" aria-label="จำเป็น">*</span></label>
         <div class="mt-2">
           <input id="curriculum_year" v-model="form.curriculum_year" type="text" required placeholder="เช่น 2567" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
         </div>
       </div>
       <div>
         <label for="deadline" class="block text-sm font-semibold text-gray-700">กำหนดส่ง</label>
         <div class="mt-2">
           <FormDatePicker id="deadline" v-model="form.deadline" placeholder="เลือกวันที่กำหนดส่ง" />
         </div>
       </div>
     </div>
   </div>

   <!-- divider -->
   <div class="border-t border-gray-100"></div>

   <!-- กลุ่ม 2: ชื่อปริญญา (optional / auto-fill) -->
   <div>
     <p class="text-xs font-semibold text-gray-400 mb-4">ชื่อปริญญา <span class="text-gray-300 font-normal">กรอกอัตโนมัติเมื่อเลือกระดับปริญญา</span></p>
     <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
       <div class="sm:col-span-2">
         <label for="degree_name" class="block text-sm font-semibold text-gray-700">ชื่อปริญญา (ภาษาไทย)</label>
         <div class="mt-2">
           <input id="degree_name" v-model="form.degree_name" type="text" placeholder="เช่น วิทยาศาสตรบัณฑิต" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
         </div>
       </div>
       <div>
         <label for="degree_name_abbr" class="block text-sm font-semibold text-gray-700">ชื่อย่อปริญญา</label>
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
  <div v-if="duplicateWarning.length" class="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
   <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
   </svg>
   <div class="flex-1 min-w-0">
    <p class="text-sm font-semibold text-amber-800">พบหลักสูตรสาขาวิชานี้ในระบบแล้ว {{ duplicateWarning.length }} รายการ</p>
    <p class="text-xs text-amber-700 mt-0.5">กำลังสร้างรุ่นใหม่ กรุณาตรวจสอบว่าตั้ง <strong>ปีหลักสูตร</strong> ถูกต้อง</p>
    <div class="mt-2 flex flex-wrap gap-1.5">
     <span v-for="c in duplicateWarning" :key="c.id"
      class="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 px-2 py-0.5 rounded-full">
      ปี {{ c.curriculum_year }}
      <span class="text-amber-500">·</span>
      {{ { pending_department:'รอส่ง', department_submitted:'รอตรวจ', under_committee:'กรรมการ', approved:'อนุมัติ', revision:'แก้ไข' }[c.status] || c.status }}
     </span>
    </div>
   </div>
  </div>
 </Transition>

 <!-- Team members Card -->
 <div class="bg-white rounded-xl shadow-sm border border-gray-200">
 <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
 <h3 class="text-base font-semibold text-gray-900">อาจารย์ผู้รับผิดชอบหลักสูตร</h3>
 </div>

 <div class="p-6 bg-gray-50/30">
 <div v-if="usersLoading" class="flex items-center gap-3 text-sm text-gray-500 py-4 justify-center">
 <svg class="w-5 h-5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
 </svg>
 กำลังโหลดข้อมูลผู้ใช้ระบบ…
 </div>

 <div class="space-y-6">
 <div v-for="(member, idx) in form.team" :key="idx" class="relative bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
 <button type="button" @click="removeMember(idx)" :disabled="form.team.length <= 1" class="absolute right-4 top-4 text-gray-400 hover:text-red-500 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none disabled:opacity-25 disabled:pointer-events-none">
 <PhTrash class="w-5 h-5" />
 </button>
 
 <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <!-- Name with autocomplete -->
 <div class="relative">
 <label class="block text-sm font-semibold text-gray-700">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
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
 placeholder="พิมพ์ชื่อเพื่อค้นหาจากระบบ"
 />
 </div>
 <div
 v-if="focusedMember === idx && getMemberSuggestions(idx).length > 0"
 class="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
 >
 <button
 v-for="user in getMemberSuggestions(idx)"
 :key="user.id"
 type="button"
 @mousedown.prevent="selectMember(idx, user)"
 class="w-full text-left px-4 py-3 text-sm hover:bg-primary-50 active:bg-primary-100 flex items-center gap-3 transition-all duration-150 ease-ios"
 >
 <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
 <PhUser class="w-5 h-5 text-gray-500" />
 </div>
 <div>
 <p class="font-medium text-gray-900">{{ user.name }}</p>
 <p class="text-xs text-gray-500 mt-0.5">
   <span v-if="user.position" class="text-primary-600 font-medium">{{ user.position }}</span>
   <span v-if="user.position && user.email">, </span>
   {{ user.email }}
 </p>
 </div>
 </button>
 </div>
 </div>

 <div>
 <label class="block text-sm font-semibold text-gray-700">บทบาทในหลักสูตร <span class="text-red-500">*</span></label>
 <div class="mt-2">
 <FormSelect
   v-model="member.role_in_curriculum"
   :options="[
     { label: 'ประธานหลักสูตร', value: 'president' },
     { label: 'เลขานุการหลักสูตร', value: 'secretary' },
     { label: 'อาจารย์ผู้รับผิดชอบ', value: 'responsible' }
   ]"
 />
 </div>
 </div>
 <div>
 <label class="block text-sm font-semibold text-gray-700">ตำแหน่งทางวิชาการ</label>
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
 <label class="block text-sm font-semibold text-gray-700">อีเมล</label>
 <div class="mt-2">
 <input v-model="member.email" type="email" placeholder="ชื่อ@nu.ac.th" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <button v-if="form.team.length === 0" type="button" @click="addMember"
 class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100 transition-all duration-150 ease-ios focus:outline-none mt-4">
 <PhUser class="mx-auto h-12 w-12 text-gray-400" />
 <span class="mt-2 block text-sm font-semibold text-gray-900">คลิกเพื่อเพิ่มอาจารย์ผู้รับผิดชอบ</span>
 </button>

 <!-- ปุ่มเพิ่มที่ด้านล่างของรายการ -->
 <button v-if="form.team.length > 0" type="button" @click="addMember"
 class="mt-4 w-full py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 active:bg-primary-100 flex items-center justify-center gap-2 transition-all duration-150 ease-ios focus:outline-none">
 <PhPlusCircle class="w-4 h-4" />
 เพิ่มรายชื่ออาจารย์
 </button>
 </div>
 </div>

 <div class="flex items-center justify-end gap-3">
 <Button variant="ghost" type="button" @click="router.back()">ออกโดยไม่บันทึก</Button>
 <Button size="lg" type="submit" :loading="loading" :icon-left="PhPlusCircle">
   {{ loading ? 'กำลังบันทึก' : 'สร้างหลักสูตร' }}
 </Button>
 </div>
 </form>

 <!-- Error toast -->
 <Teleport to="body">
 <Transition
  enter-active-class="transition ease-out duration-200"
  enter-from-class="opacity-0 translate-y-2"
  enter-to-class="opacity-100 translate-y-0"
  leave-active-class="transition ease-in duration-150"
  leave-from-class="opacity-100 translate-y-0"
  leave-to-class="opacity-0 translate-y-2"
 >
  <div v-if="toastMsg" class="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm text-white shadow-lg max-w-sm">
  <svg class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
   <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
  </svg>
  <span class="font-medium">{{ toastMsg }}</span>
  </div>
 </Transition>
 </Teleport>
 </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

import { useRouter } from 'vue-router';
import { useCurriculumStore } from '@/stores/curriculum';
import { useDepartmentStore } from '@/stores/department';
import api from '@/services/api';
import { PhCaretLeft, PhPlusCircle, PhUser, PhTrash } from '@phosphor-icons/vue';
import { DEPARTMENT_MAJORS } from '@/constants/departments';
import FormSelect from '@/components/common/FormSelect.vue';
import Button from '@/components/common/Button.vue';
import FormDatePicker from '@/components/common/FormDatePicker.vue';

const TOAST_DURATION_MS = 4_500;

const router = useRouter();
const curriculumStore = useCurriculumStore();
const deptStore = useDepartmentStore();

const departments = computed(() => deptStore.departments);
const allUsers = ref([]);
const loading = ref(false);
const usersLoading = ref(false);
const focusedMember = ref(-1);
const toastMsg = ref('');
let toastTimer = null;
const showToast = (msg) => {
 toastMsg.value = msg;
 clearTimeout(toastTimer);
 toastTimer = setTimeout(() => { toastMsg.value = ''; }, TOAST_DURATION_MS);
};

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

const DEGREE_DEFAULTS = {
 bachelor: { degree_name: 'วิทยาศาสตรบัณฑิต', degree_name_abbr: 'วท.บ.' },
 master: { degree_name: 'วิทยาศาสตรมหาบัณฑิต', degree_name_abbr: 'วท.ม.' },
 doctoral: { degree_name: 'ปรัชญาดุษฎีบัณฑิต', degree_name_abbr: 'ปร.ด.' }
};

const form = ref({
 degree_level: '', curriculum_type: '', department_id: '',
 curriculum_year: '', degree_name: '', degree_name_abbr: '',
 field_of_study: '', deadline: '',
 team: [{ name: '', role_in_curriculum: 'president', position: '', email: '', _userSelected: false }]
});

const duplicateWarning = ref([]);
let dupTimer = null;
watch(
 [() => form.value.field_of_study, () => form.value.degree_level, () => form.value.department_id],
 ([fos, deg, dept]) => {
  duplicateWarning.value = [];
  clearTimeout(dupTimer);
  if (!fos?.trim() || !deg || !dept) return;
  dupTimer = setTimeout(async () => {
   try {
    const { data } = await api.get('/curricula', {
     params: { search: fos.trim(), degree: deg, department_id: dept, limit: 20 }
    });
    duplicateWarning.value = (data.data || []).filter(c =>
     c.field_of_study?.trim().toLowerCase() === fos.trim().toLowerCase() &&
     c.degree_level === deg &&
     String(c.department_id) === String(dept)
    );
   } catch { /* silent */ }
  }, 600);
 }
);

const selectedDepartmentName = computed(() => {
 const dept = departments.value.find(d => d.id === form.value.department_id);
 return dept?.name || '';
});

const availableMajors = computed(() => {
 const level = form.value.degree_level;
 const deptName = selectedDepartmentName.value;
 if (!level || !deptName) return [];
 return DEPARTMENT_MAJORS[level]?.[deptName] || [];
});

const onDegreeLevelChange = () => {
 const defaults = DEGREE_DEFAULTS[form.value.degree_level];
 if (defaults) {
 form.value.degree_name = defaults.degree_name;
 form.value.degree_name_abbr = defaults.degree_name_abbr;
 }
};

const onDepartmentChange = () => { form.value.field_of_study = ''; };

const getMemberSuggestions = (idx) => {
 const query = form.value.team[idx]?.name?.trim().toLowerCase() || '';
 if (!query || query.length < 1) return [];
 return allUsers.value
 .filter(u => u.role === 'faculty')
 .filter(u => u.name.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query))
 .slice(0, 8);
};

const selectMember = (idx, user) => {
 form.value.team[idx].name     = user.name;
 form.value.team[idx].email    = user.email             || '';
 form.value.team[idx].position = user.academic_position || '';
 form.value.team[idx]._userSelected = true;
 focusedMember.value = -1;
};

const handleMemberBlur = () => { setTimeout(() => { focusedMember.value = -1; }, 200); };

const addMember = () => form.value.team.push({ name: '', role_in_curriculum: 'responsible', position: '', email: '', _userSelected: false });
const removeMember = (idx) => form.value.team.splice(idx, 1);

const handleSubmit = async () => {
 loading.value = true;
 try {
 const payload = {
 ...form.value,
 team: form.value.team.map(({ _userSelected, ...m }) => m)
 };
 const curriculum = await curriculumStore.create(payload);
 router.replace(`/curricula/${curriculum.id}`);
 } catch (e) {
 showToast(e.response?.data?.message || 'สร้างหลักสูตรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
 } finally {
 loading.value = false;
 }
};

onMounted(async () => {
  usersLoading.value = true;
  try {
    const [, usersRes] = await Promise.all([
      deptStore.fetchDepartments(),
      api.get('/users'),
    ]);
    allUsers.value = usersRes.data.data || [];
  } finally {
    usersLoading.value = false;
  }
});
</script>
