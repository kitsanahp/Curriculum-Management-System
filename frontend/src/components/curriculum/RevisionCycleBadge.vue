<template>
  <!-- Reminder badge: white + amber outline so it reads as a notice, not a workflow status pill -->
  <span v-if="cycle?.isDue"
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border select-none',
      'bg-white text-amber-700 border-amber-300',
    ]"
    :data-tooltip="tooltip" data-tooltip-bottom>
    <PhClockCountdown class="w-3.5 h-3.5 shrink-0 opacity-70" weight="bold" />
    ถึงเวลาปรับวงรอบ
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { PhClockCountdown } from '@phosphor-icons/vue';
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
