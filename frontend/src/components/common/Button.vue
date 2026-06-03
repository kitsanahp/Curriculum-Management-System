<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :to="to"
    :href="href"
    :disabled="isDisabled"
    :aria-disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
    :class="[
      'inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap select-none rounded-xl transition-all duration-150 ease-ios outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
      SIZE_CLASSES[size],
      VARIANT_CLASSES[variant],
      block && 'w-full',
      isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'active:scale-[0.97]'
    ]"
    @click="onClick">
    <!-- Loading spinner -->
    <span
      v-if="loading"
      class="border-2 border-current/30 border-t-current rounded-full animate-spin"
      :class="SPINNER_SIZE[size]"
      aria-hidden="true"
    />
    <!-- Leading icon -->
    <component
      v-else-if="iconLeft"
      :is="iconLeft"
      :class="ICON_SIZE[size]"
      aria-hidden="true"
    />

    <!-- Label -->
    <span v-if="$slots.default || label" :class="loading && 'opacity-70'">
      <slot>{{ label }}</slot>
    </span>

    <!-- Trailing icon -->
    <component
      v-if="iconRight && !loading"
      :is="iconRight"
      :class="ICON_SIZE[size]"
      aria-hidden="true"
    />
  </component>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // primary | secondary | danger | success | ghost
  variant:   { type: String, default: 'primary' },
  // sm | md | lg
  size:      { type: String, default: 'md' },
  // ถ้าใส่จะ render เป็น router-link
  to:        { type: [String, Object], default: null },
  // ถ้าใส่จะ render เป็น <a>
  href:      { type: String, default: null },
  // HTML type attribute (ใช้เมื่อเป็น <button>)
  type:      { type: String, default: 'button' },
  label:     { type: String, default: '' },
  iconLeft:  { type: [Object, Function], default: null },
  iconRight: { type: [Object, Function], default: null },
  loading:   { type: Boolean, default: false },
  disabled:  { type: Boolean, default: false },
  block:     { type: Boolean, default: false },
});

const emit = defineEmits(['click']);

// ถ้ามี to ใช้ router-link, ถ้ามี href ใช้ a, ที่เหลือ button
const tag = computed(() => {
  if (props.to)   return 'router-link';
  if (props.href) return 'a';
  return 'button';
});

const isDisabled = computed(() => props.disabled || props.loading);

const onClick = (e) => {
  if (isDisabled.value) { e.preventDefault(); return; }
  emit('click', e);
};

// ── Design tokens ──────────────────────────────────────────────────────────
const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const ICON_SIZE = {
  sm: 'w-3.5 h-3.5 shrink-0',
  md: 'w-4 h-4 shrink-0',
  lg: 'w-5 h-5 shrink-0',
};

const SPINNER_SIZE = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const VARIANT_CLASSES = {
  primary:   'bg-primary-600 text-white shadow-sm hover:bg-primary-500',
  secondary: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50',
  danger:    'bg-red-600 text-white shadow-sm hover:bg-red-500',
  success:   'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
};
</script>
