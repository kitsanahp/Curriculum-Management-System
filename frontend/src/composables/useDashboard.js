import { ref, computed } from 'vue';
import api from '@/services/api';

// ── Config per role ──────────────────────────────────────────────────────────
export const DASHBOARD_CONFIG = {
  admin: {
    showStats:      ['total', 'needs_action', 'need_revision', 'approved'],
    showActionList: true,
    showCommittee:  true,
    showDeadline:   true,
    dataScope:      'all',
  },
  executive: {
    showStats:      ['total', 'approved', 'in_committee', 'needs_action'],
    showActionList: false,
    showCommittee:  true,
    showDeadline:   false,
    dataScope:      'all',
  },
  faculty: {
    showStats:      ['total', 'pending', 'need_revision', 'approved'],
    showActionList: true,
    showCommittee:  false,
    showDeadline:   true,
    dataScope:      'own',
  },
  staff: {
    showStats:      ['total', 'pending', 'need_revision', 'approved'],
    showActionList: true,
    showCommittee:  false,
    showDeadline:   true,
    dataScope:      'own',
  },
};

// ── Singleton state — shared across all useDashboard() calls ─────────────────
const curricula  = ref([]);
const stats      = ref({
  total: 0, approved: 0, pending: 0,
  in_committee: 0, need_revision: 0,
  needs_action: 0, approval_rate: 0,
});
const loading   = ref(false);
const lastFetch = ref(null);

async function fetchSummary({ force = false } = {}) {
  if (!force && lastFetch.value && Date.now() - lastFetch.value < 30_000) return;
  loading.value = true;
  try {
    const { data } = await api.get('/dashboard/summary');
    curricula.value = data.data.curricula;
    stats.value     = data.data.stats;
    lastFetch.value = Date.now();
  } finally {
    loading.value = false;
  }
}

// Call this after any action that changes curriculum status
export function invalidateDashboard() {
  lastFetch.value = null;
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useDashboard() {
  const recentCurricula = computed(() =>
    [...curricula.value]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
  );

  const actionQueue = computed(() =>
    curricula.value
      .filter(c => ['department_submitted', 'pending_admin_recheck'].includes(c.status))
      .sort((a, b) => (a.status === 'pending_admin_recheck' ? -1 : 1))
      .slice(0, 8)
  );

  const revisionItems = computed(() =>
    curricula.value.filter(c => c.status === 'revision')
  );

  const pendingItems = computed(() =>
    curricula.value.filter(c => c.status === 'pending_department')
  );

  return {
    curricula, stats, loading,
    recentCurricula, actionQueue, revisionItems, pendingItems,
    fetch: fetchSummary,
  };
}
