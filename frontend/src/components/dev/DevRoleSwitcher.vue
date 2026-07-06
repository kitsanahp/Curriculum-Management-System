<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { PhShieldStar, PhChalkboardTeacher, PhUsersThree, PhBuildings, PhSuitcaseSimple, PhLightning, PhX } from '@phosphor-icons/vue';

const auth = useAuthStore();
const isExpanded = ref(false);
const isDev = import.meta.env.DEV;

const roles = [
 { id: 'admin',     label: 'เจ้าหน้าที่หลักสูตรคณะ',             icon: PhShieldStar, color: 'text-red-600 bg-red-50/90' },
 { id: 'faculty',   label: 'อาจารย์ผู้รับผิดชอบหลักสูตร',   icon: PhChalkboardTeacher, color: 'text-blue-600 bg-blue-50/90' },
 { id: 'staff',     label: 'เจ้าหน้าที่สาขาวิชา', icon: PhUsersThree, color: 'text-cyan-600 bg-cyan-50/90' },
 { id: 'registrar', label: 'เจ้าหน้าที่หลักสูตร กองฯ',          icon: PhBuildings, color: 'text-purple-600 bg-purple-50/90' },
 { id: 'executive', label: 'ผู้บริหารคณะวิทยาศาสตร์',       icon: PhSuitcaseSimple, color: 'text-orange-600 bg-orange-50/90' },
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
      class="flex flex-col items-end gap-2.5 mb-1"
    >
      <div 
        v-if="isExpanded"
        v-for="role in roles" 
        :key="role.id"
        class="group flex items-center gap-3"
      >
        <!-- Tooltip -->
        <span class="bg-gray-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          {{ role.label }}
        </span>
        
        <!-- Role Button -->
        <button 
          @click="switchRole(role.id)"
          :class="[
            role.color,
            auth.user?.role === role.id ? 'ring-2 ring-primary-500 shadow-md scale-110' : 'hover:scale-105 hover:shadow-sm'
          ]"
          class="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ease-ios active:scale-[0.88] border border-gray-200/50 backdrop-blur-sm"
        >
          <component :is="role.icon" weight="duotone" class="w-5 h-5" />
        </button>
      </div>
    </TransitionGroup>

    <!-- Main Toggle Button -->
    <button 
      @click="isExpanded = !isExpanded"
      class="w-14 h-14 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ease-ios active:scale-[0.88] border border-gray-100 group"
    >
      <PhX v-if="isExpanded" class="w-6 h-6 text-gray-500 group-hover:rotate-90 transition-transform duration-200" />
      <PhLightning v-else weight="duotone" class="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform duration-200" />
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

