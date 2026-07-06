import api from '@/services/api';

export const resourceService = {
  getAll: (params)       => api.get('/resources', { params }),
  create: (formData)     => api.post('/resources', formData),
  update: (id, formData) => api.put(`/resources/${id}`, formData),
  setPin: (id, isPinned) => api.patch(`/resources/${id}/pin`, { is_pinned: isPinned }),
  remove: (id)           => api.delete(`/resources/${id}`),
};
