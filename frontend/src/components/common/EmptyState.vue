<template>
  <div :class="['flex flex-col items-center text-center', PADDING[size]]">
    <!-- Icon wrapper — bg-gray-50 + rounded-full pattern ที่ใช้ทุกที่ -->
    <div
      v-if="icon"
      :class="[
        'rounded-full flex items-center justify-center mb-4',
        ICON_BG[variant],
        ICON_WRAP_SIZE[size]
      ]">
      <component
        :is="icon"
        :class="[ICON_COLOR[variant], ICON_SIZE[size]]"
        aria-hidden="true"
      />
    </div>

    <!-- Title -->
    <h3 :class="['font-bold', TITLE_SIZE[size], TITLE_COLOR[variant]]">
      {{ title }}
    </h3>

    <!-- Description (optional) -->
    <p
      v-if="description"
      :class="['text-sm mt-1 leading-relaxed max-w-xs', DESC_COLOR[variant]]">
      {{ description }}
    </p>

    <!-- Action button (optional, ใช้ slot ก็ได้) -->
    <div v-if="$slots.action || actionLabel" class="mt-6">
      <slot name="action">
        <Button
          v-if="actionLabel"
          :variant="actionVariant"
          :icon-left="actionIcon"
          @click="$emit('action')">
          {{ actionLabel }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue';

defineProps({
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  icon:         { type: [Object, Function], default: null },
  // default | error | success
  variant:      { type: String, default: 'default' },
  // sm | md | lg
  size:         { type: String, default: 'md' },
  actionLabel:  { type: String, default: '' },
  actionIcon:   { type: [Object, Function], default: null },
  actionVariant:{ type: String, default: 'secondary' },
});

defineEmits(['action']);

const PADDING = {
  sm: 'py-8 px-4',
  md: 'py-16 px-6',
  lg: 'py-24 px-6',
};
const ICON_WRAP_SIZE = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' };
const ICON_SIZE      = { sm: 'w-6 h-6',   md: 'w-8 h-8',   lg: 'w-10 h-10' };
const TITLE_SIZE     = { sm: 'text-sm',   md: 'text-lg',   lg: 'text-xl'   };

const ICON_BG = {
  default: 'bg-gray-50',
  error:   'bg-red-50',
  success: 'bg-emerald-50',
};
const ICON_COLOR = {
  default: 'text-gray-300',
  error:   'text-red-400',
  success: 'text-emerald-500',
};
const TITLE_COLOR = {
  default: 'text-gray-900',
  error:   'text-red-900',
  success: 'text-emerald-900',
};
const DESC_COLOR = {
  default: 'text-gray-500',
  error:   'text-red-600',
  success: 'text-emerald-600',
};
</script>
