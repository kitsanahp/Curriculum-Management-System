<template>
  <div class="max-w-5xl mx-auto space-y-5">

    <!-- ── LIST VIEW ── -->
    <template v-if="!selectedItem">

      <!-- Header (PageHeader component) -->
      <PageHeader
        title="ดาวน์โหลดเอกสาร"
        :subtitle="`มติคณะกรรมการตรวจรายวิชาศึกษาทั่วไป ปริญญาตรีทุกภาควิชา${items.length ? ` · ${items.length} รายการ` : ''}`"
      />

      <!-- Filter bar -->
      <div v-if="!loading && items.length" class="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1">
            <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="search" type="text" placeholder="ค้นหาสาขาวิชา"
              class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all" />
          </div>
          <!-- Department dropdown -->
          <FormSelect
            v-model="selectedDept"
            :options="[
              { label: 'ทุกภาควิชา', value: '' },
              ...availableDepts.map(d => ({ label: d.short, value: d.key }))
            ]"
            placeholder="ทุกภาควิชา"
            class="sm:w-48"
          />
        </div>
      </div>

      <!-- Active filter chips -->
      <div v-if="search || selectedDept" class="flex items-center gap-2 flex-wrap -mt-1">
        <span class="text-[11px] font-semibold text-gray-400">กรองโดย</span>
        <button v-if="selectedDept" @click="selectedDept = ''"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 active:scale-[0.95] transition-all duration-150 ease-ios">
          {{ availableDepts.find(d => d.key === selectedDept)?.short || selectedDept }}
          <span class="text-primary-400 font-bold leading-none">×</span>
        </button>
        <button v-if="search" @click="search = ''"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 active:scale-[0.95] transition-all duration-150 ease-ios">
          "{{ search }}"
          <span class="text-primary-400 font-bold leading-none">×</span>
        </button>
        <button @click="search = ''; selectedDept = ''"
          class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-all duration-150 ease-ios">
          ล้างทั้งหมด
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 5" :key="i"
          class="bg-white rounded-xl border border-gray-100 h-[84px] animate-pulse"
          :style="{ opacity: Math.max(0.2, 1 - (i - 1) * 0.18) }"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!items.length" class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <EmptyState
          title="ยังไม่มีเอกสาร"
          description="เอกสารจะปรากฏเมื่อมีการนำหลักสูตรเข้าพิจารณาในคณะกรรมการตรวจรายวิชาศึกษาทั่วไป"
          :icon="PhTray"
          size="lg"
        />
      </div>

      <!-- No results after filter -->
      <div v-else-if="!filteredItems.length" class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <EmptyState
          title="ไม่พบข้อมูลที่ค้นหา"
          :icon="PhFunnel"
          action-label="ล้างตัวกรอง"
          @action="search = ''; selectedDept = ''"
        />
      </div>

      <!-- Row list -->
      <div v-else class="space-y-2">
        <div v-for="item in filteredItems" :key="item.id"
          @click="selectedItem = item"
          class="bg-white cursor-pointer rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group overflow-hidden">

          <div class="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-5">

            <!-- Left: curriculum info -->
            <div class="flex-1 min-w-0">
              <!-- Badges -->
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {{ DEGREE_LABELS[item.curriculum?.degree_level] || 'ปริญญาตรี' }}
                </span>
                <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  ปี {{ item.curriculum?.curriculum_year }}
                </span>
                <span v-if="item.curriculum?.curriculum_type"
                  :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded',
                    item.curriculum.curriculum_type === 'new'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-sky-50 text-sky-700']">
                  {{ item.curriculum.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'ปรับปรุงหลักสูตร' }}
                </span>
              </div>
              <!-- Name -->
              <h3 class="font-bold text-gray-900 text-base leading-snug">
                {{ item.curriculum?.field_of_study
                  ? `สาขาวิชา${item.curriculum.field_of_study}`
                  : item.curriculum?.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
              </h3>
              <!-- Degree name (if field_of_study exists) -->
              <p v-if="item.curriculum?.field_of_study && item.curriculum?.degree_name"
                class="text-sm text-gray-500 font-medium truncate mt-0.5">
                {{ item.curriculum.degree_name }}
              </p>
              <!-- Department -->
              <div class="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                <component v-if="deptIcon(item.curriculum?.department?.name)"
                  :is="deptIcon(item.curriculum?.department?.name)"
                  weight="bold" class="w-3.5 h-3.5 shrink-0"
                  :style="{ color: deptColor(item.curriculum?.department?.name) }" />
                <span class="truncate">{{ item.curriculum?.department?.name || 'ไม่ระบุภาควิชา' }}</span>
              </div>
            </div>

            <!-- Right: date + file count + caret -->
            <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
              <div class="flex flex-col items-start sm:items-end gap-1">
                <p class="text-xs font-bold text-gray-700 tabular-nums">
                  {{ item.decision_date ? formatDate(item.decision_date) : 'ยังไม่ระบุ' }}
                </p>
                <p v-if="item.meeting_number" class="text-[11px] text-gray-400">
                  ครั้งที่ {{ item.meeting_number }}
                </p>
              </div>
              <div class="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-2.5 py-1.5 rounded-lg">
                <PhFiles class="w-3.5 h-3.5" />
                <span class="text-xs font-bold tabular-nums">{{ item.documents?.length || 0 }} ไฟล์</span>
              </div>
              <div class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 group-hover:text-gray-600 group-hover:bg-gray-50 transition-all duration-200 shrink-0">
                <PhCaretRight class="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>
      </div>

    </template>

    <!-- ── DETAIL VIEW ── -->
    <template v-else>

      <!-- Back + header -->
      <div>
        <button @click="selectedItem = null"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all duration-150 ease-ios mb-4 group">
          <PhCaretLeft class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          กลับรายการ
        </button>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="min-w-0">
              <!-- Badges -->
              <div class="flex items-center gap-1.5 mb-2 flex-wrap">
                <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {{ DEGREE_LABELS[selectedItem.curriculum?.degree_level] || 'ปริญญาตรี' }}
                </span>
                <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  ปี {{ selectedItem.curriculum?.curriculum_year }}
                </span>
                <span v-if="selectedItem.curriculum?.curriculum_type"
                  :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded',
                    selectedItem.curriculum.curriculum_type === 'new'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-sky-50 text-sky-700']">
                  {{ selectedItem.curriculum.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'ปรับปรุงหลักสูตร' }}
                </span>
              </div>
              <!-- Name -->
              <h1 class="text-xl font-bold text-gray-900 tracking-tight leading-snug">
                {{ selectedItem.curriculum?.field_of_study
                  ? `สาขาวิชา${selectedItem.curriculum.field_of_study}`
                  : selectedItem.curriculum?.degree_name }}
              </h1>
              <p v-if="selectedItem.curriculum?.field_of_study && selectedItem.curriculum?.degree_name"
                class="text-sm text-gray-500 font-medium mt-0.5">
                {{ selectedItem.curriculum.degree_name }}
              </p>
              <!-- Dept -->
              <div class="flex items-center gap-1.5 mt-2">
                <component v-if="deptIcon(selectedItem.curriculum?.department?.name)"
                  :is="deptIcon(selectedItem.curriculum?.department?.name)"
                  weight="bold" class="w-3.5 h-3.5 shrink-0"
                  :style="{ color: deptColor(selectedItem.curriculum?.department?.name) }" />
                <span class="text-sm text-gray-500 font-medium">
                  {{ selectedItem.curriculum?.department?.name }}
                </span>
              </div>
            </div>
            <!-- Date info -->
            <div class="shrink-0 sm:text-right">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">วันมติ</p>
              <p class="text-sm font-bold text-gray-800 tabular-nums">
                {{ selectedItem.decision_date ? formatDate(selectedItem.decision_date) : 'ยังไม่ระบุ' }}
              </p>
              <p v-if="selectedItem.meeting_number" class="text-xs text-gray-400 mt-0.5">
                ครั้งที่ {{ selectedItem.meeting_number }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- File list -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">เอกสารแนบ</span>
          <span class="text-xs font-semibold text-gray-400 tabular-nums">
            {{ selectedItem.documents?.length || 0 }} ไฟล์
          </span>
        </div>

        <div v-if="!selectedItem.documents?.length" class="px-5 py-12 text-center">
          <PhTray class="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p class="text-sm font-semibold text-gray-500">ยังไม่มีไฟล์แนบ</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div v-for="doc in selectedItem.documents" :key="doc.id"
            class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/70 active:bg-gray-100 transition-all duration-150 ease-ios">
            <FileIcon :fileType="fileExt(doc.original_name)" size="sm" class="shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ doc.original_name }}</p>
              <p v-if="doc.file_size" class="text-xs text-gray-400 mt-0.5">{{ formatSize(doc.file_size) }}</p>
            </div>
            <button @click="downloadFile(doc)" :disabled="downloading === doc.id"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-white hover:bg-primary-600 px-3.5 py-2 rounded-lg border border-primary-200 hover:border-primary-600 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50 shrink-0">
              <PhDownloadSimple v-if="downloading !== doc.id" class="w-4 h-4" />
              <span v-else class="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></span>
              ดาวน์โหลด
            </button>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { formatThaiDateNumeric } from '@/utils/date';
import {
  PhDownloadSimple, PhTray, PhFunnel,
  PhCaretRight, PhCaretLeft, PhMagnifyingGlass, PhFiles,
} from '@phosphor-icons/vue';
import FileIcon from '@/components/common/FileIcon.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { getDept, DEPT_CONFIG } from '@/constants/deptConfig';

const items       = ref([]);
const loading     = ref(false);
const selectedDept = ref('');
const selectedItem = ref(null);
const downloading  = ref(null);
const search       = ref('');

const formatDate = formatThaiDateNumeric;

const DEGREE_LABELS = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

const deptColor = (name) => getDept(name)?.color ?? '#94a3b8';
const deptIcon  = (name) => getDept(name)?.icon  ?? null;
const fileExt    = (name) => name?.split('.').pop()?.toLowerCase() ?? '';
const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const availableDepts = computed(() => {
  const names = new Set(items.value.map(i => i.curriculum?.department?.name).filter(Boolean));
  return DEPT_CONFIG.filter(d => names.has(d.key));
});

const filteredItems = computed(() => {
  let result = items.value;
  if (selectedDept.value)
    result = result.filter(i => i.curriculum?.department?.name === selectedDept.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    result = result.filter(i => {
      const name = (i.curriculum?.field_of_study || i.curriculum?.degree_name || '').toLowerCase();
      const dept = (i.curriculum?.department?.name || '').toLowerCase();
      return name.includes(q) || dept.includes(q);
    });
  }
  return result;
});

const downloadFile = async (doc) => {
  if (downloading.value) return;
  downloading.value = doc.id;
  try {
    const response = await api.get(`/curricula/committee-documents/${doc.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_name;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    downloading.value = null;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/downloads');
    items.value = data.data;
  } finally {
    loading.value = false;
  }
});
</script>
