import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { invalidateDashboard } from '@/composables/useDashboard';

export const useCurriculumStore = defineStore('curriculum', () => {
  const curricula = ref([]);
  const current = ref(null);
  const loading = ref(false);

  async function fetchAll(params = {}) {
    loading.value = true;
    try {
      const { data } = await api.get('/curricula', { params });
      curricula.value = data.data;
      return data.meta;
    } finally { loading.value = false; }
  }

  async function fetchById(id) {
    loading.value = true;
    try {
      const { data } = await api.get(`/curricula/${id}`);
      current.value = data.data;
      return data.data;
    } finally { loading.value = false; }
  }

  async function create(payload) {
    const { data } = await api.post('/curricula', payload);
    curricula.value.unshift(data.data);
    return data.data;
  }

  async function update(id, payload) {
    const { data } = await api.put(`/curricula/${id}`, payload);
    const updated = data.data;
    // patch only the changed scalar fields so relations (department, team) are preserved
    const idx = curricula.value.findIndex((c) => c.id === id);
    if (idx !== -1) curricula.value[idx] = { ...curricula.value[idx], ...updated };
    if (current.value?.id === id) current.value = { ...current.value, ...updated };
    return updated;
  }

  async function submitByDepartment(id) {
    await api.post(`/curricula/${id}/submit`);
    await fetchById(id);
    invalidateDashboard();
  }

  async function rejectByAdmin(id, note, revisionDeadline) {
    await api.post(`/curricula/${id}/reject`, { note, revision_deadline: revisionDeadline || null });
    await fetchById(id);
    invalidateDashboard();
  }

  async function approveByAdmin(id) {
    await api.post(`/curricula/${id}/approve`);
    await fetchById(id);
    invalidateDashboard();
  }

  async function resubmitAfterRevision(id) {
    await api.post(`/curricula/${id}/resubmit`);
    await fetchById(id);
    invalidateDashboard();
  }

  async function approveRecheck(id) {
    await api.post(`/curricula/${id}/approve-recheck`);
    await fetchById(id);
    invalidateDashboard();
  }

  async function rejectRecheck(id, note, revisionDeadline) {
    await api.post(`/curricula/${id}/reject-recheck`, { note, revision_deadline: revisionDeadline || null });
    await fetchById(id);
    invalidateDashboard();
  }

  async function updateTeam(id, team) {
    const { data } = await api.put(`/curricula/${id}/team`, { team });
    return data.data;
  }

  return { curricula, current, loading, fetchAll, fetchById, create, update, updateTeam, submitByDepartment, rejectByAdmin, approveByAdmin, resubmitAfterRevision, approveRecheck, rejectRecheck };
});

