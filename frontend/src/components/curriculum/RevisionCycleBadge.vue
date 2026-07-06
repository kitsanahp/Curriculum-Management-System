<template>
  <span v-if="cycle?.isDue"
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border select-none',
      'bg-amber-50 text-amber-700 border-amber-200',
    ]"
    :data-tooltip="tooltip" data-tooltip-bottom>
    <PhArrowsClockwise class="w-3.5 h-3.5 shrink-0 opacity-70" weight="bold" />
    ถึงเวลาปรับวงรอบ
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { PhArrowsClockwise } from '@phosphor-icons/vue';
import { getRevisionCycle } from '@/utils/curriculum';

const props = defineProps({
  // ปีหลักสูตร พ.ศ. เช่น "2570"
  curriculumYear: { type: [String, Number], default: null },
});

const cycle = computed(() => getRevisionCycle(props.curriculumYear));

const tooltip = computed(() => {
  const c = cycle.value;
  if (!c) return '';
  if (c.yearsLeft === 0) return `ครบกำหนดปรับปรุงปีนี้ (${c.currentYear})`;
  return `เลยกำหนดปรับปรุงมา ${Math.abs(c.yearsLeft)} ปี`;
});
</script>
