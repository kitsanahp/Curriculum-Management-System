<template>
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div class="min-w-0">
      <!-- Breadcrumb หรือ back button (optional) -->
      <slot name="breadcrumb" />

      <!-- Title row — รองรับ icon นำหน้าและ badge ด้านข้าง -->
      <div class="flex items-center gap-3 flex-wrap">
        <component
          v-if="icon"
          :is="icon"
          :weight="iconWeight"
          class="w-7 h-7 text-primary-600 shrink-0"
          aria-hidden="true"
        />
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
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
