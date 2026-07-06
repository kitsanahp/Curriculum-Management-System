import api from '@/services/api';

export const userService = {
  getAll: ()          => api.get('/users'),
  update: (id, data)  => api.put(`/users/${id}`, data),
  remove: (id)        => api.delete(`/users/${id}`),
  sendPasswordReset: (id) => api.post(`/users/${id}/send-reset`),
};
