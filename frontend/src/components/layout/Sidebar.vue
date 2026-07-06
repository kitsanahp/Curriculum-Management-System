<template>
  <aside
    class="flex flex-col h-full shrink-0 overflow-hidden select-none border-r border-white/10"
    :class="collapsed ? 'w-16' : 'w-72'"
    style="background: #312e81; transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);">

    <!-- ── Brand Header ─────────────────────────────────────────────────────── -->
    <div class="shrink-0 border-b border-white/10">

      <!-- Header row (height = 64px = h-16, matches Navbar) -->
      <div class="relative h-16 flex items-center"
        :class="collapsed ? 'justify-center' : 'gap-3 px-4'">

        <button type="button" :aria-label="collapsed ? 'แสดง sidebar' : 'ระบบบริหารหลักสูตร'"
          class="shrink-0 w-9 h-9 rounded-full bg-white p-1.5 flex items-center justify-center transition-all duration-150 ease-ios shadow-sm ring-1 ring-white/25"
          :class="collapsed && 'hover:scale-105 active:scale-95'"
          @click="collapsed ? $emit('toggle-sidebar') : null">
          <img :src="logoSci" alt="" class="w-full h-full object-contain" />
        </button>

        <div class="flex-1 min-w-0 overflow-hidden transition-opacity duration-200"
          :class="collapsed ? 'opacity-0 max-w-0' : 'opacity-100'">
          <p class="text-white font-semibold whitespace-nowrap" style="font-size: 13px; line-height: 16px;">
            ระบบบริหารหลักสูตร
          </p>
          <p class="text-white/55 mt-0.5 whitespace-nowrap leading-4" style="font-size: 11px;">
            คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
          </p>
        </div>

        <!-- ปุ่มย่อเมนู — ลูกศรชิดขวาบนของหัว sidebar (ตำแหน่งมาตรฐาน collapse) -->
        <button v-if="!collapsed" type="button" @click="$emit('toggle-sidebar')" aria-label="ย่อเมนู"
          class="group absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-white/55 hover:text-white hover:bg-white/15 transition-all duration-150 ease-ios active:scale-90">
          <PhCaretDoubleLeft class="w-4 h-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" weight="bold" aria-hidden="true" />
        </button>

      </div>

    </div>
    <!-- end Brand Header -->

    <!-- ── Navigation ───────────────────────────────────────────────────────── -->
    <nav class="flex-1 overflow-y-auto no-scrollbar"
      :class="collapsed ? 'py-3 px-2' : 'pt-2 pb-3 px-3'"
      aria-label="เมนูหลัก">

      <div class="space-y-0.5">
        <SidebarItem v-for="item in mainItems" :key="item.to"
          :item="item" :collapsed="collapsed" :active="isActive(item.to)" />
      </div>

      <template v-if="adminItems.length">
        <button v-if="!collapsed"
          @click="adminExpanded = !adminExpanded"
          class="mt-5 mb-1 px-2 w-full flex items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors text-left outline-none rounded focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Toggle การจัดการ">
          <PhCaretDown
            class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
            :class="!adminExpanded && '-rotate-90'"
            aria-hidden="true" />
          <span class="font-semibold" style="font-size: 11px;">การจัดการ</span>
        </button>
        <div v-else class="my-3 mx-1 border-t border-white/15" aria-hidden="true"></div>
        <div v-show="collapsed || adminExpanded" class="space-y-0.5">
          <SidebarItem v-for="item in adminItems" :key="item.to"
            :item="item" :collapsed="collapsed" :active="isActive(item.to)" />
        </div>
      </template>
    </nav>

    <!-- ── Footer — Logout ──────────────────────────────────────────────────── -->
    <div class="shrink-0 border-t border-white/10" :class="collapsed ? 'px-2 py-3' : 'p-3'">
      <button aria-label="ออกจากระบบ" @click="handleLogout"
        class="flex items-center w-full rounded-lg text-red-400 bg-red-500/10 hover:text-red-300 hover:bg-red-500/20 transition-all duration-150 ease-ios active:scale-[0.97]"
        :class="collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'">
        <PhSignOut class="w-5 h-5 shrink-0" aria-hidden="true" />
        <span v-if="!collapsed" class="font-medium" style="font-size: 13px;">
          ออกจากระบบ
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, h } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import logoSci from '@/assets/images/logo-sci.png';
import {
  PhHouse, PhFileText, PhMegaphone,
  PhUsers, PhSignOut, PhFolderOpen, PhCaretLeft,
  PhArchive, PhHighlighter, PhCaretDown, PhCaretDoubleLeft,
  PhBuildings,
} from '@phosphor-icons/vue';

defineProps({ collapsed: Boolean });
defineEmits(['toggle-sidebar']);

const authStore = useAuthStore();
const route = useRoute();

const adminExpanded = ref(true);

const MAIN_ITEMS = [
  { to: '/dashboard',     label: 'ภาพรวม',           icon: PhHouse,          roles: ['admin', 'executive'] },
  { to: '/faculty',       label: 'ภาพรวม',           icon: PhHouse,          roles: ['staff'] },
  { to: '/curricula',     label: 'รายการหลักสูตร',     icon: PhFileText,       roles: ['admin', 'faculty', 'staff'] },
  { to: '/highlights',    label: 'หมายเหตุในเอกสาร',  icon: PhHighlighter,    roles: ['admin', 'faculty', 'staff'] },
  { to: '/announcements', label: 'ประกาศ',              icon: PhMegaphone,      roles: ['admin', 'faculty', 'staff', 'executive'] },
  { to: '/downloads',     label: 'รายการหลักสูตร',     icon: PhFileText,       roles: ['registrar'] },
  { to: '/resources',     label: 'แบบฟอร์มและเอกสาร',  icon: PhFolderOpen,     roles: ['admin', 'faculty', 'staff', 'executive', 'registrar'] },
];

const ADMIN_ITEMS = [
  { to: '/users',              label: 'บัญชีผู้ใช้',         icon: PhUsers,     roles: ['admin'] },
  { to: '/master-data',        label: 'ภาควิชาและชื่อวุฒิ', icon: PhBuildings, roles: ['admin'] },
  { to: '/curricula/archived', label: 'ประวัติการยกเลิก',   icon: PhArchive,   roles: ['admin'] },
];

const filterByRole = (items) => {
  const role = authStore.user?.role;
  return items.filter(item => item.roles.includes(role));
};

const mainItems  = computed(() => filterByRole(MAIN_ITEMS));
const adminItems = computed(() => filterByRole(ADMIN_ITEMS));
const allItems   = computed(() => [...mainItems.value, ...adminItems.value]);

const isActive = (path) => {
  if (route.path === path) return true;
  if (!route.path.startsWith(path + '/')) return false;
  return !allItems.value.some(
    item => item.to !== path && item.to.startsWith(path) && route.path.startsWith(item.to)
  );
};

const handleLogout = () => {
  authStore.logout();
  window.location.href = '/login';
};



// Inline component — 2 skin: light (expanded) / dark (collapsed)
const SidebarItem = (props) => {
  const { item, collapsed, active } = props;
  return h(RouterLink, {
    to: item.to,
    'aria-current': active ? 'page' : undefined,
    class: [
      'group relative flex items-center rounded-lg transition-all duration-150 ease-ios active:scale-[0.97]',
      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
      active
        ? 'bg-white/15 text-white font-semibold shadow-sm'
        : 'text-white/65 hover:text-white hover:bg-white/10',
    ],
  }, () => [
    h(item.icon, {
      class: 'w-5 h-5 shrink-0',
      weight: active ? 'fill' : 'bold',
      'aria-hidden': 'true',
    }),
    !collapsed && h('span', {
      class: ['whitespace-nowrap', active ? 'font-semibold' : 'font-medium'],
      style: 'font-size: 13px; line-height: 16px;',
    }, item.label),
  ]);
};
</script>
