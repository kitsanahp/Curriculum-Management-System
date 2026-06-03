<template>
  <div class="max-w-5xl mx-auto">

    <!-- Header (PageHeader component) -->
    <div class="mb-6">
      <PageHeader
        title="แบบฟอร์มและเอกสาร"
        subtitle="ดาวน์โหลดแบบฟอร์ม เอกสาร และลิงก์ที่ใช้บ่อย">
        <template v-if="isAdmin" #actions>
          <Button :icon-left="PhPlusCircle" @click="router.push('/resources/create')">
            เพิ่มรายการ
          </Button>
        </template>
      </PageHeader>
    </div>

    <!-- 2-column layout -->
    <div class="flex flex-col lg:flex-row gap-5 items-start">

      <!-- LEFT: main content -->
      <div class="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Search + tabs bar -->
        <div class="px-4 pt-4 pb-3 space-y-3 border-b border-gray-100">
          <div class="relative">
            <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อหรือคำอธิบาย"
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all" />
          </div>
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button @click="activeCategory = 'ทั้งหมด'"
              :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0',
                activeCategory === 'ทั้งหมด'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200']">
              ทั้งหมด
              <span v-if="resources.length"
                :class="['tabular-nums', activeCategory === 'ทั้งหมด' ? 'opacity-70' : 'text-gray-400']">
                {{ resources.length }}
              </span>
            </button>
            <button v-for="cat in categories" :key="cat"
              @click="activeCategory = cat"
              :class="['px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0',
                activeCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200']">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="p-3 space-y-1">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-3 py-3 animate-pulse rounded-xl"
            :style="{ opacity: 1 - (i - 1) * 0.18 }">
            <div class="w-10 h-10 bg-gray-100 rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3.5 bg-gray-100 rounded-full w-44"></div>
              <div class="h-3 bg-gray-100 rounded-full w-28"></div>
            </div>
            <div class="h-7 bg-gray-100 rounded-lg w-24 shrink-0"></div>
          </div>
        </div>

        <!-- Empty state -->
        <EmptyState
          v-else-if="!filteredResources.length"
          :title="searchQuery || activeCategory !== 'ทั้งหมด' ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีแบบฟอร์มหรือเอกสาร'"
          :description="!searchQuery && activeCategory === 'ทั้งหมด' ? 'ไฟล์และลิงก์ที่ถูกเพิ่มจะแสดงที่นี่' : ''"
          :icon="PhFolderOpen"
          :action-label="searchQuery || activeCategory !== 'ทั้งหมด' ? 'ล้างตัวกรอง' : ''"
          @action="searchQuery = ''; activeCategory = 'ทั้งหมด'"
        />

        <!-- Grouped list -->
        <template v-else>
          <template v-for="(group, gi) in groupedResources" :key="group.category">
            <!-- Section label -->
            <div :class="['px-5 pt-4 pb-1 flex items-center justify-between',
              gi > 0 && 'border-t border-gray-100']">
              <span class="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.1em]">{{ group.category }}</span>
              <span class="text-[10.5px] text-gray-300 tabular-nums">{{ group.items.length }} รายการ</span>
            </div>

            <!-- Items -->
            <div class="px-3 pb-3 space-y-0.5">
              <div v-for="r in group.items" :key="r.id"
                class="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-100">

                <!-- File type icon -->
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', fileTypeMeta(r).bg]">
                  <component :is="fileTypeMeta(r).icon" :class="['w-[18px] h-[18px]', fileTypeMeta(r).color]" />
                </div>

                <!-- Title + description -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate leading-snug">{{ r.title }}</p>
                  <p class="text-xs text-gray-400 mt-0.5 truncate">
                    {{ r.description || fileTypeMeta(r).label }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <a :href="r.type === 'link' ? r.link_url : r.file_url"
                    target="_blank" rel="noopener"
                    :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-[0.96]',
                      r.type === 'link'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700']">
                    <PhArrowSquareOut v-if="r.type === 'link'" class="w-3.5 h-3.5" />
                    <PhDownloadSimple v-else class="w-3.5 h-3.5" />
                    {{ r.type === 'link' ? 'เปิดลิงก์' : 'ดาวน์โหลด' }}
                  </a>
                  <button v-if="isAdmin" @click="promptDelete(r.id)"
                    class="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all opacity-0 group-hover:opacity-100 shrink-0">
                    <PhTrash class="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          </template>
        </template>

      </div>

      <!-- RIGHT: sticky sidebar -->
      <div class="w-full lg:w-56 shrink-0 lg:sticky lg:top-6">
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.1em]">ระบบที่เกี่ยวข้อง</p>
          </div>
          <div class="p-2">
            <a v-for="svc in EXTERNAL_SERVICES" :key="svc.key"
              :href="svc.url" target="_blank" rel="noopener noreferrer"
              class="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all duration-150">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: svc.color + '15' }">
                <component :is="svc.icon" class="w-3.5 h-3.5 shrink-0" :style="{ color: svc.color }" />
              </div>
              <p class="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-snug transition-colors">
                {{ svc.name }}
              </p>
              <PhArrowSquareOut class="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" />
            </a>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from '@/composables/useConfirm';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import {
  PhPlusCircle, PhLink, PhArrowSquareOut,
  PhDownloadSimple, PhTrash, PhFolderOpen,
  PhMagnifyingGlass,
  PhGlobe, PhBookOpen, PhSealCheck, PhBuildingOffice,
  PhFilePdf, PhFileDoc, PhFileXls, PhFilePpt, PhFileZip, PhFile,
} from '@phosphor-icons/vue';

const router    = useRouter();
const authStore = useAuthStore();
const { open: confirm } = useConfirm();
const isAdmin = computed(() => authStore.user?.role === 'admin');

const EXTERNAL_SERVICES = [
  { key: 'checo', name: 'CHECO',               url: 'https://www.checo.mua.go.th/', icon: PhGlobe,          color: '#3b82f6' },
  { key: 'tqf',   name: 'TQF Management',       url: '#',                             icon: PhBookOpen,       color: '#6366f1' },
  { key: 'cisa',  name: 'CISA',                 url: '#',                             icon: PhSealCheck,      color: '#10b981' },
  { key: 'nu',    name: 'กองบริการการศึกษา มหาวิทยาลัยนเรศวร', url: 'https://acad.nu.ac.th/',       icon: PhBuildingOffice, color: '#f59e0b' },
];

const FILE_TYPE_META = {
  pdf:  { icon: PhFilePdf,  bg: 'bg-rose-50',    color: 'text-rose-500',    label: 'PDF Document'      },
  docx: { icon: PhFileDoc,  bg: 'bg-blue-50',    color: 'text-blue-500',    label: 'Word Document'     },
  xlsx: { icon: PhFileXls,  bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Excel Spreadsheet' },
  pptx: { icon: PhFilePpt,  bg: 'bg-orange-50',  color: 'text-orange-500',  label: 'PowerPoint'        },
  zip:  { icon: PhFileZip,  bg: 'bg-slate-100',  color: 'text-slate-500',   label: 'Archive'           },
  link: { icon: PhLink,     bg: 'bg-indigo-50',  color: 'text-indigo-500',  label: 'External Link'     },
  file: { icon: PhFile,     bg: 'bg-gray-100',   color: 'text-gray-500',    label: 'Document'          },
};

const fileTypeMeta = (r) => {
  if (r.type === 'link') return FILE_TYPE_META.link;
  const ext = (r.file_url || '').split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                           return FILE_TYPE_META.pdf;
  if (['docx', 'doc'].includes(ext))           return FILE_TYPE_META.docx;
  if (['xlsx', 'xls', 'csv'].includes(ext))    return FILE_TYPE_META.xlsx;
  if (['pptx', 'ppt'].includes(ext))           return FILE_TYPE_META.pptx;
  if (['zip', 'rar', '7z'].includes(ext))      return FILE_TYPE_META.zip;
  return FILE_TYPE_META.file;
};

const resources      = ref([]);
const loading        = ref(false);
const searchQuery    = ref('');
const activeCategory = ref('ทั้งหมด');

const categories = computed(() => [...new Set(resources.value.map(r => r.category).filter(Boolean))]);

const filteredResources = computed(() => {
  let result = resources.value;
  if (activeCategory.value !== 'ทั้งหมด') {
    result = result.filter(r => r.category === activeCategory.value);
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter(r =>
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }
  return result;
});

const groupedResources = computed(() => {
  const map = new Map();
  for (const r of filteredResources.value) {
    const cat = r.category || 'ไม่ระบุหมวดหมู่';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(r);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
});

const fetchResources = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/resources');
    resources.value = data.data || [];
  } finally { loading.value = false; }
};

const promptDelete = async (id) => {
  const confirmed = await confirm({
    title:        'ลบรายการ',
    message:      'รายการนี้จะถูกลบออกจากระบบถาวร',
    confirmLabel: 'ลบรายการ',
    type:         'danger',
  });
  if (!confirmed) return;
  try {
    await api.delete(`/resources/${id}`);
    resources.value = resources.value.filter(r => r.id !== id);
  } catch (e) {
    console.error('Delete failed', e);
  }
};

onMounted(fetchResources);
</script>
