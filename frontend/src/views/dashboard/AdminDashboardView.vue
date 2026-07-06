<template>
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- KPI bar — สรุปสถานะหลักสูตร (แนวนอนยาว บนสุด) -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
        <span class="text-sm font-bold text-gray-900">สรุปสถานะหลักสูตร</span>
        <FormSelect v-model="selectedYear" :options="yearOptions" class="w-36" />
      </div>
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-100">
        <div v-for="i in 5" :key="i" class="px-5 py-4">
          <div class="h-12 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
      <div v-else class="flex flex-wrap">
        <!-- ทั้งหมด -->
        <RouterLink to="/curricula"
          class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer border-l border-gray-100/70 first:border-l-0 flex-1 min-w-[200px] whitespace-normal">
          <span class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <PhStack weight="duotone" class="w-5 h-5 text-primary-600" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="text-2xl font-bold text-primary-600 tabular-nums leading-none">{{ yearTotal }}</p>
            <p class="text-xs text-gray-500 mt-1 leading-tight">หลักสูตรทั้งหมด</p>
          </div>
        </RouterLink>
        <!-- สถานะต่างๆ — ชื่อเต็มบรรทัดเดียว ไม่ตัดคำ -->
        <RouterLink v-for="m in statusCards" :key="m.key" :to="m.to"
          class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer border-l border-gray-100/70 flex-1 min-w-[200px] whitespace-normal">
          <span class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{ backgroundColor: m.color + '1a' }">
            <component :is="m.icon" weight="duotone" class="w-5 h-5" :style="{ color: m.color }" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="text-2xl font-bold tabular-nums leading-none" :style="{ color: m.color }">{{ m.value }}</p>
            <p class="text-xs text-gray-500 mt-1 leading-tight break-words">{{ m.label }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- คู่ — ซ้าย: รอเจ้าหน้าที่คณะ | ขวา: รอแก้ไขจากสาขา -->
    <div class="grid md:grid-cols-2 gap-6">

      <!-- Action Queue — รอดำเนินการจากเจ้าหน้าที่คณะ -->
      <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-gray-900">หลักสูตรรอดำเนินการจากเจ้าหน้าที่คณะ</span>
              <span v-if="!loading && filteredActionQueue.length"
                class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-bold text-orange-700">
                {{ filteredActionQueue.length }}
              </span>
            </div>
            <RouterLink to="/curricula"
              class="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-150 cursor-pointer">
              ดูทั้งหมด
            </RouterLink>
          </div>

          <div v-if="loading" class="p-4 space-y-2">
            <div v-for="i in 3" :key="i" class="h-[60px] rounded-lg bg-gray-100 animate-pulse" />
          </div>

          <div v-else-if="!filteredActionQueue.length"
            class="flex flex-col items-center justify-center gap-2 py-10">
            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <PhCheckCircle weight="duotone" class="w-6 h-6 text-emerald-500" />
            </div>
            <p class="text-sm font-medium text-gray-500">ไม่มีรายการรอดำเนินการ</p>
          </div>

          <div v-else class="divide-y divide-gray-50 flex-1">
            <RouterLink
              v-for="c in filteredActionQueue" :key="c.id" :to="`/curricula/${c.id}`"
              class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors duration-150 group cursor-pointer">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-500 truncate">
                  {{ c.department?.name || 'ไม่ระบุภาควิชา' }}
                </p>
                <p class="text-sm font-semibold text-gray-800 truncate leading-snug mt-0.5">
                  {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ DEGREE_FULL[c.degree_level] || '-' }}</span>
                  <span v-if="c.curriculum_type" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}</span>
                  <span v-if="c.curriculum_year" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">ปี {{ c.curriculum_year }}</span>
                  <StatusBadge :status="c.status" :curriculum="c" />
                </div>
              </div>
              <PhCaretRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
            </RouterLink>
          </div>
        </div>

      <!-- Revision Needed — รอแก้ไขจากสาขา (คู่ขวา) -->
      <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-gray-900">หลักสูตรรอแก้ไขจากสาขา</span>
            <span v-if="!loading && filteredRevisionItems.length"
              class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-700">
              {{ filteredRevisionItems.length }}
            </span>
          </div>
          <RouterLink to="/curricula"
            class="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-150 cursor-pointer">
            ดูทั้งหมด
          </RouterLink>
        </div>

        <div v-if="loading" class="p-4 space-y-2">
          <div v-for="i in 3" :key="i" class="h-[60px] rounded-lg bg-gray-100 animate-pulse" />
        </div>

        <div v-else-if="!filteredRevisionItems.length"
          class="flex flex-col items-center justify-center gap-2 py-10">
          <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <PhCheckCircle weight="duotone" class="w-6 h-6 text-emerald-500" />
          </div>
          <p class="text-sm font-medium text-gray-500">ไม่มีหลักสูตรรอแก้ไข</p>
        </div>

        <div v-else class="divide-y divide-gray-50 flex-1">
          <RouterLink
            v-for="c in filteredRevisionItems" :key="c.id" :to="`/curricula/${c.id}`"
            class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors duration-150 group cursor-pointer">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-gray-500 truncate">
                {{ c.department?.name || 'ไม่ระบุภาควิชา' }}
              </p>
              <p class="text-sm font-semibold text-gray-800 truncate leading-snug mt-0.5">
                {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
              </p>
              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ DEGREE_FULL[c.degree_level] || '-' }}</span>
                <span v-if="c.curriculum_type" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}</span>
                <span v-if="c.curriculum_year" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">ปี {{ c.curriculum_year }}</span>
                <StatusBadge :status="c.status" :curriculum="c" />
                <span v-if="c.revision_deadline" :class="[
                  'text-[11px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap',
                  isOverdue(c.revision_deadline)
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                ]">
                  {{ isOverdue(c.revision_deadline) ? 'เลยกำหนด' : formatThaiDateShort(c.revision_deadline) }}
                </span>
              </div>
            </div>
            <PhCaretRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ความคืบหน้าคณะกรรมการ (เต็มความกว้าง) — ทุกปี ไม่ถูกกรองตามปีของการ์ดสรุป -->
    <CommitteeProgressTracker :curricula="curricula" :loading="loading" />

    <!-- รายการหลักสูตรดำเนินการล่าสุด (เต็มความกว้าง) -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
            <span class="text-sm font-bold text-gray-900">รายการหลักสูตรดำเนินการล่าสุด</span>
            <RouterLink to="/curricula"
              class="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-150 cursor-pointer">
              ดูทั้งหมด<span v-if="stats.total" class="ml-1 text-gray-400 font-normal">({{ stats.total }})</span>
            </RouterLink>
          </div>

          <div v-if="loading" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-[52px] rounded-lg bg-gray-100 animate-pulse" />
          </div>

          <EmptyState
            v-else-if="!filteredRecentCurricula.length"
            title="ยังไม่มีรายการหลักสูตรในระบบ"
            description="เริ่มต้นสร้างหลักสูตรแรกของคณะ"
            :icon="PhBookBookmark"
            action-label="สร้างหลักสูตรใหม่"
            :action-icon="PhPlusCircle"
            @action="router.push('/curricula/create')"
          />

          <div v-else class="divide-y divide-gray-50">
            <RouterLink
              v-for="c in filteredRecentCurricula.slice(0, 5)" :key="c.id" :to="`/curricula/${c.id}`"
              class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/70 transition-colors duration-150 group cursor-pointer">
              
              <!-- Name + dept row -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">
                  {{ c.department?.name || 'ไม่ระบุ' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">
                  {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span class="inline-flex items-center gap-1 text-[11px] text-gray-400 tabular-nums mr-1">
                    <PhClock class="w-3 h-3 shrink-0" />{{ formatThaiDateShort(c.updatedAt) }}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ DEGREE_FULL[c.degree_level] || '-' }}</span>
                  <span v-if="c.curriculum_type" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}</span>
                  <span v-if="c.curriculum_year" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">ปี {{ c.curriculum_year }}</span>
                </div>
              </div>

              <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <StatusBadge :status="c.status" :curriculum="c" />
              </div>
              <PhCaretRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
            </RouterLink>
          </div>
        </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useDashboard } from '@/composables/useDashboard';
import StatusBadge from '@/components/common/StatusBadge.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import {
  PhPlusCircle, PhCaretRight, PhClock, PhStack,
  PhCheckCircle, PhBookBookmark,
  PhPencilSimple, PhUsersThree, PhShieldCheck,
} from '@phosphor-icons/vue';
import { isOverdue, formatThaiDateShort } from '@/utils/date';

const router = useRouter();
const { stats, curricula, loading, fetch } = useDashboard();

const DEGREE_FULL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

onMounted(() => fetch());

// ── Scope ตามปีหลักสูตร — โดนัทสะท้อนเฉพาะปีที่เลือก (default = ปีล่าสุด) ──────
const selectedYear = ref('');
const availableYears = computed(() =>
  [...new Set(curricula.value.map(c => c.curriculum_year).filter(Boolean).map(String))]
    .sort((a, b) => Number(b) - Number(a))
);
const yearOptions = computed(() => [
  { label: 'ทุกปี', value: '' },
  ...availableYears.value.map(y => ({ label: `ปีหลักสูตร ${y}`, value: y })),
]);
watch(availableYears, (ys) => {
  if (!selectedYear.value && ys.length) selectedYear.value = ys[0];
}, { immediate: true });

const yearCurricula = computed(() =>
  selectedYear.value
    ? curricula.value.filter(c => String(c.curriculum_year) === selectedYear.value)
    : curricula.value
);
const yearTotal = computed(() => yearCurricula.value.length);

// คิวงาน/รายการล่าสุด — แสดงทุกปีเสมอ (ตัวกรองปีมีผลเฉพาะการ์ดสรุปสถานะ)
// ไม่งั้นงานค้างปีเก่าจะหายจากคิวเมื่อรีเฟรชแล้วปีรีเซ็ตกลับเป็นปีล่าสุด
const filteredActionQueue = computed(() =>
  curricula.value
    .filter(c => ['department_submitted', 'pending_admin_recheck'].includes(c.status))
    .sort((a, b) => (a.status === 'pending_admin_recheck' ? -1 : 1))
    .slice(0, 8)
);

const filteredRevisionItems = computed(() =>
  curricula.value.filter(c => c.status === 'revision')
);

const filteredRecentCurricula = computed(() =>
  [...curricula.value]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
);

// สถานะของหลักสูตรในปีที่เลือก (สำหรับโดนัท + legend)
const statusCards = computed(() => {
  const list = yearCurricula.value;
  const count = (fn) => list.filter(fn).length;
  return [
    { key: 'needs_action', label: 'หลักสูตรรอดำเนินการจากเจ้าหน้าที่คณะ', short: 'รอดำเนินการ',
      value: count(c => ['department_submitted', 'pending_admin_recheck'].includes(c.status)),
      icon: PhClock, color: '#f43f5e', to: '/curricula' },
    { key: 'revision', label: 'หลักสูตรรอแก้ไขจากสาขา', short: 'รอแก้ไข',
      value: count(c => c.status === 'revision'),
      icon: PhPencilSimple, color: '#8b5cf6', to: '/curricula' },
    { key: 'in_committee', label: 'หลักสูตรอยู่ระหว่างพิจารณาจากคณะกรรมการ', short: 'ระหว่างพิจารณา',
      value: count(c => c.status === 'under_committee'),
      icon: PhUsersThree, color: '#3b82f6', to: '/curricula' },
    { key: 'approved', label: 'หลักสูตรอนุมัติโดย สป.อว.', short: 'อนุมัติแล้ว',
      value: count(c => c.status === 'approved'),
      icon: PhShieldCheck, color: '#f59e0b', to: '/curricula' },
  ];
});
</script>
