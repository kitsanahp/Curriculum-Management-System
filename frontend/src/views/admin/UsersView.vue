<template>
  <div class="max-w-5xl mx-auto space-y-4">

    <PageHeader
      title="บัญชีผู้ใช้">
      <template #actions>
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <PhUserCircle class="w-3.5 h-3.5 shrink-0 text-gray-400" weight="bold" aria-hidden="true" />
          {{ activeUsers.length }} บัญชีที่ใช้งาน
        </span>
        <span v-if="pendingUsers.length"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 shadow-sm">
          <PhClock class="w-3.5 h-3.5 shrink-0 text-red-500" weight="fill" aria-hidden="true" />
          รออนุมัติ {{ pendingUsers.length }} คน
        </span>
      </template>
    </PageHeader>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div v-for="i in 6" :key="i" class="bg-white rounded-2xl border border-gray-200/80 h-16" />
    </div>

    <!-- Error state -->
    <div v-else-if="error"
      class="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col items-center text-center px-6 py-16">
      <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
        <PhWarning class="w-6 h-6 text-red-500" />
      </div>
      <p class="text-sm font-semibold text-gray-900">โหลดข้อมูลผู้ใช้ไม่สำเร็จ</p>
      <p class="text-xs text-gray-500 mt-1">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</p>
      <button @click="fetchUsers" type="button"
        class="cursor-pointer mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.96] transition-all">
        ลองอีกครั้ง
      </button>
    </div>

    <template v-else>

      <!-- ── Pending Approvals ── -->
      <div v-if="pendingUsers.length"
        class="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 border-b border-red-100 bg-red-50/60 flex items-center gap-3">
          <div class="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <PhClock class="w-4 h-4 text-red-600" />
          </div>
          <span class="text-sm font-bold text-gray-900 flex-1">รออนุมัติการลงทะเบียน</span>
          <span class="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full tabular-nums">{{ pendingUsers.length }} คน</span>
        </div>
        <div class="divide-y divide-red-100/70">
          <div v-for="u in pendingUsers" :key="u.id"
            class="flex items-center gap-3.5 px-5 py-4 hover:bg-red-50/50 transition-colors duration-150">
            <UserAvatar :name="u.name" :role="u.role" size="md" class="shrink-0" />
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <p class="text-sm font-bold text-gray-900 truncate">{{ formatUserName(u) }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span :class="['w-1.5 h-1.5 rounded-full', ROLE_DOT_STYLES[u.role] || ROLE_DOT_STYLES.default]"></span>
                    <span class="text-[13px] font-semibold text-gray-500">{{ ROLE_LABELS[u.role] || u.role }}</span>
                  </div>
                </div>
              <div class="flex items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500 min-w-0 flex-wrap">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <PhEnvelopeSimple class="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  <span class="truncate">{{ u.email }}</span>
                </span>
                <span v-if="u.phone" class="inline-flex items-center gap-1.5 shrink-0 text-gray-400">
                  <PhPhone class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ u.phone }}</span>
                </span>
                <span v-if="u.department?.name" class="inline-flex items-center gap-1.5 shrink-0 text-gray-400">
                  <PhBuildings class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate max-w-[160px]">{{ u.department.name }}</span>
                </span>
              </div>
              <p v-if="u.activateError" class="text-xs font-medium text-red-600 mt-1">{{ u.activateError }}</p>
              <p v-if="u.rejectError" class="text-xs font-medium text-red-600 mt-1">{{ u.rejectError }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button @click="activateUser(u)" :disabled="u.isActivating"
                class="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.97] transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <PhCheckCircle class="w-4 h-4 shrink-0" weight="fill" />
                อนุมัติ
              </button>
              <button @click="promptDelete(u)" aria-label="ปฏิเสธ"
                class="cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 active:scale-[0.92] transition-all duration-150">
                <PhXCircle class="w-5 h-5 shrink-0" weight="fill" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Filter bar ── -->
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-4 py-3">
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div class="relative flex-1">
            <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="ค้นหาชื่อหรืออีเมล"
              class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <FormSelect v-model="filterRole" :options="roleOptions" class="sm:w-40" />
            <FormSelect v-model="filterDept" :options="deptOptions" class="sm:w-48" />
          </div>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90">
            <span v-if="search || filterRole || filterDept"
              class="inline-flex items-center text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2.5 py-1 shrink-0 self-center tabular-nums whitespace-nowrap">
              {{ filteredCount }} / {{ activeUsers.length }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- ── Users Tables (per group) ── -->
      <div class="space-y-3">
        <div v-for="group in filteredGroupedUsers" :key="group.department"
          class="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">

          <!-- Group header -->
          <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2.5">

            <span class="text-sm font-bold text-gray-800 flex-1">{{ group.department }}</span>
            <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full tabular-nums">{{ group.users.length }} คน</span>
          </div>

          <div class="divide-y divide-gray-50">
            <div v-for="u in group.users" :key="u.id"
              class="group/row flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors duration-100">
              <UserAvatar :name="u.name" :role="u.role" size="md" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ formatUserName(u) }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span :class="['w-1.5 h-1.5 rounded-full', ROLE_DOT_STYLES[u.role] || ROLE_DOT_STYLES.default]"></span>
                    <span class="text-[13px] font-semibold text-gray-500">{{ ROLE_LABELS[u.role] || u.role }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500 min-w-0 flex-wrap">
                  <span class="inline-flex items-center gap-1.5 min-w-0">
                    <PhEnvelopeSimple class="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span class="truncate">{{ u.email }}</span>
                  </span>
                  <span v-if="u.phone" class="inline-flex items-center gap-1.5 shrink-0 text-gray-400">
                    <PhPhone class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ u.phone }}</span>
                  </span>
                  <span v-if="getDisplayPosition(u) !== '—'" class="inline-flex items-center gap-1.5 shrink-0 text-gray-400">
                    <PhIdentificationBadge class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate max-w-[160px]">{{ getDisplayPosition(u) }}</span>
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                <button @click="router.push({ name: 'UserEdit', params: { id: u.id }, state: { user: JSON.parse(JSON.stringify(u)) } })"
                  class="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all duration-150"
                  aria-label="แก้ไขผู้ใช้">
                  <PhNotePencil class="w-4 h-4" />
                </button>
                <button @click="promptDelete(u)"
                  class="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150"
                  aria-label="ลบผู้ใช้">
                  <PhTrash class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state: filtered -->
        <div v-if="!filteredGroupedUsers.length && activeUsers.length"
          class="bg-white rounded-2xl border border-gray-200/80">
          <EmptyState
            title="ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"
            :icon="PhMagnifyingGlass"
            size="sm"
            action-label="ล้างตัวกรอง"
            @action="search = ''; filterRole = ''; filterDept = ''"
          />
        </div>
        <div v-if="!activeUsers.length && !pendingUsers.length"
          class="bg-white rounded-2xl border border-gray-200/80">
          <EmptyState
            title="ยังไม่มีผู้ใช้ในระบบ"
            description="ผู้ใช้ที่ลงทะเบียนจะปรากฏที่นี่"
            :icon="PhUserCircle"
            size="sm"
          />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '@/services/userService';
import {
  PhTrash, PhWarning, PhCheck, PhCheckCircle, PhXCircle, PhClock,
  PhGraduationCap, PhBank,
  PhNotePencil, PhX,
  PhMagnifyingGlass, PhUserCircle,
  PhEnvelopeSimple, PhBuildings, PhPhone, PhIdentificationBadge,
} from '@phosphor-icons/vue';
import { PhInfinity, PhTestTube, PhLeaf, PhAtom, PhCode } from '@phosphor-icons/vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { formatUserName } from '@/utils/user';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import FormSelect from '@/components/common/FormSelect.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { DEPARTMENT_ORDER } from '@/constants/departments';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่สาขาวิชา',
  registrar: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะวิทยาศาสตร์',
};

const ROLE_DOT_STYLES = {
  admin:     'bg-primary-500',
  faculty:   'bg-blue-500',
  staff:     'bg-cyan-500',
  registrar: 'bg-orange-500',
  executive: 'bg-purple-500',
  default:   'bg-gray-400',
};

const CENTRAL_GROUP = 'บุคลากรส่วนกลาง';
const CENTRAL_ROLES = new Set(['admin', 'registrar', 'executive']);

const DEPT_THEMES_MAP = {
  [CENTRAL_GROUP]:                                    { icon: PhBank,  iconBg: 'bg-primary-50',  iconText: 'text-primary-500',  central: true },
  'ภาควิชาคณิตศาสตร์':                               { icon: PhInfinity, iconBg: 'bg-red-50',      iconText: 'text-red-500'       },
  'ภาควิชาชีววิทยา':                                 { icon: PhLeaf,           iconBg: 'bg-emerald-50',  iconText: 'text-emerald-500'   },
  'ภาควิชาเคมี':                                     { icon: PhTestTube,       iconBg: 'bg-purple-50',   iconText: 'text-purple-500'    },
  'ภาควิชาฟิสิกส์':                                  { icon: PhAtom,           iconBg: 'bg-blue-50',     iconText: 'text-blue-500'      },
  'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ': { icon: PhCode,           iconBg: 'bg-orange-50',   iconText: 'text-orange-500'    },
  default:                                            { icon: PhGraduationCap,       iconBg: 'bg-gray-100',    iconText: 'text-gray-500'      },
};
const getDeptTheme = (name) => DEPT_THEMES_MAP[name] ?? DEPT_THEMES_MAP.default;

const router = useRouter();
const { open: confirm } = useConfirm();
const toast = useToast();

// ─── State ────────────────────────────────────────────────────────────────────

const users      = ref([]);
const loading    = ref(false);
const error      = ref(false);
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



const getDisplayPosition = (u) => {
  return u.position || '—';
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
  error.value = false;
  try {
    const { data } = await userService.getAll();
    users.value = data.data;
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
};

// ─── User actions ─────────────────────────────────────────────────────────────

const activateUser = async (user) => {
  user.activateError = '';
  try {
    user.isActivating = true;
    await userService.update(user.id, { is_active: true });
    user.is_active = true;
  } catch (e) {
    user.activateError = e.response?.data?.message || 'อนุมัติไม่สำเร็จ';
  } finally {
    user.isActivating = false;
  }
};

// ─── Delete & Reject ──────────────────────────────────────────────────────────
// ใช้ ConfirmModal กลาง (useConfirm) — โทน/layout เดียวกับ confirm อื่นทั้งระบบ

const promptDelete = async (user) => {
  const isPending = !user.is_active;
  const name = formatUserName(user);
  const ok = await confirm({
    title: isPending ? 'ปฏิเสธสิทธิ์การใช้งาน' : 'ลบผู้ใช้',
    message: isPending
      ? `${name} จะถูกปฏิเสธสิทธิ์การใช้งาน คำขอลงทะเบียนและข้อมูลบัญชีนี้จะถูกนำออกจากระบบ`
      : `${name} จะถูกลบออกจากระบบถาวร บัญชีและสิทธิ์ทั้งหมดจะหายไป`,
    confirmLabel: isPending ? 'ปฏิเสธสิทธิ์การใช้งาน' : 'ลบผู้ใช้',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await userService.remove(user.id);
    users.value = users.value.filter(u => u.id !== user.id);
    toast.success(isPending ? 'ปฏิเสธสิทธิ์การใช้งานแล้ว' : 'ลบผู้ใช้สำเร็จ');
  } catch (e) {
    toast.error(e.response?.data?.message ||
      (isPending ? 'ปฏิเสธสิทธิ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'));
  }
};

onMounted(fetchUsers);
</script>
