import { ref, watch } from 'vue';

/**
 * Count-up animation สำหรับตัวเลขใน stat cards
 * @param {import('vue').Ref<number>} source  - ref ที่มีค่าจริง
 * @param {object} options
 * @param {number} options.duration  - ระยะเวลา ms (default 700)
 * @param {number} options.delay     - delay ก่อนเริ่ม ms (default 0)
 */
export function useCountUp(source, { duration = 700, delay = 0 } = {}) {
  const display = ref(0);
  let raf = null;

  const animate = (target) => {
    if (raf) cancelAnimationFrame(raf);
    const start     = display.value;
    const startTime = performance.now() + delay;

    const tick = (now) => {
      if (now < startTime) { raf = requestAnimationFrame(tick); return; }
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      display.value  = Math.round(start + (target - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  };

  watch(source, (val) => animate(val ?? 0), { immediate: true });

  return display;
}
