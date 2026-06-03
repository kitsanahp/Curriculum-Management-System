<template>
  <!-- single line -->
  <div
    v-if="lines === 1"
    :style="{ width, height }"
    :class="['animate-shimmer rounded', SHAPE_CLASSES[shape]]"
    aria-hidden="true"
  />

  <!-- multi-line text — แต่ละบรรทัดความยาวลดหลั่น natural -->
  <div v-else class="space-y-2">
    <div
      v-for="i in lines"
      :key="i"
      :style="{
        width: i === lines ? '60%' : width,
        height
      }"
      class="animate-shimmer rounded"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
defineProps({
  // rect | circle | text
  shape:  { type: String, default: 'rect' },
  width:  { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  lines:  { type: Number, default: 1 },
});

const SHAPE_CLASSES = {
  rect:   'rounded',
  circle: 'rounded-full',
  text:   'rounded',
};
</script>
