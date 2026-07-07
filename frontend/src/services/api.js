import axios from 'axios';

// axios instance หลักของระบบ — ทุก API call ใช้ตัวนี้
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ส่ง httpOnly cookie ทุก request อัตโนมัติ
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // FormData upload: ให้ browser set Content-Type เองพร้อม boundary
  // ถ้า set เองจะ error เพราะ boundary หายไป
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
// endpoint สาธารณะของ auth — 401 จากพวกนี้คือ "ข้อมูลผิด" ไม่ใช่ session หมดอายุ
// ห้าม redirect ไม่งั้นหน้า login โดน reload ก่อนผู้ใช้เห็นข้อความ error
const AUTH_PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/dev-login'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthPublic = AUTH_PUBLIC_PATHS.some((p) => url.includes(p));
    // token หมดอายุหรือไม่ถูกต้อง → ล้าง session และ redirect ไป login
    if (error.response?.status === 401 && !isAuthPublic && window.location.pathname !== '/login') {
      // ต้องล้าง user ใน localStorage ด้วย ไม่งั้น guard ของ /login เห็นว่ายัง login อยู่
      // จะเด้งกลับหน้าแรกแล้ววน redirect ไม่จบ
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
