<template>
  <div class="max-w-3xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button type="button" @click="goBack" aria-label="ย้อนกลับ"
        class="cursor-pointer shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="min-w-0">
        <h2 class="text-2xl font-semibold text-gray-900">
          {{ isEdit ? 'แก้ไขประกาศ' : 'สร้างประกาศแจ้งเวียน' }}
        </h2>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ isEdit ? 'แก้ไขข้อมูลประกาศที่มีอยู่' : 'สร้างประกาศเพื่อให้ผู้ใช้งานทราบข้อมูล' }}
        </p>
      </div>
    </div>

    <!-- Page loading skeleton -->
    <div v-if="pageLoading" class="bg-white rounded-2xl border border-gray-200/80 h-64 animate-pulse"></div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Main info card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div class="border-b border-gray-100 px-6 pt-5 pb-4">
          <h3 class="text-base font-bold text-gray-900">ข้อมูลประกาศ</h3>
        </div>
        <div class="p-6 space-y-5">

          <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
            <PhWarning class="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p class="text-sm font-medium text-red-800">{{ error }}</p>
          </div>

          <div>
            <label for="ann-title" class="block text-sm font-semibold text-gray-700 mb-1.5">
              หัวข้อประกาศ <span class="text-red-500">*</span>
            </label>
            <input id="ann-title" v-model="form.title" type="text" placeholder="ระบุหัวข้อประกาศ..."
              autocomplete="off" autocapitalize="off" spellcheck="false"
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
          </div>

          <div>
            <label for="ann-content" class="block text-sm font-semibold text-gray-700 mb-1.5">
              เนื้อหา <span class="text-red-500">*</span>
            </label>
            <textarea id="ann-content" v-model="form.content" rows="7" placeholder="รายละเอียดประกาศ..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all resize-none"></textarea>
          </div>

          <div>
            <label for="ann-link" class="block text-sm font-semibold text-gray-700 mb-1.5">
              ลิงก์ที่เกี่ยวข้อง <span class="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <input id="ann-link" v-model="form.link_url" type="url" placeholder="https://..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
          </div>

        </div>
      </div>

      <!-- Image card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div class="border-b border-gray-100 px-6 pt-5 pb-4">
          <h3 class="text-base font-bold text-gray-900">
            รูปภาพประกอบ
            <span class="text-sm font-normal text-gray-400 ml-1">(ไม่บังคับ)</span>
          </h3>
        </div>
        <div class="p-6">

          <!-- Preview: file selected or existing image -->
          <div v-if="selectedFile || form.current_image_url"
            class="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img :src="selectedFile ? previewUrl : form.current_image_url"
              class="w-full max-h-64 object-cover block" />
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2.5"
              style="background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)">
              <p class="text-xs font-medium text-white/85 truncate mr-2">
                {{ selectedFile ? selectedFile.name : 'รูปภาพปัจจุบัน' }}
              </p>
              <div class="flex items-center gap-1.5 shrink-0">
                <label class="relative inline-flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/35 text-white px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 ease-ios">
                  <PhPencil class="w-3 h-3 shrink-0" />
                  เปลี่ยน
                  <input :key="fileInputKey" type="file" accept="image/*" @change="onFileChange"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </label>
                <button type="button" @click="clearImage"
                  class="inline-flex items-center gap-1 text-xs font-bold bg-red-500/75 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg active:scale-[0.95] transition-all duration-150 ease-ios">
                  <PhTrash class="w-3 h-3 shrink-0" />
                  ลบ
                </button>
              </div>
            </div>
          </div>

          <!-- Upload zone -->
          <div v-else class="relative group cursor-pointer">
            <div class="rounded-xl border-2 border-dashed border-gray-300 px-6 py-14 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400">
              <PhImage class="mx-auto h-10 w-10 text-gray-400 group-hover:text-primary-500 transition-colors" />
              <p class="mt-3 text-sm font-semibold text-primary-600 group-hover:text-primary-500">คลิกเพื่อเลือกรูปภาพ</p>
              <p class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
            </div>
            <input :key="fileInputKey" type="file" accept="image/*" @change="onFileChange"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>

        </div>
      </div>

      <!-- Attachments card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div class="border-b border-gray-100 px-6 pt-5 pb-4 flex items-center justify-between gap-3">
          <h3 class="text-base font-bold text-gray-900">
            เอกสารแนบ
            <span class="text-sm font-normal text-gray-400 ml-1">(ไม่บังคับ)</span>
          </h3>
          <span v-if="totalAttachments > 0" class="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg shrink-0">
            {{ totalAttachments }} / {{ MAX_ATTACHMENTS }} ไฟล์
          </span>
        </div>
        <div class="p-6 space-y-3">

          <!-- File list: existing + newly selected -->
          <ul v-if="totalAttachments > 0" class="space-y-2">
            <li v-for="att in visibleAttachments" :key="`old-${att.id}`"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50/60">
              <FileIcon :file-type="att.file_type" size="sm" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ att.original_name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatSize(att.file_size) }}</p>
              </div>
              <button type="button" @click="removeExisting(att.id)" :aria-label="`ลบไฟล์แนบ ${att.original_name}`"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                <PhX class="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
            <li v-for="(file, i) in newFiles" :key="`new-${i}-${file.name}`"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-primary-200 bg-primary-50/60">
              <FileIcon :file-type="fileExt(file.name)" size="sm" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-primary-800 truncate">{{ file.name }}</p>
                <p class="text-xs text-primary-500 mt-0.5">{{ formatSize(file.size) }} · รอเผยแพร่</p>
              </div>
              <button type="button" @click="removeNew(i)" :aria-label="`เอาไฟล์ ${file.name} ออก`"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-primary-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                <PhX class="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <!-- Add dropzone -->
          <div v-if="totalAttachments < MAX_ATTACHMENTS" class="relative group cursor-pointer">
            <div class="rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400">
              <PhPaperclip class="mx-auto h-8 w-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
              <p class="mt-2 text-sm font-semibold text-primary-600 group-hover:text-primary-500">คลิกเพื่อเพิ่มไฟล์แนบ</p>
              <p class="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, PPTX, ZIP — เลือกได้หลายไฟล์</p>
            </div>
            <input :key="attachInputKey" type="file" multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.zip" @change="onAttachmentsChange"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="เพิ่มไฟล์แนบ" />
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="button" @click="goBack"
          class="cursor-pointer px-5 py-3 text-sm font-bold text-red-500 bg-white border-2 border-red-400 rounded-xl hover:bg-red-50 hover:border-red-500 shadow-2xs active:scale-[0.97] transition-all duration-150 ease-ios">
          ยกเลิก
        </button>
        <button type="submit" :disabled="loading"
          class="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white border border-primary-800 shadow-sm hover:bg-primary-800 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
          {{ loading
            ? (isEdit ? 'กำลังบันทึก…' : 'กำลังเผยแพร่…')
            : (isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'เผยแพร่ประกาศ') }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { announcementService } from '@/services/announcementService';
import FileIcon from '@/components/common/FileIcon.vue';
import { PhCaretLeft, PhWarning, PhImage, PhPencil, PhTrash, PhPaperclip, PhX } from '@phosphor-icons/vue';


const router = useRouter();
const route  = useRoute();

const isEdit = computed(() => !!route.params.id);

// กลับหน้ารายการประกาศเสมอ (ไม่พึ่ง history เพื่อไม่ให้เด้งไปหน้าอื่น)
const goBack = () => router.push('/announcements');

const form         = ref({ title: '', content: '', link_url: '', current_image_url: null });
const selectedFile = ref(null);
const previewUrl   = ref(null);
const fileInputKey = ref(0);
const loading      = ref(false);
const pageLoading  = ref(false);
const error        = ref('');

// ── ไฟล์แนบ ──────────────────────────────────────────────────────────────────
const MAX_ATTACHMENTS    = 10;
const existingAttachments = ref([]);   // ไฟล์เดิม (โหมดแก้ไข) [{ id, original_name, file_type, file_size }]
const removedIds          = ref([]);   // id ของไฟล์เดิมที่กดเอาออก
const newFiles            = ref([]);   // ไฟล์ใหม่ที่เพิ่งเลือก (File objects)
const attachInputKey      = ref(0);

const visibleAttachments = computed(() =>
  existingAttachments.value.filter(a => !removedIds.value.includes(a.id))
);
const totalAttachments = computed(() => visibleAttachments.value.length + newFiles.value.length);

const fileExt = (name) => (name?.split('.').pop() || '').toLowerCase();
const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

onMounted(async () => {
  if (!isEdit.value) return;
  pageLoading.value = true;
  try {
    const stateData = history.state?.announcement;
    if (stateData) {
      form.value = {
        title:             stateData.title || '',
        content:           stateData.content || '',
        link_url:          stateData.link_url || '',
        current_image_url: stateData.image_url || null,
      };
      existingAttachments.value = stateData.attachments || [];
    } else {
      const { data } = await announcementService.getAll();
      const found = (data.data || []).find(a => String(a.id) === String(route.params.id));
      if (found) {
        form.value = {
          title:             found.title || '',
          content:           found.content || '',
          link_url:          found.link_url || '',
          current_image_url: found.image_url || null,
        };
        existingAttachments.value = found.attachments || [];
      }
    }
  } finally {
    pageLoading.value = false;
  }
});

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  selectedFile.value = file;
  previewUrl.value   = URL.createObjectURL(file);
};

const clearImage = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  selectedFile.value = null;
  form.value.current_image_url = null;
  fileInputKey.value++;
};

const onAttachmentsChange = (e) => {
  const picked = Array.from(e.target.files || []);
  const room = MAX_ATTACHMENTS - totalAttachments.value;
  if (picked.length > room) {
    error.value = `แนบไฟล์ได้สูงสุด ${MAX_ATTACHMENTS} ไฟล์`;
    newFiles.value = [...newFiles.value, ...picked.slice(0, room)];
  } else {
    error.value = '';
    newFiles.value = [...newFiles.value, ...picked];
  }
  attachInputKey.value++; // reset input ให้เลือกไฟล์ชื่อเดิมซ้ำได้
};

const removeExisting = (id) => { removedIds.value = [...removedIds.value, id]; };
const removeNew = (i) => { newFiles.value = newFiles.value.filter((_, idx) => idx !== i); };

const handleSubmit = async () => {
  error.value = '';
  if (!form.value.title.trim() || !form.value.content.trim()) {
    error.value = 'กรุณากรอกหัวข้อและเนื้อหาประกาศ';
    return;
  }
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('title',   form.value.title);
    fd.append('content', form.value.content);
    if (form.value.link_url) fd.append('link_url', form.value.link_url);
    if (selectedFile.value)  fd.append('image', selectedFile.value);
    newFiles.value.forEach(f => fd.append('attachments', f));
    if (removedIds.value.length) fd.append('removed_attachment_ids', JSON.stringify(removedIds.value));

    if (isEdit.value) {
      await announcementService.update(route.params.id, fd);
    } else {
      await announcementService.create(fd);
    }
    router.push('/announcements');
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกประกาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
};
</script>
