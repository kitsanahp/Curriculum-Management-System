import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// ทุก component ใช้ lazy load → แยก chunk ลดขนาด bundle หน้าแรก
const routes = [
  // ─── หน้าสาธารณะ (ไม่ต้อง login) ──────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guest: true }
  },
  {
    // เปิดได้ทุกคน (ผู้ใช้กดจากลิงก์ในอีเมล แม้ยังไม่ได้ login)
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
  },

  // ─── หน้าที่ต้อง login (ครอบด้วย AppLayout) ────────────────────────────
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => {
          const authStore = useAuthStore();
          const role = authStore.user?.role;
          if (role === 'faculty') return '/curricula';   // อาจารย์ไม่มีหน้าหลัก → ไปรายการหลักสูตร
          if (role === 'staff') return '/faculty';
          if (role === 'registrar') return '/downloads';
          return '/dashboard';
        }
      },

      // Dashboard ตาม role
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { roles: ['admin', 'executive'] }
      },
      {
        path: 'faculty',
        name: 'FacultyDashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { roles: ['staff'] }
      },
      {
        path: 'registrar',
        redirect: '/downloads'
      },

      // หลักสูตร
      {
        path: 'curricula',
        name: 'CurriculaList',
        component: () => import('@/views/curriculum/CurriculumListView.vue'),
        meta: { roles: ['admin', 'faculty', 'staff'] }
      },
      {
        path: 'curricula/create',
        name: 'CurriculumCreate',
        component: () => import('@/views/curriculum/CurriculumCreateView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'curricula/archived',
        name: 'CurriculumArchivedList',
        component: () => import('@/views/curriculum/CurriculumArchivedListView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'curricula/:id',
        name: 'CurriculumDetail',
        component: () => import('@/views/curriculum/CurriculumDetailView.vue'),
        meta: { roles: ['admin', 'faculty', 'staff', 'registrar', 'executive'] }
      },

      // เมนูอื่น ๆ
      {
        path: 'highlights',
        name: 'Highlights',
        component: () => import('@/views/highlights/HighlightsView.vue'),
        meta: { roles: ['admin', 'faculty', 'staff'] }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/announcements/AnnouncementsView.vue'),
        meta: { roles: ['admin', 'faculty', 'staff', 'executive'] }
      },
      {
        path: 'announcements/create',
        name: 'AnnouncementCreate',
        component: () => import('@/views/announcements/AnnouncementFormView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'announcements/:id/edit',
        name: 'AnnouncementEdit',
        component: () => import('@/views/announcements/AnnouncementFormView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'downloads',
        name: 'Downloads',
        component: () => import('@/views/downloads/DownloadsView.vue'),
        meta: { roles: ['registrar'] }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/resources/ResourcesView.vue'),
        meta: { roles: ['admin', 'faculty', 'staff', 'executive', 'registrar'] }
      },
      {
        path: 'resources/create',
        name: 'ResourcesCreate',
        component: () => import('@/views/resources/ResourcesCreateView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'resources/:id/edit',
        name: 'ResourcesEdit',
        component: () => import('@/views/resources/ResourcesCreateView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/admin/UsersView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('@/views/admin/UserEditView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'master-data',
        name: 'MasterData',
        component: () => import('@/views/admin/MasterDataView.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'curricula/:id/decision/:stepId',
        name: 'CommitteeDecision',
        component: () => import('@/views/curriculum/CommitteeDecisionView.vue'),
        meta: { roles: ['admin'] }
      },
    ]
  },

  // fallback — path ที่ไม่มีอยู่ → redirect กลับ home
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ─── Navigation Guard ────────────────────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const authStore     = useAuthStore();
  const requiresAuth  = to.matched.some(r => r.meta.requiresAuth);
  const isGuestRoute  = to.matched.some(r => r.meta.guest);

  // ยังไม่ login แต่ route ต้องการ auth → ไป login
  if (requiresAuth && !authStore.isLoggedIn) return next('/login');

  // login แล้วแต่เข้า guest route (login/register) → ไป home
  if (isGuestRoute && authStore.isLoggedIn) return next('/');

  // ตรวจสอบ role — redirect ตาม role ถ้าไม่มีสิทธิ์
  if (to.meta.roles && authStore.isLoggedIn) {
    if (!to.meta.roles.includes(authStore.user?.role)) {
      const role = authStore.user?.role;
      if (role === 'faculty')   return next('/curricula');
      if (role === 'staff')     return next('/faculty');
      if (role === 'registrar') return next('/downloads');
      return next('/dashboard');
    }
  }

  next();
});

export default router;

