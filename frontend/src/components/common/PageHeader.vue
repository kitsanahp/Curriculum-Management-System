<template>
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div class="min-w-0">
      <!-- Breadcrumb หรือ back button (optional) -->
      <slot name="breadcrumb" />

      <!-- Title row — รองรับ icon นำหน้าและ badge ด้านข้าง -->
      <div class="flex items-center gap-3 flex-wrap">
        <span
          v-if="icon"
          class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 shrink-0"
          aria-hidden="true"
        >
          <component :is="icon" :weight="iconWeight" class="w-5 h-5" />
        </span>
        <h1 class="text-xl font-semibold text-gray-900">
          {{ title }}
        </h1>
        <slot name="title-badge" />
      </div>

      <!-- Subtitle -->
      <p v-if="subtitle" class="text-sm text-gray-500 mt-1 font-medium">
        {{ subtitle }}
      </p>
    </div>

    <!-- Actions ด้านขวา (ปุ่ม สร้าง/ส่งออก/etc) -->
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:      { type: String, required: true },
  subtitle:   { type: String, default: '' },
  icon:       { type: [Object, Function], default: null },
  iconWeight: { type: String, default: 'duotone' },
});
</script>
