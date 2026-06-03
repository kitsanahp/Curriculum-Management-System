import { ref } from 'vue';
import api from '@/services/api';

export function useTeamEditor(curriculumId, onSaved) {
  const editingTeam = ref(false);
  const savingTeam = ref(false);
  const teamForm = ref([]);
  const focusedTeamMember = ref(-1);
  const allUsers = ref([]);

  const nextRole = () => {
    const roles = teamForm.value.map(m => m.role_in_curriculum);
    if (!roles.includes('president')) return 'president';
    if (!roles.includes('secretary')) return 'secretary';
    return 'responsible';
  };

  const startEdit = (currentTeam) => {
    teamForm.value = (currentTeam || []).map(m => ({
      name: m.name,
      role_in_curriculum: m.role_in_curriculum,
      position: m.position || '',
      email: m.email || '',
      _userSelected: false,
    }));
    editingTeam.value = true;
  };

  const cancelEdit = () => { editingTeam.value = false; };

  const save = async (toast) => {
    savingTeam.value = true;
    try {
      await api.put(`/curricula/${curriculumId}/team`, {
        team: teamForm.value.map(({ _userSelected, ...m }) => m),
      });
      editingTeam.value = false;
      onSaved?.();
    } catch {
      toast?.error('บันทึกรายชื่อไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    } finally { savingTeam.value = false; }
  };

  const getSuggestions = (idx) => {
    const q = teamForm.value[idx]?.name?.trim().toLowerCase() || '';
    if (!q) return [];
    return allUsers.value
      .filter(u => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .slice(0, 6);
  };

  const selectMember = (idx, user) => {
    teamForm.value[idx].name = user.name;
    teamForm.value[idx].email = user.email || '';
    teamForm.value[idx]._userSelected = true;
    focusedTeamMember.value = -1;
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      allUsers.value = data.data || [];
    } catch { /* non-critical */ }
  };

  return {
    editingTeam, savingTeam, teamForm, focusedTeamMember, allUsers,
    nextRole, startEdit, cancelEdit, save, getSuggestions, selectMember, loadUsers,
  };
}
