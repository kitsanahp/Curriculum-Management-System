import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';

export const useAuthStore = defineStore('auth', () => {
  function _parseStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }
  const user = ref(_parseStoredUser());

  const isLoggedIn  = computed(() => !!user.value);
  const isAdmin     = computed(() => user.value?.role === 'admin');
  const isFaculty   = computed(() => ['faculty', 'staff'].includes(user.value?.role));
  const isStaff     = computed(() => user.value?.role === 'staff');
  const isRegistrar = computed(() => user.value?.role === 'registrar');
  const isExecutive = computed(() => user.value?.role === 'executive');

  async function login(email, password) {
    const { data } = await authService.login(email, password);
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('_devOriginalRole');
    return data;
  }

  async function devLogin(role) {
    const { data } = await authService.devLogin(role);
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  function logout() {
    authService.logout().catch(() => {});
    user.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('_devOriginalRole');
  }

  async function fetchMe() {
    try {
      const { data } = await authService.me();
      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  }

  return {
    user,
    isLoggedIn, isAdmin, isFaculty, isStaff, isRegistrar, isExecutive,
    login, devLogin, logout, fetchMe,
  };
});
