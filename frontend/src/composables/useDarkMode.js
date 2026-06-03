import { ref, watchEffect } from 'vue';

const STORAGE_KEY = 'cms-color-scheme';

const isDark = ref(
  localStorage.getItem(STORAGE_KEY)
    ? localStorage.getItem(STORAGE_KEY) === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
);

watchEffect(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light');
});

export function useDarkMode() {
  const toggle = () => { isDark.value = !isDark.value; };
  return { isDark, toggle };
}
