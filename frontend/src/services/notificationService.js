import api from '@/services/api';

export const notificationService = {
  getAll:     () => api.get('/users/notifications'),
  markRead:   (id) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.put('/users/notifications/read-all'),
  clearAll:   () => api.delete('/users/notifications/clear-all'),
};
