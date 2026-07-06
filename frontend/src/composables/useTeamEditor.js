import { ref } from 'vue';
import { curriculumService } from '@/services/curriculumService';
import { userService } from '@/services/userService';

// getDepartmentId: getter คืน department_id ของหลักสูตร (ใช้กรอง suggestion ตามภาควิชา)
export function useTeamEditor(curriculumId, onSaved, getDepartmentId) {
  const editingTeam = ref(false);
  const savingTeam = ref(false);
  const teamForm = ref([]);
  const focusedTeamMember = ref(-1);
  const allUsers = ref([]);
  const showAllDepts = ref(false); // true = แสดงอาจารย์ทุกภาควิชา (เผื่อทีมสหวิทยาการ)

  const nextRole = () => {
    const roles = teamForm.value.map(m => m.role_in_curriculum);
    if (!roles.includes('president')) return 'president';
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
    if (teamForm.value.length === 0) {
      toast?.error('ข้อมูลไม่ครบถ้วน', 'ต้องมีสมาชิกในทีมอย่างน้อย 1 คน');
      return;
    }

    const hasEmptyName = teamForm.value.some(m => !m.name || !m.name.trim());
    if (hasEmptyName) {
      toast?.error('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อสมาชิกให้ครบทุกคน');
      return;
    }

    const hasPresident = teamForm.value.some(m => m.role_in_curriculum === 'president');
    if (!hasPresident) {
      toast?.error('ข้อมูลไม่ถูกต้อง', 'ต้องมีประธานหลักสูตรอย่างน้อย 1 คน');
      return;
    }

    savingTeam.value = true;
    try {
      await curriculumService.updateTeam(curriculumId, teamForm.value.map(({ _userSelected, ...m }) => m));
      editingTeam.value = false;
      onSaved?.();
    } catch {
      toast?.error('บันทึกรายชื่อไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    } finally { savingTeam.value = false; }
  };

  const getSuggestions = (idx) => {
    const q = teamForm.value[idx]?.name?.trim().toLowerCase() || '';
    if (!q) return [];
    const deptId = getDepartmentId?.();
    const matched = allUsers.value
      // ทีมหลักสูตรมีแต่อาจารย์ — แสดงเฉพาะ role faculty เท่านั้น
      .filter(u => u.role === 'faculty')
      .filter(u => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    if (showAllDepts.value || !deptId) return matched.slice(0, 6);
    // คนภาคเดียวกับหลักสูตรขึ้นก่อน — ถ้าในภาคไม่มีชื่อที่ตรงเลย fallback เป็นทุกภาค
    // (กัน dropdown ว่างทั้งที่ชื่ออยู่ในระบบ เช่น ทีมสหวิทยาการ)
    const inDept = matched.filter(u => u.department_id === deptId);
    return (inDept.length > 0 ? inDept : matched).slice(0, 6);
  };

  const selectMember = (idx, user) => {
    teamForm.value[idx].name = user.name;
    teamForm.value[idx].email = user.email || '';
    // ตำแหน่งวิชาการ: อ่าน academic_position ก่อน, fallback position สำหรับ user seed เก่า
    // ที่เก็บตำแหน่งวิชาการไว้ใน position
    teamForm.value[idx].position = user.academic_position || user.position || '';
    teamForm.value[idx]._userSelected = true;
    focusedTeamMember.value = -1;
  };

  const loadUsers = async () => {
    try {
      const { data } = await userService.getAll();
      allUsers.value = data.data || [];
    } catch { /* non-critical */ }
  };

  return {
    editingTeam, savingTeam, teamForm, focusedTeamMember, allUsers, showAllDepts,
    nextRole, startEdit, cancelEdit, save, getSuggestions, selectMember, loadUsers,
  };
}
