<template>
  <div class="max-w-4xl mx-auto space-y-5">

    <!-- Header (PageHeader component) -->
    <PageHeader
      title="ประกาศแจ้งเตือน">
      <template v-if="authStore.isAdmin" #actions>
        <Button :icon-left="PhMegaphone" @click="router.push('/announcements/create')">
          สร้างประกาศ
        </Button>
      </template>
    </PageHeader>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i"
        class="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 animate-pulse"
        :style="{ opacity: Math.max(0.2, 1 - (i - 1) * 0.3) }">
        <div class="flex gap-3 mb-3">
          <div class="h-3 bg-gray-200 rounded w-24"></div>
          <div class="h-3 bg-gray-100 rounded w-20"></div>
        </div>
        <div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="space-y-2">
          <div class="h-3 bg-gray-100 rounded w-full"></div>
          <div class="h-3 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!announcements.length" class="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
      <EmptyState
        title="ยังไม่มีประกาศในขณะนี้"
        description="ประกาศใหม่จะแสดงที่นี่เมื่อมีการเผยแพร่"
        :icon="PhMegaphone"
        size="lg"
        :action-label="authStore.isAdmin ? 'สร้างประกาศแรก' : ''"
        :action-icon="PhMegaphone"
        @action="router.push('/announcements/create')"
      />
    </div>

    <!-- Announcement list -->
    <div v-else class="space-y-4">
      <div v-for="a in announcements" :key="a.id"
        class="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:border-gray-300 hover:shadow-md hover:shadow-gray-100 transition-all duration-150 ease-ios">
        <div class="flex">

          <!-- Image (left side, if present) -->
          <div v-if="a.image_url" class="w-44 shrink-0 hidden sm:block self-stretch">
            <img :src="a.image_url" :alt="`รูปประกอบประกาศ: ${a.title}`" class="w-full h-full object-cover" loading="lazy" />
          </div>

          <!-- Content -->
          <div class="flex-1 p-5 min-w-0">
            <!-- Meta row -->
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-2 flex-wrap">
                <UserAvatar :name="formatUserName(a.creator)" size="xs" class="shrink-0" />
                <span class="text-xs font-semibold text-gray-700">{{ formatUserName(a.creator) }}</span>
                <span class="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{{ formatDate(a.createdAt) }}</span>
              </div>
              <!-- Admin actions -->
              <div v-if="authStore.isAdmin" class="flex items-center gap-0.5 shrink-0">
                <button @click="router.push({ name: 'AnnouncementEdit', params: { id: a.id }, state: { announcement: a } })"
                  class="p-2.5 cursor-pointer text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg active:scale-[0.88] transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  :aria-label="`แก้ไขประกาศ: ${a.title}`">
                  <PhPencil class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button @click="handleDelete(a.id)"
                  class="p-2.5 cursor-pointer text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-[0.88] transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  :aria-label="`ลบประกาศ: ${a.title}`">
                  <PhTrash class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Image (top, mobile only) -->
            <img v-if="a.image_url" :src="a.image_url" :alt="`รูปประกอบประกาศ: ${a.title}`"
              class="w-full aspect-video object-cover rounded-lg mb-3 sm:hidden" loading="lazy" />

            <h3 class="text-base font-bold text-gray-900 leading-snug mb-2">{{ a.title }}</h3>
            <div class="relative">
              <p :class="[
                'text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words transition-all',
                expanded.has(a.id) ? '' : 'line-clamp-4'
              ]">{{ a.content }}</p>
              <button v-if="isLong(a.content) && !expanded.has(a.id)"
                @click="expanded.add(a.id); expanded = new Set(expanded)"
                class="mt-1 cursor-pointer text-xs font-semibold text-primary-600 hover:text-primary-700 transition-all duration-150 ease-ios">
                อ่านเพิ่มเติม
              </button>
              <button v-else-if="isLong(a.content) && expanded.has(a.id)"
                @click="expanded.delete(a.id); expanded = new Set(expanded)"
                class="mt-1 cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all duration-150 ease-ios">
                แสดงน้อยลง
              </button>
            </div>

            <div v-if="a.link_url" class="mt-4">
              <a :href="a.link_url" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors duration-150">
                <PhLink class="w-3.5 h-3.5 shrink-0" />
                เปิดลิงก์ที่เกี่ยวข้อง
              </a>
            </div>

            <!-- Attachments -->
            <div v-if="a.attachments?.length" class="mt-4 pt-4 border-t border-gray-100">
              <p class="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2">
                <PhPaperclip class="w-3.5 h-3.5 shrink-0" />
                เอกสารแนบ ({{ a.attachments.length }})
              </p>
              <div class="flex flex-col gap-2 sm:grid sm:grid-cols-2">
                <a v-for="att in a.attachments" :key="att.id"
                  :href="`/api/announcements/attachments/${att.id}/download`"
                  class="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 transition-all duration-150 ease-ios min-w-0"
                  :aria-label="`ดาวน์โหลด ${att.original_name}`">
                  <FileIcon :file-type="att.file_type" size="sm" class="shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-800">{{ att.original_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatSize(att.file_size) }}</p>
                  </div>
                  <PhDownloadSimple class="w-4 h-4 text-gray-300 group-hover:text-primary-600 shrink-0 transition-colors" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from '@/composables/useConfirm';
import { announcementService } from '@/services/announcementService';
import { formatThaiDateTime } from '@/utils/date';
import { formatUserName } from '@/utils/user';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import FileIcon from '@/components/common/FileIcon.vue';
import {
  PhTrash, PhPencil,
  PhMegaphone, PhLink, PhPaperclip, PhDownloadSimple,
} from '@phosphor-icons/vue';

const router    = useRouter();
const authStore = useAuthStore();
const { open: confirm } = useConfirm();

const announcements = ref([]);
const loading       = ref(false);
const expanded      = ref(new Set());

const CONTENT_THRESHOLD = 220;
const isLong = (text) => (text || '').length > CONTENT_THRESHOLD;

const formatDate = formatThaiDateTime;
const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const { data } = await announcementService.getAll();
    announcements.value = data.data;
  } finally { loading.value = false; }
};

const handleDelete = async (id) => {
  const confirmed = await confirm({
    title:        'ลบประกาศ',
    message:      'ประกาศนี้จะหายไปถาวร ผู้ใช้ทั้งหมดจะไม่เห็นอีก',
    confirmLabel: 'ลบประกาศ',
    type:         'danger',
  });
  if (!confirmed) return;
  await announcementService.remove(id);
  await fetchAnnouncements();
};

onMounted(fetchAnnouncements);
</script>
