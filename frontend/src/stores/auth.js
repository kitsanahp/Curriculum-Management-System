import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  // token ไม่เก็บใน localStorage อีกต่อไป — ใช้ httpOnly cookie แทน
  // user object เก็บไว้เพื่อแสดง UI (ชื่อ, role) เท่านั้น
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  // ─── Computed (role shortcuts) ──────────────────────────────────────────────
  const isLoggedIn  = computed(() => !!user.value);
  const isAdmin     = computed(() => user.value?.role === 'admin');
  const isFaculty   = computed(() => ['faculty', 'staff'].includes(user.value?.role));
  const isStaff     = computed(() => user.value?.role === 'staff');
  const isRegistrar = computed(() => user.value?.role === 'registrar');
  const isExecutive = computed(() => user.value?.role === 'executive');

  // ─── Actions ────────────────────────────────────────────────────────────────

  // เข้าสู่ระบบ — token เซ็ตเป็น httpOnly cookie โดย backend อัตโนมัติ
  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('_devOriginalRole');
    return data;
  }

  // เข้าสู่ระบบแบบรัดขั้นตอน (เฉพาะ Development)
  async function devLogin(role) {
    const { data } = await api.post('/auth/dev-login', { role });
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  // ออกจากระบบ — แจ้ง backend ล้าง cookie แล้วล้าง state
  function logout() {
    api.post('/auth/logout').catch(() => {});
    user.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('_devOriginalRole');
  }

  // โหลดข้อมูล user ปัจจุบันจาก server (ใช้หลัง refresh เพื่อ sync role ล่าสุด)
  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me');
      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // cookie หมดอายุหรือ server error → logout
      logout();
    }
  }

  return {
    user,
    isLoggedIn, isAdmin, isFaculty, isStaff, isRegistrar, isExecutive,
    login, devLogin, logout, fetchMe,
  };
});
