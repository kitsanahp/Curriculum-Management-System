<template>
  <div class="max-w-7xl mx-auto space-y-5">

    <!-- KPI summary — donut cards (สัดส่วน part-to-whole) -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <!-- Unified Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
        <span class="text-sm font-bold text-gray-900">สรุปภาพรวมหลักสูตร</span>
        <FormSelect v-model="filterYear" :options="yearOptions" class="w-36 bg-white" />
      </div>

      <div class="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div v-for="card in donutCards" :key="card.key" class="p-5 sm:p-8">
        <p class="text-center text-sm font-bold text-gray-700 mb-5">{{ card.title }}</p>

        <div class="flex items-center justify-center gap-5 sm:gap-7">
          <!-- SVG donut -->
          <div class="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 100 100" class="w-full h-full" style="transform: rotate(-90deg);" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" stroke-width="12" />
              <circle
                v-for="seg in card.segments" :key="seg.key"
                cx="50" cy="50" r="38" fill="none"
                :stroke="seg.color" stroke-width="12" stroke-linecap="butt"
                :stroke-dasharray="`${seg.length} ${card.C - seg.length}`"
                :stroke-dashoffset="seg.dashOffset"
                class="transition-all duration-700 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-3xl font-black tabular-nums leading-none" :style="{ color: card.centerColor }">{{ card.total }}</p>
              <p class="text-xs font-medium text-gray-500 mt-0.5">หลักสูตร</p>
            </div>
          </div>

          <!-- Legend -->
          <div class="space-y-2.5 min-w-0">
            <div v-for="seg in card.segments" :key="seg.key" class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }" aria-hidden="true" />
              <span class="text-sm text-gray-600 flex-1 min-w-0">{{ seg.label }}</span>
              <span class="text-sm font-bold text-gray-800 tabular-nums shrink-0 w-7 text-right">{{ seg.value }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- สถานะหลักสูตรแยกตามระดับปริญญา — matrix เดียว: แถว = สถานะ, คอลัมน์ = ระดับปริญญา
         (แทนการ์ด 3 ใบที่ label สถานะซ้ำ 3 รอบ — เทียบข้ามระดับได้ในสายตาเดียว) -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 flex-wrap">
        <PhGraduationCap weight="duotone" class="w-5 h-5 text-primary-500" aria-hidden="true" />
        <span class="text-sm font-bold text-gray-900">สถานะหลักสูตรแยกตามระดับปริญญา</span>
        <span v-if="!loading && filteredCurricula.length"
          class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-50 px-1.5 text-xs font-bold text-primary-700">
          {{ filteredCurricula.length }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 7" :key="i" class="h-6 bg-gray-100 animate-pulse rounded-lg" :class="i > 1 && 'opacity-60'" />
      </div>

      <template v-else>
        <!-- Stacked bars — สเกลเดียวกันทุกแท่ง (เทียบความยาวข้ามระดับได้ตรง ๆ) -->
        <div class="px-5 pt-5 pb-4 space-y-3.5">
          <div v-for="deg in degreeBars.degs" :key="deg.key" class="flex items-center gap-3"
            role="img" :aria-label="`${deg.label} ${deg.total} หลักสูตร`">
            <span class="w-20 shrink-0 text-sm font-semibold text-gray-700 whitespace-nowrap text-right">{{ deg.label }}</span>
            <span class="w-6 shrink-0 text-sm font-bold tabular-nums text-right"
              :class="deg.total ? 'text-gray-900' : 'text-gray-300'">{{ deg.total }}</span>
            <div class="flex-1 h-7 rounded-md bg-gray-50 ring-1 ring-inset ring-gray-100 p-0.5">
              <div v-if="deg.total" class="h-full flex gap-0.5">
                <div v-for="seg in deg.segments" :key="seg.key"
                  class="h-full rounded flex items-center justify-center transition-all duration-700 ease-out cursor-default"
                  :style="{ width: `${(seg.count / degreeBars.max) * 100}%`, backgroundColor: seg.color, minWidth: '14px' }"
                  :title="`${seg.label} — ${seg.count} หลักสูตร`">
                  <span v-if="seg.count / degreeBars.max >= 0.1" class="text-[11px] font-bold text-white tabular-nums">{{ seg.count }}</span>
                </div>
              </div>
              <div v-else class="h-full flex items-center px-2">
                <span class="text-[11px] text-gray-400">ไม่มีหลักสูตร</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend รวม — จุดสี + ยอดรวมต่อสถานะ (ตัวที่เป็น 0 หรี่ลง) -->
        <div class="px-5 py-4 border-t border-gray-100 space-y-2">
          <div v-for="s in statusLegend" :key="s.key" class="flex items-center gap-2.5 flex-wrap">
            <span class="w-2.5 h-2.5 rounded-sm shrink-0" :class="!s.count && 'opacity-25'"
              :style="{ backgroundColor: s.color }" aria-hidden="true" />
            <span class="text-xs" :class="s.count ? 'text-gray-700 font-medium' : 'text-gray-400'">{{ s.label }}</span>
            <span v-if="s.sub" class="text-[10px] font-semibold px-1.5 py-px rounded-md bg-gray-100 text-gray-500 whitespace-nowrap">{{ s.sub }}</span>
            <span class="text-xs font-bold tabular-nums" :class="s.count ? 'text-gray-900' : 'text-gray-300'">{{ s.count }}</span>
            <!-- อยู่ระหว่างพิจารณาขั้นไหน — โผล่เฉพาะเมื่อมีจริง -->
            <span v-for="lv in s.levels || []" :key="lv.label"
              class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-100">
              {{ lv.label }}<span class="font-bold text-gray-700 tabular-nums">{{ lv.count }}</span>
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Committee pipeline tracker — grouped by department -->
    <div class="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2.5">
          <PhFlowArrow weight="duotone" class="w-5 h-5 text-primary-500" />
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
          <template v-if="committeeOverdue">
            <span class="w-px h-3.5 bg-gray-200 hidden sm:block" aria-hidden="true" />
            <span class="flex items-center gap-1 font-bold text-red-600">
              <PhWarningCircle weight="fill" class="w-3.5 h-3.5" />
              เลยกำหนดส่งแก้ {{ committeeOverdue }}
            </span>
          </template>
        </div>
      </div>

      <div v-if="loading" class="p-4 space-y-2.5">
        <div v-for="i in 4" :key="i" class="h-[46px] rounded-lg bg-gray-100 animate-pulse" />
      </div>

      <div v-else-if="!committeePipeline.length" class="flex items-center gap-3 px-5 py-4">
        <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <PhCheckCircle weight="duotone" class="w-5 h-5 text-emerald-500" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-700">ไม่มีหลักสูตรอยู่ระหว่างพิจารณา</p>
        </div>
      </div>

      <!-- Stepper grouped by department — ยืดเต็มกว้าง ไม่ต้องเลื่อนแนวนอน -->
      <div v-else class="divide-y divide-gray-100">
        <div v-for="group in committeePipeline" :key="group.deptName" class="flex items-stretch">

          <!-- Department cell -->
          <div class="w-32 shrink-0 flex flex-col items-center justify-center text-center px-2.5 py-3 gap-1"
            :style="{ backgroundColor: group.color }">
            <span class="text-[11px] font-bold text-white leading-snug"
              style="display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">{{ group.shortName }}</span>
            <span class="text-[10px] font-medium text-white/75 tabular-nums whitespace-nowrap">{{ group.items.length }} หลักสูตร</span>
          </div>

          <!-- Rows (stepper) -->
          <div class="flex-1 min-w-0 divide-y divide-gray-50">
            <div v-for="item in group.items" :key="item.id" class="px-4 py-3">
              <!-- Name + step badge -->
              <div class="flex items-start justify-between gap-3 mb-2">
                <p class="text-xs font-semibold leading-snug min-w-0" :class="item.overdue ? 'text-red-600' : 'text-gray-800'">
                  {{ item.name }}
                  <span class="ml-1.5 text-[10px] font-normal text-gray-400">{{ item.degreeLabel }}</span>
                </p>
                <span class="shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums"
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useDashboard } from '@/composables/useDashboard';
import { PhGraduationCap, PhFlowArrow, PhWarningCircle, PhCheckCircle } from '@phosphor-icons/vue';
import FormSelect from '@/components/common/FormSelect.vue';
import { getDept, DEPARTMENT_ORDER } from '@/constants/departments';
import { COMMITTEE_LABELS } from '@/constants/committees';
import { formatThaiDateShort } from '@/utils/date';
import { getRevisionCycle } from '@/utils/curriculum';

const DEGREE_FULL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

const { curricula, loading, fetch } = useDashboard();

const filterYear = ref('');

const availableYears = computed(() =>
  [...new Set(curricula.value.map(c => c.curriculum_year).filter(Boolean).map(String))]
    .sort((a, b) => Number(b) - Number(a))
);

const yearOptions = computed(() => [
  { label: 'ทุกปี', value: '' },
  ...availableYears.value.map(y => ({ label: `ปีหลักสูตร ${y}`, value: y })),
]);

const filteredCurricula = computed(() => {
  if (!filterYear.value) return curricula.value;
  return curricula.value.filter(c => String(c.curriculum_year) === String(filterYear.value));
});

onMounted(() => fetch());

// ── KPI summary — donut charts (pure SVG, no lib) — คำนวณจากข้อมูลจริง ──
// โดนัท 1: สัดส่วนหลักสูตรตามระดับปริญญา
const DEGREE_DONUT = computed(() => {
  const count = (lvl) => filteredCurricula.value.filter(c => c.degree_level === lvl).length;
  return [
    { key: 'bachelor', label: 'ปริญญาตรี', value: count('bachelor'), color: '#3b82f6' },
    { key: 'master',   label: 'ปริญญาโท', value: count('master'),   color: '#a23a4d' },
    { key: 'doctoral', label: 'ปริญญาเอก', value: count('doctoral'), color: '#16a34a' },
  ];
});
// โดนัท 2: หลักสูตรที่ใกล้/เลยครบรอบปรับปรุง (รอบ 5 ปี จาก curriculum_year)
const RENEWAL_DONUT = computed(() => {
  let y1 = 0, y2 = 0, over = 0;
  for (const c of filteredCurricula.value) {
    const cyc = getRevisionCycle(c.curriculum_year);
    if (!cyc) continue;
    if (cyc.yearsLeft < 0) over++;
    else if (cyc.yearsLeft <= 1) y1++;
    else if (cyc.yearsLeft === 2) y2++;
  }
  return [
    { key: 'y1',   label: 'ภายใน 1 ปี', value: y1,   color: '#fb923c' },
    { key: 'y2',   label: 'ภายใน 2 ปี', value: y2,   color: '#f97316' },
    { key: 'over', label: 'เกินกำหนด',  value: over, color: '#ef4444' },
  ];
});

// คำนวณ segment ของ donut (เว้นช่องว่างระหว่าง segment เล็กน้อย)
function buildDonut(items) {
  const r = 38;
  const C = 2 * Math.PI * r;
  const GAP = 2;
  const total = items.reduce((s, i) => s + i.value, 0);
  const active = items.filter(i => i.value > 0);
  if (!total) return { segments: [], C, total: 0 };
  const gapTotal = active.length * GAP;
  let acc = 0;
  const segments = active.map((p, idx) => {
    const length = (p.value / total) * (C - gapTotal);
    const dashOffset = -(acc + idx * GAP);
    acc += length;
    return { ...p, pct: Math.round((p.value / total) * 100), length, dashOffset };
  });
  return { segments, C, total };
}

const donutCards = computed(() => [
  { key: 'degree',  title: 'ภาพรวมหลักสูตร',          centerColor: '#111827', ...buildDonut(DEGREE_DONUT.value)  },
  { key: 'renewal', title: 'หลักสูตรครบกำหนดปรับปรุง', centerColor: '#ea580c', ...buildDonut(RENEWAL_DONUT.value) },
]);

// ── กราฟแยกตามระดับปริญญา ─────────────────────────────────────────────────
// ระดับของแต่ละคณะกรรมการ — ใช้บอก "อยู่ระหว่างพิจารณาขั้นไหน"
const COMMITTEE_LEVEL = {
  faculty_academic: 'ระดับคณะ', faculty_board: 'ระดับคณะ', general_education: 'ระดับคณะ',
  university_academic: 'ระดับมหาวิทยาลัย', graduate_school: 'ระดับมหาวิทยาลัย',
  university_council_academic: 'ระดับมหาวิทยาลัย', university_council: 'ระดับมหาวิทยาลัย',
  cisa: 'สป.อว.',
};
const LEVEL_ORDER = ['ระดับคณะ', 'ระดับมหาวิทยาลัย', 'สป.อว.'];
const currentCommitteeType = (c) =>
  (c.committee_steps || []).find(s => s.id === c.current_committee_step_id)?.committee_type || null;

// ชื่อสถานะตรงกับ StatusBadge + แตกย่อยให้รู้ว่าติดอยู่ที่ใคร/ขั้นไหน
// match() ครอบครบทั้ง 7 สถานะ → ผลรวมแถวเท่ายอดหลักสูตรเสมอ (reconcile)
const STATUS_ROWS = [
  { key: 'approved',  color: '#10b981', label: 'หลักสูตรอนุมัติโดย สป.อว.',   match: c => c.status === 'approved' },
  { key: 'committee', color: '#3b82f6', label: 'หลักสูตรอยู่ระหว่างพิจารณาจากคณะกรรมการ',  match: c => c.status === 'under_committee', byLevel: true },
  { key: 'rev_comm',  color: '#ef4444', label: 'ส่งกลับแก้ไข', sub: 'จาก คณะกรรมการ',  match: c => c.status === 'revision' && c.current_committee_step_id != null },
  { key: 'rev_admin', color: '#fb7185', label: 'ส่งกลับแก้ไข', sub: 'จาก งานหลักสูตร', match: c => c.status === 'revision' && c.current_committee_step_id == null },
  { key: 'recheck',   color: '#8b5cf6', label: 'รอเจ้าหน้าที่คณะตรวจสอบ', match: c => ['department_submitted', 'pending_admin_recheck'].includes(c.status) },
  { key: 'pending',   color: '#94a3b8', label: 'รอภาควิชาส่งเอกสาร',  match: c => ['pending_department', 'draft'].includes(c.status) },
];

// แท่ง stacked ต่อระดับปริญญา — ทุกแท่งใช้สเกลเดียวกัน (หารด้วย max ไม่ใช่ 100% ของตัวเอง)
const degreeBars = computed(() => {
  const degs = [
    { key: 'bachelor', label: 'ปริญญาตรี' },
    { key: 'master',   label: 'ปริญญาโท'  },
    { key: 'doctoral', label: 'ปริญญาเอก' },
  ].map(d => {
    const items = filteredCurricula.value.filter(c => c.degree_level === d.key);
    return {
      ...d,
      total: items.length,
      segments: STATUS_ROWS
        .map(s => ({
          key: s.key,
          label: s.sub ? `${s.label} (${s.sub})` : s.label,
          color: s.color,
          count: items.filter(s.match).length,
        }))
        .filter(s => s.count),
    };
  });
  return { degs, max: Math.max(1, ...degs.map(d => d.total)) };
});

// legend รวมทุกระดับ + แตกย่อยขั้นคณะกรรมการของ 'อยู่ระหว่างพิจารณา'
const statusLegend = computed(() =>
  STATUS_ROWS.map(s => {
    const matched = filteredCurricula.value.filter(s.match);
    let levels = null;
    if (s.byLevel && matched.length) {
      const counts = {};
      matched.forEach(c => {
        const lv = COMMITTEE_LEVEL[currentCommitteeType(c)] || 'ระดับคณะ';
        counts[lv] = (counts[lv] || 0) + 1;
      });
      levels = LEVEL_ORDER.filter(l => counts[l]).map(l => ({ label: l, count: counts[l] }));
    }
    return { ...s, count: matched.length, levels };
  })
);

// ── Committee pipeline Gantt ───────────────────────────────────────────────────
// X-axis: 8 ขั้น — งานหลักสูตร คณะวิทย์ (ขั้น 1) + 7 คณะกรรมการ
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
const DEGREE_LEGEND = [
  { key: 'bachelor', label: 'ปริญญาตรี', color: DEGREE_COLOR.bachelor },
  { key: 'master',   label: 'ปริญญาโท', color: DEGREE_COLOR.master },
  { key: 'doctoral', label: 'ปริญญาเอก', color: DEGREE_COLOR.doctoral },
];
// เรียงระดับปริญญา ตรี → โท → เอก (ไล่ตามลำดับในแต่ละภาควิชา)
const DEGREE_RANK = { bachelor: 0, master: 1, doctoral: 2 };

const committeeRows = computed(() => {
  return filteredCurricula.value
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
      // เลื่อน +1 เพราะงานหลักสูตร = ขั้น 1
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
        fillPct: `${((currentOrder - 0.5) / total) * 100}%`,
      };
    })
    .filter(Boolean);
});

const committeeTotal   = computed(() => committeeRows.value.length);
const committeeOverdue = computed(() => committeeRows.value.filter(r => r.overdue).length);

const committeePipeline = computed(() => {
  const order = [...DEPARTMENT_ORDER, 'ไม่ระบุ'];
  return order
    .map(deptName => {
      const items = committeeRows.value.filter(r => r.deptName === deptName);
      if (!items.length) return null;
      // เรียง ตรี → โท → เอก ก่อน แล้วดันงานที่เลยกำหนดขึ้นบน
      items.sort((a, b) =>
        (DEGREE_RANK[a.degreeLevel] - DEGREE_RANK[b.degreeLevel])
        || (b.overdue - a.overdue)
        || (b.overdueDays - a.overdueDays));
      return {
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
