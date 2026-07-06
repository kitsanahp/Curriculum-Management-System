import api from '@/services/api';

export const departmentService = {
  getAll: () => api.get('/departments'),
  create: (payload) => api.post('/departments', payload),
  update: (id, payload) => api.put(`/departments/${id}`, payload),
  remove: (id) => api.delete(`/departments/${id}`),
};

export const majorService = {
  create: (payload) => api.post('/majors', payload),
  update: (id, payload) => api.put(`/majors/${id}`, payload),
  remove: (id) => api.delete(`/majors/${id}`),
};

export const degreeTitleService = {
  getAll: () => api.get('/degree-titles'),
  create: (payload) => api.post('/degree-titles', payload),
  update: (id, payload) => api.put(`/degree-titles/${id}`, payload),
  remove: (id) => api.delete(`/degree-titles/${id}`),
};
