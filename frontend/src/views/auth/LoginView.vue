<template>
  <div class="min-h-screen flex flex-col lg:flex-row">

    <!-- ─── Left: Identity + Announcements ─── -->
    <aside class="relative flex flex-col w-full lg:w-[52%] shrink-0 overflow-hidden min-h-[260px] sm:min-h-[360px] lg:min-h-screen">
      <!-- Background photo — แสดงเต็ม -->
      <div class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${loginBg})` }"></div>

      <!-- Layer 1: Primary base 62% — inline เพราะ overlay ซ้อนชั้นต้องการค่าแน่นอน -->
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
          <!-- ตรา มน. — พื้นขาว badge เดียวกับฝั่งขวา ให้เด่นเท่ากัน -->
          <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img :src="nuLogo" alt="มหาวิทยาลัยนเรศวร" class="w-full h-full object-contain p-0.5" />
          </div>
          <!-- โลโก้คณะ -->
          <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img :src="logoSci" alt="คณะวิทยาศาสตร์" class="w-full h-full object-contain p-0.5" />
          </div>
          <div class="border-l border-white/15 pl-3">
            <p class="text-sm font-bold text-white/90 leading-tight">ระบบบริหารจัดการหลักสูตร</p>
            <p class="text-xs text-white/55 mt-0.5">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
          </div>
        </div>


        <!-- Announcements — flex-1, กลมกลืนกับพื้นหลัง -->
        <div class="flex-1 flex flex-col min-h-0 mt-6">

          <div v-if="announcements.length > 0"
            @mouseenter="pauseSlideshow" @mouseleave="resumeSlideshow"
            class="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden border border-white/15 backdrop-blur-md"
            style="background: rgba(31,14,104,0.55);">

            <!-- Header — ไม่มี bg แยก ใช้ border แทน -->
            <div class="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
              <!-- Pill badge — แคปซูลมนพื้นจาง (ไม่ใส่ letter-spacing เพราะตัวไทยจะเพี้ยน) -->
              <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold text-white/70">
                ประกาศล่าสุด
              </span>
              <div v-if="announcements.length > 1" class="flex items-center gap-0.5">
                <button @click="prevSlide" aria-label="ประกาศก่อนหน้า"
                  class="p-1.5 rounded-xl text-white/30 hover:text-white/70 active:scale-[0.88] transition-all duration-150 ease-ios">
                  <PhCaretLeft class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span class="text-[10px] text-white/30 tabular-nums w-7 text-center">
                  {{ currentSlide + 1 }}/{{ announcements.length }}
                </span>
                <button @click="nextSlide" aria-label="ประกาศถัดไป"
                  class="p-1.5 rounded-xl text-white/30 hover:text-white/70 active:scale-[0.88] transition-all duration-150 ease-ios">
                  <PhCaretRight class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Slide area — min-h เป็น safety net กัน collapse -->
            <div class="relative flex-1 min-h-[260px]">
              <transition name="fade">
                <div v-if="announcements[currentSlide]" :key="currentSlide" class="absolute inset-0 flex flex-col">

                  <!-- รูปภาพ — มีระยะขอบ + มุมมน ให้ลอยในการ์ด ไม่ตัดขอบแข็ง -->
                  <div class="shrink-0 px-4 pt-4" style="max-height: 50%;">
                    <img v-if="announcements[currentSlide].image_url"
                      :src="announcements[currentSlide].image_url"
                      class="w-full object-contain rounded-xl border border-white/10"
                      style="max-height: 100%; display: block;"
                      :alt="announcements[currentSlide].title" />
                    <div v-else class="py-8 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03]">
                      <PhMegaphone class="w-10 h-10 text-white/15" />
                    </div>
                  </div>

                  <!-- ข้อความ — ไม่มี line-clamp, scroll ได้ -->
                  <div class="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                    <p class="text-[11px] text-white/40">
                      {{ formatDate(announcements[currentSlide].created_at) }}
                    </p>
                    <p class="text-sm font-semibold font-heading text-white leading-snug">
                      {{ announcements[currentSlide].title }}
                    </p>
                    <p class="text-xs text-white/80 leading-relaxed">
                      {{ announcements[currentSlide].content }}
                    </p>
                    <a v-if="announcements[currentSlide].link_url"
                      :href="announcements[currentSlide].link_url"
                      target="_blank" rel="noopener noreferrer" @click.stop
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-primary-300 hover:text-white transition-all duration-150 ease-ios pt-0.5">
                      <PhArrowSquareOut class="w-3 h-3" />
                      อ่านเพิ่มเติม
                    </a>

                    <!-- ไฟล์แนบ — ดาวน์โหลดได้ (route public) -->
                    <div v-if="announcements[currentSlide].attachments?.length" class="pt-1.5 space-y-1">
                      <a v-for="att in announcements[currentSlide].attachments" :key="att.id"
                        :href="`/api/announcements/attachments/${att.id}/download`"
                        target="_blank" rel="noopener noreferrer" @click.stop
                        class="flex items-center gap-1.5 text-[11px] font-medium text-white/70 hover:text-white transition-all duration-150 ease-ios">
                        <PhPaperclip class="w-3 h-3 shrink-0" />
                        <span class="truncate">{{ att.original_name }}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Dot indicators -->
            <div v-if="announcements.length > 1"
              class="flex gap-1.5 py-2.5 justify-center border-t border-white/10 shrink-0">
              <button v-for="(_, i) in announcements" :key="i" @click="goToSlide(i)"
                :aria-label="`ไปประกาศที่ ${i + 1}`"
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

        <!-- Footer — ไม่มีเส้นคั่น ใช้ระยะห่างแทน -->
        <div class="mt-8">
          <p class="text-[11px] text-white/30">
            © 2026 คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
          </p>
        </div>
      </div>
    </aside>

    <!-- ─── Right: Login form ─── -->
    <main class="flex-1 flex flex-col items-center justify-center bg-gray-50 px-5 py-10 sm:px-8">
      <div class="w-full max-w-[400px] space-y-3">

        <!-- Login card -->
        <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-6 py-8 sm:px-9 sm:py-9 space-y-7">

          <!-- Heading — ฝั่งนี้เป็น "action" ไม่ย้ำโลโก้/ชื่อระบบ (อยู่ฝั่งซ้ายแล้ว) -->
          <div>
            <h1 class="text-[26px] font-semibold text-gray-900 leading-tight">เข้าสู่ระบบ</h1>
            <p class="text-sm text-gray-500 mt-2">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700 block">อีเมล</label>
              <div class="relative group">
                <PhEnvelope class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                <input v-model="form.email" type="email" required autocomplete="email"
                  placeholder="ชื่อบัญชี@nu.ac.th"
                  class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none placeholder:text-gray-400 text-gray-900" />
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 block">รหัสผ่าน</label>
                <RouterLink to="/forgot-password"
                  class="text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors">
                  ลืมรหัสผ่าน?
                </RouterLink>
              </div>
              <div class="relative group">
                <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required
                  autocomplete="current-password" placeholder="••••••••"
                  class="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none placeholder:text-gray-400 text-gray-900" />
                <button type="button" @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-all duration-150 ease-ios">
                  <PhEyeSlash v-if="showPassword" class="w-4 h-4" />
                  <PhEye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
              <PhInfo class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p class="text-xs font-medium text-red-700">{{ error }}</p>
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
              class="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.97] transition-all ease-ios disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20 mt-1">
              <span v-if="loading" class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                กำลังตรวจสอบ…
              </span>
              <span v-else class="flex items-center gap-2">
                <PhSignIn class="w-4 h-4" />
                เข้าสู่ระบบ
              </span>
            </button>

          </form>

          <!-- Register prompt -->
          <p class="text-center text-sm text-gray-500 pt-1 border-t border-gray-100">
            ยังไม่มีบัญชีในระบบ?
            <router-link to="/register"
              class="group relative font-semibold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-0.5 align-middle ml-0.5">
              <span class="relative">
                ขอสิทธิ์เข้าใช้งาน
                <span class="absolute left-0 -bottom-0.5 h-0.5 w-full origin-left scale-x-0 rounded-full bg-primary-500 transition-transform duration-300 ease-ios group-hover:scale-x-100"></span>
              </span>
              <PhCaretRight weight="bold" class="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </router-link>
          </p>

        </div>

        <!-- System note — ลอยอยู่ใต้ card -->
        <p class="text-center text-xs text-gray-400 leading-relaxed px-2">
          ระบบสำหรับบุคลากรคณะวิทยาศาสตร์เท่านั้น<br class="hidden sm:inline" />
          หากพบปัญหา ติดต่อผู้ดูแลระบบ
        </p>

      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { formatThaiDate } from '@/utils/date';
import loginBg from '@/assets/images/login-bg.jpg';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import {
  PhInfo,
  PhEnvelope, PhLockSimple, PhEye, PhEyeSlash,
  PhArrowSquareOut, PhCaretLeft, PhCaretRight,
  PhMegaphone, PhSignIn, PhPaperclip
} from '@phosphor-icons/vue';

const SLIDESHOW_INTERVAL_MS = 6_000;

const router = useRouter();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
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

// หยุด slideshow ตอนเอาเมาส์ชี้ (ผู้ใช้กำลังอ่าน) แล้วเดินต่อเมื่อเมาส์ออก
const pauseSlideshow = () => clearInterval(slideTimer);
const resumeSlideshow = () => resetTimer();

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
/* สไลด์ประกาศ — fade + ดริฟต์ขึ้นเล็กน้อย (ease-out-quint) ให้ดูลื่น ไม่กระตุก */
.fade-enter-active {
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* เคารพผู้ใช้ที่ปิดแอนิเมชัน — เหลือแค่ fade สั้น ๆ ไม่มีการเลื่อน */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
}
</style>
