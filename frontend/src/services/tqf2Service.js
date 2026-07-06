import api from '@/services/api';

export const tqf2Service = {
  getAll:  (curriculumId, params) => api.get(`/curricula/${curriculumId}/tqf2`, { params }),
  upload:  (curriculumId, formData) => api.post(`/curricula/${curriculumId}/tqf2`, formData),
  remove:  (id) => api.delete(`/curricula/tqf2/${id}`),
  compare: (idA, idB) => api.get('/curricula/tqf2/compare', { params: { id_a: idA, id_b: idB } }),
};
