<template>
 <div
 :class="[
 'rounded flex items-center justify-center shrink-0 border transition-all duration-200',
 sizeClasses[size],
 theme.bg,
 theme.border
 ]"
 >
 <div class="relative w-full h-full flex flex-col items-center justify-center">
 <component :is="theme.icon" :class="[iconSizeClasses[size], theme.iconColor]" />
 <div 
 v-if="showLabel && displayExtension"
 :class="[
 'absolute bottom-1.5 px-1 rounded-[3px] font-black uppercase leading-none select-none ',
 labelSizeClasses[size],
 theme.labelBg,
 theme.labelText
 ]"
 >
 {{ displayExtension }}
 </div>
 </div>
 </div>
</template>

<script setup>
import { computed } from 'vue';
import { PhFile, PhFileText } from '@phosphor-icons/vue';

const props = defineProps({
 fileType: { type: String, default: '' },
 size: { type: String, default: 'md' }, // sm, md, lg
 showLabel: { type: Boolean, default: true }
});

const displayExtension = computed(() => {
 if (!props.fileType) return '';
 const type = props.fileType.toLowerCase();
 if (type === 'pdf') return 'PDF';
 if (type.includes('doc')) return 'DOC';
 if (type.includes('xls')) return 'XLS';
 if (type.includes('ppt')) return 'PPT';
 return type.toUpperCase().slice(0, 4);
});

const theme = computed(() => {
 const type = props.fileType?.toLowerCase() || '';
 
 if (type === 'pdf') {
 return {
 bg: 'bg-rose-50',
 border: 'border-rose-200',
 icon: PhFile,
 iconColor: 'text-rose-600',
 labelBg: 'bg-rose-600',
 labelText: 'text-white'
 };
 }

 if (type.includes('doc')) {
 return {
 bg: 'bg-blue-50',
 border: 'border-blue-200',
 icon: PhFileText,
 iconColor: 'text-blue-600',
 labelBg: 'bg-blue-600',
 labelText: 'text-white'
 };
 }

 if (type.includes('xls') || type.includes('csv')) {
 return {
 bg: 'bg-emerald-50',
 border: 'border-emerald-200',
 icon: PhFileText,
 iconColor: 'text-emerald-600',
 labelBg: 'bg-emerald-600',
 labelText: 'text-white'
 };
 }

 return {
 bg: 'bg-orange-50',
 border: 'border-orange-200',
 icon: PhFile,
 iconColor: 'text-orange-500',
 labelBg: 'bg-orange-500',
 labelText: 'text-white'
 };
});

const sizeClasses = {
 sm: 'w-8 h-8',
 md: 'w-10 h-10',
 lg: 'w-12 h-12'
};

const iconSizeClasses = {
 sm: 'w-4 h-4 mb-1.5',
 md: 'w-5 h-5 mb-1.5',
 lg: 'w-6 h-6 mb-2'
};

const labelSizeClasses = {
 sm: 'text-[5px] py-0.5',
 md: 'text-[6px] py-0.5',
 lg: 'text-[8px] py-0.5'
};
</script>

