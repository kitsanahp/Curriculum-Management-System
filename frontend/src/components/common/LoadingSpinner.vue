<template>
  <!-- inline = แค่ spinner เดียว, default = centered พร้อม label -->
  <div
    v-if="inline"
    :class="[
      'border-current/20 border-t-current rounded-full animate-spin',
      SIZE_CLASSES[size],
      BORDER_WIDTH[size]
    ]"
    role="status"
    :aria-label="label || 'กำลังโหลด'"
  />

  <div
    v-else
    class="flex flex-col items-center justify-center gap-3"
    :class="centered && 'py-12'"
    role="status">
    <div
      :class="[
        'border-primary-100 border-t-primary-600 rounded-full animate-spin',
        SIZE_CLASSES[size],
        BORDER_WIDTH[size]
      ]"
      aria-hidden="true"
    />
    <p v-if="label" :class="['text-gray-500 font-medium', LABEL_SIZE[size]]">
      {{ label }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  // sm | md | lg | xl
  size:     { type: String, default: 'md' },
  // ข้อความใต้ spinner
  label:    { type: String, default: '' },
  // แสดงในบรรทัดเดียว (สำหรับใส่ในปุ่ม)
  inline:   { type: Boolean, default: false },
  // เพิ่ม py-12 ให้อยู่กลาง section
  centered: { type: Boolean, default: false },
});

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const BORDER_WIDTH = {
  sm: 'border-2',
  md: 'border-[3px]',
  lg: 'border-[3px]',
  xl: 'border-4',
};

const LABEL_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-base',
};
</script>
