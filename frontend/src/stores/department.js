import { defineStore } from 'pinia';
import { ref } from 'vue';
import { departmentService } from '@/services/departmentService';
import { DEPARTMENT_ORDER } from '@/constants/departments';

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref([]);
  const loaded = ref(false);

  async function fetchDepartments() {
    if (loaded.value) return;
    try {
      const { data } = await departmentService.getAll();
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
