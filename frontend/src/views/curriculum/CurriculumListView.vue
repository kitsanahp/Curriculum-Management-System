<template>
  <div class="max-w-7xl mx-auto space-y-5">
    <!-- Hero Header (PageHeader component) -->
    <PageHeader
      :title="authStore.isAdmin ? 'หลักสูตรทั้งหมด' : 'หลักสูตรของฉัน'"
      :subtitle="authStore.isAdmin
        ? 'จัดการและติดตามสถานะการดำเนินงานของหลักสูตรในระบบคณะวิทยาศาสตร์'
        : 'ติดตามสถานะและดำเนินการส่งเอกสารหลักสูตรของสาขาวิชา'">
      <template v-if="authStore.isAdmin" #actions>
        <Button size="lg" :icon-left="PhPlusCircle" to="/curricula/create">
          สร้างหลักสูตรใหม่
        </Button>
      </template>
    </PageHeader>

    <!-- Filter Section (Symmetrical & Modern) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <PhMagnifyingGlass class="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input v-model="search" type="text"
            :placeholder="authStore.isAdmin ? 'ค้นหาชื่อหลักสูตร สาขาวิชา หรือภาควิชา' : 'ค้นหาชื่อหลักสูตร'"
            class="block w-full rounded-lg border-gray-300 py-2.5 pl-11 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent sm:text-sm transition-all" />
        </div>
        
        <!-- Filters Group -->
        <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-3', authStore.isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3']">
          <FormSelect
            v-model="filterDegree"
            :options="[
              { label: 'ทุกระดับปริญญา', value: '' },
              { label: 'ปริญญาตรี', value: 'bachelor' },
              { label: 'ปริญญาโท', value: 'master' },
              { label: 'ปริญญาเอก', value: 'doctoral' }
            ]"
          />
          <FormSelect
            v-model="filterStatus"
            :options="[
              { label: 'ทุกสถานะ',                    value: '' },
              { label: 'รอภาควิชาส่งเอกสาร',          value: 'pending_department' },
              { label: 'รอตรวจสอบเอกสาร',             value: 'department_submitted' },
              { label: 'รอเจ้าหน้าที่ตรวจสอบ',        value: 'pending_admin_recheck' },
              { label: 'อยู่ระหว่างการพิจารณา',        value: 'under_committee' },
              { label: 'ส่งกลับแก้ไข',                value: 'revision' },
              { label: 'อนุมัติโดย สป.อว.',            value: 'approved' }
            ]"
          />
          <FormSelect
            v-if="authStore.isAdmin"
            v-model="filterDepartment"
            :options="[
              { label: 'ทุกภาควิชา', value: '' },
              ...departments.map(d => ({ label: d.name, value: d.id }))
            ]"
          />
          <FormSelect v-model="filterYear" :options="yearOptions" />
        </div>
      </div>
    </div>

    <!-- Active filter chips -->
    <div v-if="activeChips.length" class="flex items-center gap-2 flex-wrap -mt-1">
      <span class="text-[11px] font-semibold text-gray-400">กรองโดย</span>
      <button v-for="chip in activeChips" :key="chip.label" @click="chip.clear()"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 active:scale-[0.95] transition-all duration-150 ease-ios">
        {{ chip.label }}
        <span class="text-primary-400 font-bold leading-none">×</span>
      </button>
      <button @click="filterDegree = ''; filterStatus = ''; filterDepartment = ''; filterYear = ''"
        class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-all duration-150 ease-ios">
        ล้างทั้งหมด
      </button>
    </div>

    <!-- List (Strict Symmetry) -->
    <!-- ST04 shimmer skeleton แทน opacity pulse ธรรมดา -->
    <div v-if="curriculumStore.loading" class="space-y-3">
      <div v-for="i in 4" :key="i"
        :style="{ animationDelay: `${(i - 1) * 60}ms` }"
        class="rounded-xl h-24 animate-shimmer opacity-80">
      </div>
    </div>

    <div v-else-if="filteredCurricula.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200">
      <EmptyState
        title="ไม่พบข้อมูลหลักสูตร"
        description="ลองเปลี่ยนเงื่อนไขการค้นหา"
        :icon="PhFileText"
        size="lg"
        :action-label="hasActiveFilter ? 'ล้างตัวกรองทั้งหมด' : ''"
        :action-icon="PhBroom"
        @action="filterDegree=''; filterStatus=''; filterDepartment=''; search=''"
      />
    </div>

    <!-- DC01 stagger + DC03 hover-lift via TransitionGroup -->
    <TransitionGroup
      v-else
      tag="div"
      name="list-stagger"
      class="space-y-2"
      appear>
      <div
        v-for="(c, idx) in filteredCurricula"
        :key="c.id"
        :style="{ '--stagger-delay': `${Math.min(idx * 50, 300)}ms` }"
        @click="router.push(`/curricula/${c.id}`)"
        :class="[
          'cursor-pointer rounded-xl border hover-lift active:bg-gray-50/80 active:scale-[0.995] transition-colors duration-150 ease-ios group relative overflow-hidden',
          deadlineOf(c) && isOverdue(deadlineOf(c))
            ? 'bg-red-50/40 border-red-300 hover:border-red-400'
            : 'bg-white border-gray-200 hover:border-gray-300'
        ]">



        <div class="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-5">
          <!-- Main Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
              </span>
              <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                ปี {{ c.curriculum_year }}
              </span>
            </div>

            <h3 class="font-bold text-gray-900 text-base sm:text-lg leading-snug">
              {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
            </h3>
            <p v-if="c.field_of_study && c.degree_name" class="text-sm text-gray-600 font-medium truncate mt-0.5">
              {{ c.degree_name }}
            </p>

            <div class="flex items-center gap-1.5 mt-1.5 text-sm font-medium text-gray-500">
              <component v-if="deptIcon(c.department?.name)" :is="deptIcon(c.department?.name)"
                weight="bold" class="w-3.5 h-3.5 shrink-0"
                :style="{ color: deptColor(c.department?.name) }" />
              <span class="truncate">{{ c.department?.name || 'ไม่ระบุภาควิชา' }}</span>
            </div>
          </div>

          <!-- Right section: status + deadline + actions -->
          <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
            <!-- Status & Deadline -->
            <div class="flex flex-col items-start sm:items-end gap-1.5 min-w-0">
              <StatusBadge :status="c.status" :curriculum="c" />
              <div v-if="deadlineOf(c)" class="flex items-center gap-1.5 flex-wrap sm:justify-end">
                <span :class="[
                  'text-[10px] font-semibold uppercase tracking-wide',
                  c.status === 'revision' && c.revision_deadline ? 'text-red-400' : 'text-gray-400'
                ]">{{ c.status === 'revision' && c.revision_deadline ? 'กำหนดส่งแก้ไข' : 'กำหนดส่ง' }}</span>
                <span :class="[
                  'text-xs font-bold',
                  isOverdue(deadlineOf(c)) ? 'text-red-600' : 'text-gray-700'
                ]">{{ formatDate(deadlineOf(c)) }}</span>
                <span :class="[
                  'text-[10px] font-black px-1.5 py-px rounded whitespace-nowrap',
                  isOverdue(deadlineOf(c))
                    ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200'
                    : daysLeft(deadlineOf(c)) <= 7
                      ? 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200'
                      : 'bg-gray-100 text-gray-500'
                ]">
                  {{ isOverdue(deadlineOf(c)) ? `เกิน ${Math.abs(daysLeft(deadlineOf(c)))} วัน` : `${daysLeft(deadlineOf(c))} วัน` }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 border-l border-gray-100 pl-3 sm:pl-4">
              <button v-if="authStore.isAdmin" @click.stop="deleteCurriculum(c)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios">
                <PhTrash class="w-4 h-4" />
              </button>
              <div class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 group-hover:text-gray-600 group-hover:bg-gray-50 transition-all duration-200">
                <PhCaretRight class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Pagination (Symmetrical) -->
    <div v-if="totalPages > 1" class="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
          หน้า <span class="text-gray-900">{{ currentPage }}</span> / {{ totalPages }}
        </p>
        <nav class="flex gap-2" aria-label="Pagination">
          <button @click="currentPage--; loadData()" :disabled="currentPage === 1"
            class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 active:scale-[0.88] transition-all duration-150 ease-ios">
            <PhCaretLeft class="h-5 w-5" />
          </button>
          <button @click="currentPage++; loadData()" :disabled="currentPage === totalPages"
            class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 active:scale-[0.88] transition-all duration-150 ease-ios">
            <PhCaretRight class="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCurriculumStore } from '@/stores/curriculum';
import { useAuthStore } from '@/stores/auth';
import { useDepartmentStore } from '@/stores/department';
import StatusBadge from '@/components/common/StatusBadge.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import { PhPlusCircle, PhCaretRight, PhTrash, PhMagnifyingGlass, PhFileText, PhCaretLeft, PhBroom } from '@phosphor-icons/vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { getDept } from '@/constants/deptConfig';
import { formatThaiDateNumeric, isOverdue } from '@/utils/date';
import dayjs from 'dayjs';
import { refDebounced } from '@vueuse/core';
import api from '@/services/api';

const deptIcon = (name) => getDept(name)?.icon ?? null;
const deptColor = (name) => getDept(name)?.color ?? '#94a3b8';

const router = useRouter();
const curriculumStore = useCurriculumStore();
const authStore = useAuthStore();
const deptStore = useDepartmentStore();
const toast = useToast();
const { open: confirm } = useConfirm();

const search = ref('');
const debouncedSearch = refDebounced(search, 500);

const filterDegree = ref('');
const filterStatus = ref('');
const filterDepartment = ref('');
const filterYear = ref('');
const departments = computed(() => deptStore.departments);

const currentBE = new Date().getFullYear() + 543;
const yearOptions = computed(() => [
  { label: 'ทุกปีการศึกษา', value: '' },
  ...Array.from({ length: 16 }, (_, i) => currentBE + 5 - i)
    .map(y => ({ label: String(y), value: String(y) }))
]);

const currentPage = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const totalCount = ref(0);

const loadData = async () => {
 const meta = await curriculumStore.fetchAll({
 page: currentPage.value,
 limit: limit.value,
 search: debouncedSearch.value || undefined,
 degree: filterDegree.value || undefined,
 status: filterStatus.value || undefined,
 department_id: filterDepartment.value || undefined,
 year: filterYear.value || undefined
 });
 if (meta) {
 totalPages.value = Math.ceil(meta.total / meta.limit);
 totalCount.value = meta.total;
 }
};

watch([debouncedSearch, filterDegree, filterStatus, filterDepartment, filterYear], () => {
 currentPage.value = 1;
 loadData();
});

const hasActiveFilter = computed(() => !!(search.value || filterDegree.value || filterStatus.value || filterDepartment.value || filterYear.value));

const filteredCurricula = computed(() => {
  return [...curriculumStore.curricula].sort((a, b) => {
    const aOverdue = deadlineOf(a) && isOverdue(deadlineOf(a));
    const bOverdue = deadlineOf(b) && isOverdue(deadlineOf(b));
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return 0;
  });
});


const formatDate = formatThaiDateNumeric;

function deadlineOf(c) {
  if (c.status === 'pending_department') return c.deadline || null;
  if (c.status === 'revision') return c.revision_deadline || null;
  return null;
}

function daysLeft(date) {
  return dayjs(date).diff(dayjs(), 'day');
}

// ─── Active filter chips ──────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending_department:    'รอภาควิชาส่งเอกสาร',
  department_submitted:  'รอตรวจสอบเอกสาร',
  pending_admin_recheck: 'รอเจ้าหน้าที่ตรวจสอบ',
  under_committee:       'อยู่ระหว่างการพิจารณา',
  revision:              'ส่งกลับแก้ไข',
  approved:              'อนุมัติโดย สป.อว.',
};
const DEGREE_LABELS = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

const activeChips = computed(() => {
  const chips = [];
  if (filterDegree.value)
    chips.push({ label: DEGREE_LABELS[filterDegree.value] || filterDegree.value, clear: () => { filterDegree.value = ''; } });
  if (filterStatus.value)
    chips.push({ label: STATUS_LABELS[filterStatus.value] || filterStatus.value, clear: () => { filterStatus.value = ''; } });
  if (filterDepartment.value) {
    const dept = departments.value.find(d => String(d.id) === String(filterDepartment.value));
    chips.push({ label: dept?.name || 'ภาควิชา', clear: () => { filterDepartment.value = ''; } });
  }
  if (filterYear.value)
    chips.push({ label: `ปี ${filterYear.value}`, clear: () => { filterYear.value = ''; } });
  return chips;
});

const deleteCurriculum = async (c) => {
  const name = c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'หลักสูตรนี้';
  const ok = await confirm({
    title: 'ยกเลิกหลักสูตร',
    message: `${name} จะถูกยกเลิก ข้อมูลยังคงอยู่ในระบบเป็นประวัติ`,
    confirmLabel: 'ยกเลิกหลักสูตร',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await api.delete(`/curricula/${c.id}`);
    loadData();
  } catch (err) {
    toast.error('ยกเลิกหลักสูตรไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองอีกครั้ง');
  }
};

onMounted(() => {
  loadData();
  if (authStore.isAdmin) deptStore.fetchDepartments();
});
</script>

<style scoped>
/* DC01 — Stagger card-in animation เวลา list โหลดครั้งแรก / re-render */
.list-stagger-enter-active {
  animation: card-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--stagger-delay, 0ms);
}
.list-stagger-leave-active {
  animation: none;
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
  position: absolute;
  width: 100%;
}
.list-stagger-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
.list-stagger-move {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
