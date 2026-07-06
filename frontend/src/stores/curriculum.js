import { defineStore } from 'pinia';
import { ref } from 'vue';
import { curriculumService } from '@/services/curriculumService';
import { invalidateDashboard } from '@/composables/useDashboard';

export const useCurriculumStore = defineStore('curriculum', () => {
  const curricula = ref([]);
  const current = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchAll(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await curriculumService.getAll(params);
      curricula.value = data.data;
      return data.meta;
    } catch (e) {
      error.value = e;
      throw e;
    } finally { loading.value = false; }
  }

  async function fetchById(id) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await curriculumService.getById(id);
      current.value = data.data;
      return data.data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally { loading.value = false; }
  }

  async function create(payload) {
    const { data } = await curriculumService.create(payload);
    curricula.value.unshift(data.data);
    return data.data;
  }

  async function update(id, payload) {
    const { data } = await curriculumService.update(id, payload);
    const updated = data.data;
    const idx = curricula.value.findIndex((c) => c.id === id);
    if (idx !== -1) curricula.value[idx] = { ...curricula.value[idx], ...updated };
    if (current.value?.id === id) current.value = { ...current.value, ...updated };
    return updated;
  }

  async function submitByDepartment(id) {
    await curriculumService.submit(id);
    await fetchById(id);
    invalidateDashboard();
  }

  async function rejectByAdmin(id, note, revisionDeadline) {
    await curriculumService.reject(id, note, revisionDeadline);
    await fetchById(id);
    invalidateDashboard();
  }

  async function approveByAdmin(id) {
    await curriculumService.approve(id);
    await fetchById(id);
    invalidateDashboard();
  }

  async function resubmitAfterRevision(id) {
    await curriculumService.resubmit(id);
    await fetchById(id);
    invalidateDashboard();
  }

  async function approveRecheck(id) {
    await curriculumService.approveRecheck(id);
    await fetchById(id);
    invalidateDashboard();
  }

  async function rejectRecheck(id, note, revisionDeadline) {
    await curriculumService.rejectRecheck(id, note, revisionDeadline);
    await fetchById(id);
    invalidateDashboard();
  }

  async function updateTeam(id, team) {
    const { data } = await curriculumService.updateTeam(id, team);
    return data.data;
  }

  return { curricula, current, loading, error, fetchAll, fetchById, create, update, updateTeam, submitByDepartment, rejectByAdmin, approveByAdmin, resubmitAfterRevision, approveRecheck, rejectRecheck };
});
