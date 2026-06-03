<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-500/75 backdrop-blur-sm" @click="$emit('close')"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh] border border-gray-100 overflow-hidden">

        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start shrink-0">
          <div>
            <h3 class="text-base font-semibold text-gray-900">
              {{ initialData ? 'แก้ไขประกาศ' : 'สร้างประกาศแจ้งเวียน' }}
            </h3>
            <p v-if="!initialData" class="mt-0.5 text-sm text-gray-500">สร้างประกาศเพื่อให้ผู้ใช้งานทราบข้อมูล</p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 mt-0.5 transition-all duration-150 ease-ios">
            <PhX class="h-5 w-5" />
          </button>
        </div>

        <!-- Form body -->
        <div class="overflow-y-auto p-6 space-y-5">
          <div v-if="error" class="rounded-lg bg-red-50 p-4 flex gap-3">
            <PhWarning class="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p class="text-sm font-medium text-red-800">{{ error }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">หัวข้อประกาศ <span class="text-red-500">*</span></label>
            <input v-model="form.title" type="text" placeholder="ระบุหัวข้อประกาศ..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 text-sm transition-all" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">เนื้อหา <span class="text-red-500">*</span></label>
            <textarea v-model="form.content" rows="4" placeholder="รายละเอียดประกาศ..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 text-sm transition-all resize-none"></textarea>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              ลิงก์ที่เกี่ยวข้อง <span class="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <input v-model="form.link_url" type="url" placeholder="https://..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 text-sm transition-all" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              รูปภาพประกอบ <span class="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>

            <!-- Preview: มีรูปอยู่แล้ว (ไฟล์ใหม่ หรือรูปเดิมใน edit mode) -->
            <div v-if="selectedFile || form.current_image_url"
              class="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img
                :src="selectedFile ? previewUrl : form.current_image_url"
                class="w-full max-h-52 object-cover block"
              />
              <!-- Overlay action bar -->
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

            <!-- Upload zone: ยังไม่มีรูป -->
            <div v-else class="relative group cursor-pointer">
              <div class="rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                <PhImage class="mx-auto h-8 w-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                <p class="mt-2 text-sm font-semibold text-primary-600 group-hover:text-primary-500">คลิกเพื่อเลือกรูปภาพ</p>
                <p class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
              </div>
              <input :key="fileInputKey" type="file" accept="image/*" @change="onFileChange"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button @click="$emit('close')"
            class="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-150 ease-ios">
            ยกเลิก
          </button>
          <button @click="handleSubmit" :disabled="loading"
            class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50">
            <span v-if="loading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
            {{ loading
              ? (initialData ? 'กำลังบันทึก…' : 'กำลังส่งประกาศ…')
              : (initialData ? 'บันทึกการเปลี่ยนแปลง' : 'เผยแพร่ประกาศ') }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { PhX, PhWarning, PhImage, PhPencil, PhTrash } from '@phosphor-icons/vue';

const props = defineProps({
  modelValue: Boolean,
  initialData: { type: Object, default: null },
  loading:     { type: Boolean, default: false },
  error:       { type: String,  default: '' },
});

const emit = defineEmits(['close', 'submit']);

const form         = ref({ title: '', content: '', link_url: '', current_image_url: null });
const selectedFile = ref(null);
const previewUrl   = ref(null);
const fileInputKey = ref(0);

watch(() => props.modelValue, (open) => {
  if (!open) return;
  if (props.initialData) {
    form.value = {
      title:             props.initialData.title,
      content:           props.initialData.content,
      link_url:          props.initialData.link_url || '',
      current_image_url: props.initialData.image_url || null,
    };
  } else {
    form.value = { title: '', content: '', link_url: '', current_image_url: null };
  }
  selectedFile.value = null;
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
});

watch(selectedFile, (file) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = file ? URL.createObjectURL(file) : null;
});

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) selectedFile.value = file;
};

const clearImage = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  selectedFile.value = null;
  form.value.current_image_url = null;
  fileInputKey.value++;
};;

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleSubmit = () => emit('submit', { ...form.value }, selectedFile.value);
</script>
