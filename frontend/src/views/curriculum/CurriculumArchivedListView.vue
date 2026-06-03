<template>
  <div class="max-w-7xl mx-auto space-y-5">
    <!-- Hero Header (PageHeader component) -->
    <PageHeader
      title="ประวัติการยกเลิกหลักสูตร"
      subtitle="หลักสูตรที่ถูกยกเลิกหรือซ่อนจากการแสดงผลปกติ สามารถกู้คืนได้ที่นี่">
      <template #actions>
        <Button variant="secondary" size="lg" :icon-left="PhCaretLeft" @click="router.back()">
          กลับ
        </Button>
      </template>
    </PageHeader>

    <!-- List -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-100 p-8 animate-pulse h-32 opacity-60"></div>
    </div>

    <div v-else-if="archivedCurricula.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200">
      <EmptyState
        title="ไม่มีประวัติการยกเลิกหลักสูตร"
        description="หลักสูตรที่ถูกยกเลิกจะมาแสดงอยู่ที่หน้านี้"
        :icon="PhArchive"
        size="lg"
      />
    </div>

    <div v-else class="space-y-2">
      <div v-for="c in archivedCurricula" :key="c.id" 
        class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-5">
          <!-- Main Info -->
          <div class="flex-1 min-w-0 opacity-70">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-semibold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
              </span>
              <span class="text-[10px] font-semibold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                ปี {{ c.curriculum_year }}
              </span>
            </div>

            <h3 class="font-bold text-gray-700 text-base sm:text-lg leading-snug line-through decoration-gray-400">
              {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
            </h3>
            <p v-if="c.field_of_study && c.degree_name" class="text-sm text-gray-500 font-medium truncate mt-0.5">
              {{ c.degree_name }}
            </p>

            <div class="flex items-center gap-1.5 mt-1.5 text-sm font-medium text-gray-400">
              <PhBank class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ c.department?.name || 'ไม่ระบุภาควิชา' }}</span>
            </div>
          </div>

          <!-- Right section: Delete Date + Actions -->
          <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
            <div class="flex flex-col items-start sm:items-end gap-1 min-w-0">
               <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">ยกเลิกเมื่อ</span>
               <span class="text-xs font-bold text-gray-600">{{ formatDate(c.deleted_at) }}</span>
            </div>

            <div class="flex items-center gap-1 border-l border-gray-200 pl-3 sm:pl-4">
              <button @click="restoreCurriculum(c)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 active:scale-[0.95] transition-all duration-150 ease-ios font-semibold text-xs shadow-sm">
                <PhArrowCounterClockwise class="w-4 h-4" />
                กู้คืน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Success Toast -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0">
        <div v-if="toast.msg"
          :class="[
            'fixed bottom-6 right-6 z-[200] flex items-center gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm',
            toast.type === 'error' ? 'bg-gray-900' : 'bg-emerald-600'
          ]">
          <PhWarningCircle v-if="toast.type === 'error'" class="w-5 h-5 text-red-400 shrink-0" />
          <PhCheckCircle v-else class="w-5 h-5 text-white shrink-0" />
          {{ toast.msg }}
        </div>
      </Transition>
    </Teleport>

    <!-- Restore Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showRestoreModal" class="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-xl bg-white px-6 pb-6 pt-8 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 shadow-inner sm:mx-0">
                  <PhArrowCounterClockwise class="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div class="mt-4 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 class="text-lg font-bold text-gray-900 leading-tight">กู้คืนหลักสูตร</h3>
                  <div class="mt-3">
                    <p class="text-sm text-gray-500 leading-relaxed font-medium text-pretty"><span class="font-bold text-gray-900">{{ restoreTarget?.field_of_study ? `สาขาวิชา${restoreTarget.field_of_study}` : restoreTarget?.degree_name }}</span> จะกลับมาแสดงในรายการหลักสูตรตามปกติ</p>
                  </div>
                </div>
              </div>
              <div class="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                <button type="button" class="inline-flex flex-1 justify-center whitespace-nowrap rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all duration-150 ease-ios" @click="confirmRestore">กู้คืนหลักสูตร</button>
                <button type="button" class="inline-flex flex-1 justify-center whitespace-nowrap rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios" @click="showRestoreModal = false">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { PhCaretLeft, PhArchive, PhBank, PhArrowCounterClockwise, PhWarningCircle, PhCheckCircle } from '@phosphor-icons/vue';
import { formatThaiDateNumeric } from '@/utils/date';
import api from '@/services/api';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';

const router = useRouter();

const archivedCurricula = ref([]);
const loading = ref(false);

const toast = ref({ msg: '', type: 'success' });
let toastTimer = null;
function showToast(msg, type = 'success') {
  toast.value = { msg, type };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value.msg = ''; }, 4000);
}

const showRestoreModal = ref(false);
const restoreTarget = ref(null);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/curricula/archived');
    archivedCurricula.value = data.data || [];
  } catch (err) {
    showToast('ไม่สามารถดึงข้อมูลได้', 'error');
  } finally {
    loading.value = false;
  }
};

const formatDate = formatThaiDateNumeric;

const restoreCurriculum = (c) => {
  restoreTarget.value = c;
  showRestoreModal.value = true;
};

const confirmRestore = async () => {
  if (!restoreTarget.value) return;
  const c = restoreTarget.value;
  showRestoreModal.value = false;
  try {
    await api.post(`/curricula/${c.id}/restore`);
    showToast('กู้คืนหลักสูตรสำเร็จ');
    loadData();
  } catch (err) {
    showToast(err.response?.data?.message || 'กู้คืนไม่สำเร็จ กรุณาลองใหม่', 'error');
  } finally {
    restoreTarget.value = null;
  }
};

onMounted(() => {
  loadData();
});
</script>