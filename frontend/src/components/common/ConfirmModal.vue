<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="state"
        class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        @click.self="respond(false)">

        <!-- Backdrop แยก animation จาก modal card -->
        <Transition name="fade" appear>
          <div v-if="state" class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
        </Transition>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-inset ring-gray-900/5 overflow-hidden">
          <div class="p-6">

            <!-- Header: icon tile + title (centered) -->
            <div class="flex flex-col items-center text-center gap-4">
              <div :class="['shrink-0 w-16 h-16 rounded-full flex items-center justify-center ring-8 mt-2', STYLES[state.type].iconBg, STYLES[state.type].ringColor]">
                <component :is="getIcon(state.type)" :class="['w-8 h-8', STYLES[state.type].iconColor]" weight="duotone" />
              </div>
              <div class="min-w-0 flex-1 w-full mt-1">
                <h3 class="text-lg font-bold text-gray-900 leading-snug text-balance px-2">{{ state.title }}</h3>
                <!-- Subject (Subtle) -->
                <div v-if="state.subject" class="mt-2 inline-flex max-w-full items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg border border-gray-100">
                  <PhGraduationCap class="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  <span class="truncate">{{ state.subject }}</span>
                </div>
              </div>
            </div>

            <!-- Message — notice box (สีตาม type: amber เฉพาะ warning/danger, ที่เหลือโทนกลาง) -->
            <div v-if="state.message"
              :class="['mt-5 flex items-center gap-2.5 rounded-xl px-4 py-2.5 ring-1 ring-inset', noticeStyle.box]">
              <component :is="noticeStyle.icon" :class="['w-5 h-5 shrink-0', noticeStyle.iconColor]" weight="fill" />
              <div :class="['flex-1 text-[13px] leading-relaxed text-left font-medium', noticeStyle.text]" v-html="state.message"></div>
            </div>

            <!-- Detail box -->
            <div v-if="state.detail"
              class="mt-4 p-4 rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm text-gray-600 leading-relaxed">
              {{ state.detail }}
            </div>

            <!-- Actions — ชิดขวา primary เด่น หรือแบ่งครึ่งเท่ากัน -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              <button
                @click="respond(false)"
                :class="['w-full min-h-[44px] flex items-center justify-center py-2 px-3 rounded-xl text-sm font-bold shadow-2xs active:scale-[0.98] transition-all duration-200 ease-ios break-words text-center', cancelBtnClass]">
                {{ state.cancelLabel }}
              </button>
              <button
                @click="respond(true)"
                :class="['w-full min-h-[44px] flex items-center justify-center py-2 px-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-ios break-words text-center', confirmBtnClass]">
                {{ state.confirmLabel }}
              </button>
            </div>

          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  PhGraduationCap,
  PhClipboardText,
  PhWarningCircle,
  PhCheckCircle,
  PhInfo
} from '@phosphor-icons/vue';

const { state, respond } = useConfirm();

// notice box: warning/danger ใช้โทน amber (เตือน), ที่เหลือใช้โทนกลาง (ให้ข้อมูล)
const noticeStyle = computed(() => {
  const t = state.value?.type;
  if (t === 'danger' || t === 'warning') {
    return { box: 'bg-amber-50 ring-amber-200/70', icon: PhWarningCircle, iconColor: 'text-amber-500', text: 'text-amber-800' };
  }
  return { box: 'bg-gray-50 ring-gray-200', icon: PhInfo, iconColor: 'text-gray-400', text: 'text-gray-600' };
});

const confirmBtnClass = computed(() => {
  const t = state.value?.type;
  if (t === 'danger') return 'bg-red-600 hover:bg-red-500 text-white';
  if (t === 'warning') return 'bg-orange-500 hover:bg-orange-400 text-white';
  if (t === 'primary') return 'bg-primary-600 hover:bg-primary-500 text-white';
  return 'bg-emerald-600 hover:bg-emerald-500 text-white';
});

const cancelBtnClass = computed(() => {
  return 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400';
});

const getIcon = (type) => {
  switch(type) {
    case 'danger': return PhWarningCircle;
    case 'warning': return PhWarningCircle;
    case 'success': return PhCheckCircle;
    case 'primary': return PhClipboardText;
    default: return PhClipboardText;
  }
};

const STYLES = {
  danger: {
    btn: 'bg-red-600 hover:bg-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    ringColor: 'ring-red-50',
  },
  warning: {
    btn: 'bg-orange-500 hover:bg-orange-400',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    ringColor: 'ring-orange-50',
  },
  primary: {
    btn: 'bg-primary-600 hover:bg-primary-500',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    ringColor: 'ring-primary-50',
  },
  success: {
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    ringColor: 'ring-emerald-50',
  },
};
</script>

<style scoped>
/* modal card — spring in/out (keyframes อยู่ใน animations.css แล้ว) */
.confirm-enter-active { animation: modal-spring-in  320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.confirm-leave-active { animation: modal-spring-out 160ms ease-in both; pointer-events: none; }

/* backdrop ใช้ fade transition จาก transitions.css */
</style>
