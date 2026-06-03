import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length);

  async function fetch() {
    try {
      const { data } = await api.get('/users/notifications');
      notifications.value = data.data;
    } catch { /* background poll — silent fail */ }
  }

  async function markRead(id) {
    await api.put(`/users/notifications/${id}/read`);
    const n = notifications.value.find((n) => n.id === id);
    if (n) n.is_read = true;
  }

  async function markAllRead() {
    await api.put('/users/notifications/read-all');
    notifications.value.forEach((n) => (n.is_read = true));
  }

  async function clearAll() {
    notifications.value = [];
    await api.delete('/users/notifications/clear-all');
  }

  return { notifications, unreadCount, fetch, markRead, markAllRead, clearAll };
});

