<template>
  <div ref="triggerRef" class="inline-flex" @mouseenter="handleEnter" @mouseleave="handleLeave">
    <slot />
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-show="show && text"
          :style="tooltipStyle"
          class="fixed z-[9999] pointer-events-none w-max max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg text-center leading-relaxed whitespace-normal break-words"
        >
          {{ text }}
          <!-- arrow -->
          <div
            :class="[
              'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
              placement === 'top'
                ? 'top-full -mt-0.5 border-t-gray-900'
                : 'bottom-full -mb-0.5 border-b-gray-900',
            ]"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

defineProps({
  text: { type: String, default: '' },
});

const triggerRef = ref(null);
const show = ref(false);
const placement = ref('top');
const coords = ref({ top: 0, left: 0 });

const handleEnter = async () => {
  await nextTick();
  const rect = triggerRef.value?.getBoundingClientRect();
  if (!rect) return;

  // ถ้าพื้นที่เหนือ trigger น้อยกว่า 60px ให้แสดงด้านล่างแทน
  placement.value = rect.top > 60 ? 'top' : 'bottom';
  coords.value = {
    top: placement.value === 'top' ? rect.top - 8 : rect.bottom + 8,
    left: rect.left + rect.width / 2,
  };
  show.value = true;
};

const handleLeave = () => { show.value = false; };

const tooltipStyle = computed(() => ({
  left: `${coords.value.left}px`,
  top: `${coords.value.top}px`,
  transform: placement.value === 'top'
    ? 'translate(-50%, -100%)'
    : 'translate(-50%, 0)',
}));
</script>
