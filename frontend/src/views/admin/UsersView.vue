<template>
  <div class="max-w-5xl mx-auto space-y-4">

    <!-- Header (PageHeader component) -->
    <PageHeader
      title="จัดการผู้ใช้"
      subtitle="อนุมัติบัญชีและกำหนดสิทธิ์ผู้ใช้ในระบบ">
      <template #actions>
        <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          {{ activeUsers.length }} ผู้ใช้ที่ใช้งานอยู่
        </span>
        <span v-if="pendingUsers.length"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 shadow-sm">
          รออนุมัติ {{ pendingUsers.length }}
        </span>
      </template>
    </PageHeader>

    <!-- ── Skeleton ── -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-200 h-16" />
    </div>

    <template v-else>

      <!-- ── Pending Approvals ── -->
      <div v-if="pendingUsers.length"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span class="text-sm font-bold text-gray-900">รออนุมัติการลงทะเบียน</span>
          <span class="text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full tabular-nums">{{ pendingUsers.length }}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-orange-50/30">
                <th class="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 shrink-0"></div>
                    <span>ชื่อผู้ใช้ที่รออนุมัติ</span>
                  </div>
                </th>
                <th class="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell w-36">สิทธิ์ผู้ใช้</th>
                <th class="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">ข้อมูลติดต่อ</th>
                <th class="px-5 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="u in pendingUsers" :key="u.id"
                class="hover:bg-orange-50/40 transition-colors duration-150 group/row">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <UserAvatar :name="u.name" :role="u.role" size="sm" class="shrink-0" />
                    <div class="min-w-0">
                      <p class="text-[15px] font-bold text-gray-900">{{ u.name }}</p>
                      <p v-if="u.activateError" class="text-xs font-medium text-red-600 mt-1">{{ u.activateError }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 hidden sm:table-cell">
                  <span :class="['inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded border whitespace-nowrap', ROLE_BADGE_STYLES[u.role] || ROLE_BADGE_STYLES.default]">
                    {{ getRoleLabel(u) }}
                  </span>
                </td>
                <td class="px-5 py-4 hidden md:table-cell text-sm">
                  <p class="font-medium text-gray-800">{{ u.email }}</p>
                  <p class="text-xs text-gray-500 mt-0.5" v-if="u.department?.name">{{ u.department.name }}</p>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="activateUser(u)" :disabled="u.isActivating"
                      class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.97] transition-all duration-150 shadow-sm border border-emerald-600 disabled:opacity-50">
                      <PhCheck class="w-3.5 h-3.5 shrink-0" />
                      อนุมัติ
                    </button>
                    <button @click="promptDelete(u)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 shadow-sm border border-transparent hover:border-red-100">
                      <PhX class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Filter bar ── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div class="relative flex-1">
            <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="ค้นหาชื่อหรืออีเมล"
              class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <FormSelect v-model="filterRole" :options="roleOptions" class="sm:w-40" />
            <FormSelect v-model="filterDept" :options="deptOptions" class="sm:w-48" />
          </div>
          <span v-if="search || filterRole || filterDept"
            class="text-xs font-semibold text-gray-400 shrink-0 self-center tabular-nums">
            {{ filteredCount }} / {{ activeUsers.length }}
          </span>
        </div>
      </div>

      <!-- ── Users Tables (per group) ── -->
      <div class="space-y-3">
        <div v-for="group in filteredGroupedUsers" :key="group.department"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          <!-- Group header -->
          <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <div :class="['w-5 h-5 rounded-md flex items-center justify-center shrink-0', getDeptTheme(group.department).iconBg]">
              <component :is="getDeptTheme(group.department).icon"
                :class="['w-3 h-3', getDeptTheme(group.department).iconText]" />
            </div>
            <span class="text-xs font-bold text-gray-700 tracking-wide">{{ group.department }}</span>
            <span class="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full tabular-nums ml-0.5">{{ group.users.length }}</span>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50/50">
                  <th class="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-16">ลำดับ</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 shrink-0"></div>
                      <span>ชื่อ-สกุล</span>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell w-32">สิทธิ์</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell w-36">เบอร์ติดต่อ</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">อีเมล</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden xl:table-cell w-48">ตำแหน่ง</th>
                  <th class="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(u, i) in group.users" :key="u.id"
                  class="hover:bg-primary-50/30 transition-colors duration-100 group/row">
                  <td class="px-4 py-4 text-center text-sm text-gray-500 font-medium tabular-nums">{{ i + 1 }}</td>
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <UserAvatar :name="u.name" :role="u.role" size="sm" class="shrink-0" />
                      <div class="min-w-0">
                        <p class="text-[15px] font-bold text-gray-900 truncate">{{ u.name }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4 hidden sm:table-cell">
                    <span :class="['inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded border whitespace-nowrap', ROLE_BADGE_STYLES[u.role] || ROLE_BADGE_STYLES.default]">
                      {{ ROLE_LABELS_SHORT[u.role] || u.role }}
                    </span>
                  </td>
                  <td class="px-4 py-4 hidden md:table-cell text-sm font-medium text-gray-700 whitespace-nowrap">{{ u.phone || '—' }}</td>
                  <td class="px-4 py-4 hidden lg:table-cell text-sm font-medium text-gray-700 truncate max-w-[200px] hover:max-w-none transition-all">{{ u.email }}</td>
                  <td class="px-4 py-4 hidden xl:table-cell text-sm font-medium text-gray-700 whitespace-nowrap">{{ getDisplayPosition(u) }}</td>
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-0.5 justify-end opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button @click="router.push({ name: 'UserEdit', params: { id: u.id }, state: { user: JSON.parse(JSON.stringify(u)) } })"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all duration-150 ease-ios">
                        <PhNotePencil class="w-3.5 h-3.5" />
                      </button>
                      <button @click="promptDelete(u)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios">
                        <PhTrash class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty state: filtered -->
        <div v-if="!filteredGroupedUsers.length && activeUsers.length"
          class="bg-white rounded-xl border border-gray-200">
          <EmptyState
            title="ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"
            :icon="PhMagnifyingGlass"
            size="sm"
            action-label="ล้างตัวกรอง"
            @action="search = ''; filterRole = ''; filterDept = ''"
          />
        </div>
        <div v-if="!activeUsers.length && !pendingUsers.length"
          class="bg-white rounded-xl border border-gray-200">
          <EmptyState
            title="ยังไม่มีผู้ใช้ในระบบ"
            description="ผู้ใช้ที่ลงทะเบียนจะปรากฏที่นี่"
            :icon="PhUserCircle"
            size="sm"
          />
        </div>
      </div>
    </template>

    <!-- ── Delete Modal ── -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" @click="showDeleteModal = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <PhTrash class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">ลบผู้ใช้</h3>
                <p class="text-sm text-gray-500 mt-1">
                  <span class="font-semibold text-gray-800">{{ deleteTarget?.name }}</span> จะถูกลบออกจากระบบถาวร บัญชีและสิทธิ์ทั้งหมดจะหายไป
                </p>
              </div>
            </div>
            <div v-if="deleteError" class="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 flex items-center gap-2">
              <PhWarning class="h-4 w-4 text-red-400 shrink-0" />
              <p class="text-xs font-medium text-red-700">{{ deleteError }}</p>
            </div>
          </div>
          <div class="px-6 pb-5 flex gap-3 justify-end">
            <button @click="showDeleteModal = false" :disabled="deleteLoading"
              class="text-sm font-semibold text-gray-600 bg-white ring-1 ring-inset ring-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50 whitespace-nowrap">
              ยกเลิก
            </button>
            <button @click="confirmDelete" :disabled="deleteLoading"
              class="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 active:scale-[0.97] transition-all duration-150 ease-ios shadow-sm disabled:opacity-50 whitespace-nowrap">
              <span v-if="deleteLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
              {{ deleteLoading ? 'กำลังลบ…' : 'ลบผู้ใช้' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import {
  PhTrash, PhWarning, PhCheck,
  PhGraduationCap, PhBank,
  PhNotePencil, PhX,
  PhMagnifyingGlass,
} from '@phosphor-icons/vue';
import { PhMathOperations, PhTestTube, PhLeaf, PhAtom, PhCode } from '@phosphor-icons/vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { DEPARTMENT_ORDER } from '@/constants/departments';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่ภาควิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะวิทยาศาสตร์',
};

const ROLE_BADGE_STYLES = {
  admin:     'bg-primary-50 text-primary-700 border-primary-200',
  faculty:   'bg-blue-50 text-blue-700 border-blue-200',
  staff:     'bg-cyan-50 text-cyan-700 border-cyan-200',
  registrar: 'bg-orange-50 text-orange-700 border-orange-200',
  executive: 'bg-purple-50 text-purple-700 border-purple-200',
  default:   'bg-gray-100 text-gray-600 border-gray-200',
};

const getRoleLabel = (u) => {
  return ROLE_LABELS[u.role] || u.role;
};

const CENTRAL_GROUP = 'บุคลากรส่วนกลาง';
const CENTRAL_ROLES = new Set(['admin', 'registrar', 'executive']);

const DEPT_THEMES_MAP = {
  [CENTRAL_GROUP]:                                    { icon: PhBank,  iconBg: 'bg-primary-50',  iconText: 'text-primary-500',  central: true },
  'ภาควิชาคณิตศาสตร์':                               { icon: PhMathOperations, iconBg: 'bg-red-50',      iconText: 'text-red-500'       },
  'ภาควิชาชีววิทยา':                                 { icon: PhLeaf,           iconBg: 'bg-emerald-50',  iconText: 'text-emerald-500'   },
  'ภาควิชาเคมี':                                     { icon: PhTestTube,       iconBg: 'bg-purple-50',   iconText: 'text-purple-500'    },
  'ภาควิชาฟิสิกส์':                                  { icon: PhAtom,           iconBg: 'bg-blue-50',     iconText: 'text-blue-500'      },
  'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ': { icon: PhCode,           iconBg: 'bg-orange-50',   iconText: 'text-orange-500'    },
  default:                                            { icon: PhGraduationCap,       iconBg: 'bg-gray-100',    iconText: 'text-gray-500'      },
};
const getDeptTheme = (name) => DEPT_THEMES_MAP[name] ?? DEPT_THEMES_MAP.default;

const router = useRouter();

// ─── State ────────────────────────────────────────────────────────────────────

const users      = ref([]);
const loading    = ref(false);
const search     = ref('');
const filterRole = ref('');
const filterDept = ref('');

// ─── Computed ─────────────────────────────────────────────────────────────────

const pendingUsers = computed(() => users.value.filter(u => !u.is_active));
const activeUsers  = computed(() => users.value.filter(u => u.is_active));

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase();
  return activeUsers.value.filter(u => {
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
    if (filterRole.value && u.role !== filterRole.value) return false;
    if (filterDept.value) {
      const dept = CENTRAL_ROLES.has(u.role) ? CENTRAL_GROUP : (u.department?.name || CENTRAL_GROUP);
      if (dept !== filterDept.value) return false;
    }
    return true;
  });
});

const filteredCount = computed(() => filteredUsers.value.length);

const filteredGroupedUsers = computed(() => {
  const map = {};
  for (const u of filteredUsers.value) {
    const key = CENTRAL_ROLES.has(u.role) ? CENTRAL_GROUP : (u.department?.name || CENTRAL_GROUP);
    if (!map[key]) map[key] = [];
    map[key].push(u);
  }
  const ROLE_ORDER = { admin: 0, faculty: 1, registrar: 2, executive: 3, staff: 4 };
  for (const k of Object.keys(map)) map[k].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
  const central = map[CENTRAL_GROUP] ? [{ department: CENTRAL_GROUP, users: map[CENTRAL_GROUP] }] : [];
  const ordered = DEPARTMENT_ORDER.filter(n => map[n]).map(n => ({ department: n, users: map[n] }));
  const others  = Object.keys(map).filter(n => !DEPARTMENT_ORDER.includes(n) && n !== CENTRAL_GROUP).sort().map(n => ({ department: n, users: map[n] }));
  return [...central, ...ordered, ...others];
});

const sortedFilteredUsers = computed(() =>
  filteredGroupedUsers.value.flatMap(g => g.users)
);

const ROLE_LABELS_SHORT = {
  admin:     'เจ้าหน้าที่คณะ',
  faculty:   'อาจารย์',
  staff:     'เจ้าหน้าที่ภาควิชา',
  registrar: 'กองบริการฯ',
  executive: 'ผู้บริหาร',
};

const getGlobalIndex = (group, userIndex) => {
  const groups = filteredGroupedUsers.value;
  const groupIdx = groups.findIndex(g => g.department === group.department);
  const offset = groups.slice(0, groupIdx).reduce((sum, g) => sum + g.users.length, 0);
  return offset + userIndex + 1;
};

const getDisplayPosition = (u) => {
  if (u.role === 'faculty') return u.academic_position || '—';
  if (u.role === 'executive') return [u.position, u.academic_position].filter(Boolean).join(' / ') || '—';
  return u.position || '—';
};

const getDeptLabel = (u) => {
  if (CENTRAL_ROLES.has(u.role)) return 'ส่วนกลาง';
  return u.department?.name || '—';
};

const roleOptions = computed(() => [
  { label: 'ทุกสิทธิ์', value: '' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value })),
]);

const deptOptions = computed(() => {
  const seen = new Set();
  for (const u of activeUsers.value) {
    seen.add(CENTRAL_ROLES.has(u.role) ? CENTRAL_GROUP : (u.department?.name || CENTRAL_GROUP));
  }
  const ordered = [CENTRAL_GROUP, ...DEPARTMENT_ORDER].filter(d => seen.has(d));
  const rest    = [...seen].filter(d => !ordered.includes(d)).sort();
  return [{ label: 'ทุกภาควิชา', value: '' }, ...[...ordered, ...rest].map(d => ({ label: d, value: d }))];
});

// ─── Data fetching ────────────────────────────────────────────────────────────

const fetchUsers = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/users');
    users.value = data.data;
  } finally {
    loading.value = false;
  }
};

// ─── User actions ─────────────────────────────────────────────────────────────

const activateUser = async (user) => {
  user.activateError = '';
  try {
    user.isActivating = true;
    await api.put(`/users/${user.id}`, { is_active: true });
    user.is_active = true;
  } catch (e) {
    user.activateError = e.response?.data?.message || 'อนุมัติไม่สำเร็จ';
  } finally {
    user.isActivating = false;
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const showDeleteModal = ref(false);
const deleteTarget    = ref(null);
const deleteLoading   = ref(false);
const deleteError     = ref('');

const promptDelete = (user) => {
  deleteTarget.value = user;
  deleteError.value  = '';
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  deleteError.value   = '';
  try {
    await api.delete(`/users/${deleteTarget.value.id}`);
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id);
    showDeleteModal.value = false;
    deleteTarget.value = null;
  } catch (e) {
    deleteError.value = e.response?.data?.message || 'ลบไม่สำเร็จ กรุณาลองใหม่';
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(fetchUsers);
</script>
