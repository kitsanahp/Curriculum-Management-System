<template>
  <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2.5">
        <PhFlowArrow weight="duotone" class="w-5 h-5 text-primary-500" aria-hidden="true" />
        <span class="text-sm font-bold text-gray-900">ความคืบหน้าคณะกรรมการ</span>
        <span v-if="!loading && committeeTotal"
          class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-50 px-1.5 text-xs font-bold text-primary-700">
          {{ committeeTotal }}
        </span>
      </div>
      <div v-if="!loading && committeeTotal" class="flex items-center gap-x-3 gap-y-1.5 text-xs flex-wrap">
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <span class="text-gray-500">ผ่านแล้ว</span>
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-primary-500" aria-hidden="true" />
          <span class="text-gray-500">กำลังพิจารณา</span>
        </span>
        <template v-if="!loading && committeeOverdue">
          <span class="w-px h-3.5 bg-gray-200 hidden sm:block" aria-hidden="true" />
          <span class="flex items-center gap-1 font-bold text-red-600">
            <PhWarningCircle weight="fill" class="w-3.5 h-3.5" aria-hidden="true" />
            เลยกำหนดส่งแก้ {{ committeeOverdue }}
          </span>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-5">
      <div v-for="i in 3" :key="i" class="space-y-2.5">
        <div class="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
        <div class="h-2 bg-gray-100 animate-pulse rounded-full" />
      </div>
    </div>

    <!-- Empty — compact strip -->
    <div v-else-if="!sections.length" class="flex items-center gap-3 px-5 py-4">
      <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
        <PhCheckCircle weight="duotone" class="w-5 h-5 text-emerald-500" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-700">ไม่มีหลักสูตรอยู่ระหว่างพิจารณา</p>
      </div>
    </div>

    <!-- Stepper — ยืดเต็มความกว้าง ไม่ต้องเลื่อนแนวนอน -->
    <div v-else>
      <div v-for="group in sections" :key="group.key">
        <!-- Department header (grouped only) -->
        <div v-if="groupByDepartment" class="flex items-center gap-2 px-5 pt-3.5 pb-1.5 bg-gray-50/40">
          <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ backgroundColor: group.color }" aria-hidden="true" />
          <h3 class="text-xs font-bold text-gray-700">{{ group.shortName }}</h3>
          <span class="text-[11px] text-gray-400 tabular-nums">{{ group.items.length }} หลักสูตร</span>
        </div>

        <!-- Rows -->
        <div class="divide-y divide-gray-100">
          <div v-for="item in group.items" :key="item.id" class="px-5 py-3.5">
            <!-- Name + step badge -->
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <p class="text-sm font-semibold leading-snug min-w-0" :class="item.overdue ? 'text-red-600' : 'text-gray-800'">
                {{ item.name }}
                <span class="ml-1.5 text-[11px] font-normal text-gray-400">{{ item.degreeLabel }}</span>
              </p>
              <span class="shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
                :class="item.overdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'">
                ขั้น {{ item.currentOrder }}/{{ item.total }}
              </span>
            </div>

            <!-- Stepper nodes (full width) -->
            <div class="flex items-center" role="img"
              :aria-label="`ผ่านแล้ว ${item.currentOrder - 1} จาก ${item.total} ขั้น`">
              <template v-for="n in item.total" :key="n">
                <span class="shrink-0 rounded-full transition-all duration-500 ease-out"
                  :class="nodeClass(item, n)" :style="nodeStyle(item, n)" />
                <span v-if="n < item.total" class="h-0.5 flex-1 rounded-full transition-all duration-500 ease-out"
                  :class="n < item.currentOrder ? 'bg-emerald-300' : 'bg-gray-200'" />
              </template>
            </div>

            <!-- Current stage + overdue (ชื่อเต็ม ไม่มีจุดคั่น) -->
            <div class="flex items-center gap-2 flex-wrap mt-2 text-[11px] leading-snug">
              <span class="text-gray-400">กำลังพิจารณา</span>
              <span class="font-semibold text-gray-700">{{ item.currentCommitteeFull }}</span>
              <span v-if="item.overdue"
                class="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-600 font-bold px-1.5 py-0.5">
                <PhWarningCircle weight="fill" class="w-3 h-3" aria-hidden="true" />
                เลยกำหนด {{ item.overdueDays }} วัน
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import {
  PhFlowArrow, PhWarningCircle, PhCheckCircle,
} from '@phosphor-icons/vue';
import { getDept, DEPARTMENT_ORDER } from '@/constants/departments';
import { COMMITTEE_LABELS } from '@/constants/committees';
import { formatThaiDateShort } from '@/utils/date';

const props = defineProps({
  // หลักสูตรที่ backend กรอง scope ให้แล้ว (staff = ภาควิชาตน / admin-exec = ทั้งหมด)
  curricula: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // true = จัดกลุ่มตามภาควิชา (มุมมองคณะ) | false = flat (มุมมองสาขาเดียว)
  groupByDepartment: { type: Boolean, default: false },
});

const DEGREE_FULL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };
// เรียงระดับปริญญา ตรี → โท → เอก (ไล่ตามลำดับ ห้ามข้ามห้ามปน)
const DEGREE_RANK = { bachelor: 0, master: 1, doctoral: 2 };

// 8 ขั้น — งานหลักสูตร คณะวิทย์ (ขั้น 1) + 7 คณะกรรมการ (ใช้ในชื่อ tooltip ของแต่ละจุด)
const COMMITTEE_COLUMNS = [
  'งานหลักสูตร คณะวิทยาศาสตร์',
  COMMITTEE_LABELS.faculty_academic,
  COMMITTEE_LABELS.faculty_board,
  COMMITTEE_LABELS.general_education,
  COMMITTEE_LABELS.university_academic,
  COMMITTEE_LABELS.university_council_academic,
  COMMITTEE_LABELS.university_council,
  COMMITTEE_LABELS.cisa,
];

const DEGREE_COLOR = { bachelor: '#5b8def', master: '#2bb3a3', doctoral: '#8b7cf0' };

// เรียงในกลุ่ม: ระดับปริญญา (ตรี→โท→เอก) ก่อน แล้วค่อยดันงานที่เลยกำหนดขึ้นบน
const sortRows = (a, b) =>
  (DEGREE_RANK[a.degreeLevel] - DEGREE_RANK[b.degreeLevel])
  || (b.overdue - a.overdue)
  || (b.overdueDays - a.overdueDays);

// แปลงหลักสูตร → row (เฉพาะที่อยู่ระหว่างพิจารณา/รอแก้ตามมติ)
const committeeRows = computed(() =>
  (props.curricula || [])
    .filter(c => c.status === 'under_committee' || c.status === 'revision')
    .map(c => {
      const steps = [...(c.committee_steps || [])].sort((a, b) => a.step_order - b.step_order);
      const committeeCount = steps.length || 7;
      const total = committeeCount + 1;  // +งานหลักสูตร คณะวิทย์ (ขั้น 1)
      const approvedCount = steps.filter(s => s.status === 'approved').length;
      const revisionStep = steps.find(s => s.status === 'revision');
      const isRevision = c.status === 'revision' && !!revisionStep;
      if (c.status === 'revision' && !isRevision) return null;

      const current = revisionStep
        || steps.find(s => s.id === c.current_committee_step_id)
        || steps.find(s => s.status !== 'approved')
        || steps[steps.length - 1];
      // เลื่อน +1 เพราะงานหลักสูตร = ขั้น 1 (ผ่านแล้วเสมอเมื่อหลักสูตรเข้ากรรมการ)
      const currentOrder = (current?.step_order ?? Math.min(approvedCount + 1, committeeCount)) + 1;

      const overdue = isRevision && !!c.revision_deadline
        && dayjs().isAfter(dayjs(c.revision_deadline), 'day');
      const overdueDays = overdue ? dayjs().diff(dayjs(c.revision_deadline), 'day') : 0;

      const datesByOrder = {};
      steps.forEach(s => {
        if (s.decision_date && (s.status === 'approved' || s.status === 'revision')) {
          datesByOrder[s.step_order + 1] = { status: s.status, date: formatThaiDateShort(s.decision_date) };
        }
      });

      return {
        id: c.id,
        name: c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุ',
        degreeLevel: c.degree_level,
        degreeLabel: DEGREE_FULL[c.degree_level] || '-',
        deptName: c.department?.name || 'ไม่ระบุ',
        currentCommitteeFull: COMMITTEE_LABELS[current?.committee_type] || 'รอเริ่มพิจารณา',
        currentOrder, total, overdue, overdueDays, isRevision, datesByOrder,
        color: DEGREE_COLOR[c.degree_level] || '#6366f1',
      };
    })
    .filter(Boolean)
);

const committeeTotal = computed(() => committeeRows.value.length);
const committeeOverdue = computed(() => committeeRows.value.filter(r => r.overdue).length);

// flat (1 section) หรือ grouped ตามภาควิชา — ทั้งสองโหมดเรียง ตรี→โท→เอก
const sections = computed(() => {
  if (!committeeRows.value.length) return [];

  if (!props.groupByDepartment) {
    return [{ key: 'all', items: [...committeeRows.value].sort(sortRows) }];
  }

  const order = [...DEPARTMENT_ORDER, 'ไม่ระบุ'];
  return order
    .map(deptName => {
      const items = committeeRows.value.filter(r => r.deptName === deptName);
      if (!items.length) return null;
      items.sort(sortRows);
      return {
        key: deptName,
        deptName,
        shortName: getDept(deptName)?.short ?? deptName,
        color: getDept(deptName)?.color ?? '#94a3b8',
        items,
      };
    })
    .filter(Boolean);
});

// ── Stepper node helpers ─────────────────────────────────────────────────────
const nodeState = (item, n) => {
  if (n < item.currentOrder) return 'approved';
  if (n === item.currentOrder) return item.overdue || item.isRevision ? 'revision' : 'current';
  return 'pending';
};
const nodeClass = (item, n) => {
  const st = nodeState(item, n);
  if (st === 'approved') return 'w-2.5 h-2.5 bg-emerald-500';
  if (st === 'current')  return 'w-3.5 h-3.5 ring-4 ring-primary-500/20';
  if (st === 'revision') return 'w-3.5 h-3.5 bg-red-500 ring-4 ring-red-500/20';
  return 'w-2 h-2 bg-gray-200';
};
const nodeStyle = (item, n) =>
  nodeState(item, n) === 'current' ? { backgroundColor: item.color } : {};
const nodeTitle = (item, n) => {
  const name = COMMITTEE_COLUMNS[n - 1] || `ขั้นที่ ${n}`;
  const d = item.datesByOrder?.[n];
  if (d) return `${name}: ${d.status === 'revision' ? 'ส่งกลับแก้ไข' : 'เห็นชอบ'} ${d.date}`;
  return name;
};
</script>
