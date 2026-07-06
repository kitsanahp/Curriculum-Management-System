<template>
  <div class="max-w-5xl mx-auto">

    <!-- Header (PageHeader component) -->
    <div class="mb-6">
      <PageHeader
        title="แบบฟอร์มและเอกสาร">
        <template v-if="isAdmin" #actions>
          <Button :icon-left="PhFilePlus" @click="router.push('/resources/create')">
            เพิ่มรายการ
          </Button>
        </template>
      </PageHeader>
    </div>

    <!-- Layout: มือถือเรียง ค้นหา → ปักหมุด → รายการเอกสาร / จอใหญ่ 2 คอลัมน์ ปักหมุด sticky ขวา
         (ใช้ grid + order เพราะ flex 2 คอลัมน์แทรกสลับข้ามคอลัมน์ตอน stack ไม่ได้) -->
    <div class="grid gap-x-5 gap-y-4 lg:grid-cols-[1fr_16rem] items-start">

      <!-- Toolbar: search + categories -->
      <div class="order-1 min-w-0 lg:col-start-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div class="relative">
            <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อหรือคำอธิบาย" aria-label="ค้นหาแบบฟอร์มและเอกสาร"
              class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all" />
            <!-- ปุ่มล้างคำค้นหา — โผล่เมื่อมีข้อความ -->
            <button v-if="searchQuery" @click="searchQuery = ''" type="button" aria-label="ล้างการค้นหา"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/70 active:scale-[0.9] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
              <PhX class="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button @click="activeCategory = 'ทั้งหมด'"
              :class="['cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0',
                activeCategory === 'ทั้งหมด'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
              ทั้งหมด
              <span v-if="mainResources.length"
                :class="['tabular-nums', activeCategory === 'ทั้งหมด' ? 'opacity-70' : 'text-gray-500']">
                {{ mainResources.length }}
              </span>
            </button>
            <button v-for="cat in categories" :key="cat"
              @click="activeCategory = cat"
              :class="['cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0',
                activeCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
              {{ cat }}
              <!-- count ต่อหมวด — ให้ consistent กับ tab "ทั้งหมด" -->
              <span :class="['tabular-nums', activeCategory === cat ? 'opacity-70' : 'text-gray-500']">
                {{ countOf(cat) }}
              </span>
            </button>
          </div>
      </div>

      <!-- Main: รายการเอกสาร -->
      <div class="order-3 min-w-0 space-y-4 lg:col-start-1">

        <!-- Loading skeleton -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 animate-pulse">
            <div class="w-10 h-10 bg-gray-100 rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3.5 bg-gray-100 rounded-full w-1/2"></div>
              <div class="h-3 bg-gray-100 rounded-full w-1/3"></div>
            </div>
            <div class="w-9 h-9 bg-gray-100 rounded-xl shrink-0"></div>
          </div>
        </div>

        <!-- Error state — แยกจาก empty ชัดเจน + ปุ่มลองใหม่ -->
        <div v-else-if="error" class="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center px-6 py-16">
          <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
            <PhWarningCircle class="w-6 h-6 text-red-500" aria-hidden="true" />
          </div>
          <p class="text-sm font-semibold text-gray-900">โหลดข้อมูลไม่สำเร็จ</p>
          <p class="text-xs text-gray-400 mt-1">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</p>
          <button @click="fetchResources" type="button"
            class="cursor-pointer mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.96] transition-all">
            <PhArrowClockwise class="w-3.5 h-3.5" /> ลองอีกครั้ง
          </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="!filteredResources.length" class="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <EmptyState
            :title="searchQuery || activeCategory !== 'ทั้งหมด' ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีแบบฟอร์มหรือเอกสาร'"
            :description="!searchQuery && activeCategory === 'ทั้งหมด' ? 'ไฟล์และลิงก์ที่ถูกเพิ่มจะแสดงที่นี่' : ''"
            :icon="PhFolderOpen"
            :action-label="searchQuery || activeCategory !== 'ทั้งหมด' ? 'ล้างตัวกรอง' : ''"
            @action="searchQuery = ''; activeCategory = 'ทั้งหมด'"
          />
        </div>

        <!-- Grouped card gallery -->
        <div v-else class="space-y-6">
          <div v-for="group in groupedResources" :key="group.category">
            <!-- Section header -->
            <div class="flex items-center gap-2 mb-3 px-1">
              <span class="text-sm font-bold text-gray-800">{{ group.category }}</span>
              <span class="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full tabular-nums">
                {{ group.items.length }}
              </span>
            </div>

            <!-- Compact card list -->
            <div class="space-y-2">
              <div v-for="r in group.items" :key="r.id"
                class="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 pr-2.5 hover:border-gray-300 hover:shadow-sm transition-all duration-200">

                <!-- File icon -->
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', fileTypeMeta(r).bg]">
                  <component :is="fileTypeMeta(r).icon" :class="['w-[18px] h-[18px]', fileTypeMeta(r).color]" />
                </div>

                <!-- Title + meta -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 leading-snug truncate">{{ r.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 truncate">{{ metaText(r) }}</p>
                </div>

                <!-- Actions (in-flow → ไม่ซ้อนชื่อ) -->
                <div class="flex items-center shrink-0">
                  <!-- ปักหมุด (admin) -->
                  <button v-if="isAdmin" @click="togglePin(r)" :aria-label="r.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดรายการ'"
                    :class="['cursor-pointer p-1.5 rounded-lg active:scale-[0.88] transition-all',
                      r.is_pinned
                        ? 'text-amber-500 hover:bg-amber-100/70'
                        : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100']">
                    <PhPushPin class="w-3.5 h-3.5" :weight="r.is_pinned ? 'fill' : 'regular'" />
                  </button>
                  <span v-else-if="r.is_pinned" class="p-1.5 text-amber-500" aria-label="ปักหมุดแล้ว"><PhPushPin class="w-3.5 h-3.5" weight="fill" /></span>

                  <!-- แก้ไข/ลบ (admin) — โผล่ตอน hover (สำรองที่ไว้ ไม่ดันชื่อ) -->
                  <template v-if="isAdmin">
                    <button @click="router.push(`/resources/${r.id}/edit`)" aria-label="แก้ไข"
                      class="cursor-pointer p-1.5 rounded-lg text-gray-300 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <PhPencilSimple class="w-3.5 h-3.5" />
                    </button>
                    <button @click="promptDelete(r.id)" aria-label="ลบ"
                      class="cursor-pointer p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <PhTrash class="w-3.5 h-3.5" />
                    </button>
                  </template>

                  <!-- เปิด/ดาวน์โหลด -->
                  <a :href="r.type === 'link' ? r.link_url : r.file_url" target="_blank" rel="noopener"
                    :aria-label="r.type === 'link' ? 'เปิดลิงก์' : 'ดาวน์โหลด'"
                    :class="['ml-1 inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 active:scale-[0.92] transition-all duration-150',
                      r.type === 'link'
                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200']">
                    <PhArrowSquareOut v-if="r.type === 'link'" class="w-4 h-4" />
                    <PhDownloadSimple v-else class="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT: sticky sidebar — กว้าง 256px (คอลัมน์ 2 ของ grid) ให้ชื่อหน่วยงานไทยยาวๆ พอหายใจ
           มือถือ: order-2 = อยู่ใต้ช่องค้นหา เหนือรายการเอกสาร -->
      <div class="order-2 min-w-0 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:row-span-2">
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-1.5">
            <PhPushPin class="w-3.5 h-3.5 text-amber-500" weight="fill" />
            <p class="text-xs font-bold text-gray-600">รายการปักหมุด</p>
            <span v-if="pinnedResources.length" class="ml-auto text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full tabular-nums">{{ pinnedResources.length }}</span>
          </div>
          <div class="p-2">
            <!-- รายการที่ปักหมุด -->
            <div v-for="r in pinnedResources" :key="r.id"
              class="group relative flex items-center rounded-xl hover:bg-gray-50 transition-all duration-150">
              <a :href="r.type === 'link' ? r.link_url : r.file_url" target="_blank" rel="noopener"
                class="cursor-pointer flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2.5">
                <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0', fileTypeMeta(r).bg]">
                  <component :is="fileTypeMeta(r).icon" :class="['w-4 h-4 shrink-0', fileTypeMeta(r).color]" />
                </div>
                <p class="flex-1 min-w-0 text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-snug line-clamp-2 transition-colors">
                  {{ r.title }}
                </p>
              </a>
              <!-- ยกเลิกปักหมุด (admin) / ไอคอนชนิด (อื่นๆ) -->
              <button v-if="isAdmin" @click="togglePin(r)" aria-label="ยกเลิกปักหมุด"
                class="cursor-pointer shrink-0 mr-1.5 p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 active:scale-[0.88] transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <PhPushPinSlash class="w-3.5 h-3.5" />
              </button>
              <component v-else :is="r.type === 'link' ? PhArrowSquareOut : PhDownloadSimple" class="w-3.5 h-3.5 text-gray-300 shrink-0 mr-3" />
            </div>

            <!-- Empty -->
            <div v-if="!pinnedResources.length" class="px-3 py-8 text-center">
              <div class="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-2.5">
                <PhPushPin class="w-5 h-5 text-gray-300" />
              </div>
              <p class="text-xs font-medium text-gray-500">ยังไม่มีรายการปักหมุด</p>
              <p v-if="isAdmin" class="text-xs text-gray-400 mt-1.5 leading-relaxed">กดไอคอนหมุดมุมขวาบนของการ์ด<br>เพื่อปักหมุดรายการสำคัญ</p>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { resourceService } from '@/services/resourceService';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { formatThaiDateShort } from '@/utils/date';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import {
  PhLink, PhArrowSquareOut,
  PhDownloadSimple, PhTrash, PhFolderOpen, PhPencilSimple,
  PhMagnifyingGlass, PhX, PhWarningCircle, PhArrowClockwise, PhFilePlus,
  PhFilePdf, PhFileDoc, PhFileXls, PhFilePpt, PhFileZip, PhFile,
  PhPushPin, PhPushPinSlash,
} from '@phosphor-icons/vue';

const router    = useRouter();
const authStore = useAuthStore();
const { open: confirm } = useConfirm();
const toast = useToast();
const isAdmin = computed(() => authStore.user?.role === 'admin');

const FILE_TYPE_META = {
  pdf:  { icon: PhFilePdf,  bg: 'bg-rose-50',    color: 'text-rose-500',    label: 'PDF Document'      },
  docx: { icon: PhFileDoc,  bg: 'bg-blue-50',    color: 'text-blue-500',    label: 'Word Document'     },
  xlsx: { icon: PhFileXls,  bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Excel Spreadsheet' },
  pptx: { icon: PhFilePpt,  bg: 'bg-orange-50',  color: 'text-orange-500',  label: 'PowerPoint'        },
  zip:  { icon: PhFileZip,  bg: 'bg-slate-100',  color: 'text-slate-500',   label: 'Archive'           },
  link: { icon: PhLink,     bg: 'bg-indigo-50',  color: 'text-indigo-500',  label: 'External Link'     },
  file: { icon: PhFile,     bg: 'bg-gray-100',   color: 'text-gray-500',    label: 'Document'          },
};

// description ที่เป็นค่าว่าง/ขีด "-" ถือว่าไม่มี → ตกไปใช้ type label แทน
const metaText = (r) => {
  const d = (r.description || '').trim();
  return d && d !== '-' ? d : fileTypeMeta(r).label;
};

// วันที่เพิ่ม (ถ่วงฝั่งขวา) — ไม่มีก็คืนค่าว่าง
const addedDate = (r) => (r.created_at ? formatThaiDateShort(r.created_at) : '');

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
const error          = ref(false);
const searchQuery    = ref('');
const activeCategory = ref('ทั้งหมด');

// รายการหลัก = ทุกรายการ (โชว์ในแกลเลอรีตามหมวด)
const mainResources = computed(() => resources.value);

// ไฟล์ที่ admin ปักหมุด → โชว์ลัดใน sidebar
const pinnedResources = computed(() => resources.value.filter(r => r.is_pinned));

const categories = computed(() => [...new Set(mainResources.value.map(r => r.category).filter(Boolean))]);

// จำนวนรายการต่อหมวด — ใช้กับ count บน tab
const countOf = (cat) => mainResources.value.filter(r => r.category === cat).length;

const filteredResources = computed(() => {
  let result = mainResources.value;
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
  error.value = false;
  try {
    const { data } = await resourceService.getAll();
    resources.value = data.data || [];
  } catch (e) {
    error.value = true;          // แยก "พัง" ออกจาก "ว่าง" ให้ชัด
  } finally {
    loading.value = false;
  }
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
    await resourceService.remove(id);
    resources.value = resources.value.filter(r => r.id !== id);
  } catch (e) {
    toast.error('ลบไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

// ปักหมุด/ยกเลิก (admin) — อัปเดต local ทันที แล้วยิง API
const togglePin = async (r) => {
  const next = !r.is_pinned;
  try {
    await resourceService.setPin(r.id, next);
    r.is_pinned = next;
    toast.show(next
      ? { type: 'success', title: 'ปักหมุดรายการแล้ว', icon: PhPushPin }
      : { type: 'error',   title: 'ยกเลิกปักหมุดแล้ว', icon: PhPushPinSlash });
  } catch (e) {
    toast.error('ทำรายการไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

onMounted(fetchResources);
</script>
