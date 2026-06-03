import { ref } from 'vue';

// Module-level singleton so any component shares the same queue
const _toasts = ref([]);
let _nextId = 0;

function _add({ type = 'info', title, message = '', duration = 4500 }) {
  const id = ++_nextId;
  _toasts.value.push({ id, type, title, message });
  if (duration > 0) setTimeout(() => _remove(id), duration);
}

function _remove(id) {
  const idx = _toasts.value.findIndex(t => t.id === id);
  if (idx !== -1) _toasts.value.splice(idx, 1);
}

export function useToast() {
  return {
    toasts:  _toasts,
    success: (title, message = '') => _add({ type: 'success', title, message }),
    error:   (title, message = '') => _add({ type: 'error',   title, message }),
    info:    (title, message = '') => _add({ type: 'info',    title, message }),
    warning: (title, message = '') => _add({ type: 'warning', title, message }),
    remove:  _remove,
  };
}

