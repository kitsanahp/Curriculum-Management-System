<template>
  <header
    class="relative bg-white/95 dark:bg-[color-mix(in_srgb,var(--dm-surface)_92%,transparent)] backdrop-blur-md border-b border-gray-200 dark:border-[var(--dm-border)] h-16 px-4 lg:px-6 flex items-center justify-between shrink-0 z-20"
    style="transition: background-color 0.25s ease, border-color 0.25s ease;">

    <!-- ── Left: Hamburger + Page Title ──────────────────────────────────── -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Hamburger (mobile only) -->
      <button aria-label="เปิด/ปิด เมนู" @click="$emit('toggle-menu')"
        class="md:hidden w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 ease-ios active:scale-90">
        <PhList class="w-5 h-5" aria-hidden="true" />
      </button>

      <!-- Page title (replaces decorative breadcrumb) -->
      <h1 class="font-semibold text-gray-900 dark:text-[var(--dm-text-1)] truncate"
        style="font-size: 16px; line-height: 24px;">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- ── Right: Actions + User ──────────────────────────────────────────── -->
    <div class="flex items-center gap-2">

      <!-- Notification bell -->
      <div class="relative">
        <button :aria-label="showNotif ? 'ปิดการแจ้งเตือน' : 'ดูการแจ้งเตือน'" :aria-expanded="showNotif"
          aria-haspopup="true" @click="showNotif = !showNotif"
          class="relative w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-primary-900/30 transition-all duration-150 ease-ios active:scale-90 group">
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
            class="fixed right-2 sm:right-4 lg:right-6 top-[calc(4rem+6px)] w-[calc(100vw-1rem)] sm:w-[340px] max-w-[340px] bg-white dark:bg-[var(--dm-surface)] rounded-lg shadow-elev-3 border border-gray-200 dark:border-[var(--dm-border-strong)] z-[200] overflow-hidden">

            <!-- Header -->
            <div class="px-4 pt-3.5 pb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-900 dark:text-[var(--dm-text-1)]">การแจ้งเตือน</span>
                <span v-if="notifStore.unreadCount > 0"
                  class="text-[10px] font-black bg-primary-600 text-white px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                  {{ notifStore.unreadCount }}
                </span>
              </div>
              <button v-if="notifStore.notifications.length > 0" @click.stop="notifStore.clearAll()"
                class="text-xs font-semibold text-gray-400 hover:text-red-500 dark:text-[var(--dm-text-4)] dark:hover:text-red-400 transition-colors">
                ล้างทั้งหมด
              </button>
            </div>
            <div class="mx-4 h-px bg-gray-100 dark:bg-[var(--dm-border-sub)]"></div>

            <!-- Notification list -->
            <div class="max-h-[400px] overflow-y-auto">
              <div v-for="n in notifStore.notifications.slice(0, 10)" :key="n.id" @click="handleNotifClick(n)"
                class="flex gap-3 px-4 py-3 cursor-pointer transition-all duration-150 ease-ios border-b border-gray-50 dark:border-[var(--dm-border-sub)] last:border-0 active:bg-gray-100 dark:active:bg-[var(--dm-surface-2)]"
                :class="!n.is_read
                  ? 'hover:bg-gray-50 dark:hover:bg-[var(--dm-surface-2)]'
                  : 'hover:bg-gray-50 dark:hover:bg-[var(--dm-surface-2)]'">

                <!-- Type icon -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  :class="getNotifStyle(n).bg">
                  <component :is="getNotifStyle(n).icon" class="w-4 h-4" :class="getNotifStyle(n).color"
                    aria-hidden="true" />
                </div>

                <!-- Text block -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-[13px] leading-snug"
                      :class="!n.is_read ? 'font-bold text-gray-900 dark:text-[var(--dm-text-1)]' : 'font-medium text-gray-600 dark:text-[var(--dm-text-2)]'">
                      {{ n.title }}
                    </p>
                    <span v-if="!n.is_read" class="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1"
                      aria-hidden="true"></span>
                  </div>
                  <p class="text-[12px] text-gray-500 dark:text-[var(--dm-text-3)] mt-0.5 line-clamp-2 leading-relaxed">
                    {{ n.message }}
                  </p>
                  <p v-if="n.createdAt" class="text-[11px] text-gray-400 dark:text-[var(--dm-text-4)] mt-1">
                    {{ relativeTime(n.createdAt) }}
                  </p>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="!notifStore.notifications.length" class="py-12 px-4 text-center">
                <div
                  class="w-10 h-10 bg-gray-100 dark:bg-[var(--dm-surface-2)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <PhBell class="w-5 h-5 text-gray-300" />
                </div>
                <p class="text-sm font-semibold text-gray-500 dark:text-[var(--dm-text-3)]">ไม่มีการแจ้งเตือน</p>
                <p class="text-xs text-gray-400 dark:text-[var(--dm-text-4)] mt-1">เมื่อมีกิจกรรมใหม่จะแสดงที่นี่</p>
              </div>
            </div>

            <!-- Footer -->
            <div v-if="notifStore.notifications.length > 10"
              class="border-t border-gray-100 dark:border-[var(--dm-border-sub)] px-4 py-2 text-center">
              <p class="text-[11px] text-gray-400 dark:text-[var(--dm-text-4)]">
                แสดง 10 จาก {{ notifStore.notifications.length }} รายการล่าสุด
              </p>
            </div>

          </div>
        </Transition>
      </div>

      <!-- Dark mode toggle — same visual weight as bell -->
      <button :aria-label="isDark ? 'เปลี่ยนเป็น Light mode' : 'เปลี่ยนเป็น Dark mode'" @click="toggleDark"
        class="w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-primary-900/30 transition-all duration-150 ease-ios active:scale-90">
        <Transition name="mode-icon" mode="out-in">
          <PhSun v-if="isDark" key="sun" class="w-5 h-5 text-orange-400" aria-hidden="true" />
          <PhMoon v-else key="moon" class="w-5 h-5" aria-hidden="true" />
        </Transition>
      </button>

      <!-- Divider -->
      <div class="hidden sm:block w-px h-6 bg-gray-200 dark:bg-[var(--dm-border)] mx-1" aria-hidden="true"></div>

      <!-- User Identity — clean, no group hover effects -->
      <div class="flex items-center gap-2.5 pl-1">
        <!-- Text info (hidden on mobile) -->
        <div class="hidden sm:flex flex-col items-end text-right">
          <span class="font-semibold text-gray-900 dark:text-[var(--dm-text-1)] truncate max-w-[180px]"
            style="font-size: 13px; line-height: 16px;">
            {{ authStore.user?.name || 'ผู้ใช้งานระบบ' }}
          </span>
          <span class="text-gray-500 dark:text-[var(--dm-text-3)] mt-0.5 truncate max-w-[180px]"
            style="font-size: 11px; line-height: 14px;">
            {{ currentLabels[authStore.user?.role] }}
          </span>
        </div>

        <!-- Avatar -->
        <UserAvatar :name="authStore.user?.name" :role="authStore.user?.role" size="md" :online="true"
          class="ring-2 ring-transparent hover:ring-primary-100 transition-all duration-150 rounded-full" />
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
import { useDarkMode } from '@/composables/useDarkMode';
import {
  PhBell, PhX, PhList, PhCaretRight, PhHouse, PhSun, PhMoon,
  PhMegaphone, PhWarning, PhCheckCircle, PhFileText,
} from '@phosphor-icons/vue';
import UserAvatar from '@/components/common/UserAvatar.vue';

defineEmits(['toggle-menu']);

const authStore = useAuthStore();
const notifStore = useNotificationStore();
const { isDark, toggle: toggleDark } = useDarkMode();
const localeStore = useLocaleStore();
const router = useRouter();
const route = useRoute();
const showNotif = ref(false);

const onKeydown = (e) => { if (e.key === 'Escape') showNotif.value = false; };
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
    return { icon: PhMegaphone, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-500' };
  if (n.title?.includes('ตีกลับ') || n.title?.includes('ส่งคืน') || n.title?.includes('แก้ไข'))
    return { icon: PhWarning, bg: 'bg-orange-50 dark:bg-orange-900/20', color: 'text-orange-500' };
  if (n.title?.includes('อนุมัติ') || n.title?.includes('ผ่าน') || n.title?.includes('เห็นชอบ'))
    return { icon: PhCheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-500' };
  if (n.curriculum_id || n.title?.includes('หลักสูตร') || n.title?.includes('เอกสาร'))
    return { icon: PhFileText, bg: 'bg-primary-50 dark:bg-primary-900/20', color: 'text-primary-600' };
  return { icon: PhBell, bg: 'bg-gray-100 dark:bg-gray-700', color: 'text-gray-400' };
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
  staff: 'เจ้าหน้าที่ภาควิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'คณบดี/รองคณบดี',
};

const ROLE_LABELS_EN = {
  admin: 'Faculty Curriculum Officer',
  faculty: 'Curriculum Lecturer',
  staff: 'Department Staff',
  registrar: 'Registrar Officer',
  executive: 'Dean / Vice Dean',
};

const currentLabels = computed(() => localeStore.currentLang === 'th' ? ROLE_LABELS_TH : ROLE_LABELS_EN);

// Dynamic Page Title for Breadcrumbs
const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith('/faculty')) {
    return localeStore.currentLang === 'th' ? 'ภาพรวมหลักสูตร' : 'Curriculum Overview';
  }
  if (path.startsWith('/dashboard')) {
    return localeStore.currentLang === 'th' ? 'ภาพรวมระบบ' : 'Dashboard Overview';
  }
  if (path.startsWith('/curricula')) {
    return localeStore.currentLang === 'th' ? 'จัดการหลักสูตร' : 'Curricula Management';
  }
  if (path.startsWith('/announcements')) {
    return localeStore.currentLang === 'th' ? 'ประกาศแจ้งเตือน' : 'Announcements';
  }
  if (path.startsWith('/registrar')) {
    return localeStore.currentLang === 'th' ? 'ภาพรวมระบบ' : 'Dashboard Overview';
  }
  if (path.startsWith('/downloads')) {
    return localeStore.currentLang === 'th' ? 'ดาวน์โหลดเอกสาร' : 'Downloads';
  }
  if (path.startsWith('/resources')) {
    return localeStore.currentLang === 'th' ? 'แบบฟอร์มและเอกสาร' : 'Forms & Resources';
  }
  if (path.startsWith('/users')) {
    return localeStore.currentLang === 'th' ? 'จัดการผู้ใช้' : 'User Management';
  }
  if (path.startsWith('/highlights')) {
    return localeStore.currentLang === 'th' ? 'หมายเหตุในเอกสาร' : 'Document Highlights';
  }
  return '';
});
</script>

<style scoped>
.mode-icon-enter-active,
.mode-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.mode-icon-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.6);
}

.mode-icon-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.6);
}

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
