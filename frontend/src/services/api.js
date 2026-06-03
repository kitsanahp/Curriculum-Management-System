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
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // token หมดอายุหรือไม่ถูกต้อง → ล้าง session และ redirect ไป login
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
