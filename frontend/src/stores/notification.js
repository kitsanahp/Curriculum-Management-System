import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationService } from '@/services/notificationService';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length);

  async function fetch() {
    try {
      const { data } = await notificationService.getAll();
      notifications.value = data.data;
    } catch { /* background poll — silent fail */ }
  }

  async function markRead(id) {
    await notificationService.markRead(id);
    const n = notifications.value.find((n) => n.id === id);
    if (n) n.is_read = true;
  }

  async function markAllRead() {
    await notificationService.markAllRead();
    notifications.value.forEach((n) => (n.is_read = true));
  }

  async function clearAll() {
    notifications.value = [];
    await notificationService.clearAll();
  }

  return { notifications, unreadCount, fetch, markRead, markAllRead, clearAll };
});
