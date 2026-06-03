<template>
  <aside class="flex flex-col h-full shrink-0 overflow-hidden select-none" :class="[
    collapsed ? 'w-16' : 'w-72',
    'bg-primary-900 dark:bg-gray-900'
  ]" style="transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);">

    <!-- ── Brand Header (height = 64px = h-16, matches Navbar) ─────────── -->
    <div class="h-16 shrink-0 flex items-center border-b border-white/[0.06]"
      :class="collapsed ? 'justify-center px-0' : 'gap-3 px-4'">

      <!-- Logo — clean, no ring decoration -->
      <button type="button" :aria-label="collapsed ? 'แสดง sidebar' : 'ระบบบริหารหลักสูตร'"
        class="shrink-0 w-9 h-9 rounded-md bg-white p-1.5 flex items-center justify-center transition-all duration-150 ease-ios"
        :class="collapsed && 'hover:scale-105 active:scale-95'" @click="collapsed ? $emit('toggle-sidebar') : null">
        <img :src="logoSci" alt="" class="w-full h-full object-contain" />
      </button>

      <!-- Brand text (hidden when collapsed) -->
      <div class="flex-1 min-w-0 overflow-hidden transition-opacity duration-200"
        :class="collapsed ? 'opacity-0 max-w-0' : 'opacity-100'">
        <p class="text-white font-semibold whitespace-nowrap" style="font-size: 13px; line-height: 16px;">
          ระบบบริหารหลักสูตร
        </p>
        <p class="text-white/45 mt-0.5 whitespace-nowrap" style="font-size: 11px; line-height: 14px;">
          คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
        </p>
      </div>

      <!-- Collapse button -->
      <button v-if="!collapsed" aria-label="ซ่อน sidebar"
        class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-150 ease-ios active:scale-90"
        @click.stop="$emit('toggle-sidebar')">
        <PhCaretLeft class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>

    <!-- ── Navigation ───────────────────────────────────────────────────── -->
    <nav class="flex-1 overflow-y-auto no-scrollbar py-4" :class="collapsed ? 'px-2' : 'px-3'" aria-label="เมนูหลัก">

      <!-- Main section -->
      <div class="space-y-1">
        <SidebarItem v-for="item in mainItems" :key="item.to" :item="item" :collapsed="collapsed"
          :active="isActive(item.to)" />
      </div>

      <!-- Admin section (with divider) -->
      <template v-if="adminItems.length">
        <div class="my-4 border-t border-white/[0.06]" aria-hidden="true"></div>
        <p v-if="!collapsed" class="px-3 mb-2 text-white/35 font-semibold uppercase tracking-wider"
          style="font-size: 11px; line-height: 14px; letter-spacing: 0.08em;">
          ผู้ดูแลระบบ
        </p>
        <div class="space-y-1">
          <SidebarItem v-for="item in adminItems" :key="item.to" :item="item" :collapsed="collapsed"
            :active="isActive(item.to)" />
        </div>
      </template>
    </nav>

    <!-- ── Footer — user + logout (visually distinct from nav) ─────────── -->
    <div class="shrink-0 border-t border-white/[0.06]" :class="collapsed ? 'px-2 py-3' : 'p-3'">

      <!-- Logout — secondary style, not nav-item -->
      <button aria-label="ออกจากระบบ"
        class="flex items-center w-full rounded-md text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 ease-ios active:scale-[0.97]"
        :class="collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'" @click="handleLogout">
        <PhSignOut class="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        <span v-if="!collapsed" class="font-medium" style="font-size: 13px;">
          ออกจากระบบ
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, h } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import logoSci from '@/assets/images/logo-sci.png';
import {
  PhHouse, PhFileText, PhMegaphone, PhDownloadSimple,
  PhUsers, PhSignOut, PhFolderOpen, PhCaretLeft,
  PhArchive, PhHighlighter,
} from '@phosphor-icons/vue';

defineProps({ collapsed: Boolean });
defineEmits(['toggle-sidebar']);

const authStore = useAuthStore();
const route = useRoute();

// ── Menu structure — แบ่งเป็น 2 section ────────────────────────────────────
const MAIN_ITEMS = [
  { to: '/dashboard', label: 'หน้าหลัก', icon: PhHouse, roles: ['admin', 'executive'] },
  { to: '/faculty', label: 'หน้าหลัก', icon: PhHouse, roles: ['faculty', 'staff'] },
  { to: '/curricula', label: 'รายการหลักสูตร', icon: PhFileText, roles: ['admin', 'faculty', 'staff'] },
  { to: '/highlights', label: 'หมายเหตุในเอกสาร', icon: PhHighlighter, roles: ['admin', 'faculty', 'staff'] },
  { to: '/announcements', label: 'ประกาศ', icon: PhMegaphone, roles: ['admin', 'faculty', 'staff', 'executive'] },
  { to: '/resources', label: 'แบบฟอร์มและเอกสาร', icon: PhFolderOpen, roles: ['admin', 'faculty', 'staff', 'executive', 'registrar'] },
  { to: '/downloads', label: 'ดาวน์โหลดเอกสาร', icon: PhDownloadSimple, roles: ['registrar'] },
];

const ADMIN_ITEMS = [
  { to: '/users', label: 'จัดการผู้ใช้', icon: PhUsers, roles: ['admin'] },
  { to: '/curricula/archived', label: 'ประวัติการยกเลิก', icon: PhArchive, roles: ['admin'] },
];

const filterByRole = (items) => {
  const role = authStore.user?.role;
  return items.filter(item => item.roles.includes(role));
};

const mainItems = computed(() => filterByRole(MAIN_ITEMS));
const adminItems = computed(() => filterByRole(ADMIN_ITEMS));
const allItems = computed(() => [...mainItems.value, ...adminItems.value]);

const isActive = (path) => {
  if (route.path === path) return true;
  if (!route.path.startsWith(path + '/')) return false;
  return !allItems.value.some(item => item.to !== path && item.to.startsWith(path) && route.path.startsWith(item.to));
};

const handleLogout = () => {
  authStore.logout();
  window.location.href = '/login';
};

// ── SidebarItem — inline component, ลด repetition ─────────────────────────
const SidebarItem = (props) => {
  const { item, collapsed, active } = props;
  return h(RouterLink, {
    to: item.to,
    'aria-current': active ? 'page' : undefined,
    class: [
      'group relative flex items-center rounded-md transition-all duration-150 ease-ios active:scale-[0.97]',
      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
      active
        ? 'bg-white/[0.10] text-white'
        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
    ]
  }, () => [
    // Active indicator removed based on user request
    // Icon
    h(item.icon, {
      class: 'w-[18px] h-[18px] shrink-0',
      weight: active ? 'fill' : 'regular',
      'aria-hidden': 'true'
    }),
    // Label
    !collapsed && h('span', {
      class: ['whitespace-nowrap', active ? 'font-semibold' : 'font-medium'],
      style: 'font-size: 13px; line-height: 16px;'
    }, item.label)
  ]);
};
</script>
