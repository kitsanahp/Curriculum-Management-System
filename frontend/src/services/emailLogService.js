import api from './api';

export const emailLogService = {
  getAll: (params = {}) => api.get('/email-logs', { params }),
};
