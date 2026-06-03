import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { DEPARTMENT_ORDER } from '@/constants/departments';

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref([]);
  const loaded = ref(false);

  async function fetchDepartments() {
    if (loaded.value) return;
    try {
      const { data } = await api.get('/departments');
      const raw = data.data || [];
      departments.value = [
        ...DEPARTMENT_ORDER.map(name => raw.find(d => d.name === name)).filter(Boolean),
        ...raw.filter(d => !DEPARTMENT_ORDER.includes(d.name)),
      ];
      loaded.value = true;
    } catch { /* non-critical */ }
  }

  function invalidate() {
    loaded.value = false;
  }

  return { departments, fetchDepartments, invalidate };
});
