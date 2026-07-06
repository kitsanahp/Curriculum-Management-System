import api from '@/services/api';

export const downloadsService = {
  getAll: (params) => api.get('/downloads', { params }),
};
