<template>
  <div class="max-w-3xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button type="button" @click="router.back()" aria-label="ย้อนกลับ"
        class="cursor-pointer shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <PhCaretLeft class="w-5 h-5" />
      </button>
      <div class="min-w-0">
        <h2 class="text-2xl font-semibold text-gray-900">{{ isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่' }}</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ isEdit ? 'แก้ไขข้อมูลแบบฟอร์ม เอกสาร หรือลิงก์' : 'เพิ่มแบบฟอร์ม เอกสาร หรือลิงก์สำหรับการบริหารหลักสูตร' }}
        </p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Type selector card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div class="border-b border-gray-100 px-6 pt-5 pb-4 flex items-center justify-between gap-3">
          <h3 class="text-base font-bold text-gray-900">ประเภทรายการ</h3>
          <!-- โหมดแก้ไข: ประเภทเปลี่ยนไม่ได้ -->
          <span v-if="isEdit" class="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">เปลี่ยนประเภทไม่ได้หลังสร้าง</span>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" :disabled="isEdit" @click="form.type = 'file'"
              :class="[
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 ease-ios text-left active:scale-[0.98]',
                form.type === 'file'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                isEdit && form.type !== 'file' ? 'opacity-40 cursor-not-allowed' : '',
                isEdit ? 'cursor-default' : 'cursor-pointer',
              ]">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                form.type === 'file' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400']">
                <PhUploadSimple class="w-5 h-5" />
              </div>
              <div>
                <p :class="['text-sm font-bold', form.type === 'file' ? 'text-primary-800' : 'text-gray-700']">ไฟล์เอกสาร</p>
                <p class="text-xs text-gray-500 mt-0.5">PDF, DOCX, XLSX, PPTX</p>
              </div>
            </button>

            <button type="button" :disabled="isEdit" @click="form.type = 'link'"
              :class="[
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 ease-ios text-left active:scale-[0.98]',
                form.type === 'link'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                isEdit && form.type !== 'link' ? 'opacity-40 cursor-not-allowed' : '',
                isEdit ? 'cursor-default' : 'cursor-pointer',
              ]">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                form.type === 'link' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400']">
                <PhLink class="w-5 h-5" />
              </div>
              <div>
                <p :class="['text-sm font-bold', form.type === 'link' ? 'text-primary-800' : 'text-gray-700']">ลิงก์ภายนอก</p>
                <p class="text-xs text-gray-500 mt-0.5">URL เว็บไซต์หรือระบบอื่น</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Details card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div class="border-b border-gray-100 px-6 pt-5 pb-4">
          <h3 class="text-base font-bold text-gray-900">รายละเอียด</h3>
        </div>
        <div class="p-6 space-y-5">

          <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
            <PhWarning class="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p class="text-sm font-medium text-red-800">{{ error }}</p>
          </div>

          <div>
            <label for="res-title" class="block text-sm font-semibold text-gray-700 mb-1.5">
              ชื่อรายการ <span class="text-red-500">*</span>
            </label>
            <input id="res-title" v-model="form.title" type="text" placeholder="เช่น แบบฟอร์ม ร่างหลักสูตร (มคอ.2)"
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
          </div>

          <!-- File upload zone -->
          <div v-if="form.type === 'file'">
            <label for="res-file" class="block text-sm font-semibold text-gray-700 mb-1.5">
              ไฟล์ <span v-if="!isEdit" class="text-red-500">*</span>
            </label>
            <!-- โหมดแก้ไข: บอกไฟล์เดิม + แนบใหม่เฉพาะเมื่ออยากเปลี่ยน -->
            <p v-if="isEdit && currentFileName" class="text-xs text-gray-400 mb-2">
              ไฟล์ปัจจุบัน: <span class="font-medium text-gray-600">{{ currentFileName }}</span>
              <span class="text-gray-400"> — แนบไฟล์ใหม่เพื่อแทนที่ (ไม่บังคับ)</span>
            </p>
            <div class="relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150"
              :class="selectedFile ? 'border-primary-300 bg-primary-50/30' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/20'">
              <div class="space-y-2">
                <PhUploadSimple class="mx-auto h-10 w-10" :class="selectedFile ? 'text-primary-500' : 'text-gray-400'" />
                <p class="text-sm font-bold" :class="selectedFile ? 'text-primary-700' : 'text-primary-600'">
                  {{ selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์' }}
                </p>
                <p v-if="!selectedFile" class="text-xs text-gray-400">PDF, DOCX, XLSX, PPTX, ZIP</p>
                <p v-else class="text-xs text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <input id="res-file" type="file" @change="onFileChange"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.zip"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>

          <!-- URL input -->
          <div v-if="form.type === 'link'">
            <label for="res-url" class="block text-sm font-semibold text-gray-700 mb-1.5">
              URL <span class="text-red-500">*</span>
            </label>
            <input id="res-url" v-model="form.link_url" type="url" placeholder="https://..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
          </div>

          <!-- หมวดหมู่ -->
          <div>
            <label for="res-category" class="block text-sm font-semibold text-gray-700 mb-1.5">หมวดหมู่</label>
            <div class="relative">
              <div v-if="!showCustomCategory">
                <button id="res-category" type="button" @click="dropdownOpen = !dropdownOpen"
                  class="cursor-pointer flex items-center justify-between w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all bg-white relative z-[11]"
                  :class="!form.category ? 'text-gray-400' : 'text-gray-900'">
                  <span>{{ form.category || 'เลือกหมวดหมู่ หรือเพิ่มใหม่' }}</span>
                  <PhCaretDown class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': dropdownOpen }" />
                </button>
                
                <!-- Overlay for closing dropdown -->
                <div v-if="dropdownOpen" class="fixed inset-0 z-10" @click="dropdownOpen = false"></div>

                <Transition
                  enter-active-class="transition duration-150 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0">
                  <div v-if="dropdownOpen"
                    class="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div class="max-h-60 overflow-y-auto py-1.5">
                      <button type="button" v-for="cat in allCategories" :key="cat"
                        @click="selectCategory(cat)"
                        class="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        {{ cat }}
                      </button>
                      <div class="h-px bg-gray-100 my-1"></div>
                      <button type="button" @click="selectCategory('__CUSTOM__')"
                        class="cursor-pointer w-full text-left px-4 py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors">
                        + เพิ่มหมวดหมู่ใหม่
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
              
              <div v-else class="flex gap-2">
                <input v-model="form.category" type="text" placeholder="ระบุชื่อหมวดหมู่ใหม่"
                  class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all" />
                <button type="button" @click="cancelCustomCategory"
                  class="cursor-pointer shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>

          <div>
            <label for="res-desc" class="block text-sm font-semibold text-gray-700 mb-1.5">
              คำอธิบาย <span class="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea id="res-desc" v-model="form.description" rows="3" placeholder="อธิบายเพิ่มเติม..."
              class="block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all resize-none"></textarea>
          </div>

        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="button" @click="router.back()"
          class="cursor-pointer px-6 py-2.5 text-sm font-bold text-red-500 bg-white border-2 border-red-400 rounded-lg hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios shadow-2xs">
          ยกเลิก
        </button>
        <button type="submit" :disabled="loading"
          class="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all duration-150 ease-ios disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
          {{ loading ? 'กำลังบันทึก…' : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล') }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { resourceService } from '@/services/resourceService';
import { RELATED_SYSTEMS_CATEGORY } from '@/constants/resources';
import { PhCaretLeft, PhWarning, PhUploadSimple, PhLink, PhCaretDown } from '@phosphor-icons/vue';

const router = useRouter();
const route  = useRoute();

// โหมดแก้ไข — มี :id ใน route → ใช้ฟอร์มเดียวกันทั้งสร้างและแก้
const resourceId = route.params.id;
const isEdit     = !!resourceId;

const form             = ref({ title: '', type: 'file', link_url: '', category: '', description: '' });

// โหมดสร้าง: รับ query เปิดฟอร์มมาเป็น "ลิงก์" ไว้ให้เลย
if (!isEdit && route.query.type === 'link') {
  form.value.type = 'link';
}
const selectedFile     = ref(null);
const currentFileUrl   = ref('');   // ไฟล์เดิม (โหมดแก้ไข) — ไว้โชว์ว่าถ้าไม่แนบใหม่จะใช้ไฟล์นี้
const loading          = ref(false);
const error            = ref('');
const existingCategories = ref([]);
const showCustomCategory = ref(false);

const currentFileName = computed(() => currentFileUrl.value.split('/').pop() || '');

const defaultCategories = ['มคอ.', 'ประกันคุณภาพ', 'แบบฟอร์มทั่วไป', 'คู่มือ', 'อื่นๆ'];
const allCategories = computed(() => {
  const merged = [...new Set([...defaultCategories, ...existingCategories.value])];
  return merged.filter(c => c !== '__CUSTOM__');
});

const dropdownOpen = ref(false);

const selectCategory = (cat) => {
  dropdownOpen.value = false;
  if (cat === '__CUSTOM__') {
    showCustomCategory.value = true;
    form.value.category = '';
  } else {
    form.value.category = cat;
  }
};

const cancelCustomCategory = () => {
  showCustomCategory.value = false;
  form.value.category = '';
};

onMounted(async () => {
  try {
    const { data } = await resourceService.getAll();
    const all = data.data || [];
    // กรอง "ระบบที่เกี่ยวข้อง" ออก — หมวดนี้คุมด้วย toggle ไม่ให้เลือกจาก dropdown
    existingCategories.value = [...new Set(all.map(r => r.category).filter(Boolean))]
      .filter(c => c !== RELATED_SYSTEMS_CATEGORY);

    // โหมดแก้ไข → หา resource มา prefill
    if (isEdit) {
      const r = all.find(x => String(x.id) === String(resourceId));
      if (!r) { error.value = 'ไม่พบรายการที่ต้องการแก้ไข'; return; }
      form.value = {
        title:       r.title || '',
        type:        r.type || 'file',
        link_url:    r.link_url || '',
        category:    r.category || '',
        description: r.description || '',
      };
      currentFileUrl.value  = r.file_url || '';
    }
  } catch {
    if (isEdit) error.value = 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  }
});

const onFileChange = (e) => { selectedFile.value = e.target.files[0] || null; };

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleSubmit = async () => {
  error.value = '';
  if (!form.value.title.trim())                                          { error.value = 'กรุณาระบุชื่อรายการ'; return; }
  // โหมดแก้ไข: ไฟล์ไม่บังคับ (ไม่แนบใหม่ = ใช้ไฟล์เดิม)
  if (form.value.type === 'file' && !isEdit && !selectedFile.value)      { error.value = 'กรุณาเลือกไฟล์'; return; }
  if (form.value.type === 'link' && !form.value.link_url.trim())         { error.value = 'กรุณาระบุ URL'; return; }

  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('title', form.value.title);
    if (!isEdit) fd.append('type', form.value.type);   // ประเภทเปลี่ยนไม่ได้หลังสร้าง
    if (form.value.type === 'file' && selectedFile.value)  fd.append('file', selectedFile.value);
    if (form.value.type === 'link')                        fd.append('link_url', form.value.link_url);

    const category = form.value.category;

    // แก้ไข: ส่งทุก field เสมอ (รวมค่าว่าง) เพื่อให้ "ล้างหมวด/คำอธิบาย" ได้
    // สร้าง: ส่งเฉพาะที่มีค่า
    if (isEdit) {
      fd.append('category', category || '');
      fd.append('description', form.value.description || '');
      await resourceService.update(resourceId, fd);
    } else {
      if (category)                 fd.append('category', category);
      if (form.value.description)   fd.append('description', form.value.description);
      await resourceService.create(fd);
    }
    router.push('/resources');
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
};
</script>

