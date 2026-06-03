import { ref } from 'vue';

// Module-level singleton so any component can open the same modal
const _state = ref(null);

export function useConfirm() {
  const open = ({
    title,
    message,
    subject      = '',
    detail       = '',
    confirmLabel = 'ยืนยัน',
    cancelLabel  = 'ยกเลิก',
    type         = 'danger',   // 'danger' | 'warning' | 'primary'
  }) =>
    new Promise((resolve) => {
      _state.value = { title, message, subject, detail, confirmLabel, cancelLabel, type, resolve };
    });

  const respond = (result) => {
    _state.value?.resolve(result);
    _state.value = null;
  };

  return { state: _state, open, respond };
}

