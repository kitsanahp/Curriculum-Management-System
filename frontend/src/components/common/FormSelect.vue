<template>
  <div class="relative" ref="containerRef">
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :class="[
        'relative w-full flex items-center justify-between gap-2 rounded-lg bg-white py-2.5 pl-3 pr-3 text-left border text-sm transition-all duration-150 ease-ios focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0',
        open
          ? 'border-primary-400 shadow-sm'
          : 'border-gray-300 hover:border-gray-400',
        disabled
          ? 'bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer text-gray-900'
      ]"
    >
      <span class="block truncate min-w-0" :class="selectedLabel ? 'text-gray-900' : 'text-gray-400'">
        {{ selectedLabel || placeholder }}
      </span>
      <PhCaretDown
        weight="bold"
        class="h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ease-out"
        :class="open ? 'rotate-180' : 'rotate-0'"
      />
    </button>

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
              v-for="option in options"
              :key="option.value"
              type="button"
              role="option"
              :aria-selected="option.value === modelValue"
              @click="select(option.value)"
              :class="[
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-all duration-150 ease-ios gap-3',
                option.value === modelValue
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              ]"
            >
              <span class="truncate">{{ option.label }}</span>
              <PhCheck v-if="option.value === modelValue" weight="bold" class="h-3.5 w-3.5 text-primary-600 shrink-0" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { PhCheck, PhCaretDown } from '@phosphor-icons/vue';

const props = defineProps({
  modelValue: [String, Number, Boolean],
  options:    { type: Array,   default: () => [] },
  placeholder:{ type: String,  default: 'เลือกรายการ' },
  disabled:   { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'change']);

const open          = ref(false);
const containerRef  = ref(null);
const panelRef      = ref(null);
const panelStyle    = ref({});
const maxPanelHeight = ref('240px');

const selectedLabel = computed(() =>
  props.options.find(o => o.value === props.modelValue)?.label ?? null
);

const updatePosition = () => {
  if (!containerRef.value) return;
  const rect        = containerRef.value.getBoundingClientRect();
  const spaceBelow  = window.innerHeight - rect.bottom - 8;
  const spaceAbove  = rect.top - 8;
  const naturalH    = Math.min(props.options.length * 36 + 10, 240);

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
  if (!open.value) updatePosition();
  open.value = !open.value;
};

const select = (value) => {
  emit('update:modelValue', value);
  emit('change', value);
  open.value = false;
};

const onClickOutside = (e) => {
  if (!containerRef.value?.contains(e.target) && !panelRef.value?.contains(e.target)) {
    open.value = false;
  }
};

const onKeydown = (e) => {
  if (e.key === 'Escape') open.value = false;
};

const onScroll = () => { if (open.value) updatePosition(); };

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', onScroll, true);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', onScroll, true);
});
</script>
