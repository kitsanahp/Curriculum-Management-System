<template>
  <AdminDashboardView v-if="authStore.isAdmin" />
  <ExecutiveDashboardView v-else-if="authStore.isExecutive" />
  <StaffDashboardView v-else-if="authStore.isStaff" />
  <FacultyDashboardView v-else-if="isFaculty" />
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AdminDashboardView from './AdminDashboardView.vue';
import ExecutiveDashboardView from './ExecutiveDashboardView.vue';
import StaffDashboardView from './StaffDashboardView.vue';
import FacultyDashboardView from './FacultyDashboardView.vue';

const authStore = useAuthStore();
const isFaculty = computed(() =>
  authStore.user?.role === 'faculty' || authStore.user?.role === 'staff'
);
</script>
