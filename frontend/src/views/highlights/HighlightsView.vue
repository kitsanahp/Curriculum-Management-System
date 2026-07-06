<template>
  <div>
    <div class="max-w-4xl mx-auto space-y-5">

      <!-- ═══════════════════════════════════════
           LIST VIEW
      ═══════════════════════════════════════ -->
      <template v-if="!selectedFile">

        <!-- Header (PageHeader component) -->
        <PageHeader
          title="หมายเหตุในเอกสาร">
          <template #actions>
            <span class="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 tabular-nums">
              {{ totalCount }} ไฮไลท์
            </span>
            <span v-if="activeCount > 0"
              class="px-3 py-1.5 rounded-full bg-amber-100 text-sm text-amber-700 tabular-nums">
              {{ activeCount }} ยังไม่แก้ไข
            </span>
          </template>
        </PageHeader>

        <!-- Filter card -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm">

          <!-- Search -->
          <div class="px-4 pt-4 pb-3.5 border-b border-gray-100">
            <div class="relative">
              <PhMagnifyingGlass class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input v-model="search" type="text" placeholder="ค้นหาสาขา ชื่อไฟล์ หรือข้อความที่ไฮไลท์"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent focus:bg-white transition-all" />
            </div>
          </div>

          <!-- Filters row -->
          <div class="px-4 py-3 flex items-center gap-2.5 flex-wrap">

            <!-- Status pills -->
            <div class="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button v-for="opt in statusOptions" :key="opt.value"
                @click="filterStatus = opt.value"
                :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap',
                  filterStatus === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
                {{ opt.label }}
                <span class="ml-1 text-xs opacity-50 tabular-nums">{{ opt.count }}</span>
              </button>
            </div>

            <div class="w-px h-5 bg-gray-200 shrink-0"></div>

            <!-- Color pills -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button @click="filterColor = null"
                :class="['px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap',
                  filterColor === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
                ทุกสี
              </button>
              <button v-for="clr in colorOptions" :key="clr.value"
                @click="filterColor = filterColor === clr.value ? null : clr.value"
                :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap',
                  filterColor === clr.value ? clr.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
                <span :class="['w-2.5 h-2.5 rounded-full shrink-0', clr.bg]"></span>
                {{ clr.label }}
              </button>
            </div>

            <div class="w-px h-5 bg-gray-200 shrink-0"></div>

            <!-- File type pills -->
            <div class="flex items-center gap-1.5">
              <button v-for="ft in fileTypeOptions" :key="ft.value"
                @click="filterFileType = filterFileType === ft.value ? null : ft.value"
                :class="['px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap',
                  filterFileType === ft.value ? ft.activeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200']">
                {{ ft.label }}
              </button>
            </div>

          </div>
        </div>

        <!-- Loading skeleton -->
        <template v-if="loading">
          <div v-for="i in 2" :key="i" class="space-y-2">
            <div class="h-4 w-48 bg-gray-200 rounded-full animate-pulse"></div>
            <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div v-for="j in 2" :key="j"
                class="flex items-center gap-3.5 px-5 py-4 border-b border-gray-100 last:border-0 animate-pulse">
                <div class="w-10 h-10 bg-gray-100 rounded-xl shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-100 rounded-full w-1/2"></div>
                  <div class="h-3 bg-gray-100 rounded-full w-1/4"></div>
                </div>
                <div class="w-20 h-3.5 bg-gray-100 rounded-full shrink-0"></div>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty -->
        <div v-else-if="!listGroups.length" class="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <EmptyState
            title="ยังไม่มีไฮไลท์ในระบบ"
            description="ลองเปลี่ยนตัวกรอง หรือยังไม่มีการไฮไลท์ในเอกสารใดเลย"
            :icon="PhHighlighter"
            size="lg"
          />
        </div>

        <!-- Curriculum groups -->
        <div v-else class="space-y-5">
          <div v-for="cg in listGroups" :key="cg.id"
            class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            <!-- Curriculum group header -->
            <button class="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              @click="toggleCurriculum(cg.id)">
              <PhCaretRight
                :class="['w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0',
                  (expandedCurricula.has(cg.id) || isFiltering) ? 'rotate-90' : '']" />
              <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <PhGraduationCap class="w-5 h-5 text-primary-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p v-if="cg.curriculum?.department?.name" class="text-xs font-semibold text-gray-500 truncate">
                  {{ cg.curriculum.department.name }}
                </p>
                <p class="text-sm font-bold text-gray-900 truncate leading-snug">
                  {{ cg.curriculum?.field_of_study ? `สาขาวิชา${cg.curriculum.field_of_study}` : (cg.curriculum?.degree_name || cg.name) }}
                </p>
                <p v-if="cg.curriculum?.field_of_study && cg.curriculum?.degree_name" class="text-xs text-gray-500 truncate mt-0.5">
                  {{ cg.curriculum.degree_name }}
                </p>
                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span v-if="cg.curriculum?.degree_level" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ DEGREE_LABEL[cg.curriculum.degree_level] || cg.curriculum.degree_level }}</span>
                  <span v-if="cg.curriculum?.curriculum_type" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ cg.curriculum.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}</span>
                  <span v-if="cg.curriculum?.curriculum_year" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">ปี {{ cg.curriculum.curriculum_year }}</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">
                    <PhFiles class="w-3 h-3 shrink-0" />{{ cg.files.length }} ไฟล์
                  </span>
                </div>
              </div>
              <span class="text-xs font-semibold text-gray-600 tabular-nums shrink-0 bg-gray-100 px-2.5 py-1 rounded-full">
                {{ cg.totalCount }} ไฮไลท์
              </span>
            </button>

            <!-- File rows -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <div v-if="expandedCurricula.has(cg.id) || isFiltering"
                class="border-t border-gray-100 divide-y divide-gray-100">
                <button v-for="file in cg.files" :key="`${file.document_type}_${file.document_id}`"
                  class="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors text-left group/row"
                  @click="openDetail(file)">

                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    file.document_type === 'tqf2' ? 'bg-indigo-100' : 'bg-sky-100']">
                    <PhFileText :class="['w-5 h-5', file.document_type === 'tqf2' ? 'text-indigo-500' : 'text-sky-500']" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate leading-snug">
                      {{ file.document_type === 'tqf2' ? ('ร่างหลักสูตร (มคอ.2)' + (file.academic_year ? ' ปี ' + file.academic_year : '')) : 'เอกสารประกอบ' }}
                    </p>
                    <div class="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span class="truncate min-w-0">{{ file.file_name }}</span>
                      <span class="shrink-0">อัปเดต {{ file.lastDate }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="flex items-center gap-1">
                      <div v-for="c in file.colorsUsed" :key="c"
                        :class="['w-2.5 h-2.5 rounded-full', colorDotClass(c)]"></div>
                    </div>
                    <span class="text-sm text-gray-500 tabular-nums w-16 text-right hidden sm:block">
                      <span class="font-medium text-gray-700">{{ file.annotations.length }}</span> ไฮไลท์
                    </span>
                  </div>

                </button>
              </div>
            </Transition>
          </div>
        </div>

      </template>

      <!-- ═══════════════════════════════════════
           DETAIL VIEW
      ═══════════════════════════════════════ -->
      <template v-else>

        <!-- Header — มือถือ 2 แถว (ย้อนกลับ+เปิดเอกสาร / ชื่อไฟล์เต็มกว้าง), desktop แถวเดียวตามเดิม -->
        <div class="flex flex-wrap items-start gap-3">
          <button @click="selectedFile = null"
            class="shrink-0 h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:scale-[0.95] transition-all mt-0.5">
            <PhCaretLeft class="w-4 h-4" />
            ย้อนกลับ
          </button>
          <div class="order-3 sm:order-none w-full sm:w-auto sm:flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                selectedFile.document_type === 'tqf2' ? 'bg-indigo-100' : 'bg-sky-100']">
                <PhFileText :class="['w-4 h-4', selectedFile.document_type === 'tqf2' ? 'text-indigo-500' : 'text-sky-500']" />
              </div>
              <h1 class="text-lg font-bold text-gray-900 leading-snug line-clamp-2 sm:line-clamp-1 min-w-0 flex-1 sm:flex-none sm:max-w-lg">{{ selectedFile.file_name }}</h1>
              <span :class="['text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0',
                selectedFile.document_type === 'tqf2' ? 'bg-indigo-100 text-indigo-600' : 'bg-sky-100 text-sky-600']">
                {{ selectedFile.document_type === 'tqf2' ? 'ร่างหลักสูตร (มคอ.2)' : 'เอกสาร' }}
              </span>
            </div>
            <!-- คุมจุดตัดบรรทัดเอง — ชื่อปริญญา/ปี เป็นคำเฉพาะ ห้ามหักกลางคำ -->
            <p v-if="selectedFile.curriculum" class="text-sm text-gray-500 mt-1 ml-11">
              <span v-if="selectedFile.curriculum.field_of_study">สาขา{{ selectedFile.curriculum.field_of_study }}</span>{{ ' ' }}<span v-if="selectedFile.curriculum.degree_name" class="whitespace-nowrap">{{ selectedFile.curriculum.degree_name }}</span>{{ ' ' }}<span v-if="selectedFile.curriculum.curriculum_year" class="whitespace-nowrap">ปี {{ selectedFile.curriculum.curriculum_year }}</span>
            </p>
            <p v-else class="text-sm text-gray-500 mt-1 ml-11">ไม่ระบุหลักสูตร</p>
          </div>
          <button @click="openDocument(selectedFile)"
            class="shrink-0 ml-auto sm:ml-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-[0.97] transition-all shadow-sm">
            <PhArrowSquareOut class="w-3.5 h-3.5" />
            เปิดเอกสาร
          </button>
        </div>

        <!-- Detail filters -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-2.5 flex-wrap">

          <div class="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button v-for="opt in detailStatusOptions" :key="opt.value"
              @click="detailFilterStatus = opt.value"
              :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap',
                detailFilterStatus === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
              {{ opt.label }}
              <span class="ml-1 text-xs opacity-50 tabular-nums">{{ opt.count }}</span>
            </button>
          </div>

          <div class="w-px h-5 bg-gray-200 shrink-0"></div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button @click="detailFilterColor = null"
              :class="['px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                detailFilterColor === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
              ทุกสี
            </button>
            <button v-for="clr in colorOptions" :key="clr.value"
              @click="detailFilterColor = detailFilterColor === clr.value ? null : clr.value"
              :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                detailFilterColor === clr.value ? clr.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
              <span :class="['w-2.5 h-2.5 rounded-full shrink-0', clr.bg]"></span>
              {{ clr.label }}
            </button>
          </div>

          <span class="ml-auto text-sm text-gray-500 tabular-nums shrink-0">{{ detailAnnotations.length }} รายการ</span>
        </div>

        <!-- Empty annotations -->
        <div v-if="!detailAnnotations.length"
          class="bg-white rounded-2xl border border-gray-200 shadow-sm py-14 flex flex-col items-center text-center px-4">
          <div class="w-12 h-12 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-3">
            <PhHighlighter class="w-6 h-6 text-gray-300" />
          </div>
          <p class="text-sm font-medium text-gray-700">ไม่พบไฮไลท์ที่ตรงกับเงื่อนไขที่เลือก</p>
          <p class="text-sm text-gray-500 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
        </div>

        <!-- Annotation cards -->
        <div v-else class="space-y-3">
          <div v-for="ann in detailAnnotations" :key="ann.id"
            class="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-4 min-w-0">

              <!-- ข้อความไฮไลท์ — พื้นสีตามสีไฮไลท์ (เหมือนปากกาเน้น) -->
              <p :class="['text-sm text-gray-800 leading-relaxed rounded-md px-2.5 py-1.5', colorHighlightClass(ann.color),
                expandedAnnotations.has(ann.id) ? '' : 'line-clamp-3']">
                "{{ ann.selected_text }}"
              </p>
              <button v-if="ann.selected_text.length > 120"
                @click="toggleExpandAnnotation(ann.id)"
                class="text-sm font-medium text-primary-600 hover:text-primary-700 mt-1 transition-colors">
                {{ expandedAnnotations.has(ann.id) ? 'แสดงน้อยลง' : 'ดูทั้งหมด' }}
              </button>

              <!-- Comment -->
              <div v-if="ann.comment"
                class="mt-2.5 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                <PhNote class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <p class="text-sm text-gray-600 leading-relaxed">{{ ann.comment }}</p>
              </div>

              <!-- Meta row -->
              <div class="flex items-center gap-2.5 mt-3 flex-wrap">
                <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0',
                  ann.is_resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700']">
                  <PhCheckCircle v-if="ann.is_resolved" class="w-3 h-3" />
                  <PhClock v-else class="w-3 h-3" />
                  {{ ann.is_resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข' }}
                </span>
                <span class="text-sm text-gray-600">{{ formatUserName(ann.author) || 'ผู้ใช้งาน' }}</span>
                <span class="text-sm text-gray-500">{{ formatDate(ann.created_at) }}</span>
                <button @click="jumpToAnnotation(selectedFile, ann)"
                  class="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.95] transition-all shrink-0">
                  <PhArrowSquareOut class="w-3.5 h-3.5" />
                  ไปยัง
                </button>
              </div>

          </div>
        </div>

      </template>

    </div>

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      v-if="previewState"
      :doc="previewState.doc"
      :api-path="previewState.apiPath"
      :document-type="previewState.documentType"
      :focus-annotation-id="previewState.annotationId"
      @close="previewState = null"
      @download="handlePreviewDownload"
      @update="fetchSummary"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { documentService } from '@/services/documentService';
import api from '@/services/api';
import {
  PhHighlighter, PhFileText, PhArrowRight, PhCaretLeft,
  PhArrowSquareOut, PhMagnifyingGlass, PhCaretRight,
  PhCheckCircle, PhClock, PhNote, PhGraduationCap, PhFiles,
} from '@phosphor-icons/vue';
import DocumentPreviewModal from '@/components/curriculum/DocumentPreviewModal.vue';
import { formatUserName } from '@/utils/user';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const loading             = ref(true);
const groups              = ref([]);
const selectedFile        = ref(null);
const expandedCurricula   = ref(new Set());
const expandedAnnotations = ref(new Set());
const previewState        = ref(null);

const search         = ref('');
const filterStatus   = ref('all');
const filterColor    = ref(null);
const filterFileType = ref(null);

const detailFilterStatus = ref('all');
const detailFilterColor  = ref(null);

const colorOptions = [
  { value: 'yellow', label: 'เหลือง', bg: 'bg-yellow-400', activeClass: 'bg-yellow-100 text-yellow-800' },
  { value: 'green',  label: 'เขียว',  bg: 'bg-green-400',  activeClass: 'bg-green-100 text-green-800'  },
  { value: 'blue',   label: 'น้ำเงิน', bg: 'bg-blue-400',  activeClass: 'bg-blue-100 text-blue-800'    },
  { value: 'pink',   label: 'ชมพู',   bg: 'bg-pink-400',   activeClass: 'bg-pink-100 text-pink-800'    },
];
const fileTypeOptions = [
  { value: 'document', label: 'เอกสาร', activeClass: 'bg-sky-100 text-sky-700'       },
  { value: 'tqf2',     label: 'ร่างหลักสูตร (มคอ.2)',  activeClass: 'bg-indigo-100 text-indigo-700' },
];
const DEGREE_LABEL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' };

const colorDotClass = (color) => ({
  yellow: 'bg-yellow-400', green: 'bg-green-400', blue: 'bg-blue-400', pink: 'bg-pink-400',
}[color] ?? 'bg-gray-300');
const colorHighlightClass = (color) => ({
  yellow: 'bg-yellow-100', green: 'bg-green-100', blue: 'bg-blue-100', pink: 'bg-pink-100',
}[color] ?? 'bg-gray-100');
const colorBarClass = (color) => ({
  yellow: 'bg-yellow-400', green: 'bg-green-400', blue: 'bg-blue-400', pink: 'bg-pink-400',
}[color] ?? 'bg-gray-200');

const totalCount  = computed(() => groups.value.reduce((s, g) => s + g.annotations.length, 0));
const activeCount = computed(() => groups.value.reduce((s, g) => s + g.annotations.filter(a => !a.is_resolved).length, 0));

const statusOptions = computed(() => {
  const all    = groups.value.reduce((s, g) => s + g.annotations.length, 0);
  const active = groups.value.reduce((s, g) => s + g.annotations.filter(a => !a.is_resolved).length, 0);
  return [
    { value: 'all',      label: 'ทั้งหมด',    count: all          },
    { value: 'active',   label: 'ยังไม่แก้ไข', count: active       },
    { value: 'resolved', label: 'แก้ไขแล้ว',  count: all - active },
  ];
});

const listGroups = computed(() => {
  const q = search.value.trim().toLowerCase();
  const filtered = groups.value
    .filter(g => !filterFileType.value || g.document_type === filterFileType.value)
    .map(g => {
      const cName = formatCurriculumName(g.curriculum).toLowerCase();
      const label = (g.document_type === 'tqf2'
        ? 'ร่างหลักสูตร (มคอ.2) ' + (g.academic_year || '')
        : 'เอกสารประกอบ').toLowerCase();
      return {
        ...g,
        annotations: g.annotations.filter(a => {
          if (filterStatus.value === 'active'   && a.is_resolved)  return false;
          if (filterStatus.value === 'resolved' && !a.is_resolved) return false;
          if (filterColor.value && a.color !== filterColor.value)  return false;
          if (q && !g.file_name.toLowerCase().includes(q) &&
              !a.selected_text.toLowerCase().includes(q) &&
              !cName.includes(q) && !label.includes(q))            return false;
          return true;
        }),
      };
    })
    .filter(g => g.annotations.length > 0)
    .map(g => ({
      ...g,
      colorsUsed: [...new Set(g.annotations.map(a => a.color))].slice(0, 4),
      lastDate: formatDate(g.annotations[0]?.created_at),
    }));

  const map = new Map();
  for (const g of filtered) {
    const cId   = g.curriculum?.id ?? 0;
    const cName = formatCurriculumName(g.curriculum);
    if (!map.has(cId)) map.set(cId, { id: cId, name: cName, curriculum: g.curriculum, files: [], totalCount: 0 });
    const entry = map.get(cId);
    entry.files.push(g);
    entry.totalCount += g.annotations.length;
  }
  return [...map.values()];
});

// กำลังค้นหา/กรองอยู่ไหม → ถ้าใช่ ให้กางทุกกลุ่มเพื่อโชว์ผลลัพธ์
const isFiltering = computed(() =>
  !!search.value.trim() || filterStatus.value !== 'all' || !!filterColor.value || !!filterFileType.value
);

const detailStatusOptions = computed(() => {
  if (!selectedFile.value) return [];
  const anns   = selectedFile.value.annotations;
  const active = anns.filter(a => !a.is_resolved).length;
  return [
    { value: 'all',      label: 'ทั้งหมด',    count: anns.length         },
    { value: 'active',   label: 'ยังไม่แก้ไข', count: active              },
    { value: 'resolved', label: 'แก้ไขแล้ว',  count: anns.length - active },
  ];
});

const detailAnnotations = computed(() => {
  if (!selectedFile.value) return [];
  return selectedFile.value.annotations.filter(a => {
    if (detailFilterStatus.value === 'active'   && a.is_resolved)  return false;
    if (detailFilterStatus.value === 'resolved' && !a.is_resolved) return false;
    if (detailFilterColor.value && a.color !== detailFilterColor.value) return false;
    return true;
  });
});

const toggleCurriculum = (id) => {
  const s = new Set(expandedCurricula.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedCurricula.value = s;
};

const toggleExpandAnnotation = (id) => {
  const s = new Set(expandedAnnotations.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedAnnotations.value = s;
};

const openDetail = (file) => {
  selectedFile.value = file;
  detailFilterStatus.value  = 'all';
  detailFilterColor.value   = null;
  expandedAnnotations.value = new Set();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openDocument = (file) => {
  const apiPath = file.document_type === 'tqf2'
    ? `/curricula/tqf2/${file.document_id}/preview`
    : `/curricula/documents/${file.document_id}/preview`;
  previewState.value = {
    doc: { id: file.document_id, original_name: file.file_name, file_type: file.file_type },
    apiPath,
    documentType: file.document_type,
    annotationId: null,
  };
};

const handlePreviewDownload = async () => {
  if (!previewState.value) return;
  const { doc, apiPath } = previewState.value;
  try {
    const response = await api.get(apiPath.replace('/preview', '/download'), { responseType: 'blob' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([response.data]));
    link.download = doc.original_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch { /* silent */ }
};

const jumpToAnnotation = (file, ann) => {
  const apiPath = file.document_type === 'tqf2'
    ? `/curricula/tqf2/${file.document_id}/preview`
    : `/curricula/documents/${file.document_id}/preview`;
  previewState.value = {
    doc: { id: file.document_id, original_name: file.file_name, file_type: file.file_type },
    apiPath,
    documentType: file.document_type,
    annotationId: ann.id,
  };
};

const formatCurriculumName = (c) => {
  if (!c) return 'ไม่ระบุหลักสูตร';
  return [c.field_of_study && `สาขา${c.field_of_study}`, c.degree_name, c.curriculum_year && `ปี ${c.curriculum_year}`]
    .filter(Boolean).join(' ');
};

const formatDate = (dateStr) => dateStr ? dayjs(dateStr).format('DD/MM/YY') : '';

const fetchSummary = async () => {
  try {
    const { data } = await documentService.getAnnotationsSummary();
    groups.value = data.data ?? [];
  } catch { /* silent */ }
};

onMounted(async () => {
  try {
    await fetchSummary();
    if (groups.value.length) {
      const firstId = groups.value[0].curriculum?.id ?? 0;
      expandedCurricula.value = new Set([firstId]);
    }
  } finally {
    loading.value = false;
  }
});
</script>

