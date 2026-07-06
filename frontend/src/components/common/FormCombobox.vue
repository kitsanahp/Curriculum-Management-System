<template>
  <div class="relative" ref="containerRef">
    <div class="relative">
      <component v-if="icon" :is="icon" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
      <input
        type="text"
        ref="inputRef"
        v-model="internalValue"
        @focus="onFocus"
        @input="onInput"
        @keydown="handleKeydown"
        :disabled="disabled"
        :placeholder="placeholder"
        :class="[
          'relative w-full rounded-lg bg-white py-2.5 pr-10 text-left border text-sm transition-all duration-150 ease-ios focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0',
          icon ? 'pl-9' : 'pl-3',
          open
            ? 'border-primary-400 shadow-sm'
            : 'border-gray-300 hover:border-gray-400',
          disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'text-gray-900'
        ]"
      />
      <button type="button" @click="toggle" tabindex="-1" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <PhCaretDown
          weight="bold"
          class="h-4 w-4 text-gray-400 transition-transform duration-200 ease-out cursor-pointer hover:text-gray-600"
          :class="open ? 'rotate-180' : 'rotate-0'"
          aria-hidden="true"
        />
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="open"
          ref="panelRef"
          role="listbox"
          class="fixed z-[9999] rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden"
          :style="panelStyle"
        >
          <div class="py-1 overflow-auto overscroll-contain" :style="{ maxHeight: maxPanelHeight }">
            <button
              v-for="(option, idx) in filteredOptions"
              :key="option.value"
              type="button"
              role="option"
              :aria-selected="option.value === internalValue"
              @click="select(option.value)"
              @mouseenter="focusedIndex = idx"
              :class="[
                'w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-all duration-150 ease-ios gap-3',
                option.value === internalValue || focusedIndex === idx
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              ]"
            >
              <span class="truncate">{{ option.label }}</span>
              <PhCheck v-if="option.value === internalValue" weight="bold" class="h-3.5 w-3.5 text-primary-600 shrink-0" />
            </button>
            <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-sm text-gray-500 text-center">
              ไม่มีตัวเลือกที่ตรงกัน
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { PhCheck, PhCaretDown } from '@phosphor-icons/vue';

const props = defineProps({
  modelValue: [String, Number],
  options:    { type: Array,   default: () => [] },
  placeholder:{ type: String,  default: 'พิมพ์หรือเลือก...' },
  disabled:   { type: Boolean, default: false },
  icon:       { type: [Object, Function], default: null },
});

const emit = defineEmits(['update:modelValue', 'change']);

const internalValue = ref(props.modelValue);
const open = ref(false);
const containerRef = ref(null);
const panelRef = ref(null);
const inputRef = ref(null);
const panelStyle = ref({});
const maxPanelHeight = ref('240px');
const focusedIndex = ref(-1);

// Sync external changes
watch(() => props.modelValue, (newVal) => {
  if (internalValue.value !== newVal) {
    internalValue.value = newVal;
  }
});

const filteredOptions = computed(() => {
  if (!internalValue.value) return props.options;
  const search = String(internalValue.value).toLowerCase();
  return props.options.filter(o => String(o.label).toLowerCase().includes(search) || String(o.value).toLowerCase().includes(search));
});

const updatePosition = () => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  // +10 for padding, limit to 240
  const naturalH = Math.min((filteredOptions.value.length || 1) * 36 + 10, 240);

  if (spaceBelow >= naturalH || spaceBelow >= spaceAbove) {
    const h = Math.min(naturalH, spaceBelow);
    maxPanelHeight.value = `${h}px`;
    panelStyle.value = { top: `${rect.bottom + 4}px`, left: `${rect.left}px`, minWidth: `${rect.width}px` };
  } else {
    const h = Math.min(naturalH, spaceAbove);
    maxPanelHeight.value = `${h}px`;
    panelStyle.value = { bottom: `${window.innerHeight - rect.top + 4}px`, left: `${rect.left}px`, minWidth: `${rect.width}px` };
  }
};

const toggle = () => {
  if (props.disabled) return;
  if (!open.value) {
    open.value = true;
    inputRef.value?.focus();
    updatePosition();
    focusedIndex.value = -1;
  } else {
    open.value = false;
  }
};

const onFocus = () => {
  if (props.disabled) return;
  open.value = true;
  updatePosition();
  focusedIndex.value = -1;
};

const onInput = (e) => {
  emit('update:modelValue', internalValue.value);
  emit('change', internalValue.value);
  open.value = true;
  updatePosition();
  focusedIndex.value = -1;
};

const handleKeydown = (e) => {
  const optsCount = filteredOptions.value.length;
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    open.value = true;
    updatePosition();
    e.preventDefault();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusedIndex.value = Math.min(focusedIndex.value + 1, optsCount - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedIndex.value >= 0 && focusedIndex.value < optsCount) {
      select(filteredOptions.value[focusedIndex.value].value);
    } else {
      // Allow manual entry
      open.value = false;
    }
  } else if (e.key === 'Escape') {
    open.value = false;
    inputRef.value?.blur();
  }
};

const select = (value) => {
  internalValue.value = value;
  emit('update:modelValue', value);
  emit('change', value);
  open.value = false;
};

const onClickOutside = (e) => {
  if (!containerRef.value?.contains(e.target) && !panelRef.value?.contains(e.target)) {
    open.value = false;
  }
};

const onScroll = () => { if (open.value) updatePosition(); };

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
  window.addEventListener('scroll', onScroll, true);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside);
  window.removeEventListener('scroll', onScroll, true);
});
</script>
