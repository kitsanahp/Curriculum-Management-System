<template>
  <!-- page title แบบ typographic — ไม่มีไอคอน badge, เน้นลำดับชั้นตัวอักษร -->
  <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
    <div class="min-w-0">
      <p v-if="scope" class="text-xs font-semibold text-gray-500 mb-1.5">
        {{ scope }}
      </p>
      <h1 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">
        {{ title }}
      </h1>
    </div>

    <!-- date — pill สะอาดเล็กๆ -->
    <span
      class="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm">
      <PhCalendarBlank weight="duotone" class="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
      <span class="whitespace-nowrap">ข้อมูล ณ {{ formatThaiDate(new Date()) }}</span>
    </span>
  </header>
</template>

<script setup>
import { PhCalendarBlank } from '@phosphor-icons/vue';
import { formatThaiDate } from '@/utils/date';

defineProps({
  title: { type: String, required: true },
  scope: { type: String, default: '' },
});
</script>
