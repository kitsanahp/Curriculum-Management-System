<template>
 <div class="min-h-screen flex flex-col lg:flex-row">

 <!-- ─── Left: Identity + Announcements ─── -->
 <aside class="relative flex flex-col w-full lg:w-[52%] shrink-0 overflow-hidden min-h-[260px] sm:min-h-[360px] lg:min-h-screen">
 <!-- Background photo — แสดงเต็ม -->
 <div class="absolute inset-0 bg-cover bg-center"
 :style="{ backgroundImage: `url(${loginBg})` }"></div>

 <!-- Layer 1: Primary base 62% -->
 <div class="absolute inset-0" style="background: rgba(49, 46, 129, 0.62);"></div>

 <!-- Layer 2: Vignette gradient — บน/ล่างเข้ม กลางโปร่ง -->
 <div class="absolute inset-0"
 style="background: linear-gradient(to bottom,
 rgba(49,46,129,0.55) 0%,
 rgba(49,46,129,0.15) 35%,
 rgba(49,46,129,0.15) 65%,
 rgba(49,46,129,0.60) 100%
 );"></div>

 <!-- Accent line -->
 <div class="relative z-10 h-[2px] bg-primary-400/50 shrink-0"></div>

 <div class="relative z-10 flex flex-col flex-1 px-5 py-5 sm:px-8 sm:py-8 lg:px-14 lg:py-10">

 <!-- University branding -->
 <div class="flex items-center gap-3">
 <img :src="nuLogo" alt="Naresuan University" class="h-10 w-auto shrink-0 opacity-90" />
 <img :src="logoSci" alt="Faculty of Science"
 class="h-10 w-10 rounded-full object-contain border border-white/15 p-0.5 opacity-90" />
 <div class="border-l border-white/15 pl-3">
 <p class="text-sm font-bold text-white/90 leading-tight">ระบบบริหารจัดการหลักสูตร</p>
 <p class="text-xs text-white/55 mt-0.5">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
 </div>
 </div>


 <!-- Announcements — flex-1, กลมกลืนกับพื้นหลัง -->
 <div class="flex-1 flex flex-col min-h-0 mt-6">

 <div v-if="announcements.length > 0"
 class="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden border border-white/15 backdrop-blur-md"
 style="background: rgba(31,14,104,0.55);">

 <!-- Header — ไม่มี bg แยก ใช้ border แทน -->
 <div class="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
 <div class="flex items-center gap-2">
 <span class="w-1.5 h-1.5 rounded-full bg-accent-400/80 shrink-0"></span>
 <span class="text-[10px] font-medium text-white/50 tracking-[0.12em] uppercase">ประกาศล่าสุด</span>
 </div>
 <div v-if="announcements.length > 1" class="flex items-center gap-0.5">
 <button @click="prevSlide"
 class="p-1.5 rounded-xl text-white/30 hover:text-white/70 active:scale-[0.88] transition-all duration-150 ease-ios">
 <PhCaretLeft class="w-3.5 h-3.5" />
 </button>
 <span class="text-[10px] text-white/30 tabular-nums w-7 text-center">
 {{ currentSlide + 1 }}/{{ announcements.length }}
 </span>
 <button @click="nextSlide"
 class="p-1.5 rounded-xl text-white/30 hover:text-white/70 active:scale-[0.88] transition-all duration-150 ease-ios">
 <PhCaretRight class="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 <!-- Slide area — min-h เป็น safety net กัน collapse -->
 <div class="relative flex-1 min-h-[260px]">
 <transition-group name="fade">
 <template v-for="(announcement, index) in announcements" :key="announcement.id || index">
 <div v-if="index === currentSlide" class="absolute inset-0 flex flex-col">

 <!-- รูปภาพ — ใช้ overlay gradient ให้กลืนกับพื้นม่วง -->
 <div class="shrink-0 relative overflow-hidden" style="max-height: 50%;">
 <img v-if="announcement.image_url"
 :src="announcement.image_url"
 class="w-full object-contain"
 style="max-height: 100%; display: block;"
 :alt="announcement.title" />
 <div v-else class="py-10 flex flex-col items-center gap-2">
 <PhMegaphone class="w-10 h-10 text-white/15" />
 </div>
 <!-- Bottom fade ให้รูปเบลนกับเนื้อหาด้านล่าง -->
 <div v-if="announcement.image_url"
 class="absolute bottom-0 inset-x-0 h-8"
 style="background: linear-gradient(to bottom, transparent, rgba(31,14,104,0.93));"></div>
 </div>

 <!-- ข้อความ — ไม่มี line-clamp, scroll ได้ -->
 <div class="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
 <p class="text-[11px] text-white/40">
 {{ formatDate(announcement.created_at) }}
 </p>
 <p class="text-sm font-semibold text-white leading-snug">
 {{ announcement.title }}
 </p>
 <p class="text-xs text-white/80 leading-relaxed">
 {{ announcement.content }}
 </p>
 <a v-if="announcement.link_url"
 :href="announcement.link_url"
 target="_blank" rel="noopener noreferrer" @click.stop
 class="inline-flex items-center gap-1 text-[11px] font-medium text-primary-300 hover:text-white transition-all duration-150 ease-ios pt-0.5">
 <PhArrowSquareOut class="w-3 h-3" />
 อ่านเพิ่มเติม
 </a>
 </div>
 </div>
 </template>
 </transition-group>
 </div>

 <!-- Dot indicators -->
 <div v-if="announcements.length > 1"
 class="flex gap-1.5 py-2.5 justify-center border-t border-white/10 shrink-0">
 <button v-for="(_, i) in announcements" :key="i" @click="goToSlide(i)"
 :class="['h-[2px] rounded-full transition-all duration-300 ease-ios',
 i === currentSlide ? 'bg-white/60 w-6' : 'bg-white/15 w-2 hover:bg-white/30']">
 </button>
 </div>
 </div>

 <!-- No announcements -->
 <div v-else class="flex-1 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
 <PhMegaphone class="w-8 h-8 text-white/15" />
 <p class="text-xs text-white/30">ยังไม่มีประกาศในขณะนี้</p>
 </div>
 </div>

 <!-- Footer -->
 <div class="mt-8 pt-4 border-t border-white/10">
 <p class="text-[11px] text-white/30">
 © 2026 คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
 </p>
 </div>
 </div>
 </aside>

 <!-- ─── Right: Login form ─── -->
 <main class="flex-1 flex flex-col bg-white">

 <!-- Accent strip -->
 <div class="h-[2px] shrink-0 bg-primary-400/40"></div>

 <div class="flex-1 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
 <div class="w-full max-w-[380px] mx-auto space-y-8">

  <!-- Heading -->
  <div>
  <h2 class="text-[28px] font-black text-primary-900 tracking-tight leading-none">เข้าสู่ระบบ</h2>
  <p class="text-sm text-gray-400 mt-2">ระบบบริหารหลักสูตร คณะวิทยาศาสตร์</p>
  </div>

  <!-- Form -->
  <form @submit.prevent="handleLogin" class="space-y-5">

  <!-- Email -->
  <div class="space-y-2">
  <label class="text-sm font-medium text-gray-600 block">อีเมล</label>
  <div class="relative">
  <PhEnvelope class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  <input v-model="form.email" type="email" required autocomplete="email"
   placeholder="ชื่อบัญชี@nu.ac.th"
   class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none placeholder:text-gray-400 text-gray-900" />
  </div>
  </div>

  <!-- Password -->
  <div class="space-y-2">
  <label class="text-sm font-medium text-gray-600 block">รหัสผ่าน</label>
  <div class="relative">
  <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required
   autocomplete="current-password" placeholder="••••••••"
   class="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none placeholder:text-gray-400 text-gray-900" />
  <button type="button" @click="showPassword = !showPassword"
   class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-all duration-150 ease-ios">
   <PhEyeSlash v-if="showPassword" class="w-4 h-4" />
   <PhEye v-else class="w-4 h-4" />
  </button>
  </div>
  </div>

  <!-- Forgot password -->
  <div class="flex justify-end -mt-1">
    <button type="button" @click="showForgotModal = true"
      class="text-xs text-gray-400 hover:text-primary-600 transition-colors">
      ลืมรหัสผ่าน?
    </button>
  </div>

  <!-- Error -->
  <div v-if="error" class="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
  <PhInfo class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
  <p class="text-xs font-medium text-red-700">{{ error }}</p>
  </div>

  <!-- Submit -->
  <button type="submit" :disabled="loading"
  class="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-600 active:scale-[0.97] transition-all ease-ios disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary-900/20">
  <span v-if="loading" class="flex items-center gap-2">
   <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
   กำลังตรวจสอบ…
  </span>
  <span v-else class="flex items-center gap-2">
   <PhSignOut class="w-4 h-4" />
   เข้าสู่ระบบ
  </span>
  </button>

  </form>

  <!-- Footer Actions -->
  <div class="pt-6 mt-4 flex flex-col gap-6">
    
    <!-- Register Link -->
    <div class="flex items-center justify-center gap-2 text-sm">
      <span class="text-gray-500">ยังไม่มีบัญชีในระบบ</span>
      <router-link to="/register"
        class="font-bold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1 group">
        ขอสิทธิ์เข้าใช้งาน
        <PhCaretRight weight="bold" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </router-link>
    </div>

    <!-- System note -->
    <div class="flex flex-col items-center text-center gap-1.5 pt-5 border-t border-gray-100">
      <div class="flex items-center gap-1.5 text-gray-400">
        <PhInfo class="w-3.5 h-3.5" weight="fill" />
        <span class="text-[11px] font-medium">ระบบสำหรับบุคลากรคณะวิทยาศาสตร์เท่านั้น</span>
      </div>
      <p class="text-[10px] text-gray-400">
        หากพบปัญหาการเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบ
      </p>
    </div>
  
  </div>

 </div>
 </div>
 </main>

 <!-- Forgot password modal -->
 <Teleport to="body">
  <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
    leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
   <div v-if="showForgotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
     @click.self="showForgotModal = false">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
     <h3 class="text-base font-bold text-gray-900 mb-1">ลืมรหัสผ่าน?</h3>
     <p class="text-sm text-gray-500 leading-relaxed mb-4">
       กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน
     </p>
     <div class="bg-gray-50 rounded-xl p-3.5 mb-4 flex items-center gap-3">
      <PhEnvelope class="w-4 h-4 text-primary-500 shrink-0" />
      <a href="mailto:infosci@nu.ac.th" class="text-sm font-semibold text-primary-600 hover:underline">infosci@nu.ac.th</a>
     </div>
     <button @click="showForgotModal = false"
       class="w-full py-2.5 rounded-xl bg-primary-600 text-sm font-bold text-white hover:bg-primary-500 active:scale-[0.97] transition-all">
       รับทราบ
     </button>
    </div>
   </div>
  </Transition>
 </Teleport>

 </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { formatThaiDate } from '@/utils/date';
import loginBg from '@/assets/images/login-bg.jpg';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import {
 PhInfo, PhGraduationCap,
 PhEnvelope, PhLockSimple, PhEye, PhEyeSlash,
 PhArrowSquareOut, PhCaretLeft, PhCaretRight,
 PhMegaphone, PhSignOut
} from '@phosphor-icons/vue';

const SLIDESHOW_INTERVAL_MS = 6_000;

const router = useRouter();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const showForgotModal = ref(false);
const announcements = ref([]);
const currentSlide = ref(0);
let slideTimer = null;

const goToSlide = (i) => { currentSlide.value = i; resetTimer(); };
const prevSlide = () => {
 if (announcements.value.length > 1) {
 currentSlide.value = (currentSlide.value - 1 + announcements.value.length) % announcements.value.length;
 resetTimer();
 }
};
const nextSlide = () => {
 if (announcements.value.length > 1) {
 currentSlide.value = (currentSlide.value + 1) % announcements.value.length;
 resetTimer();
 }
};
const resetTimer = () => {
 clearInterval(slideTimer);
 if (announcements.value.length > 1) {
 slideTimer = setInterval(() => {
 currentSlide.value = (currentSlide.value + 1) % announcements.value.length;
 }, SLIDESHOW_INTERVAL_MS);
 }
};

watch(
 () => announcements.value,
 (newVals) => {
 if (newVals && newVals.length > 1) {
 resetTimer();
 }
 },
 { deep: true }
);

const formatDate = formatThaiDate;

const handleLogin = async () => {
 loading.value = true;
 error.value = '';
 try {
 const response = await axios.post('/api/auth/login', {
   email: form.value.email,
   password: form.value.password
 }, { withCredentials: true });

 const { user } = response.data;

 localStorage.setItem('user', JSON.stringify(user));
 localStorage.removeItem('_devOriginalRole');

 authStore.user = user;

 router.push('/');
 } catch (e) {
 error.value = e.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
 } finally {
 loading.value = false;
 }
};

onMounted(async () => {
 try {
 const { data } = await axios.get('/api/announcements/public');
 announcements.value = data.data || [];
 } catch {}
});

onUnmounted(() => clearInterval(slideTimer));
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
 transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
 opacity: 0;
}
</style>