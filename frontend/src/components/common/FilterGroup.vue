<template>
  <div class="space-y-3">
    <!-- Filter controls (search + dropdowns ผ่าน slot) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-3">
        <!-- Search row (optional) -->
        <div v-if="$slots.search || searchable" class="relative">
          <slot name="search">
            <InputField
              :id="searchId"
              :model-value="searchValue"
              :placeholder="searchPlaceholder"
              :icon-left="PhMagnifyingGlass"
              @update:model-value="$emit('update:searchValue', $event)"
            />
          </slot>
        </div>

        <!-- Filter dropdowns row -->
        <div
          v-if="$slots.filters"
          :class="['grid grid-cols-1 sm:grid-cols-2 gap-3', GRID_COLS[cols]]">
          <slot name="filters" />
        </div>
      </div>
    </div>

    <!-- Active filter chips -->
    <div
      v-if="activeChips.length"
      class="flex items-center gap-2 flex-wrap -mt-1">
      <span class="text-[11px] font-semibold text-gray-400">กรองโดย</span>
      <button
        v-for="chip in activeChips"
        :key="chip.key || chip.label"
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 active:scale-[0.95] transition-all duration-150 ease-ios"
        @click="$emit('remove-chip', chip)">
        {{ chip.label }}
        <span class="text-primary-400 font-bold leading-none" aria-hidden="true">×</span>
      </button>
      <button
        type="button"
        class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-all"
        @click="$emit('clear-all')">
        ล้างทั้งหมด
      </button>
    </div>
  </div>
</template>

<script setup>
import { PhMagnifyingGlass } from '@phosphor-icons/vue';
import InputField from './InputField.vue';

defineProps({
  // จำนวน columns ของ filter row บนจอใหญ่: 2 | 3 | 4
  cols:       { type: Number, default: 3 },
  // ใช้ search built-in (ถ้าไม่ใช้ slot custom)
  searchable: { type: Boolean, default: false },
  searchValue: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'ค้นหา' },
  searchId:   { type: String, default: 'filter-search' },
  // [{ key, label }] — chip ที่ active อยู่
  activeChips: { type: Array, default: () => [] },
});

defineEmits(['update:searchValue', 'remove-chip', 'clear-all']);

const GRID_COLS = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};
</script>
