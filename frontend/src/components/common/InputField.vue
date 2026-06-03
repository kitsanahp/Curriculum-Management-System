<template>
  <div class="w-full">
    <!-- Label + required mark + optional hint -->
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-semibold text-gray-700 mb-1.5">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-label="จำเป็น">*</span>
      <span v-else-if="optional" class="text-gray-400 font-normal ml-1">(ไม่บังคับ)</span>
    </label>

    <!-- Input wrapper (รองรับ icon ซ้าย/ขวา) -->
    <div class="relative">
      <!-- Leading icon -->
      <div
        v-if="iconLeft"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <component :is="iconLeft" class="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>

      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : helper ? `${id}-helper` : undefined"
        :class="[
          'block w-full rounded-xl border bg-white text-sm text-gray-900 shadow-sm transition-all',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2',
          iconLeft  && 'pl-10',
          iconRight && 'pr-10',
          !iconLeft && !iconRight && 'px-3.5',
          SIZE_CLASSES[size],
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20',
          disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed'
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      />

      <!-- Trailing icon (click-able เช่น show/hide password) -->
      <button
        v-if="iconRight"
        type="button"
        tabindex="-1"
        class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
        :aria-label="iconRightLabel"
        @click="$emit('icon-right-click')">
        <component :is="iconRight" class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Error message (priority สูงกว่า helper) -->
    <p
      v-if="error"
      :id="`${id}-error`"
      class="mt-1.5 text-xs font-medium text-red-600 flex items-start gap-1">
      <span aria-hidden="true">⚠</span>
      <span>{{ error }}</span>
    </p>

    <!-- Helper text -->
    <p
      v-else-if="helper"
      :id="`${id}-helper`"
      class="mt-1.5 text-xs text-gray-500">
      {{ helper }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  id:          { type: String, required: true },
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, default: '' },
  type:        { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  helper:      { type: String, default: '' },
  error:       { type: String, default: '' },
  required:    { type: Boolean, default: false },
  optional:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  readonly:    { type: Boolean, default: false },
  // sm | md | lg
  size:        { type: String, default: 'md' },
  iconLeft:    { type: [Object, Function], default: null },
  iconRight:   { type: [Object, Function], default: null },
  iconRightLabel: { type: String, default: '' },
});

defineEmits(['update:modelValue', 'blur', 'icon-right-click']);

const SIZE_CLASSES = {
  sm: 'py-2',
  md: 'py-2.5',
  lg: 'py-3',
};
</script>
