<template>
  <div class="max-w-7xl mx-auto space-y-5">

    <!-- Header -->
    <PageHeader
      title="ภาพรวม"
      :icon="PhHouse"
    />

    <!-- Stats: single surface -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div v-for="stat in statItems" :key="stat.key"
          class="flex items-center gap-3.5 px-5 py-4">
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', stat.iconBg]">
            <component :is="stat.icon" weight="duotone" :class="['w-5 h-5', stat.iconColor]" />
          </div>
          <div class="min-w-0">
            <div v-if="loading" class="h-6 w-10 bg-gray-100 animate-pulse rounded mb-1" />
            <p v-else class="text-2xl font-black text-gray-900 tabular-nums leading-none">
              {{ stat.value }}
            </p>
            <p class="text-xs font-medium text-gray-500 mt-0.5 truncate">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Deadline warnings (only shown when there are overdue/urgent items) -->
    <div v-if="!loading && urgentItems.length" class="space-y-2">
      <p class="text-xs font-bold text-gray-600 px-0.5">
        ต้องดำเนินการก่อน
      </p>
      <div class="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
        <RouterLink
          v-for="c in urgentItems" :key="c.id" :to="`/curricula/${c.id}`"
          class="flex items-center gap-4 px-5 py-3.5 hover:bg-red-100/50 transition-colors duration-150 group cursor-pointer border-b border-red-100 last:border-0">
          <PhWarningCircle weight="duotone" class="w-5 h-5 text-red-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-red-800 truncate">
              {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
            </p>
            <p class="text-xs text-red-500 mt-0.5">
              <template v-if="c.status === 'revision'">
                ต้องส่งเอกสารแก้ไข
                <template v-if="c.revision_deadline">
                  {{ isOverdue(c.revision_deadline) ? '— เลยกำหนดแล้ว' : `ภายใน ${formatThaiDateShort(c.revision_deadline)}` }}
                </template>
              </template>
              <template v-else>
                รอส่งเอกสาร
                <template v-if="c.submit_deadline">
                  {{ isOverdue(c.submit_deadline) ? '— เลยกำหนดแล้ว' : `ภายใน ${formatThaiDateShort(c.submit_deadline)}` }}
                </template>
              </template>
            </p>
          </div>
          <PhCaretRight class="w-3.5 h-3.5 text-red-400 group-hover:text-red-600 transition-colors shrink-0" />
        </RouterLink>
      </div>
    </div>

    <!-- My Curricula -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div class="flex items-center gap-2.5">
          <PhBookBookmark weight="duotone" class="w-5 h-5 text-primary-500" />
          <span class="text-sm font-bold text-gray-900">{{ listTitle }}</span>
          <span v-if="!loading && curricula.length"
            class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-bold text-gray-600">
            {{ curricula.length }}
          </span>
        </div>
        <RouterLink to="/curricula"
          class="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-150 cursor-pointer">
          ดูทั้งหมด
        </RouterLink>
      </div>

      <div v-if="loading" class="p-4 space-y-2">
        <div v-for="i in 4" :key="i" class="h-[60px] rounded-lg bg-gray-100 animate-pulse" />
      </div>

      <EmptyState
        v-else-if="!curricula.length"
        :title="emptyTitle"
        description="ติดต่อนักวิชาการศึกษาเพื่อเพิ่มหลักสูตร"
        :icon="PhBookBookmark"
        size="md"
      />

      <div v-else class="divide-y divide-gray-50">
        <RouterLink
          v-for="c in recentCurricula" :key="c.id" :to="`/curricula/${c.id}`"
          class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors duration-150 group cursor-pointer">

          <!-- Status indicator dot -->
          <div :class="['w-2 h-2 rounded-full shrink-0', STATUS_DOT[c.status] || 'bg-gray-300']" />

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate leading-snug">
              {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
            </p>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span class="text-xs text-gray-400">
                {{ DEGREE_FULL[c.degree_level] }}
              </span>
              <!-- Deadline chip when relevant -->
              <template v-if="deadlineOf(c)">
                <span class="text-gray-200 text-xs" aria-hidden="true">·</span>
                <span :class="[
                  'text-xs font-bold px-1.5 py-px rounded',
                  isOverdue(deadlineOf(c))
                    ? 'bg-red-50 text-red-600'
                    : daysLeft(deadlineOf(c)) <= 7
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-gray-100 text-gray-500'
                ]">
                  {{ isOverdue(deadlineOf(c))
                    ? `เกิน ${Math.abs(daysLeft(deadlineOf(c)))} วัน`
                    : `${daysLeft(deadlineOf(c))} วัน` }}
                </span>
              </template>
            </div>
          </div>

          <StatusBadge :status="c.status" :curriculum="c" class="shrink-0 hidden sm:inline-flex" />
          <PhCaretRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
        </RouterLink>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useDashboard } from '@/composables/useDashboard';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import {
  PhHouse, PhCaretRight, PhBookBookmark,
  PhStack, PhHourglassMedium, PhArrowCounterClockwise, PhSealCheck,
  PhWarningCircle,
} from '@phosphor-icons/vue';
import { isOverdue, formatThaiDateShort } from '@/utils/date';
import dayjs from 'dayjs';

const router = useRouter();
const authStore = useAuthStore();
const { stats, curricula, loading, recentCurricula, revisionItems, pendingItems, fetch } = useDashboard();

// staff (เจ้าหน้าที่สาขา) เห็นทุกหลักสูตรในสาขา | faculty (อาจารย์) เห็นเฉพาะที่ตนรับผิดชอบ
const isStaff = computed(() => authStore.user?.role === 'staff');
const headerSubtitle = computed(() =>
  isStaff.value ? 'ภาพรวมหลักสูตรทั้งหมดในสาขาวิชา' : 'ภาพรวมหลักสูตรที่คุณรับผิดชอบ'
);
const listTitle = computed(() => isStaff.value ? 'หลักสูตรในสาขา' : 'หลักสูตรของฉัน');
const emptyTitle = computed(() =>
  isStaff.value ? 'ยังไม่มีหลักสูตรในสาขา' : 'ยังไม่มีหลักสูตรที่ได้รับมอบหมาย'
);

const DEGREE_FULL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

const STATUS_DOT = {
  pending_department:     'bg-primary-400',
  department_submitted:   'bg-blue-400',
  pending_admin_recheck:  'bg-orange-400',
  under_committee:        'bg-blue-500',
  revision:               'bg-red-400',
  approved:               'bg-emerald-500',
};

onMounted(() => fetch());

// Items with imminent or overdue deadlines (revision + pending_department with deadline)
const urgentItems = computed(() => [
  ...revisionItems.value.filter(c =>
    !c.revision_deadline || isOverdue(c.revision_deadline) || dayjs(c.revision_deadline).diff(dayjs(), 'day') <= 3
  ),
  ...pendingItems.value.filter(c =>
    c.submit_deadline && (isOverdue(c.submit_deadline) || dayjs(c.submit_deadline).diff(dayjs(), 'day') <= 3)
  ),
]);

const deadlineOf = (c) => {
  if (c.status === 'revision' && c.revision_deadline) return c.revision_deadline;
  if (c.submit_deadline) return c.submit_deadline;
  return null;
};

const daysLeft = (date) => dayjs(date).diff(dayjs(), 'day');

const statItems = computed(() => [
  {
    key: 'total',
    label: 'หลักสูตรทั้งหมด',
    value: stats.value.total,
    icon: PhStack,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    key: 'pending',
    label: 'รอส่งเอกสาร',
    value: stats.value.pending,
    icon: PhHourglassMedium,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    key: 'need_revision',
    label: 'รอแก้ไข',
    value: stats.value.need_revision,
    icon: PhArrowCounterClockwise,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
  },
  {
    key: 'approved',
    label: 'อนุมัติแล้ว',
    value: stats.value.approved,
    icon: PhSealCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
]);
</script>
