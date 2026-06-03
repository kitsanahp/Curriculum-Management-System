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

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm ring-1 ring-inset ring-gray-900/5 overflow-hidden">
          <div class="p-7">

            <div class="flex flex-col items-center text-center">
              <!-- Type Icon -->
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center mb-4 ring-[6px]', STYLES[state.type].iconBg, STYLES[state.type].ringColor]">
                <component :is="getIcon(state.type)" :class="['w-6 h-6', STYLES[state.type].iconColor]" weight="regular" />
              </div>
              
              <!-- Title -->
              <h3 class="text-[17px] font-bold text-gray-900 leading-snug">{{ state.title }}</h3>

              <!-- Subject (Subtle) -->
              <div v-if="state.subject" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-100">
                <PhGraduationCap class="w-4 h-4 shrink-0 text-gray-400" />
                <span class="truncate">{{ state.subject }}</span>
              </div>

              <!-- Message -->
              <p v-if="state.message" class="text-sm text-gray-500 mt-2.5 leading-relaxed px-2">{{ state.message }}</p>
            </div>

            <!-- Detail box -->
            <div v-if="state.detail"
              class="mt-4 p-4 rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm text-gray-600 leading-relaxed">
              {{ state.detail }}
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
              <button
                @click="respond(false)"
                class="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98] transition-all duration-200 ease-ios">
                {{ state.cancelLabel }}
              </button>
              <button
                @click="respond(true)"
                :class="['flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-ios', STYLES[state.type].btn]">
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
import { useConfirm } from '@/composables/useConfirm';
import { 
  PhGraduationCap, 
  PhClipboardText, 
  PhWarningCircle, 
  PhCheckCircle 
} from '@phosphor-icons/vue';

const { state, respond } = useConfirm();

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
