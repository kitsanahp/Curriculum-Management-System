<template>
  <div
    class="relative shrink-0 inline-flex items-center justify-center rounded-full bg-gray-100"
    :style="{ width: dim.size, height: dim.size }"
  >
    <PhUser weight="fill" :style="{ width: dim.icon, height: dim.icon }" class="text-gray-400" />

    <div
      v-if="online"
      class="absolute bottom-0 right-0 rounded-full"
      :style="{ width: dim.dot, height: dim.dot, backgroundColor: '#10B981', border: '2px solid white' }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { PhUser } from '@phosphor-icons/vue';

const props = defineProps({
  name:   { type: String,  default: '' },
  role:   { type: String,  default: '' },
  size:   { type: String,  default: 'md' },
  online: { type: Boolean, default: false },
});

const DIMS = {
  xs: { size: '24px', icon: '14px', dot: '6px'  },
  sm: { size: '32px', icon: '18px', dot: '8px'  },
  md: { size: '40px', icon: '22px', dot: '10px' },
  lg: { size: '48px', icon: '26px', dot: '12px' },
  xl: { size: '64px', icon: '34px', dot: '14px' },
};

const dim = computed(() => DIMS[props.size] ?? DIMS.md);
</script>
