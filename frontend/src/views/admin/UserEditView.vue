<template>
  <div class="max-w-3xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button type="button" @click="router.back()" aria-label="ย้อนกลับ"
        class="cursor-pointer shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="flex items-center gap-3 min-w-0">
        <UserAvatar v-if="!pageLoading" :name="displayName || '?'" :role="form.role" size="md" class="shrink-0" />
        <div class="min-w-0">
          <h2 class="text-2xl font-semibold text-gray-900 truncate">
            {{ pageLoading ? 'กำลังโหลด…' : (displayName || 'แก้ไขผู้ใช้') }}
          </h2>
          <p class="text-sm text-gray-500 mt-0.5">แก้ไขข้อมูลและสิทธิ์การใช้งาน</p>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="pageLoading" class="bg-white rounded-2xl border border-gray-200/80 h-80 animate-pulse"></div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">

      <!-- error (full width) -->
      <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
        <PhWarning class="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <p class="text-sm font-medium text-red-800">{{ error }}</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
          <div class="p-6">

            <!-- Section 1: ข้อมูลผู้ใช้งาน -->
            <h3 class="text-lg font-bold text-gray-900 mb-5">ข้อมูลผู้ใช้งาน</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <!-- 1. ตำแหน่งวิชาการ (ถ้ามี) -->
              <div v-if="['faculty', 'executive'].includes(form.role)">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">ตำแหน่งวิชาการ</label>
                <FormSelect v-model="form.academic_position" :options="[
                  { label: 'เลือกตำแหน่ง', value: '' },
                  ...['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์'].map(p => ({ label: p, value: p }))
                ]" />
              </div>

              <!-- 2. ชื่อ-นามสกุล -->
              <div :class="['faculty', 'executive'].includes(form.role) ? 'sm:col-span-1' : 'sm:col-span-2'">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- คำนำหน้า -->
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">คำนำหน้า</label>
                    <FormCombobox v-model="form.title" :options="titleOptions" placeholder="คำนำหน้า" />
                  </div>
                  <!-- ชื่อ -->
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อ</label>
                    <input v-model="form.first_name" type="text" placeholder="ชื่อ" class="block w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                  </div>
                  <!-- นามสกุล -->
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">นามสกุล</label>
                    <input v-model="form.last_name" type="text" placeholder="นามสกุล" class="block w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                  </div>
                </div>
              </div>

              <!-- 3. ตำแหน่งงาน (ถ้ามี) -->
              <div v-if="['admin', 'staff', 'registrar', 'executive'].includes(form.role)">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่งงาน' }}
                </label>
                <FormSelect v-model="form.position" :options="[
                  { label: 'เลือกตำแหน่ง', value: '' },
                  ...(form.role === 'executive'
                    ? ['คณบดี', 'รองคณบดี', 'ผู้ช่วยคณบดี']
                    : ['นักวิชาการศึกษา', 'เจ้าหน้าที่บริหารงานทั่วไป', 'นักวิชาการคอมพิวเตอร์']
                  ).map(p => ({ label: p, value: p }))
                ]" />
              </div>

              <!-- 4. บทบาทที่ลงทะเบียน (Role) -->
              <div :class="['admin', 'staff', 'registrar', 'executive'].includes(form.role) ? 'sm:col-span-1' : 'sm:col-span-2'">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">บทบาทที่ลงทะเบียน (Role)</label>
                <FormSelect v-model="form.role" :options="Object.entries(ROLE_LABELS).map(([key, label]) => ({ label, value: key }))" />
              </div>

              <!-- 5. ภาควิชา -->
              <div v-if="!CENTRAL_ROLES.has(form.role)" class="sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">ภาควิชา / สังกัด</label>
                <FormSelect v-model="form.department_id" :options="[
                  { label: 'ไม่ระบุภาควิชา', value: null },
                  ...academicDepartments.map(d => ({ label: d.name, value: d.id }))
                ]" />
              </div>

            </div>

            <!-- Section 2: ข้อมูลติดต่อ -->
            <div class="mt-8 pt-6 border-t border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 mb-5">ข้อมูลติดต่อ</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
                  <div class="relative">
                    <PhEnvelope class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input v-model="form.email" type="email" placeholder="อีเมล" class="block w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">เบอร์ติดต่อ</label>
                  <div class="relative">
                    <PhPhone class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input :value="form.phone" @input="formatPhone" type="tel" placeholder="000-000-0000" maxlength="12" class="block w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Password reset card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-5">ตั้งรหัสผ่านใหม่</h3>
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-xl border border-gray-100 bg-gray-50/50">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-gray-900">ส่งอีเมลตั้งรหัสผ่านใหม่</p>
                <p class="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  ระบบจะส่งลิงก์ไปที่อีเมลของผู้ใช้ เพื่อให้ตั้งรหัสผ่านใหม่ด้วยตนเอง <br class="hidden sm:block" />
                  <span class="text-red-500 font-medium">หมายเหตุ: ลิงก์ใช้งานได้เพียงครั้งเดียว และจะหมดอายุภายใน 1 ชั่วโมง</span>
                </p>
              </div>
              
              <button type="button" @click="sendReset" :disabled="sendingReset"
                class="cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-primary-800 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="sendingReset"
                  class="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin shrink-0"></span>
                <PhPaperPlaneTilt v-else class="w-4 h-4 shrink-0" />
                ส่งอีเมลตั้งรหัสผ่าน
              </button>
            </div>
          </div>
        </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="button" @click="router.back()"
          class="cursor-pointer px-6 py-2.5 text-sm font-bold text-red-500 bg-white border-2 border-red-400 rounded-lg hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios shadow-2xs">
          ยกเลิก
        </button>
        <button type="submit" :disabled="loading"
          class="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
          {{ loading ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { formatUserName } from '@/utils/user';
import { useConfirm } from '@/composables/useConfirm';
import { DEPARTMENT_ORDER } from '@/constants/departments';
import UserAvatar from '@/components/common/UserAvatar.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormCombobox from '@/components/common/FormCombobox.vue';
import {
  PhCaretLeft, PhWarning, PhUserCircle, PhEnvelope, PhPhone, PhCheck,
  PhShieldStar, PhChalkboardTeacher, PhUsersThree, PhBuildings, PhSuitcaseSimple,
  PhPaperPlaneTilt
} from '@phosphor-icons/vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const { open: confirm } = useConfirm();
const toast = useToast();

const ROLE_LABELS = {
  admin: 'เจ้าหน้าที่หลักสูตรคณะ',
  faculty: 'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff: 'เจ้าหน้าที่สาขาวิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะวิทยาศาสตร์',
};

const ROLE_META = {
  admin: { icon: PhShieldStar, color: 'text-primary-600', bg: 'bg-primary-500', ring: 'ring-primary-500/30' },
  faculty: { icon: PhChalkboardTeacher, color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/30' },
  staff: { icon: PhUsersThree, color: 'text-cyan-600', bg: 'bg-cyan-500', ring: 'ring-cyan-500/30' },
  registrar: { icon: PhBuildings, color: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-500/30' },
  executive: { icon: PhSuitcaseSimple, color: 'text-purple-600', bg: 'bg-purple-500', ring: 'ring-purple-500/30' },
};

const CENTRAL_ROLES = new Set(['admin', 'registrar', 'executive']);

const titleOptions = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ศ.', 'รศ.', 'ผศ.', 'ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.', 'อ.'].map(t => ({ label: t, value: t }));
const TITLES_FOR_PARSE = ['ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.', 'ดร.', 'ศ.', 'รศ.', 'ผศ.', 'อ.', 'นางสาว', 'นาย', 'นาง'];

function parseName(fullName) {
  let title = '';
  let name_only = fullName || '';
  for (const t of TITLES_FOR_PARSE) {
    if (name_only.startsWith(t)) {
      title = t;
      name_only = name_only.substring(t.length).trim();
      break;
    }
  }
  
  const parts = name_only.split(' ').filter(Boolean);
  let first_name = '';
  let last_name = '';
  if (parts.length > 0) {
    first_name = parts[0];
    last_name = parts.slice(1).join(' ');
  }
  return { title, first_name, last_name };
}

const form = ref({
  title: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'faculty',
  department_id: null,
  position: '',
  academic_position: '',
  is_active: true
});
const originalRole = ref('faculty');
const departments = ref([]);
const academicDepartments = computed(() => departments.value.filter(d => d.name !== 'งานบริการการศึกษา'));
const loading = ref(false);
const pageLoading = ref(false);
const error = ref('');

const displayName = computed(() => {
  const builtName = [form.value.title, form.value.first_name, form.value.last_name].filter(Boolean).join(' ').trim();
  return formatUserName({ ...form.value, name: builtName });
});

watch(() => form.value.role, (newRole) => {
  form.value.position = '';
  if (newRole !== 'faculty' && newRole !== 'staff') {
    form.value.department_id = null;
  }
  if (!['faculty', 'executive'].includes(newRole)) {
    form.value.academic_position = '';
  }
});

onMounted(async () => {
  pageLoading.value = true;
  try {
    // load departments
    const { data: deptData } = await departmentService.getAll();
    departments.value = [...(deptData.data || [])].sort((a, b) => {
      const ia = DEPARTMENT_ORDER.indexOf(a.name);
      const ib = DEPARTMENT_ORDER.indexOf(b.name);
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, 'th');
      if (ia === -1) return 1; if (ib === -1) return -1;
      return ia - ib;
    });

    // load user — from state if available, else from API
    const stateUser = history.state?.user;
    if (stateUser) {
      const parsed = parseName(stateUser.name);
      form.value = {
        title: parsed.title,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        email: stateUser.email || '',
        phone: stateUser.phone || '',
        role: stateUser.role || 'faculty',
        department_id: stateUser.department?.id ?? null,
        position: stateUser.position || '',
        academic_position: stateUser.academic_position || '',
        is_active: stateUser.is_active ?? true
      };
      originalRole.value = stateUser.role || 'faculty';
    } else {
      const { data } = await userService.getAll();
      const found = (data.data || []).find(u => String(u.id) === String(route.params.id));
      if (found) {
        const parsed = parseName(found.name);
        form.value = {
          title: parsed.title,
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          email: found.email || '',
          phone: found.phone || '',
          role: found.role || 'faculty',
          department_id: found.department?.id ?? null,
          position: found.position || '',
          academic_position: found.academic_position || '',
          is_active: found.is_active ?? true
        };
        originalRole.value = found.role || 'faculty';
      }
    }
  } finally {
    pageLoading.value = false;
  }
});

const sendingReset = ref(false);
const sendReset = async () => {
  const ok = await confirm({
    title: 'ส่งอีเมลตั้งรหัสผ่านใหม่',
    message: `ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ ${form.value.email || 'อีเมลของผู้ใช้'}`,
    confirmLabel: 'ส่งอีเมล',
    cancelLabel: 'ยกเลิก',
    type: 'primary',
  });
  if (!ok) return;
  sendingReset.value = true;
  try {
    const { data } = await userService.sendPasswordReset(route.params.id);
    toast.success('ส่งอีเมลแล้ว', data?.message || '');
  } catch (e) {
    toast.error('ส่งอีเมลไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    sendingReset.value = false;
  }
};

const formatPhone = (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
  let out = digits;
  if (digits.length > 6) out = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  else if (digits.length > 3) out = digits.slice(0, 3) + '-' + digits.slice(3);
  form.value.phone = out;
};

const handleSubmit = async () => {
  error.value = '';
  const finalName = [form.value.title, form.value.first_name, form.value.last_name].filter(Boolean).join(' ').trim();
  if (!form.value.first_name.trim() || !form.value.last_name.trim()) { error.value = 'กรุณากรอกชื่อและนามสกุลให้ครบถ้วน'; return; }
  if (!form.value.email.trim()) { error.value = 'กรุณากรอกอีเมล'; return; }

  const confirmed = await confirm({
    title: 'ยืนยันการเปลี่ยนแปลงสิทธิ์ผู้ใช้',
    message: '',
    confirmLabel: 'บันทึกการเปลี่ยนแปลง',
    cancelLabel: 'ยกเลิก',
    type: 'primary',
  });
  if (!confirmed) return;

  loading.value = true;
  try {
    await userService.update(route.params.id, {
      name: finalName,
      email: form.value.email.trim(),
      phone: form.value.phone || null,
      role: form.value.role,
      department_id: CENTRAL_ROLES.has(form.value.role) ? null : (form.value.department_id || null),
      position: form.value.position || null,
      academic_position: form.value.academic_position || null,
      is_active: form.value.is_active
    });
    router.push('/users');
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
};
</script>
