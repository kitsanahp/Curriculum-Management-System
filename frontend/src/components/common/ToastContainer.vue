<template>
  <Teleport to="body">
    <div class="fixed top-20 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3 items-end">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ring-1 ring-inset w-72',
            TOAST_STYLES[toast.type].wrapper
          ]">
          <!-- Icon -->
          <div :class="['w-7 h-7 rounded-full flex items-center justify-center shrink-0', TOAST_STYLES[toast.type].icon]">
            <component :is="toast.icon || TOAST_STYLES[toast.type].iconComponent" class="w-3.5 h-3.5" />
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p :class="['text-sm font-bold leading-snug', TOAST_STYLES[toast.type].title]">{{ toast.title }}</p>
            <p v-if="toast.message" :class="['text-xs mt-0.5 leading-relaxed', TOAST_STYLES[toast.type].message]">{{ toast.message }}</p>
          </div>

          <!-- Close -->
          <button
            @click="remove(toast.id)"
            :class="['shrink-0 p-1 rounded-lg transition-all ease-ios hover:bg-black/5 active:scale-[0.88]', TOAST_STYLES[toast.type].close]">
            <PhX class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { PhX, PhCheckCircle, PhXCircle, PhWarning, PhInfo } from '@phosphor-icons/vue';

const { toasts, remove } = useToast();

const TOAST_STYLES = {
  success: {
    wrapper: 'bg-white ring-emerald-200/50 shadow-emerald-900/5',
    icon: 'bg-emerald-50 text-emerald-600',
    iconComponent: PhCheckCircle,
    title: 'text-emerald-900',
    message: 'text-emerald-600',
    close: 'text-emerald-400',
  },
  error: {
    wrapper: 'bg-white ring-red-200/50 shadow-red-900/5',
    icon: 'bg-red-50 text-red-600',
    iconComponent: PhXCircle,
    title: 'text-red-900',
    message: 'text-red-500',
    close: 'text-red-400',
  },
  warning: {
    wrapper: 'bg-white ring-orange-200/50 shadow-orange-900/5',
    icon: 'bg-orange-50 text-orange-500',
    iconComponent: PhWarning,
    title: 'text-orange-900',
    message: 'text-orange-600',
    close: 'text-orange-400',
  },
  info: {
    wrapper: 'bg-white ring-primary-200/50 shadow-primary-900/5',
    icon: 'bg-primary-50 text-primary-600',
    iconComponent: PhInfo,
    title: 'text-primary-900',
    message: 'text-primary-600',
    close: 'text-primary-400',
  },
};
</script>

<style scoped>
.toast-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(24px) scale(0.96); }
.toast-leave-to { opacity: 0; transform: translateX(16px) scale(0.96); }
</style>
