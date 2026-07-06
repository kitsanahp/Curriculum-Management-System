import api from '@/services/api';

export const authService = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  devLogin: (role)            => api.post('/auth/dev-login', { role }),
  logout:   ()                => api.post('/auth/logout'),
  me:       ()                => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
};
