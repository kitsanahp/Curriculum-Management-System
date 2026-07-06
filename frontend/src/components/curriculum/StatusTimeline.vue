<template>
  <div>
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-7 h-7 border-[3px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="!events.length" class="text-center py-12 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
      <PhClock class="mx-auto h-10 w-10 text-gray-300" />
      <p class="mt-3 text-sm font-bold text-gray-500">ยังไม่มีข้อมูล Timeline</p>
    </div>

    <div v-else>
      <div v-for="(event, idx) in events" :key="event.id">

        <!-- ─── Milestone Row ─── -->
        <div class="flex gap-3 items-start">

          <!-- Icon -->
          <div class="flex flex-col items-center shrink-0">
            <div :class="['relative w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm', theme(event).dot]">
              <component :is="theme(event).icon" class="w-4 h-4 text-white" />
            </div>
          </div>

          <!-- Content card -->
          <div class="flex-1 min-w-0 pb-1">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="min-w-0">
                <p class="text-sm font-bold text-gray-900 leading-snug">{{ getLabel(event) }}</p>
                <p class="text-xs text-gray-500 mt-0.5 truncate">
                  <span class="font-medium">{{ formatUserName(event.user) || 'ระบบ' }}</span>
                  <span class="text-xs bg-gray-100 text-gray-500 px-1.5 py-px rounded ml-1">{{ formatDate(event.createdAt) }}</span>
                </p>
              </div>
            </div>
            <!-- Notes -->
            <p v-if="event.details?.notes" class="mt-2 text-xs text-gray-500 bg-orange-50 rounded-lg px-3 py-2 ring-1 ring-orange-100 leading-relaxed">
              {{ event.details.notes }}
            </p>
          </div>
        </div>

        <!-- ─── Duration connector ─── -->
        <div v-if="idx < events.length - 1 || event.is_current" class="flex gap-3 items-stretch">
          <!-- Vertical line -->
          <div class="flex flex-col items-center w-8 shrink-0">
            <div class="w-0.5 flex-1 my-0.5" :class="event.is_current ? 'bg-gray-100 border-dashed' : 'bg-gray-100'" />
          </div>
          <!-- Duration pill -->
          <div class="flex items-center py-2">
            <span :class="[
              'inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ring-1',
              event.is_current
                ? 'bg-primary-50 text-primary-700 ring-primary-200'
                : event.duration_days > 30
                  ? 'bg-red-50 text-red-600 ring-red-200'
                  : event.duration_days > 14
                    ? 'bg-orange-50 text-orange-600 ring-orange-200'
                    : 'bg-gray-50 text-gray-500 ring-gray-200'
            ]">
              <span v-if="event.is_current" class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse shrink-0" />
              <template v-if="event.is_current">กำลังดำเนินการ <span class="font-bold">{{ event.duration_days }} วัน</span></template>
              <template v-else>{{ event.duration_days }} วัน</template>
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import {
  PhPlusCircle, PhPaperPlaneTilt, PhCheckCircle,
  PhArrowCounterClockwise, PhArrowsClockwise, PhWarningCircle,
  PhTrophy, PhClock
} from '@phosphor-icons/vue';
import { PhSealCheck } from '@phosphor-icons/vue';
import { formatThaiDateTime } from '@/utils/date';
import { formatUserName } from '@/utils/user';
import { COMMITTEE_LABELS } from '@/constants/committees';

defineProps({
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const formatDate = formatThaiDateTime;

const getLabel = (event) => {
  const ct = event.details?.committee_type;
  const name = ct ? COMMITTEE_LABELS[ct] || ct : '';

  switch (event.action) {
    case 'CREATE_CURRICULUM':       return 'สร้างหลักสูตร';
    case 'DEPARTMENT_SUBMIT':       return 'ส่งหลักสูตรเพื่อตรวจสอบ';
    case 'ADMIN_APPROVE':           return 'ผ่านการตรวจสอบ เข้าสู่กระบวนการคณะกรรมการ';
    case 'ADMIN_REJECT':            return 'งานหลักสูตรคณะส่งกลับแก้ไข';
    case 'COMMITTEE_APPROVED':
      return ct === 'cisa'
        ? 'CISA เห็นชอบ หลักสูตรได้รับการอนุมัติ'
        : `${name} เห็นชอบ`;
    case 'COMMITTEE_REVISION':      return `${name} ส่งกลับแก้ไข`;
    case 'RESUBMIT_AFTER_REVISION': return 'ส่งคืนคณะกรรมการพิจารณาต่อ';
    default: return event.action;
  }
};

const theme = (event) => {
  switch (event.action) {
    case 'CREATE_CURRICULUM':
      return { dot: 'bg-indigo-500', icon: PhPlusCircle };
    case 'DEPARTMENT_SUBMIT':
      return { dot: 'bg-orange-400', icon: PhPaperPlaneTilt };
    case 'ADMIN_APPROVE':
      return { dot: 'bg-blue-500', icon: PhCheckCircle };
    case 'ADMIN_REJECT':
      return { dot: 'bg-rose-500', icon: PhArrowCounterClockwise };
    case 'COMMITTEE_APPROVED':
      return event.details?.committee_type === 'cisa'
        ? { dot: 'bg-emerald-600', icon: PhTrophy }
        : { dot: 'bg-emerald-500', icon: PhSealCheck };
    case 'COMMITTEE_REVISION':
      return { dot: 'bg-rose-500', icon: PhWarningCircle };
    case 'RESUBMIT_AFTER_REVISION':
      return { dot: 'bg-sky-500', icon: PhArrowsClockwise };
    default:
      return { dot: 'bg-gray-400', icon: PhClock };
  }
};
</script>
