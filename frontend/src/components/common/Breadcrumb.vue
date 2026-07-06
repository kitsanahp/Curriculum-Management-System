<template>
  <nav v-if="crumbs.length >= (root ? 1 : 2)" aria-label="เส้นทางหน้า" class="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
    <template v-for="(crumb, i) in crumbs" :key="crumb.name">
      <RouterLink
        v-if="i < crumbs.length - 1"
        :to="{ name: crumb.name, params: route.params }"
        class="font-medium text-gray-500 hover:text-primary-600 transition-colors duration-150 truncate">
        {{ crumb.label }}
      </RouterLink>
      <span v-else class="font-semibold text-gray-700 truncate" aria-current="page">{{ crumb.label }}</span>
      <PhCaretRight
        v-if="i < crumbs.length - 1"
        class="w-3.5 h-3.5 text-gray-300 shrink-0"
        aria-hidden="true" />
    </template>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { PhCaretRight } from '@phosphor-icons/vue';

// root = true → แสดงแม้มี crumb เดียว (ใช้ใน navbar แทนชื่อหน้า)
const props = defineProps({
  root: { type: Boolean, default: false },
});

// แผนผัง breadcrumb ของทุกหน้า — keyed ด้วยชื่อ route, parent ชี้ไปหน้าแม่
const CRUMBS = {
  Dashboard:              { label: 'ภาพรวม' },
  FacultyDashboard:       { label: 'ภาพรวม' },

  CurriculaList:          { label: 'รายการหลักสูตร' },
  CurriculumCreate:       { label: 'สร้างหลักสูตร',        parent: 'CurriculaList' },
  CurriculumArchivedList: { label: 'ประวัติการยกเลิก',     parent: 'CurriculaList' },
  CurriculumDetail:       { label: 'รายละเอียดหลักสูตร',   parent: 'CurriculaList' },
  CommitteeDecision:      { label: 'บันทึกมติคณะกรรมการ',  parent: 'CurriculumDetail' },

  Highlights:             { label: 'หมายเหตุในเอกสาร' },

  Announcements:          { label: 'ประกาศ' },
  AnnouncementCreate:     { label: 'สร้างประกาศ',          parent: 'Announcements' },
  AnnouncementEdit:       { label: 'แก้ไขประกาศ',          parent: 'Announcements' },

  Downloads:              { label: 'รายการหลักสูตร' },

  Resources:              { label: 'แบบฟอร์มและเอกสาร' },
  ResourcesCreate:        { label: 'เพิ่มรายการ',          parent: 'Resources' },
  ResourcesEdit:          { label: 'แก้ไขรายการ',          parent: 'Resources' },

  Users:                  { label: 'บัญชีผู้ใช้' },
  UserEdit:               { label: 'แก้ไขผู้ใช้',           parent: 'Users' },
};

const route = useRoute();

// ไล่จาก route ปัจจุบันขึ้นไปตาม parent → ได้ trail (แม่ → ... → ปัจจุบัน)
const crumbs = computed(() => {
  const out = [];
  let name = route.name;
  const seen = new Set();
  while (name && CRUMBS[name] && !seen.has(name)) {
    seen.add(name);
    out.unshift({ name, label: CRUMBS[name].label });
    name = CRUMBS[name].parent;
  }
  return out;
});
</script>
