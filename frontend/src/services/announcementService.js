import api from '@/services/api';

export const announcementService = {
  getAll: (params)           => api.get('/announcements', { params }),
  create: (formData)         => api.post('/announcements', formData),
  update: (id, formData)     => api.put(`/announcements/${id}`, formData),
  remove: (id)               => api.delete(`/announcements/${id}`),
};
