import { ref } from 'vue';
import { useCurriculumStore } from '@/stores/curriculum';
import dayjs from 'dayjs';

export function useInfoEditor(curriculumId, onSaved) {
  const curriculumStore = useCurriculumStore();
  const editingInfo = ref(false);
  const savingInfo = ref(false);
  const editForm = ref({});

  const startEdit = (c) => {
    editForm.value = {
      degree_name:       c.degree_name       || '',
      degree_name_abbr:  c.degree_name_abbr  || '',
      field_of_study:    c.field_of_study    || '',
      curriculum_year:   c.curriculum_year   || '',
      deadline: c.deadline ? dayjs(c.deadline).format('YYYY-MM-DD') : '',
    };
    editingInfo.value = true;
  };

  const cancelEdit = () => { editingInfo.value = false; };

  const save = async (toast) => {
    savingInfo.value = true;
    try {
      const payload = { ...editForm.value, deadline: editForm.value.deadline || null };
      await curriculumStore.update(curriculumId, payload);
      await curriculumStore.fetchById(curriculumId);
      editingInfo.value = false;
      onSaved?.();
    } catch (e) {
      toast?.error('บันทึกข้อมูลไม่สำเร็จ', e.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
    } finally { savingInfo.value = false; }
  };

  return { editingInfo, savingInfo, editForm, startEdit, cancelEdit, save };
}
