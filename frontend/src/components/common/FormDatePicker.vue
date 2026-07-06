<template>
  <div class="relative" ref="containerRef">
    <button
      type="button"
      :id="id || undefined"
      @click="toggle"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-haspopup="'dialog'"
      :class="[
        'relative w-full flex items-center justify-between gap-2 rounded-lg bg-white py-2.5 pl-3 pr-3 text-left border text-sm transition-all duration-150 ease-ios focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0',
        open ? 'border-primary-400 shadow-sm' : 'border-gray-300 hover:border-gray-400',
        disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]"
    >
      <span class="flex items-center gap-2 min-w-0">
        <component v-if="icon" :is="icon" class="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
        <span :class="displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'" class="truncate">
          {{ displayValue || placeholder }}
        </span>
      </span>
      <PhCalendar class="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
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
          role="dialog"
          :aria-label="placeholder"
          class="fixed z-[9999] w-[232px] rounded-xl bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden select-none"
          :style="panelStyle"
        >
          <!-- Header navigation -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <button
              @click="prev" type="button"
              :aria-label="prevLabel"
              class="p-1 rounded-md hover:bg-gray-100 active:scale-[0.88] transition-all duration-150 ease-ios text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <PhCaretLeft class="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              @click="cycleHeaderUp" type="button"
              :disabled="view === 'years'"
              class="text-xs font-bold text-gray-800 tracking-tight px-2 py-1 rounded-md hover:bg-gray-100 disabled:hover:bg-transparent disabled:cursor-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-live="polite">{{ headerLabel }}</button>
            <button
              @click="next" type="button"
              :aria-label="nextLabel"
              class="p-1 rounded-md hover:bg-gray-100 active:scale-[0.88] transition-all duration-150 ease-ios text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <PhCaretRight class="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <!-- Calendar grid (days view) -->
          <div v-if="view === 'days'" class="px-2.5 pt-2 pb-1.5">
            <!-- Day headers -->
            <div class="grid grid-cols-7 mb-0.5">
              <span
                v-for="d in dayHeaders" :key="d"
                class="text-xs font-bold text-gray-500 text-center py-1"
                aria-hidden="true">
                {{ d }}
              </span>
            </div>

            <!-- Day cells -->
            <div
              class="grid grid-cols-7 gap-px"
              @keydown="handleCalendarKeydown"
            >
              <button
                v-for="(day, i) in calendarDays"
                :key="day.format('YYYY-MM-DD')"
                type="button"
                :data-date="day.format('YYYY-MM-DD')"
                @click="selectDate(day)"
                @focus="focusedDate = day"
                :tabindex="isSelected(day) ? 0 : (day.isSame(today, 'day') && !modelValue && day.month() === viewDate.month()) ? 0 : -1"
                :aria-label="`${day.date()} ${thMonths[day.month()]} ${day.year() + 543}`"
                :aria-pressed="isSelected(day)"
                :class="[
                  'h-7 w-full rounded-md text-xs flex items-center justify-center transition-all duration-100 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
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

          <!-- Months view -->
          <div v-else-if="view === 'months'" class="px-2.5 py-2.5 grid grid-cols-3 gap-1.5">
            <button
              v-for="(m, i) in thMonthsShort" :key="m" type="button"
              @click="selectMonth(i)"
              :class="[
                'h-9 rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                i === viewDate.month()
                  ? 'bg-primary-600 text-white font-bold'
                  : 'text-gray-700 font-medium hover:bg-gray-100'
              ]">
              {{ m }}
            </button>
          </div>

          <!-- Years view -->
          <div v-else class="px-2.5 py-2.5 grid grid-cols-3 gap-1.5">
            <button
              v-for="y in yearGrid" :key="y" type="button"
              @click="selectYear(y)"
              :class="[
                'h-9 rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                y === viewDate.year()
                  ? 'bg-primary-600 text-white font-bold'
                  : 'text-gray-700 font-medium hover:bg-gray-100'
              ]">
              {{ y + 543 }}
            </button>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <button
              @click="goToday" type="button"
              class="text-xs font-bold text-primary-600 hover:text-primary-700 transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded">
              วันนี้
            </button>
            <button
              @click="clearDate" type="button"
              class="text-xs font-bold text-gray-500 hover:text-red-500 transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded">
              ล้าง
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { PhCalendar, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

const props = defineProps({
  modelValue: [String, Object, Date],
  placeholder: { type: String, default: 'เลือกวันที่' },
  disabled:    { type: Boolean, default: false },
  id:          { type: String, default: null },
  icon:        { type: [Object, Function], default: null },
});

const emit = defineEmits(['update:modelValue', 'change']);

const today      = dayjs();
const viewDate   = ref(props.modelValue ? dayjs(props.modelValue) : dayjs());
const open       = ref(false);
const containerRef = ref(null);
const panelRef     = ref(null);
const panelStyle   = ref({});
const focusedDate  = ref(null);

const thMonths  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const thMonthsShort = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const dayHeaders = ['อา','จ','อ','พ','พฤ','ศ','ส'];

// มุมมองปฏิทิน: 'days' | 'months' | 'years'
const view = ref('days');
const yearGridStart = ref(today.year() - 5);
const yearGrid = computed(() => Array.from({ length: 12 }, (_, i) => yearGridStart.value + i));

const displayValue = computed(() => {
  if (!props.modelValue) return null;
  const d = dayjs(props.modelValue);
  return `${d.date()} ${thMonths[d.month()]} ${d.year() + 543}`;
});

const headerLabel = computed(() => {
  if (view.value === 'months') return `${viewDate.value.year() + 543}`;
  if (view.value === 'years')  return `${yearGridStart.value + 543} - ${yearGridStart.value + 11 + 543}`;
  return `${thMonths[viewDate.value.month()]} ${viewDate.value.year() + 543}`;
});
const prevLabel = computed(() => view.value === 'days' ? 'เดือนก่อนหน้า' : view.value === 'months' ? 'ปีก่อนหน้า' : 'ช่วงปีก่อนหน้า');
const nextLabel = computed(() => view.value === 'days' ? 'เดือนถัดไป' : view.value === 'months' ? 'ปีถัดไป' : 'ช่วงปีถัดไป');

const calendarDays = computed(() => {
  const start = viewDate.value.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
});

const isSelected = (day) => props.modelValue && day.isSame(dayjs(props.modelValue), 'day');

const prev = () => {
  if (view.value === 'days')        viewDate.value = viewDate.value.subtract(1, 'month');
  else if (view.value === 'months') viewDate.value = viewDate.value.subtract(1, 'year');
  else                              yearGridStart.value -= 12;
};
const next = () => {
  if (view.value === 'days')        viewDate.value = viewDate.value.add(1, 'month');
  else if (view.value === 'months') viewDate.value = viewDate.value.add(1, 'year');
  else                              yearGridStart.value += 12;
};

// คลิกหัวปฏิทินเพื่อเลื่อนระดับขึ้น: วัน → เดือน → ปี
const cycleHeaderUp = () => {
  if (view.value === 'days') view.value = 'months';
  else if (view.value === 'months') { yearGridStart.value = viewDate.value.year() - 5; view.value = 'years'; }
};
const selectMonth = (i) => { viewDate.value = viewDate.value.month(i); view.value = 'days'; };
const selectYear  = (y) => { viewDate.value = viewDate.value.year(y); view.value = 'months'; };

const selectDate = (day) => {
  if (day.month() !== viewDate.value.month()) return;
  emit('update:modelValue', day.format('YYYY-MM-DD'));
  emit('change', day.format('YYYY-MM-DD'));
  open.value = false;
};

const goToday = () => { viewDate.value = today; view.value = 'days'; };

const clearDate = () => {
  emit('update:modelValue', null);
  emit('change', null);
  open.value = false;
};

const focusCellByDate = (date) => {
  nextTick(() => {
    const btn = panelRef.value?.querySelector(`[data-date="${date.format('YYYY-MM-DD')}"]`);
    btn?.focus();
  });
};

const handleCalendarKeydown = (e) => {
  const current = focusedDate.value;
  if (!current) return;

  let next = null;
  if (e.key === 'ArrowLeft')  { e.preventDefault(); next = current.subtract(1, 'day'); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); next = current.add(1, 'day'); }
  else if (e.key === 'ArrowUp')    { e.preventDefault(); next = current.subtract(1, 'week'); }
  else if (e.key === 'ArrowDown')  { e.preventDefault(); next = current.add(1, 'week'); }
  else if (e.key === 'Home')       { e.preventDefault(); next = current.startOf('month'); }
  else if (e.key === 'End')        { e.preventDefault(); next = current.endOf('month'); }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (current.month() === viewDate.value.month()) selectDate(current);
    return;
  }

  if (next) {
    // Navigate month if date is outside current view
    if (next.month() !== viewDate.value.month() || next.year() !== viewDate.value.year()) {
      viewDate.value = next.startOf('month');
    }
    focusedDate.value = next;
    focusCellByDate(next);
  }
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
  if (!open.value) {
    updatePosition();
    view.value = 'days';
    // Initialise focused date to selected value or today
    focusedDate.value = props.modelValue ? dayjs(props.modelValue) : today;
  }
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
