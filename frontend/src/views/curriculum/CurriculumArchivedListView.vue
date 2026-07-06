<template>
  <div class="max-w-7xl mx-auto space-y-5">
    <!-- Hero Header (PageHeader component) -->
    <PageHeader
      title="ประวัติการยกเลิกหลักสูตร">
      <template #actions>
        <button v-if="!loading && archivedCurricula.length" @click="forceDeleteAll"
          class="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.97] transition-all duration-150 ease-ios font-semibold text-sm shadow-sm">
          <PhTrash class="w-4 h-4" weight="bold" />
          ลบทั้งหมด
        </button>
      </template>
    </PageHeader>

    <!-- List -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-gray-200/80 p-8 animate-pulse h-32 opacity-60"></div>
    </div>

    <div v-else-if="archivedCurricula.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
      <EmptyState
        title="ไม่มีประวัติการยกเลิกหลักสูตร"
        description="หลักสูตรที่ถูกยกเลิกจะมาแสดงอยู่ที่หน้านี้"
        :icon="PhArchive"
        size="lg"
      />
    </div>

    <div v-else class="space-y-2">
      <div v-for="c in archivedCurricula" :key="c.id"
        class="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden relative flex flex-col sm:flex-row sm:items-center p-5 sm:p-6 gap-4">
        
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-gray-500 mb-1 truncate">
            {{ c.department?.name || 'ไม่ระบุภาควิชา' }}
          </p>
          <h3 class="text-[17px] sm:text-lg font-bold text-gray-900 leading-snug truncate">
            {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
          </h3>
          <p v-if="c.field_of_study && c.degree_name" class="text-sm text-gray-500 font-medium truncate mt-0.5">
            {{ c.degree_name }}
          </p>

          <div class="flex items-center gap-2 mt-3.5 flex-wrap">
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
              {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
            </span>
            <span v-if="c.curriculum_type" class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600">
              หลักสูตร{{ c.curriculum_type === 'new' ? 'ใหม่' : 'ปรับปรุง' }}
            </span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600">
              ปี {{ c.curriculum_year }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-100/50 sm:ml-2">
              <PhClock class="w-3.5 h-3.5" />
              ยกเลิกเมื่อ {{ formatDate(c.deleted_at) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-l sm:pl-6 w-full sm:w-auto mt-2 sm:mt-0">
          <button @click="restoreCurriculum(c)"
            class="cursor-pointer flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-primary-700 hover:border-primary-200 hover:bg-primary-50 active:scale-[0.96] transition-all duration-150 font-semibold text-sm shadow-sm">
            <PhArrowCounterClockwise class="w-4 h-4" weight="bold" />
            กู้คืน
          </button>
          <button @click="promptForceDelete(c)"
            class="cursor-pointer flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 active:scale-[0.96] transition-all duration-150 font-semibold text-sm shadow-sm">
            <PhTrash class="w-4 h-4" weight="bold" />
            ลบถาวร
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PhArchive, PhArrowCounterClockwise, PhTrash, PhClock } from '@phosphor-icons/vue';
import { formatThaiDateNumeric } from '@/utils/date';
import { curriculumService } from '@/services/curriculumService';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const archivedCurricula = ref([]);
const loading = ref(false);
const { open: confirm } = useConfirm();

// ใช้ toast กลาง (top-right) ให้สอดคล้องทั้งระบบ ไม่ทับปุ่มลอยมุมล่าง
const toast = useToast();
const showToast = (msg, type = 'success') =>
  type === 'error' ? toast.error(msg) : toast.success(msg);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await curriculumService.getArchived();
    archivedCurricula.value = data.data || [];
  } catch (err) {
    showToast('ไม่สามารถดึงข้อมูลได้', 'error');
  } finally {
    loading.value = false;
  }
};

const formatDate = formatThaiDateNumeric;

// ทุก confirm ใช้ ConfirmModal กลาง (useConfirm) — โทน/layout เดียวกับ "ยกเลิกหลักสูตร"
const curriculumName = (c) =>
  c?.field_of_study ? `สาขาวิชา${c.field_of_study}` : c?.degree_name || 'หลักสูตรนี้';

const restoreCurriculum = async (c) => {
  const ok = await confirm({
    title: 'กู้คืนหลักสูตร',
    message: `${curriculumName(c)} จะกลับมาแสดงในรายการหลักสูตรตามปกติ`,
    confirmLabel: 'กู้คืนหลักสูตร',
    type: 'primary',
  });
  if (!ok) return;
  try {
    await curriculumService.restore(c.id);
    showToast('กู้คืนหลักสูตรสำเร็จ');
    loadData();
  } catch (err) {
    showToast(err.response?.data?.message || 'กู้คืนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  }
};

// ── ลบถาวร (Hard Delete) — ลบไม่สามารถกู้คืนได้ ──────────────────────────────
const promptForceDelete = async (c) => {
  const ok = await confirm({
    title: 'ลบหลักสูตรถาวร',
    message: `${curriculumName(c)} พร้อมเอกสาร เวอร์ชัน และประวัติทั้งหมด จะถูกลบออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้`,
    confirmLabel: 'ลบถาวร',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await curriculumService.forceDelete(c.id);
    showToast('ลบหลักสูตรถาวรสำเร็จ');
    loadData();
  } catch (err) {
    showToast(err.response?.data?.message || 'ลบถาวรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  }
};

// ── ลบประวัติทั้งหมดถาวร ──────────────────────────────────────────────────────
const forceDeleteAll = async () => {
  const count = archivedCurricula.value.length;
  const ok = await confirm({
    title: 'ลบประวัติทั้งหมดถาวร',
    message: `หลักสูตรที่ถูกยกเลิกทั้งหมด ${count} รายการ พร้อมเอกสาร เวอร์ชัน และประวัติที่เกี่ยวข้อง จะถูกลบออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้`,
    confirmLabel: `ลบทั้งหมด ${count} รายการ`,
    type: 'danger',
  });
  if (!ok) return;
  try {
    const { data } = await curriculumService.forceDeleteAll();
    showToast(data?.message || 'ลบประวัติทั้งหมดถาวรสำเร็จ');
    loadData();
  } catch (err) {
    showToast(err.response?.data?.message || 'ลบทั้งหมดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  }
};

onMounted(() => {
  loadData();
});
</script>