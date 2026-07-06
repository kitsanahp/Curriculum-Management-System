import api from '@/services/api';

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
};
