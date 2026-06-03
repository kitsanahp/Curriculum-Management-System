<template>
  <div class="relative" ref="containerRef">
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      :class="[
        'relative w-full flex items-center justify-between gap-2 rounded-lg bg-white py-2.5 pl-3 pr-3 text-left border text-sm transition-all duration-150 ease-ios focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0',
        open ? 'border-primary-400 shadow-sm' : 'border-gray-300 hover:border-gray-400',
        disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]"
    >
      <span :class="displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'" class="truncate">
        {{ displayValue || placeholder }}
      </span>
      <PhCalendar class="h-4 w-4 text-gray-400 shrink-0" />
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
          class="fixed z-[9999] w-[232px] rounded-xl bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden select-none"
          :style="panelStyle"
        >
          <!-- Month navigation -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <button
              @click="prevMonth" type="button"
              class="p-1 rounded-md hover:bg-gray-100 active:scale-[0.88] transition-all duration-150 ease-ios text-gray-500 hover:text-gray-800">
              <PhCaretLeft class="w-3.5 h-3.5" />
            </button>
            <span class="text-[11px] font-bold text-gray-800 tracking-tight">{{ monthLabel }}</span>
            <button
              @click="nextMonth" type="button"
              class="p-1 rounded-md hover:bg-gray-100 active:scale-[0.88] transition-all duration-150 ease-ios text-gray-500 hover:text-gray-800">
              <PhCaretRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Calendar grid -->
          <div class="px-2.5 pt-2 pb-1.5">
            <!-- Day headers -->
            <div class="grid grid-cols-7 mb-0.5">
              <span
                v-for="d in dayHeaders" :key="d"
                class="text-[10px] font-bold text-gray-400 text-center py-1">
                {{ d }}
              </span>
            </div>

            <!-- Day cells -->
            <div class="grid grid-cols-7 gap-px">
              <button
                v-for="(day, i) in calendarDays"
                :key="i"
                type="button"
                @click="selectDate(day)"
                :class="[
                  'h-7 w-full rounded-md text-[11px] flex items-center justify-center transition-all duration-100 ease-ios',
                  isSelected(day)
                    ? 'bg-primary-600 text-white font-bold'
                    : day.isSame(today, 'day')
                      ? 'text-primary-600 font-bold ring-1 ring-inset ring-primary-300 bg-primary-50'
                      : day.month() !== viewDate.month()
                        ? 'text-gray-200 pointer-events-none'
                        : 'text-gray-700 font-medium hover:bg-gray-100 active:bg-gray-200'
                ]"
              >
                {{ day.date() }}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <button
              @click="goToday" type="button"
              class="text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-all duration-150 ease-ios">
              วันนี้
            </button>
            <button
              @click="clearDate" type="button"
              class="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all duration-150 ease-ios">
              ล้าง
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { PhCalendar, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

const props = defineProps({
  modelValue: [String, Object, Date],
  placeholder: { type: String, default: 'เลือกวันที่' },
  disabled:    { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'change']);

const today      = dayjs();
const viewDate   = ref(props.modelValue ? dayjs(props.modelValue) : dayjs());
const open       = ref(false);
const containerRef = ref(null);
const panelRef     = ref(null);
const panelStyle   = ref({});

const thMonths  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const dayHeaders = ['อา','จ','อ','พ','พฤ','ศ','ส'];

const displayValue = computed(() => {
  if (!props.modelValue) return null;
  const d = dayjs(props.modelValue);
  return `${d.date()} ${thMonths[d.month()]} ${d.year() + 543}`;
});

const monthLabel = computed(() => `${thMonths[viewDate.value.month()]} ${viewDate.value.year() + 543}`);

const calendarDays = computed(() => {
  const start = viewDate.value.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
});

const isSelected = (day) => props.modelValue && day.isSame(dayjs(props.modelValue), 'day');

const prevMonth = () => { viewDate.value = viewDate.value.subtract(1, 'month'); };
const nextMonth = () => { viewDate.value = viewDate.value.add(1, 'month'); };

const selectDate = (day) => {
  if (day.month() !== viewDate.value.month()) return;
  emit('update:modelValue', day.format('YYYY-MM-DD'));
  emit('change', day.format('YYYY-MM-DD'));
  open.value = false;
};

const goToday = () => { viewDate.value = today; };

const clearDate = () => {
  emit('update:modelValue', null);
  emit('change', null);
  open.value = false;
};

const updatePosition = () => {
  if (!containerRef.value) return;
  const rect       = containerRef.value.getBoundingClientRect();
  const panelH     = 260;
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow >= panelH || spaceBelow >= 150) {
    panelStyle.value = { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
  } else {
    panelStyle.value = { bottom: `${window.innerHeight - rect.top + 4}px`, left: `${rect.left}px` };
  }
};

const toggle = () => {
  if (props.disabled) return;
  if (!open.value) updatePosition();
  open.value = !open.value;
};

const onClickOutside = (e) => {
  if (!containerRef.value?.contains(e.target) && !panelRef.value?.contains(e.target)) {
    open.value = false;
  }
};

const onKeydown = (e) => { if (e.key === 'Escape') open.value = false; };
const onScroll  = () => { if (open.value) updatePosition(); };

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

watch(() => props.modelValue, (val) => {
  if (val) viewDate.value = dayjs(val);
});
</script>
