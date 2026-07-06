<template>
  <div class="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">

    <!-- Background photo & Overlays -->
    <div class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url(${loginBg})` }"></div>
    <div class="absolute inset-0" style="background: rgba(49, 46, 129, 0.62);"></div>
    <div class="absolute inset-0"
      style="background: linear-gradient(to bottom,
        rgba(49,46,129,0.55) 0%,
        rgba(49,46,129,0.15) 35%,
        rgba(49,46,129,0.15) 65%,
        rgba(49,46,129,0.60) 100%
      );"></div>

    <div class="relative z-10 w-full max-w-md">

      <!-- Branding -->
      <div class="flex items-center justify-center gap-3 mb-6 text-left">
        <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
          <img :src="nuLogo" alt="มหาวิทยาลัยนเรศวร" class="w-full h-full object-contain p-0.5" />
        </div>
        <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
          <img :src="logoSci" alt="คณะวิทยาศาสตร์" class="w-full h-full object-contain p-0.5" />
        </div>
        <div class="border-l border-white/20 pl-3">
          <p class="text-sm font-bold text-white leading-tight">ระบบบริหารจัดการหลักสูตร</p>
          <p class="text-xs text-white/70 mt-0.5">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        <!-- ── Success state ── -->
        <div v-if="done" class="px-7 py-10 text-center">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <PhCheckCircle class="w-8 h-8 text-emerald-500" weight="fill" />
          </div>
          <h1 class="text-lg font-bold text-gray-900">ตั้งรหัสผ่านใหม่สำเร็จ</h1>
          <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว</p>
          <RouterLink to="/login"
            class="mt-6 inline-flex items-center justify-center w-full rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white border border-primary-800 shadow-sm hover:bg-primary-800 active:scale-[0.98] transition-all duration-150">
            ไปหน้าเข้าสู่ระบบ
          </RouterLink>
        </div>

        <!-- ── Invalid link state ── -->
        <div v-else-if="!token" class="px-7 py-10 text-center">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <PhWarning class="w-8 h-8 text-red-500" />
          </div>
          <h1 class="text-lg font-bold text-gray-900">ลิงก์ไม่ถูกต้อง</h1>
          <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">ไม่พบรหัสยืนยันในลิงก์ กรุณาเปิดจากอีเมลฉบับล่าสุด หรือติดต่อเจ้าหน้าที่เพื่อขอลิงก์ใหม่</p>
          <RouterLink to="/login"
            class="mt-6 inline-flex items-center justify-center w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150">
            กลับหน้าเข้าสู่ระบบ
          </RouterLink>
        </div>

        <!-- ── Form ── -->
        <form v-else @submit.prevent="handleSubmit">
          <div class="border-b border-gray-100 px-7 pt-6 pb-4">
            <h1 class="text-lg font-bold text-gray-900">ตั้งรหัสผ่านใหม่</h1>
            <p class="text-sm text-gray-500 mt-1">กำหนดรหัสผ่านใหม่สำหรับบัญชีของท่าน</p>
          </div>

          <div class="px-7 py-6 space-y-4">

            <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 flex items-start gap-2.5">
              <PhWarning class="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p class="text-xs font-medium text-red-700 leading-relaxed">{{ error }}</p>
            </div>

            <!-- New password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
              <div class="relative">
                <PhLockKey class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="password" :type="show ? 'text' : 'password'" autocomplete="new-password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                <button type="button" @click="show = !show" :aria-label="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <component :is="show ? PhEyeSlash : PhEye" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Confirm password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <div class="relative">
                <PhLockKey class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="confirm" :type="show ? 'text' : 'password'" autocomplete="new-password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
              <p v-if="confirm && confirm !== password" class="mt-1.5 text-xs font-medium text-red-500">รหัสผ่านไม่ตรงกัน</p>
            </div>

          </div>

          <div class="px-7 pb-7">
            <button type="submit" :disabled="loading || !canSubmit"
              class="cursor-pointer inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white border border-primary-800 shadow-sm hover:bg-primary-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
              {{ loading ? 'กำลังบันทึก…' : 'ยืนยันรหัสผ่านใหม่' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { authService } from '@/services/authService';
import { PhCheckCircle, PhWarning, PhLockKey, PhEye, PhEyeSlash } from '@phosphor-icons/vue';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import loginBg from '@/assets/images/login-bg.jpg';

const route = useRoute();
const token = ref(route.query.token || '');

const password = ref('');
const confirm  = ref('');
const show     = ref(false);
const loading  = ref(false);
const error    = ref('');
const done     = ref(false);

const canSubmit = computed(() => password.value.length >= 8 && password.value === confirm.value);

const handleSubmit = async () => {
  error.value = '';
  if (password.value.length < 8) { error.value = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'; return; }
  if (password.value !== confirm.value) { error.value = 'รหัสผ่านยืนยันไม่ตรงกัน'; return; }

  loading.value = true;
  try {
    await authService.resetPassword(token.value, password.value);
    done.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || 'ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
};
</script>
