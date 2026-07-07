<template>
  <div class="max-w-5xl mx-auto space-y-4">

    <PageHeader title="การส่งอีเมล">
      <template #actions>
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <PhPaperPlaneTilt class="w-3.5 h-3.5 shrink-0 text-gray-400" weight="bold" aria-hidden="true" />
          24 ชม. ส่งสำเร็จ {{ stats.sent24h }} ฉบับ
        </span>
        <span v-if="stats.failed24h"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 shadow-sm">
          <PhWarning class="w-3.5 h-3.5 shrink-0 text-red-500" weight="fill" aria-hidden="true" />
          ล้มเหลว {{ stats.failed24h }} ฉบับ
        </span>
      </template>
    </PageHeader>

    <!-- ── Filter bar ── -->
    <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-4 py-3">
      <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div class="relative flex-1">
          <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input v-model="search" type="text" placeholder="ค้นหาอีเมลผู้รับหรือหัวข้อ"
            class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all outline-none" />
        </div>
        <FormSelect v-model="filterStatus" :options="statusOptions" class="sm:w-44 sm:shrink-0" />
        <span class="inline-flex items-center text-xs font-semibold text-gray-400 shrink-0 self-center tabular-nums whitespace-nowrap">
          ทั้งหมด {{ meta.total }} รายการ
        </span>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-2 animate-pulse">
      <div v-for="i in 8" :key="i" class="bg-white rounded-2xl border border-gray-200/80 h-14" />
    </div>

    <!-- Error state -->
    <div v-else-if="error"
      class="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col items-center text-center px-6 py-16">
      <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
        <PhWarning class="w-6 h-6 text-red-500" />
      </div>
      <p class="text-sm font-semibold text-gray-900">โหลดข้อมูลไม่สำเร็จ</p>
      <p class="text-xs text-gray-500 mt-1">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</p>
      <button @click="fetchLogs" type="button"
        class="cursor-pointer mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.96] transition-all">
        ลองอีกครั้ง
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!logs.length"
      class="bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col items-center text-center px-6 py-16">
      <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <PhEnvelopeSimple class="w-6 h-6 text-gray-400" />
      </div>
      <p class="text-sm font-semibold text-gray-900">ยังไม่มีประวัติการส่งอีเมล</p>
      <p class="text-xs text-gray-500 mt-1">ระบบจะบันทึกผลการส่งอีเมลทุกฉบับไว้ที่นี่โดยอัตโนมัติ</p>
    </div>

    <!-- ── Log list ── -->
    <div v-else class="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div class="divide-y divide-gray-100">
        <div v-for="log in logs" :key="log.id" class="px-5 py-3.5 hover:bg-gray-50/70 transition-colors duration-150">
          <div class="flex items-center gap-3">
            <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              log.status === 'sent' ? 'bg-emerald-50' : 'bg-red-50']">
              <PhCheckCircle v-if="log.status === 'sent'" class="w-4 h-4 text-emerald-600" weight="fill" />
              <PhXCircle v-else class="w-4 h-4 text-red-600" weight="fill" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-bold text-gray-900 truncate">{{ log.recipient }}</p>
                <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full',
                  log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                  {{ log.status === 'sent' ? 'ส่งสำเร็จ' : 'ล้มเหลว' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 truncate mt-0.5">{{ log.subject || '—' }}</p>
              <p v-if="log.error" class="text-xs font-medium text-red-600 mt-1 break-words">{{ log.error }}</p>
            </div>
            <span class="text-xs text-gray-400 shrink-0 tabular-nums whitespace-nowrap">
              {{ formatThaiDateTime(log.created_at || log.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Pagination ── -->
      <div v-if="totalPages > 1" class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-500 tabular-nums">หน้า {{ meta.page }} / {{ totalPages }}</span>
        <div class="flex items-center gap-2">
          <button @click="goPage(meta.page - 1)" :disabled="meta.page <= 1"
            class="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-[0.96] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <PhCaretLeft class="w-3.5 h-3.5" /> ก่อนหน้า
          </button>
          <button @click="goPage(meta.page + 1)" :disabled="meta.page >= totalPages"
            class="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-[0.96] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            ถัดไป <PhCaretRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  PhEnvelopeSimple, PhMagnifyingGlass, PhWarning, PhCheckCircle, PhXCircle,
  PhCaretLeft, PhCaretRight, PhPaperPlaneTilt,
} from '@phosphor-icons/vue';
import PageHeader from '@/components/common/PageHeader.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import { emailLogService } from '@/services/emailLogService';
import { formatThaiDateTime } from '@/utils/date';

const logs = ref([]);
const meta = ref({ total: 0, page: 1, limit: 50 });
const stats = ref({ sentTotal: 0, failedTotal: 0, sent24h: 0, failed24h: 0 });
const loading = ref(true);
const error = ref(false);

const search = ref('');
const filterStatus = ref('');
const statusOptions = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'sent', label: 'ส่งสำเร็จ' },
  { value: 'failed', label: 'ล้มเหลว' },
];

const totalPages = computed(() => Math.max(1, Math.ceil(meta.value.total / meta.value.limit)));

async function fetchLogs(page = 1) {
  loading.value = true;
  error.value = false;
  try {
    const { data } = await emailLogService.getAll({
      page, limit: 50,
      status: filterStatus.value || undefined,
      search: search.value || undefined,
    });
    logs.value = data.data;
    meta.value = data.meta;
    stats.value = data.stats;
  } catch {
    error.value = true;
  } finally { loading.value = false; }
}

function goPage(page) {
  if (page < 1 || page > totalPages.value) return;
  fetchLogs(page);
}

// ค้นหาแบบ debounce — พิมพ์หยุด 400ms ค่อยยิง (กันยิงถี่ชน rate limit)
let searchTimer = null;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchLogs(1), 400);
});
watch(filterStatus, () => fetchLogs(1));

onMounted(() => fetchLogs());
</script>
