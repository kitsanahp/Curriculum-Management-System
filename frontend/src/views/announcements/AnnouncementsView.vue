<template>
  <div class="max-w-4xl mx-auto space-y-5">

    <!-- Header (PageHeader component) -->
    <PageHeader
      title="ประกาศแจ้งเตือน"
      subtitle="ติดตามประกาศสำคัญจากคณะวิทยาศาสตร์">
      <template v-if="authStore.isAdmin" #actions>
        <Button :icon-left="PhPlusCircle" @click="router.push('/announcements/create')">
          สร้างประกาศ
        </Button>
      </template>
    </PageHeader>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i"
        class="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse"
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
    <div v-else-if="!announcements.length" class="bg-white rounded-xl border border-gray-200 shadow-sm">
      <EmptyState
        title="ยังไม่มีประกาศในขณะนี้"
        description="ประกาศใหม่จะแสดงที่นี่เมื่อมีการเผยแพร่"
        :icon="PhMegaphone"
        size="lg"
        :action-label="authStore.isAdmin ? 'สร้างประกาศแรก' : ''"
        :action-icon="PhPlusCircle"
        @action="router.push('/announcements/create')"
      />
    </div>

    <!-- Announcement list -->
    <div v-else class="space-y-4">
      <div v-for="a in announcements" :key="a.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-all duration-150 ease-ios">
        <div class="flex">

          <!-- Image (left side, if present) -->
          <img v-if="a.image_url" :src="a.image_url"
            class="w-44 shrink-0 object-cover hidden sm:block self-start max-h-52" />

          <!-- Content -->
          <div class="flex-1 p-5 min-w-0">
            <!-- Meta row -->
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-semibold text-gray-700">{{ a.creator?.name }}</span>
                <span class="text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{{ formatDate(a.createdAt) }}</span>
              </div>
              <!-- Admin actions — always visible, subtle gray until hovered -->
              <div v-if="authStore.isAdmin" class="flex items-center gap-0.5 shrink-0">
                <button @click="router.push({ name: 'AnnouncementEdit', params: { id: a.id }, state: { announcement: a } })"
                  class="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg active:scale-[0.88] transition-all duration-150 ease-ios">
                  <PhPencil class="w-3.5 h-3.5" />
                </button>
                <button @click="handleDelete(a.id)"
                  class="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-[0.88] transition-all duration-150 ease-ios">
                  <PhTrash class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Image (top, mobile only) -->
            <img v-if="a.image_url" :src="a.image_url"
              class="w-full aspect-video object-cover rounded-lg mb-3 sm:hidden" />

            <h3 class="text-base font-bold text-gray-900 leading-snug mb-2">{{ a.title }}</h3>
            <div class="relative">
              <p :class="[
                'text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words transition-all',
                expanded.has(a.id) ? '' : 'line-clamp-4'
              ]">{{ a.content }}</p>
              <button v-if="isLong(a.content) && !expanded.has(a.id)"
                @click="expanded.add(a.id); expanded = new Set(expanded)"
                class="mt-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-all duration-150 ease-ios">
                อ่านเพิ่มเติม
              </button>
              <button v-else-if="isLong(a.content) && expanded.has(a.id)"
                @click="expanded.delete(a.id); expanded = new Set(expanded)"
                class="mt-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-all duration-150 ease-ios">
                แสดงน้อยลง
              </button>
            </div>

            <div v-if="a.link_url" class="mt-4">
              <a :href="a.link_url" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                <PhLink class="w-4 h-4" />
                เปิดลิงก์ที่เกี่ยวข้อง
              </a>
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
import api from '@/services/api';
import { formatThaiDateTime } from '@/utils/date';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Button from '@/components/common/Button.vue';
import {
  PhPlusCircle, PhTrash, PhPencil,
  PhMegaphone, PhLink,
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

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/announcements');
    announcements.value = data.data;
  } finally { loading.value = false; }
};

const handleDelete = async (id) => {
  const confirmed = await confirm({
    title:        'ลบประกาศ',
    message:      'ประกาศนี้จะถูกลบออกจากระบบถาวร',
    confirmLabel: 'ลบประกาศ',
    type:         'danger',
  });
  if (!confirmed) return;
  await api.delete(`/announcements/${id}`);
  await fetchAnnouncements();
};

onMounted(fetchAnnouncements);
</script>
