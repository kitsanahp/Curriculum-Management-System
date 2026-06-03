import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLocaleStore = defineStore('locale', () => {
  const currentLang = ref(localStorage.getItem('lang') || 'th');

  function toggleLang() {
    currentLang.value = currentLang.value === 'th' ? 'en' : 'th';
    localStorage.setItem('lang', currentLang.value);
  }

  function setLang(lang) {
    currentLang.value = lang;
    localStorage.setItem('lang', lang);
  }

  return {
    currentLang,
    toggleLang,
    setLang
  };
});

