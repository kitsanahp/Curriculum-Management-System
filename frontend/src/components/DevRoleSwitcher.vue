<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const isExpanded = ref(false);
const isDev = import.meta.env.DEV;

const roles = [
 { id: 'admin',     label: 'Admin (คณะ)',             icon: '🛡️', color: 'bg-red-600' },
 { id: 'faculty',   label: 'Faculty (อาจารย์สาขา)',   icon: '🎓', color: 'bg-blue-600' },
 { id: 'staff',     label: 'Staff (เจ้าหน้าที่สาขา)', icon: '📋', color: 'bg-cyan-600' },
 { id: 'registrar', label: 'Registrar (กอง)',          icon: '🏛️', color: 'bg-purple-600' },
 { id: 'executive', label: 'Executive (บริหาร)',       icon: '👔', color: 'bg-orange-500' },
];

const switchRole = async (roleId) => {
 try {
 await auth.devLogin(roleId);
 window.location.reload(); // รีโหลดเพื่อให้ router และสิทธิ์ต่างๆ อัปเดตใหม่ทั้งหมด
 } catch (err) {
 console.error('DevLogin Error:', err);
 alert('เกิดข้อผิดพลาดในการสลับ Role: ' + (err.response?.data?.message || err.message));
 }
};
</script>

<template>
 <div v-if="isDev" class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
 <!-- Role Buttons List -->
 <TransitionGroup 
 name="list" 
 tag="div" 
 class="flex flex-col items-end gap-2 mb-2"
 >
 <div 
 v-if="isExpanded"
 v-for="role in roles" 
 :key="role.id"
 class="group flex items-center gap-3"
 >
 <span class="bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow border border-slate-700">
 {{ role.label }}
 </span>
 <button 
 @click="switchRole(role.id)"
 :class="[
 role.color,
 auth.user?.role === role.id ? 'ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'hover:scale-110'
 ]"
 class="w-12 h-12 rounded flex items-center justify-center text-xl transition-all ease-ios shadow active:scale-[0.88] border-2 border-white/20"
 >
 {{ role.icon }}
 </button>
 </div>
 </TransitionGroup>

 <!-- Main Toggle Button -->
 <button 
 @click="isExpanded = !isExpanded"
 class="w-14 h-14 rounded bg-slate-900 text-white flex items-center justify-center shadow transition-all ease-ios hover:rotate-12 active:scale-[0.88] border-2 border-white/10 overflow-hidden relative group"
 >
 <div class="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <span v-if="!isExpanded" class="text-2xl">⚡</span>
 <span v-else class="text-xl font-bold">✕</span>
 </button>
 </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
 transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.list-enter-from,
.list-leave-to {
 opacity: 0;
 transform: translateY(20px) scale(0.5);
}
</style>

