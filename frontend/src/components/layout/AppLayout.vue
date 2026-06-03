<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import Sidebar from './Sidebar.vue';
import Navbar from './Navbar.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';

const NOTIF_POLL_INTERVAL_MS = 30_000;

// Desktop: user-controlled collapse toggle
const isSidebarCollapsed = ref(false);
// Mobile: drawer open/close
const isMobileOpen = ref(false);
// Viewport tiers (mobile-first)
const isMobile = ref(false);   // < 768px  — hamburger drawer
const isTablet = ref(false);   // 768–1023px — static icon-only sidebar

function checkViewport() {
  const w = window.innerWidth;
  isMobile.value = w < 768;
  isTablet.value = w >= 768 && w < 1024;
  if (!isMobile.value) isMobileOpen.value = false;
}

const debouncedCheckViewport = useDebounceFn(checkViewport, 100);

function toggleSidebar() {
  if (isMobile.value) {
    isMobileOpen.value = !isMobileOpen.value;
  } else if (!isTablet.value) {
    // desktop only — tablet sidebar is always icon-only
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  }
}

const authStore = useAuthStore();
const notifStore = useNotificationStore();
let notifInterval = null;
onMounted(() => {
  checkViewport();
  window.addEventListener('resize', debouncedCheckViewport);
  authStore.fetchMe();
  notifStore.fetch();
  notifInterval = setInterval(() => notifStore.fetch(), NOTIF_POLL_INTERVAL_MS);
});
onUnmounted(() => {
  window.removeEventListener('resize', debouncedCheckViewport);
  clearInterval(notifInterval);
});
</script>

<template>
  <div class="flex h-screen overflow-hidden font-sans dark:bg-[var(--dm-page)]">

    <!-- Mobile backdrop (tap to close sidebar) -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0">
      <div
        v-if="isMobileOpen && isMobile"
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40"
        @click="isMobileOpen = false" />
    </Transition>

    <!-- Sidebar wrapper
         mobile  : fixed overlay, slides in/out
         tablet  : static, always visible (icon-only via :collapsed)
         desktop : static, user-togglable collapse -->
    <div :class="[
      'shrink-0 z-50 transition-transform duration-300 ease-in-out',
      isMobile ? 'fixed inset-y-0 left-0 h-full' : 'relative',
      isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0',
    ]">
      <Sidebar
        :collapsed="isTablet || (!isMobile && isSidebarCollapsed)"
        @toggle-sidebar="toggleSidebar" />
    </div>

    <!-- Main content -->
    <div class="flex flex-col flex-1 overflow-hidden min-w-0">
      <Navbar @toggle-menu="toggleSidebar" />
      <main class="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[var(--dm-page)] px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-10 overflow-x-hidden" style="transition: background-color 0.25s ease;">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
    <!-- Global overlays (fixed positioning, must be inside single root) -->
    <ToastContainer />
    <ConfirmModal />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

