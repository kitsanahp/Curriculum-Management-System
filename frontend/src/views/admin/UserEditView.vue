<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button @click="router.back()"
        class="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="flex items-center gap-3 min-w-0">
        <UserAvatar v-if="!pageLoading" :name="form.name || '?'" :role="form.role" size="md" class="shrink-0" />
        <div class="min-w-0">
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight truncate">
            {{ pageLoading ? 'กำลังโหลด…' : (form.name || 'แก้ไขผู้ใช้') }}
          </h2>
          <p class="text-sm text-gray-500 mt-0.5">แก้ไขข้อมูลและสิทธิ์การใช้งาน</p>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="pageLoading" class="bg-white rounded-xl border border-gray-200 h-80 animate-pulse"></div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Basic info card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
          <h3 class="text-base font-semibold text-gray-900">ข้อมูลบัญชี</h3>
        </div>
        <div class="p-6 space-y-5">

          <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
            <PhWarning class="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p class="text-sm font-medium text-red-800">{{ error }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
              <div class="relative">
                <PhUserCircle class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="form.name" type="text"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
              <div class="relative">
                <PhEnvelope class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="form.email" type="email"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">เบอร์ติดต่อ</label>
              <div class="relative">
                <PhPhone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="form.phone" type="tel" placeholder="0XX-XXX-XXXX"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
            </div>
          </div>

          <div v-if="['admin', 'staff', 'registrar', 'executive'].includes(form.role)" class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่ง' }}
              </label>
              <FormSelect
                v-model="form.position"
                :options="[
                  { label: 'เลือกตำแหน่ง', value: '' },
                  ...(form.role === 'executive'
                    ? ['คณบดี', 'รองคณบดี', 'ผู้ช่วยคณบดี']
                    : ['นักวิชาการศึกษา', 'เจ้าหน้าที่บริหารงานทั่วไป', 'นักวิชาการคอมพิวเตอร์']
                  ).map(p => ({ label: p, value: p }))
                ]"
              />
            </div>
          </div>

          <div v-if="['faculty', 'executive'].includes(form.role)" class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">ตำแหน่งวิชาการ</label>
              <FormSelect
                v-model="form.academic_position"
                :options="[
                  { label: 'เลือกตำแหน่ง', value: '' },
                  ...['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์'].map(p => ({ label: p, value: p }))
                ]"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- Role card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
          <h3 class="text-base font-semibold text-gray-900">สิทธิ์การใช้งาน</h3>
        </div>
        <div class="p-6 space-y-5">

          <div class="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            <label v-for="[key, label] in Object.entries(ROLE_LABELS)" :key="key"
              class="group flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-150"
              :class="form.role === key ? 'bg-primary-50/60' : 'bg-white hover:bg-gray-50'">

              <input type="radio" :value="key" v-model="form.role" class="hidden" />

              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
                :class="form.role === key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'">
                <component :is="ROLE_META[key].icon" class="w-4 h-4" />
              </div>

              <span class="flex-1 text-sm font-medium transition-colors"
                :class="form.role === key ? 'text-primary-900 font-semibold' : 'text-gray-700'">
                {{ label }}
              </span>

              <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                :class="form.role === key ? 'border-primary-500 bg-primary-500' : 'border-gray-300 group-hover:border-primary-400'">
                <div class="w-1.5 h-1.5 rounded-full bg-white transition-transform duration-150"
                  :class="form.role === key ? 'scale-100' : 'scale-0'" />
              </div>
            </label>
          </div>

        </div>
      </div>

      <!-- Department card (not for central roles) -->
      <div v-if="!CENTRAL_ROLES.has(form.role)" class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50/50 px-6 py-4 rounded-t-xl">
          <h3 class="text-base font-semibold text-gray-900">ภาควิชา</h3>
        </div>
        <div class="p-6">
          <FormSelect
            v-model="form.department_id"
            :options="[
              { label: 'ไม่ระบุภาควิชา', value: null },
              ...departments.map(d => ({ label: d.name, value: d.id }))
            ]"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="button" @click="router.back()"
          class="px-5 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios">
          ยกเลิก
        </button>
        <button type="submit" :disabled="loading"
          class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
          {{ loading ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';
import { useConfirm } from '@/composables/useConfirm';
import { DEPARTMENT_ORDER } from '@/constants/departments';
import UserAvatar from '@/components/common/UserAvatar.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import {
  PhCaretLeft, PhWarning, PhUserCircle, PhEnvelope, PhPhone,
  PhShieldStar, PhChalkboardTeacher, PhUsersThree, PhBuildings, PhSuitcaseSimple
} from '@phosphor-icons/vue';

const router = useRouter();
const route  = useRoute();
const { open: confirm } = useConfirm();

const ROLE_LABELS = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่ภาควิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะวิทยาศาสตร์',
};

const ROLE_META = {
  admin:     { icon: PhShieldStar,        color: 'text-primary-600',   bg: 'bg-primary-500',   ring: 'ring-primary-500/30' },
  faculty:   { icon: PhChalkboardTeacher, color: 'text-blue-600',      bg: 'bg-blue-500',      ring: 'ring-blue-500/30' },
  staff:     { icon: PhUsersThree,        color: 'text-cyan-600',      bg: 'bg-cyan-500',      ring: 'ring-cyan-500/30' },
  registrar: { icon: PhBuildings,         color: 'text-orange-600',    bg: 'bg-orange-500',    ring: 'ring-orange-500/30' },
  executive: { icon: PhSuitcaseSimple,    color: 'text-purple-600',    bg: 'bg-purple-500',    ring: 'ring-purple-500/30' },
};

const CENTRAL_ROLES = new Set(['admin', 'registrar', 'executive']);

const form         = ref({
  name: '',
  email: '',
  phone: '',
  role: 'faculty',
  department_id: null,
  position: '',
  academic_position: '',
  is_active: true
});
const originalRole = ref('faculty');
const departments  = ref([]);
const loading      = ref(false);
const pageLoading  = ref(false);
const error        = ref('');

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
    const { data: deptData } = await api.get('/departments');
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
      form.value = {
        name:          stateUser.name || '',
        email:         stateUser.email || '',
        phone:         stateUser.phone || '',
        role:          stateUser.role || 'faculty',
        department_id: stateUser.department?.id ?? null,
        position:      stateUser.position || '',
        academic_position: stateUser.academic_position || '',
        is_active:     stateUser.is_active ?? true
      };
      originalRole.value = stateUser.role || 'faculty';
    } else {
      const { data } = await api.get('/users');
      const found = (data.data || []).find(u => String(u.id) === String(route.params.id));
      if (found) {
        form.value = {
          name:          found.name || '',
          email:         found.email || '',
          phone:         found.phone || '',
          role:          found.role || 'faculty',
          department_id: found.department?.id ?? null,
          position:      found.position || '',
          academic_position: found.academic_position || '',
          is_active:     found.is_active ?? true
        };
        originalRole.value = found.role || 'faculty';
      }
    }
  } finally {
    pageLoading.value = false;
  }
});

const handleSubmit = async () => {
  error.value = '';
  if (!form.value.name.trim())  { error.value = 'กรุณากรอกชื่อ-นามสกุล'; return; }
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
    await api.put(`/users/${route.params.id}`, {
      name:              form.value.name.trim(),
      email:             form.value.email.trim(),
      phone:             form.value.phone || null,
      role:              form.value.role,
      department_id:     CENTRAL_ROLES.has(form.value.role) ? null : (form.value.department_id || null),
      position:          form.value.position || null,
      academic_position: form.value.academic_position || null,
      is_active:         form.value.is_active
    });
    router.push('/users');
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
  } finally {
    loading.value = false;
  }
};
</script>
