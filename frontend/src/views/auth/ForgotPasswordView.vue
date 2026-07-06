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

        <!-- ── Sent state ── -->
        <div v-if="sent" class="px-7 py-10 text-center">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <PhEnvelopeSimpleOpen class="w-8 h-8 text-emerald-500" weight="fill" />
          </div>
          <h1 class="text-lg font-bold text-gray-900">ตรวจสอบอีเมลของท่าน</h1>
          <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">
            หากอีเมล <span class="font-semibold text-gray-700">{{ email }}</span> มีบัญชีในระบบ ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว โดยลิงก์ใช้งานได้เพียงครั้งเดียว และจะหมดอายุภายใน 1 ชั่วโมง
          </p>
          <RouterLink to="/login"
            class="mt-6 inline-flex items-center justify-center w-full rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white border border-primary-800 shadow-sm hover:bg-primary-800 active:scale-[0.98] transition-all duration-150">
            กลับหน้าเข้าสู่ระบบ
          </RouterLink>
        </div>

        <!-- ── Form ── -->
        <form v-else @submit.prevent="handleSubmit">
          <div class="border-b border-gray-100 px-7 pt-6 pb-4">
            <h1 class="text-lg font-bold text-gray-900">ลืมรหัสผ่าน</h1>
            <p class="text-sm text-gray-500 mt-1">กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้</p>
          </div>

          <div class="px-7 py-6 space-y-4">
            <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 flex items-start gap-2.5">
              <PhWarning class="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p class="text-xs font-medium text-red-700 leading-relaxed">{{ error }}</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
              <div class="relative">
                <PhEnvelope class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input v-model="email" type="email" autocomplete="email" placeholder="you@nu.ac.th"
                  class="block w-full rounded-xl border border-gray-300 py-3 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
              </div>
            </div>
          </div>

          <div class="px-7 pb-7 space-y-3">
            <button type="submit" :disabled="loading || !email"
              class="cursor-pointer inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white border border-primary-800 shadow-sm hover:bg-primary-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
              {{ loading ? 'กำลังส่ง…' : 'ส่งลิงก์ตั้งรหัสผ่าน' }}
            </button>
            <RouterLink to="/login"
              class="inline-flex items-center justify-center w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150">
              กลับหน้าเข้าสู่ระบบ
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '@/services/authService';
import { PhEnvelope, PhEnvelopeSimpleOpen, PhWarning } from '@phosphor-icons/vue';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import loginBg from '@/assets/images/login-bg.jpg';

const email   = ref('');
const loading = ref(false);
const error   = ref('');
const sent    = ref(false);

const handleSubmit = async () => {
  error.value = '';
  if (!email.value.trim()) { error.value = 'กรุณากรอกอีเมล'; return; }
  loading.value = true;
  try {
    await authService.forgotPassword(email.value.trim());
    sent.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
};
</script>
