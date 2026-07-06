<template>
  <header
    class="relative bg-white/95 backdrop-blur-md border-b border-gray-200/80 h-16 px-4 lg:px-6 flex items-center justify-between shrink-0 z-20">

    <!-- ── Left: Hamburger + Page Title ──────────────────────────────────── -->
    <!-- flex-1 + min-w-0: ฝั่งซ้ายเป็นตัวยืด/ตัด (truncate) ฝั่งขวาคงขนาดเสมอ -->
    <div class="flex flex-1 items-center gap-2 min-w-0">
      <!-- Hamburger (toggle menu) - Premium Design -->
      <button v-show="showMenuButton" aria-label="เปิดเมนู" @click="$emit('toggle-menu')"
        class="group w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 ease-ios active:scale-90">
        <!-- แสดง Hamburger บนมือถือ (จอเล็ก) และลูกศรคู่บน Desktop (จอใหญ่) -->
        <PhList class="md:hidden w-5 h-5 transition-transform duration-200 ease-out group-hover:scale-110" weight="bold" aria-hidden="true" />
        <PhCaretDoubleRight class="hidden md:block w-5 h-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" weight="bold" aria-hidden="true" />
      </button>

      <!-- Breadcrumb — sticky page location -->
      <Breadcrumb root class="min-w-0" />
    </div>

    <!-- ── Right: Actions + User ──────────────────────────────────────────── -->
    <div class="flex items-center gap-2 shrink-0 pl-2">

      <!-- Notification bell -->
      <div class="relative">
        <button :aria-label="showNotif ? 'ปิดการแจ้งเตือน' : 'ดูการแจ้งเตือน'" :aria-expanded="showNotif"
          aria-haspopup="true" @click="showNotif = !showNotif"
          class="relative w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 ease-ios active:scale-90 group">
          <PhBell class="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
          <span v-if="notifStore.unreadCount > 0"
            class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-status-danger text-white rounded-full flex items-center justify-center border-2 border-white font-bold leading-none animate-badge-bounce"
            style="font-size: 10px;">
            {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
          </span>
        </button>

        <!-- Click-outside overlay -->
        <div v-if="showNotif" class="fixed inset-0 z-[199]" @click="showNotif = false"></div>

        <!-- Dropdown — uses elev-3 shadow token -->
        <Transition name="notif-drop">
          <div v-if="showNotif"
            class="fixed right-2 sm:right-4 lg:right-6 top-20 w-[calc(100vw-2rem)] sm:w-[340px] max-w-[340px] bg-white rounded-2xl shadow-elev-3 border border-gray-200/80 z-[200] overflow-hidden">

            <!-- Header -->
            <div class="px-4 pt-3.5 pb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-900">การแจ้งเตือน</span>
                <span v-if="notifStore.unreadCount > 0"
                  class="text-xs font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                  {{ notifStore.unreadCount }}
                </span>
              </div>
              <button v-if="notifStore.notifications.length > 0" @click.stop="notifStore.clearAll()"
                class="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1">
                ล้างทั้งหมด
              </button>
            </div>
            <div class="mx-4 h-px bg-gray-100"></div>

            <!-- Notification list -->
            <div class="max-h-[400px] overflow-y-auto">
              <button type="button" v-for="n in displayNotifs" :key="n.id" @click="handleNotifClick(n)"
                :aria-label="`${n.is_read ? '' : 'ยังไม่อ่าน — '}${n.title}`"
                class="w-full text-left flex gap-3 px-4 py-3 transition-all duration-150 ease-ios border-b border-gray-50 last:border-0 active:bg-gray-100 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">

                <!-- Type icon -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  :class="getNotifStyle(n).bg">
                  <component :is="getNotifStyle(n).icon" class="w-4 h-4" :class="getNotifStyle(n).color"
                    aria-hidden="true" />
                </div>

                <!-- Text block -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm leading-snug"
                      :class="!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'">
                      {{ n.titleMain }}<PhCaretRight v-if="n.titleTail" class="inline align-middle w-3 h-3 mx-0.5 text-gray-400" weight="bold" aria-hidden="true" /><span v-if="n.titleTail">{{ n.titleTail }}</span>
                    </p>
                    <span v-if="!n.is_read" class="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1"
                      aria-hidden="true"></span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {{ n.message }}
                  </p>
                  <p v-if="n.createdAt" class="text-xs text-gray-500 mt-1">
                    {{ relativeTime(n.createdAt) }}
                  </p>
                </div>
              </button>

              <!-- Empty state -->
              <div v-if="!notifStore.notifications.length" class="py-12 px-4 text-center">
                <div
                  class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PhBell class="w-5 h-5 text-gray-300" />
                </div>
                <p class="text-sm font-semibold text-gray-500">ไม่มีการแจ้งเตือน</p>
                <p class="text-xs text-gray-500 mt-1">เมื่อมีกิจกรรมใหม่จะแสดงที่นี่</p>
              </div>
            </div>

            <!-- Footer -->
            <div v-if="notifStore.notifications.length > 10"
              class="border-t border-gray-100 px-4 py-2 text-center">
              <p class="text-xs text-gray-500">
                แสดง 10 จาก {{ notifStore.notifications.length }} รายการล่าสุด
              </p>
            </div>

          </div>
        </Transition>
      </div>

      <!-- Divider -->
      <div class="hidden sm:block w-px h-6 bg-gray-200" aria-hidden="true"></div>

      <!-- User Identity + dropdown menu -->
      <div class="relative">
        <button @click="showUserMenu = !showUserMenu" :aria-expanded="showUserMenu" aria-haspopup="true"
          aria-label="เมนูผู้ใช้"
          class="flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 min-h-[44px] rounded-lg hover:bg-gray-100 transition-all duration-150 ease-ios active:scale-[0.98]">
          <!-- Text info (hidden on mobile) -->
          <div class="hidden sm:flex flex-col items-end text-right">
            <span class="text-sm font-semibold text-gray-900 truncate max-w-[150px] lg:max-w-[220px] leading-4">
              {{ formatUserName(authStore.user) || 'ผู้ใช้งานระบบ' }}
            </span>
            <span class="text-xs text-gray-500 mt-0.5 truncate max-w-[150px] lg:max-w-[220px] leading-4">
              {{ displayRoleLabel }}
            </span>
          </div>

          <!-- Avatar -->
          <UserAvatar :name="authStore.user?.name" :role="authStore.user?.role" size="md" :online="true"
            class="ring-2 ring-transparent rounded-full" />
          <PhCaretDown class="hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': showUserMenu }" aria-hidden="true" />
        </button>

        <!-- Click-outside overlay -->
        <div v-if="showUserMenu" class="fixed inset-0 z-[199]" @click="showUserMenu = false"></div>

        <!-- Dropdown menu -->
        <Transition name="notif-drop">
          <div v-if="showUserMenu"
            class="fixed right-2 sm:right-4 lg:right-6 top-20 w-64 bg-white rounded-2xl shadow-elev-3 border border-gray-200/80 z-[200] overflow-hidden py-1.5">

            <!-- Identity block — avatar + ชื่อ + email + role รวมเป็นก้อนเดียว -->
            <div class="px-4 pt-2.5 pb-3 flex items-center gap-3">
              <UserAvatar :name="authStore.user?.name" :role="authStore.user?.role" size="md" class="shrink-0" />
              <div class="min-w-0">
                <!-- ชื่อยาว → wrap แสดงเต็ม (dropdown มีที่เหลือ) ไม่ตัดหาย -->
                <p class="text-sm font-bold text-gray-900 leading-snug break-words">
                  {{ formatUserName(authStore.user) || 'ผู้ใช้งานระบบ' }}
                </p>
                <p class="text-xs text-gray-500 truncate mt-0.5">
                  {{ authStore.user?.email }}
                </p>
                <span class="flex items-center gap-1 text-xs font-medium text-primary-600 mt-1.5 overflow-hidden">
                  <PhIdentificationBadge class="w-3 h-3 shrink-0" weight="fill" aria-hidden="true" />
                  <span class="truncate">{{ displayRoleLabel }}</span>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore } from '@/stores/locale';
import {
  PhBell, PhX, PhList, PhCaretRight, PhCaretDoubleRight, PhHouse,
  PhMegaphone, PhWarning, PhCheckCircle, PhFileText,
  PhCaretDown, PhIdentificationBadge,
} from '@phosphor-icons/vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import { formatUserName } from '@/utils/user';

defineProps({
  showMenuButton: { type: Boolean, default: false }
});

defineEmits(['toggle-menu']);

const authStore = useAuthStore();
const notifStore = useNotificationStore();
const localeStore = useLocaleStore();
const router = useRouter();
const route = useRoute();
const showNotif = ref(false);
const showUserMenu = ref(false);

// แยก title ที่คั่นด้วย dash (มีช่องว่างรอบ) → ใส่ไอคอนคั่นแทน "—" ตอน render
const splitTitle = (title) => {
  const parts = (title || '').split(/\s+[—–-]\s+/);
  return parts.length === 2 ? { main: parts[0], tail: parts[1] } : { main: title, tail: null };
};
const displayNotifs = computed(() =>
  notifStore.notifications.slice(0, 10).map((n) => {
    const { main, tail } = splitTitle(n.title);
    return { ...n, titleMain: main, titleTail: tail };
  })
);

const onKeydown = (e) => { if (e.key === 'Escape') { showNotif.value = false; showUserMenu.value = false; } };
onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));

const handleNotifClick = async (n) => {
  await notifStore.markRead(n.id);
  showNotif.value = false;

  if (n.curriculum_id) {
    router.push(`/curricula/${n.curriculum_id}`);
  } else if (n.announcement_id) {
    router.push(`/announcements#announcement-${n.announcement_id}`);
  } else if (n.title.includes('ประกาศ') || n.title.includes('Announcement')) {
    router.push('/announcements');
  }
};

const getNotifStyle = (n) => {
  if (n.announcement_id || n.title?.includes('ประกาศ'))
    return { icon: PhMegaphone, bg: 'bg-blue-50', color: 'text-blue-500' };
  if (n.title?.includes('ตีกลับ') || n.title?.includes('ส่งคืน') || n.title?.includes('แก้ไข'))
    return { icon: PhWarning, bg: 'bg-orange-50', color: 'text-orange-500' };
  if (n.title?.includes('อนุมัติ') || n.title?.includes('ผ่าน') || n.title?.includes('เห็นชอบ'))
    return { icon: PhCheckCircle, bg: 'bg-green-50', color: 'text-green-500' };
  if (n.curriculum_id || n.title?.includes('หลักสูตร') || n.title?.includes('เอกสาร'))
    return { icon: PhFileText, bg: 'bg-primary-50', color: 'text-primary-600' };
  return { icon: PhBell, bg: 'bg-gray-100', color: 'text-gray-400' };
};

const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const ROLE_LABELS_TH = {
  admin: 'เจ้าหน้าที่หลักสูตรคณะ',
  faculty: 'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff: 'เจ้าหน้าที่สาขาวิชา',
  registrar: 'เจ้าหน้าที่กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะ',
};

const ROLE_LABELS_EN = {
  admin: 'Faculty Curriculum Officer',
  faculty: 'Curriculum Lecturer',
  staff: 'Department Staff',
  registrar: 'Registrar Officer',
  executive: 'Faculty Executive',
};

const currentLabels = computed(() => localeStore.currentLang === 'th' ? ROLE_LABELS_TH : ROLE_LABELS_EN);

const displayRoleLabel = computed(() => {
  const role = authStore.user?.role;
  if (role === 'executive' && authStore.user?.position) {
    return authStore.user.position;
  }
  return currentLabels.value[role] ?? role;
});

// Dynamic Page Title for Breadcrumbs
const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith('/faculty') || path.startsWith('/dashboard') || path.startsWith('/registrar')) {
    return localeStore.currentLang === 'th' ? 'ภาพรวม' : 'Overview';
  }
  if (path.startsWith('/curricula/archived')) {
    return localeStore.currentLang === 'th' ? 'ประวัติการยกเลิก' : 'Archived Curricula';
  }
  if (path.startsWith('/curricula')) {
    return localeStore.currentLang === 'th' ? 'รายการหลักสูตร' : 'Curricula List';
  }
  if (path.startsWith('/announcements')) {
    return localeStore.currentLang === 'th' ? 'ประกาศ' : 'Announcements';
  }
  if (path.startsWith('/downloads')) {
    return localeStore.currentLang === 'th' ? 'รายการหลักสูตร' : 'Curricula List';
  }
  if (path.startsWith('/resources')) {
    return localeStore.currentLang === 'th' ? 'แบบฟอร์มและเอกสาร' : 'Forms & Resources';
  }
  if (path.startsWith('/users')) {
    return localeStore.currentLang === 'th' ? 'บัญชีผู้ใช้' : 'User Management';
  }
  if (path.startsWith('/master-data')) {
    return localeStore.currentLang === 'th' ? 'ภาควิชาและชื่อวุฒิ' : 'Departments & Degree Titles';
  }
  if (path.startsWith('/highlights')) {
    return localeStore.currentLang === 'th' ? 'หมายเหตุในเอกสาร' : 'Document Highlights';
  }
  return '';
});
</script>

<style scoped>
.notif-drop-enter-active {
  transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.notif-drop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.notif-drop-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.notif-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
