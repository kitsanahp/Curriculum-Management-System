<template>
  <span :class="[
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border select-none transition-all duration-150 ease-ios',
    info.wrapClass,
    $attrs.class
  ]">
    <!-- ไอคอนสถานะ "รอ" ให้ pulse ช้าๆ เพื่อบอกว่ากำลังรอ action -->
    <component
      :is="info.icon"
      :class="[
        'w-3.5 h-3.5 shrink-0 opacity-70',
        info.pulseIcon && 'animate-pulse-slow'
      ]"
    />
    {{ info.label }}
    <!-- dot บอก "กำลังดำเนินการอยู่" สำหรับ under_committee -->
    <span v-if="info.activeDot" class="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow opacity-80 shrink-0" />
  </span>
</template>

<script setup>
import { computed } from 'vue';
import {
  PhClock, PhSealCheck, PhFileText, PhNotePencil,
  PhMagnifyingGlass, PhUsersThree, PhArrowsClockwise,
} from '@phosphor-icons/vue';
import { COMMITTEE_LABELS } from '@/constants/committees';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  status:     { type: String, required: true },
  curriculum: { type: Object, default: null },
});

// หา committee step ปัจจุบันจากข้อมูล curriculum
const currentStep = computed(() => {
  const c = props.curriculum;
  if (!c?.committee_steps?.length || !c.current_committee_step_id) return null;
  return c.committee_steps.find(s => s.id === c.current_committee_step_id) ?? null;
});

const totalSteps = computed(() => props.curriculum?.committee_steps?.length ?? 0);

const info = computed(() => {
  const s    = props.status;
  const step = currentStep.value;
  const n    = step?.step_order;
  const tot  = totalSteps.value;
  const name = step ? (COMMITTEE_LABELS[step.committee_type] ?? step.committee_type) : '';

  switch (s) {
    case 'pending_department':
      return {
        label:     'รอภาควิชาส่งเอกสาร',
        tooltip:   'รอภาควิชาอัปโหลดเอกสารและส่งหลักสูตร',
        wrapClass: 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100/50',
        icon:      PhNotePencil,
        pulseIcon: true,   // ✨ icon pulse ช้าๆ บอกว่า "รออยู่"
      };

    case 'department_submitted':
      return {
        label:     'รอตรวจสอบเอกสาร',
        tooltip:   'ภาควิชาส่งแล้ว รอตรวจสอบจากงานหลักสูตร คณะวิทยาศาสตร์',
        wrapClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50',
        icon:      PhMagnifyingGlass,
        pulseIcon: true,   // ✨
      };

    case 'under_committee':
      return step
        ? {
            label:     `อยู่ระหว่างพิจารณา ขั้นที่ ${n} จาก ${tot}`,
            tooltip:   `อยู่ระหว่างการพิจารณาโดย${name} ขั้นที่ ${n} จาก ${tot}`,
            wrapClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/50',
            icon:      PhUsersThree,
            activeDot: true,  // ✨ dot pulse "กำลังดำเนินการ"
          }
        : {
            label:     'อยู่ระหว่างการพิจารณา',
            tooltip:   'อยู่ระหว่างการพิจารณาของคณะกรรมการ',
            wrapClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/50',
            icon:      PhUsersThree,
            activeDot: true,
          };

    case 'revision':
      return step
        ? {
            label:     `ส่งกลับแก้ไข ขั้นที่ ${n}`,
            tooltip:   `ถูกส่งกลับแก้ไขโดย${name} ขั้นที่ ${n} รอภาควิชาดำเนินการ`,
            wrapClass: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50',
            icon:      PhArrowsClockwise,
          }
        : {
            label:     'ส่งกลับแก้ไข',
            tooltip:   'ถูกส่งกลับแก้ไขโดยงานหลักสูตร คณะวิทยาศาสตร์ รอภาควิชาส่งคืน',
            wrapClass: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50',
            icon:      PhArrowsClockwise,
          };

    case 'pending_admin_recheck':
      return {
        label:     'รอเจ้าหน้าที่ตรวจสอบ',
        tooltip:   'ภาควิชาแก้ไขเอกสารเสร็จแล้ว รอให้งานหลักสูตรคณะฯ ตรวจสอบก่อนนำเข้าที่ประชุมคณะกรรมการ',
        wrapClass: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/50',
        icon:      PhClock,
        pulseIcon: true,  // ✨
      };

    case 'approved':
      return {
        label:     'อนุมัติโดย สป.อว.',
        tooltip:   'หลักสูตรผ่านการอนุมัติจาก สป.อว. (CISA) แล้ว',
        wrapClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50',
        icon:      PhSealCheck,
      };

    case 'draft':
      return {
        label:     'ร่างหลักสูตร',
        tooltip:   'ร่างหลักสูตร ยังไม่ได้เริ่มดำเนินการ',
        wrapClass: 'bg-gray-50 text-gray-600 border-gray-300 hover:border-gray-400',
        icon:      PhFileText,
      };

    default:
      return { label: s, tooltip: s, wrapClass: 'bg-gray-50 text-gray-600 border-gray-200', icon: PhClock };
  }
});
</script>
