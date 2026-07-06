<template>
  <div class="max-w-7xl mx-auto space-y-5">
    <!-- Hero Header (PageHeader component) -->
    <PageHeader
      :title="listTitle">
      <template v-if="authStore.isAdmin" #actions>
        <Button size="lg" :icon-left="PhFilePlus" to="/curricula/create">
          สร้างหลักสูตรใหม่
        </Button>
      </template>
    </PageHeader>

    <!-- Filter toolbar -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
      <div class="flex flex-col lg:flex-row lg:items-center gap-3">
        <!-- Search (primary) -->
        <div class="relative flex-1 min-w-0">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <PhMagnifyingGlass class="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input v-model="search" type="text"
            :aria-label="authStore.isAdmin ? 'ค้นหาหลักสูตร สาขาวิชา หรือภาควิชา' : 'ค้นหาหลักสูตร'"
            :placeholder="authStore.isAdmin ? 'ค้นหาชื่อหลักสูตร สาขาวิชา หรือภาควิชา' : 'ค้นหาชื่อหลักสูตร'"
            class="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 ease-ios focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none" />
        </div>

        <!-- Divider (desktop) -->
        <div class="hidden lg:block w-px h-7 bg-gray-200 shrink-0" aria-hidden="true"></div>

        <!-- Filters -->
        <div :class="['grid grid-cols-2 gap-2.5 lg:flex lg:gap-2.5 lg:shrink-0', authStore.isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3']">
          <FormSelect
            class="lg:w-44"
            v-model="filterDegree"
            :options="[
              { label: 'ทุกระดับปริญญา', value: '' },
              { label: 'ปริญญาตรี', value: 'bachelor' },
              { label: 'ปริญญาโท', value: 'master' },
              { label: 'ปริญญาเอก', value: 'doctoral' }
            ]"
          />
          <FormSelect
            class="lg:w-44"
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
            class="lg:w-44"
            v-model="filterDepartment"
            :options="[
              { label: 'ทุกภาควิชา', value: '' },
              ...departments.map(d => ({ label: d.name, value: d.id }))
            ]"
          />
          <FormSelect class="lg:w-44" v-model="filterYear" :options="yearOptions" />
        </div>
      </div>
    </div>

    <!-- Active filter chips -->
    <div v-if="activeChips.length" class="flex items-center gap-2 flex-wrap -mt-1">
      <span class="text-xs font-semibold text-gray-500">กรองโดย</span>
      <button v-for="chip in activeChips" :key="chip.label" @click="chip.clear()"
        :aria-label="`ล้างตัวกรอง ${chip.label}`"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 active:scale-[0.95] transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1">
        {{ chip.label }}
        <span class="text-primary-400 font-bold leading-none" aria-hidden="true">×</span>
      </button>
      <button @click="filterDegree = ''; filterStatus = ''; filterDepartment = ''; filterYear = ''"
        class="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 rounded">
        ล้างทั้งหมด
      </button>
    </div>

    <!-- List (Strict Symmetry) -->
    <!-- Skeleton เรียบ ไม่มี animation -->
    <div v-if="curriculumStore.loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="rounded-xl h-24 bg-gray-100 border border-gray-200 animate-pulse"></div>
    </div>

    <div v-else-if="fetchError" class="bg-white rounded-xl border border-red-200 p-8 text-center">
      <p class="text-sm font-medium text-red-600">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
      <button @click="loadData()" class="mt-3 text-xs text-primary-600 hover:text-primary-700 underline cursor-pointer">ลองใหม่</button>
    </div>

    <div v-else-if="filteredCurricula.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
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

    <div v-else class="space-y-3">
      <div
        v-for="c in filteredCurricula"
        :key="c.id"
        @click="router.push(`/curricula/${c.id}`)"
        :class="[
          'cursor-pointer rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 ease-ios group relative overflow-hidden',
          deadlineOf(c) && isOverdue(deadlineOf(c))
            ? 'bg-red-50/60 border-red-300 hover:border-red-400'
            : 'bg-white border-gray-200/80 hover:border-gray-300'
        ]">

        <div class="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-5">
          <!-- Main Info -->
          <div class="flex-1 min-w-0">
            <!-- Eyebrow: department -->
            <div class="flex items-center gap-1.5 mb-1 text-xs font-semibold text-gray-500">
              <span class="truncate">{{ c.department?.name || 'ไม่ระบุภาควิชา' }}</span>
            </div>

            <!-- Title: field of study -->
            <h3 class="font-bold text-gray-900 text-base leading-snug truncate">
              {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
            </h3>
            <p v-if="c.field_of_study && c.degree_name" class="text-xs text-gray-500 font-medium truncate mt-0.5">
              {{ c.degree_name }}
            </p>

            <!-- Meta chips: degree level + year -->
            <div class="flex items-center gap-1.5 mt-2 flex-wrap">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold', DEGREE_BADGE[c.degree_level]]">
                {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
              </span>
              <span v-if="c.curriculum_type" class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500">
                {{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500">
                ปี {{ c.curriculum_year }}
              </span>
            </div>
          </div>

          <!-- Right section: status + deadline + actions -->
          <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
            <!-- Status & Deadline -->
            <div class="flex flex-col items-start sm:items-end gap-2.5 min-w-0">
              <StatusBadge :status="c.status" :curriculum="c" />
              <RevisionCycleBadge :curriculum-year="c.curriculum_year" />
              <div v-if="deadlineOf(c)" class="flex items-center gap-1.5 flex-wrap sm:justify-end">
                <span :class="[
                  'text-xs font-semibold',
                  c.status === 'revision' && c.revision_deadline ? 'text-red-500' : 'text-gray-500'
                ]">{{ c.status === 'revision' && c.revision_deadline ? 'กำหนดส่งแก้ไข' : 'กำหนดส่ง' }}</span>
                <span :class="[
                  'text-xs font-bold',
                  isOverdue(deadlineOf(c)) ? 'text-red-600' : 'text-gray-700'
                ]">{{ formatDate(deadlineOf(c)) }}</span>
                <span :class="[
                  'text-xs font-bold px-1.5 py-px rounded-md whitespace-nowrap',
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
                class="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios">
                <PhTrash class="w-4 h-4" />
              </button>
              <div class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all duration-200">
                <PhCaretRight class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination & Total -->
    <div v-if="!curriculumStore.loading && totalCount > 0"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <p class="text-[13px] text-gray-800 font-semibold">
        ทั้งหมด : {{ totalCount }} รายการ
        <span v-if="hasActiveFilter" class="text-primary-500 font-normal ml-1">(กรองแล้ว)</span>
      </p>
      
      <nav class="flex items-center gap-1.5 flex-wrap" aria-label="Pagination">
        <button @click="currentPage = 1; loadData()" :disabled="currentPage === 1"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-gray-100/80 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100/80 transition-all duration-150 ease-ios cursor-pointer"
          aria-label="หน้าแรก">
          <PhCaretDoubleLeft class="h-3.5 w-3.5" />
        </button>
        <button @click="currentPage--; loadData()" :disabled="currentPage === 1"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-gray-100/80 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100/80 transition-all duration-150 ease-ios cursor-pointer"
          aria-label="หน้าก่อนหน้า">
          <PhCaretLeft class="h-3.5 w-3.5" />
        </button>

        <!-- Page number pills -->
        <template v-for="(page, idx) in pageRange" :key="`${page}-${idx}`">
          <button
            v-if="page !== '…'"
            @click="currentPage = page; loadData()"
            :class="[
              'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-150 ease-ios cursor-pointer',
              page === currentPage
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 bg-gray-100/80 hover:bg-gray-200'
            ]">
            {{ page }}
          </button>
          <span v-else class="text-gray-400 text-xs px-1">…</span>
        </template>

        <button @click="currentPage++; loadData()" :disabled="currentPage === totalPages"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-gray-100/80 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100/80 transition-all duration-150 ease-ios cursor-pointer"
          aria-label="หน้าถัดไป">
          <PhCaretRight class="h-3.5 w-3.5" />
        </button>
        <button @click="currentPage = totalPages; loadData()" :disabled="currentPage === totalPages"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-gray-100/80 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100/80 transition-all duration-150 ease-ios cursor-pointer"
          aria-label="หน้าสุดท้าย">
          <PhCaretDoubleRight class="h-3.5 w-3.5" />
        </button>
      </nav>
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
import RevisionCycleBadge from '@/components/curriculum/RevisionCycleBadge.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import { PhFilePlus, PhCaretRight, PhTrash, PhMagnifyingGlass, PhFileText, PhCaretLeft, PhBroom, PhCaretDoubleLeft, PhCaretDoubleRight } from '@phosphor-icons/vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { getDept } from '@/constants/departments';
import { formatThaiDateNumeric, isOverdue } from '@/utils/date';
import dayjs from 'dayjs';
import { refDebounced } from '@vueuse/core';
import { curriculumService } from '@/services/curriculumService';

const deptIcon = (name) => getDept(name)?.icon ?? null;
const deptColor = (name) => getDept(name)?.color ?? '#94a3b8';

const DEGREE_BADGE = {
  bachelor: 'bg-blue-50 text-blue-700',
  master:   'bg-purple-50 text-purple-700',
  doctoral: 'bg-indigo-50 text-indigo-700',
};

const router = useRouter();
const curriculumStore = useCurriculumStore();
const authStore = useAuthStore();
const deptStore = useDepartmentStore();
const toast = useToast();
const { open: confirm } = useConfirm();

// ชื่อภาควิชาที่ผู้ใช้ (อาจารย์/เจ้าหน้าที่สาขา) สังกัด — ใช้เป็นหัวข้อหน้า
const listTitle = computed(() => {
  if (authStore.isAdmin) return 'รายการหลักสูตรทั้งหมด';
  const deptName = authStore.user?.department?.name;
  return deptName ? `รายการหลักสูตรของ${deptName}ทั้งหมด` : 'รายการหลักสูตรของภาควิชาทั้งหมด';
});

// subtitle — เขียนคู่ขนานกับฝั่งแอดมิน แต่ระบุชื่อภาควิชาของผู้ใช้
const listSubtitle = computed(() => {
  if (authStore.isAdmin) return 'จัดการและติดตามสถานะหลักสูตร คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร';
  const deptName = authStore.user?.department?.name;
  return deptName
    ? `จัดการและติดตามสถานะหลักสูตร ${deptName}`
    : 'จัดการและติดตามสถานะหลักสูตรของภาควิชา';
});

const search = ref('');
const debouncedSearch = refDebounced(search, 500);

const filterDegree = ref('');
const filterStatus = ref('');
const filterDepartment = ref('');
const filterYear = ref('');
const departments = computed(() => deptStore.departments);

const currentBE = new Date().getFullYear() + 543;
const availableYears = ref([]); // ปีที่มีหลักสูตรจริง (ดึงจาก backend → ไม่มีวันขาด/เกิน)
const yearOptions = computed(() => {
  const years = availableYears.value.length
    ? availableYears.value
    : Array.from({ length: 16 }, (_, i) => currentBE + 5 - i); // fallback ระหว่างรอโหลด
  return [
    { label: 'ทุกปีการศึกษา', value: '' },
    ...years.map(y => ({ label: String(y), value: String(y) })),
  ];
});

const currentPage = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const totalCount = ref(0);
const fetchError = ref(false);

const loadData = async () => {
  fetchError.value = false;
  try {
    const meta = await curriculumStore.fetchAll({
      page: currentPage.value,
      limit: limit.value,
      search: debouncedSearch.value || undefined,
      degree: filterDegree.value || undefined,
      status: filterStatus.value || undefined,
      department_id: filterDepartment.value || undefined,
      year: filterYear.value || undefined,
    });
    if (meta) {
      totalPages.value = Math.ceil(meta.total / meta.limit);
      totalCount.value = meta.total;
    }
  } catch {
    fetchError.value = true;
  }
};

watch([debouncedSearch, filterDegree, filterStatus, filterDepartment, filterYear], async () => {
  currentPage.value = 1;
  await loadData();
});

const hasActiveFilter = computed(() => !!(search.value || filterDegree.value || filterStatus.value || filterDepartment.value || filterYear.value));

const pageRange = computed(() => {
  const total = totalPages.value;
  const cur   = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total];
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', cur - 1, cur, cur + 1, '…', total];
});

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
    await curriculumService.remove(c.id);
    toast.success('ยกเลิกหลักสูตรแล้ว', `${name} ถูกย้ายไปยังประวัติการยกเลิก`);
    loadData();
  } catch (err) {
    toast.error('ยกเลิกหลักสูตรไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

onMounted(() => {
  loadData();
  if (authStore.isAdmin) deptStore.fetchDepartments();
  // ดึงปีที่มีหลักสูตรจริงมาทำตัวกรอง (กันปีเก่าหลุดเมื่อเวลาผ่านไป)
  curriculumService.getYears().then(({ data }) => { availableYears.value = data.data || []; }).catch(() => {});
});
</script>
