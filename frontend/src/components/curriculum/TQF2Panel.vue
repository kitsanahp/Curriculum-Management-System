<template>
 <div class="pb-10">

  <!-- Upload toast notifications — top-right -->
  <Teleport to="body">
   <div class="fixed top-20 right-5 z-[200] flex flex-col gap-2 items-end">

    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-x-6" enter-to-class="opacity-100 translate-x-0"
     leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 translate-x-0" leave-to-class="opacity-0 translate-x-4">
     <div v-if="uploadSuccess" class="w-80 bg-white rounded-xl shadow-lg ring-1 ring-black/[0.06]">
      <div class="flex items-start gap-3 px-4 py-3.5">
       <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
        <PhCheckCircle class="w-4 h-4 text-emerald-600" />
       </div>
       <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-gray-900 leading-none">อัปโหลดสำเร็จ</p>
        <p class="text-xs text-gray-400 mt-1 break-all">"{{ uploadSuccess }}"</p>
       </div>
       <button @click="uploadSuccess = ''"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 active:scale-[0.88] transition-all ease-ios">
        <PhX class="w-3.5 h-3.5" />
       </button>
      </div>
     </div>
    </Transition>

    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-x-6" enter-to-class="opacity-100 translate-x-0"
     leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 translate-x-0" leave-to-class="opacity-0 translate-x-4">
     <div v-if="uploadError" class="w-80 bg-white rounded-xl shadow-lg ring-1 ring-black/[0.06]">
      <div class="flex items-start gap-3 px-4 py-3.5">
       <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
        <PhWarning class="w-4 h-4 text-red-500" />
       </div>
       <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-gray-900 leading-none">อัปโหลดไม่สำเร็จ</p>
        <p class="text-xs text-gray-400 mt-1 break-all">{{ uploadError }}</p>
       </div>
       <button @click="uploadError = ''"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 active:scale-[0.88] transition-all ease-ios">
        <PhX class="w-3.5 h-3.5" />
       </button>
      </div>
     </div>
    </Transition>

   </div>
  </Teleport>

  <!-- Main card -->
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm">

   <!-- Card header -->
   <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
    <div>
     <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
      มคอ.2
      <span class="text-xs font-normal text-gray-400 tracking-normal">(TQF 2)</span>
     </h2>
     <div v-if="versions.length" class="flex items-center gap-1.5 mt-0.5">
      <span class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ versions.length }} เวอร์ชัน</span>
      <span class="text-[11px] text-gray-400">อัปเดต {{ formatDate(versions[0]?.createdAt) }}</span>
     </div>
    </div>
    <div class="flex items-center gap-3 flex-wrap justify-end">
     <!-- Year filter — แสดงเฉพาะเมื่อมีข้อมูลมากกว่า 1 ปี -->
     <div v-if="availableYears.length > 1" class="flex items-center gap-1.5">
      <label class="text-[11px] font-semibold text-gray-400 whitespace-nowrap shrink-0">ปีการศึกษา</label>
      <FormSelect v-model="selectedYear" :options="yearOptions" @change="fetchVersions" placeholder="ทุกปีการศึกษา" class="w-36" />
     </div>
     <!-- เปรียบเทียบได้ -->
     <button v-if="!compareMode && versions.length >= 2" @click="enterCompare"
      class="ai-compare-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 active:scale-[0.97] transition-transform">
      <svg class="gemini-star w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
       <path d="M12 2C12 7 7 12 2 12C7 12 12 17 12 22C12 17 17 12 22 12C17 12 12 7 12 2Z"/>
      </svg>
      เปรียบเทียบเวอร์ชัน
     </button>
     <!-- ยังเปรียบเทียบไม่ได้ — แสดง disabled พร้อม tooltip -->
     <span
      v-else-if="!compareMode && versions.length < 2 && versions.length > 0"
      data-tooltip="ต้องมีอย่างน้อย 2 เวอร์ชัน เพื่อเปรียบเทียบ"
      data-tooltip-bottom
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 cursor-not-allowed select-none">
      <svg class="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
       <path d="M12 2C12 7 7 12 2 12C7 12 12 17 12 22C12 17 17 12 22 12C17 12 12 7 12 2Z"/>
      </svg>
      เปรียบเทียบเวอร์ชัน
     </span>
     <button v-if="compareMode" @click="exitCompare"
      class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-[0.97] transition-all ease-ios">
      <PhX class="w-4 h-4" /> ยกเลิก
     </button>
     <!-- อัปโหลดได้ -->
     <label v-if="canUpload"
      class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] transition-all ease-ios cursor-pointer">
      <PhUploadSimple class="w-4 h-4" aria-hidden="true" />
      อัปโหลด มคอ.2
      <input type="file" class="hidden" accept=".pdf,.docx,.doc" @change="handleUpload" />
     </label>
     <!-- อัปโหลดไม่ได้ — แสดงพร้อม tooltip บอกเหตุผล -->
     <span
      v-else-if="['faculty', 'staff'].includes(authStore.user?.role) && !canUpload"
      :data-tooltip="uploadBlockedReason"
      data-tooltip-bottom
      class="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed select-none">
      <PhUploadSimple class="w-4 h-4" aria-hidden="true" />
      อัปโหลด มคอ.2
     </span>
    </div>
   </div>

   <!-- Loading skeleton -->
   <div v-if="loading" class="px-6 py-6 space-y-3">
    <div class="h-32 rounded-xl bg-gray-100 animate-pulse"></div>
    <div class="h-32 rounded-xl bg-gray-100 animate-pulse opacity-60"></div>
   </div>

   <!-- Error state -->
   <div v-else-if="fetchError"
    class="flex items-start gap-4 m-6 p-5 rounded-xl bg-red-50 ring-1 ring-inset ring-red-100 text-red-700">
    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
     <PhWarning class="w-5 h-5 text-red-500" />
    </div>
    <div class="flex-1 min-w-0">
     <p class="font-bold text-sm">ไม่สามารถโหลดข้อมูล มคอ.2 ได้</p>
     <p class="text-xs text-red-500 mt-0.5">{{ fetchError }}</p>
     <button @click="fetchVersions"
      class="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 active:scale-[0.97] transition-all ease-ios">
      ลองใหม่อีกครั้ง
     </button>
    </div>
   </div>

   <!-- Empty state: admin waiting -->
   <div v-else-if="versions.length === 0 && authStore.user?.role === 'admin'"
    class="px-6 py-16 flex flex-col items-center text-center gap-3">
    <div class="bg-gray-100 p-4 rounded-full mb-2">
     <PhClock class="w-10 h-10 text-gray-400" />
    </div>
    <h3 class="text-base font-bold text-gray-900 uppercase tracking-wide">รอภาควิชาส่งเอกสาร</h3>
    <p class="text-sm text-gray-500 font-medium">ยังไม่มีเอกสาร มคอ.2 ในระบบ</p>
   </div>

   <!-- Empty state: staff waiting -->
   <div v-else-if="versions.length === 0 && authStore.user?.role === 'staff'"
    class="px-6 py-16 flex flex-col items-center text-center gap-3">
    <div class="bg-gray-100 p-4 rounded-full mb-2">
     <PhClock class="w-10 h-10 text-gray-400" />
    </div>
    <h3 class="text-base font-bold text-gray-900 uppercase tracking-wide">รอภาควิชาส่งเอกสาร</h3>
    <p class="text-sm text-gray-500 font-medium">ยังไม่มีเอกสาร มคอ.2 ในระบบ</p>
   </div>

   <!-- Empty state — drag-drop zone -->
   <div v-else-if="versions.length === 0"
    class="m-4 rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden"
    :class="isDragging ? 'border-primary-400 bg-primary-50/50 scale-[1.01]' : 'border-gray-200 hover:border-gray-300'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop">
    <div class="flex flex-col items-center justify-center py-14 px-8 text-center">
     <div :class="['w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all', isDragging ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400']">
      <PhUploadSimple class="w-7 h-7" />
     </div>
     <h3 class="font-bold text-gray-900 text-lg mb-1">{{ isDragging ? 'วางไฟล์ที่นี่' : 'ยังไม่มีเอกสาร มคอ.2' }}</h3>
     <p class="text-sm text-gray-500 mb-4">{{ isDragging ? 'วางไฟล์ที่นี่เพื่อส่ง' : 'ลากไฟล์มาวางที่นี่ หรือคลิกปุ่มอัปโหลดด้านบน' }}</p>
     <p class="text-xs text-gray-400">รองรับ PDF, DOCX</p>
     <p class="text-xs text-primary-500 mt-3 font-medium">อัปโหลดไฟล์แล้วกดปุ่ม "ส่งหลักสูตรเพื่อตรวจสอบ" เพื่อส่งให้เจ้าหน้าที่</p>
    </div>
   </div>

   <!-- Compare mode: Phase 1 — version selection -->
   <div v-else-if="compareMode && !diffResult" class="p-6 space-y-4">

    <!-- Step indicator -->
    <div class="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl ring-1 ring-inset ring-gray-200">
     <div class="flex items-center gap-2">
      <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
       selectedIds.length >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500']">1</div>
      <span :class="['text-sm font-semibold', selectedIds.length >= 1 ? 'text-primary-700' : 'text-gray-400']">เลือกเวอร์ชันแรก</span>
     </div>
     <div class="flex-1 h-px" :class="selectedIds.length >= 1 ? 'bg-primary-200' : 'bg-gray-200'"></div>
     <div class="flex items-center gap-2">
      <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
       selectedIds.length >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500']">2</div>
      <span :class="['text-sm font-semibold', selectedIds.length >= 2 ? 'text-primary-700' : 'text-gray-400']">เลือกเวอร์ชันที่สอง</span>
     </div>
     <div class="flex-1 h-px" :class="selectedIds.length >= 2 ? 'bg-primary-200' : 'bg-gray-200'"></div>
     <div class="flex items-center gap-2">
      <div :class="['w-7 h-7 rounded-full flex items-center justify-center transition-all',
       selectedIds.length >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500']">
       <PhCheck v-if="selectedIds.length >= 2" class="w-4 h-4" />
       <span v-else class="text-xs font-bold">✓</span>
      </div>
      <span :class="['text-sm font-semibold', selectedIds.length >= 2 ? 'text-emerald-700' : 'text-gray-400']">เปรียบเทียบ</span>
     </div>
    </div>

    <!-- Version rows (compact list) -->
    <div class="space-y-2">
     <button v-for="v in versions" :key="v.id" @click="toggleSelect(v.id)" type="button"
      :disabled="selectedIds.length >= 2 && !selectedIds.includes(v.id)"
      :class="['relative w-full flex items-center gap-3 px-4 py-3 rounded-xl ring-1 transition-all focus:outline-none text-left',
       selectedIds.includes(v.id) ? 'ring-primary-400 bg-primary-50/60 shadow-sm' : 'ring-inset ring-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-sm',
       selectedIds.length >= 2 && !selectedIds.includes(v.id) ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer']">
      <!-- Version badge -->
      <span :class="['text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0',
       selectedIds.includes(v.id) ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-600']">
       เวอร์ชันที่ {{ v.version_number }}
      </span>
      <!-- File info -->
      <div class="flex-1 min-w-0">
       <div class="flex items-center gap-2 min-w-0">
        <p class="text-sm font-semibold text-gray-900 truncate">{{ v.original_name }}</p>
        <span :class="['shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
         v.file_type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600']">
         {{ v.file_type }}
        </span>
       </div>
       <div class="flex items-center gap-1 mt-0.5 flex-wrap">
        <span class="text-[10px] text-gray-400">{{ v.uploader?.name }}</span>
        <span class="text-[10px] bg-gray-100 text-gray-400 px-1 py-px rounded">{{ formatDate(v.createdAt) }}</span>
        <span v-if="v.academic_year" class="text-[10px] font-bold bg-primary-50 text-primary-600 px-1.5 py-px rounded ring-1 ring-primary-200/60">ปี {{ v.academic_year }}</span>
       </div>
      </div>
      <!-- Selection number bubble -->
      <div v-if="selectedIds.includes(v.id)"
       class="w-6 h-6 rounded-full bg-primary-700 text-white text-xs font-black flex items-center justify-center shrink-0">
       {{ selectedIds.indexOf(v.id) + 1 }}
      </div>
     </button>
    </div>

    <!-- Loading state (2 selected, waiting for diff) -->
    <div v-if="diffLoading" class="flex flex-col items-center justify-center py-14 gap-5">
     <div class="relative w-20 h-20">
      <div class="absolute inset-3 border-[3px] border-t-primary-500 border-gray-200 rounded-full animate-spin"></div>
      <div class="absolute inset-0 flex items-center justify-center">
       <svg viewBox="0 0 24 24" class="w-7 h-7 animate-pulse">
        <defs><linearGradient id="gloading" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EA4335"/><stop offset="33%" stop-color="#FBBC05"/><stop offset="66%" stop-color="#34A853"/><stop offset="100%" stop-color="#4285F4"/></linearGradient></defs>
        <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" fill="url(#gloading)"/>
       </svg>
      </div>
     </div>
     <div class="text-center">
      <p class="text-sm font-bold text-gray-900">กำลังวิเคราะห์ความแตกต่าง</p>
      <div class="flex justify-center gap-1.5 mt-2">
       <div class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:0ms]"></div>
       <div class="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:150ms]"></div>
       <div class="w-1.5 h-1.5 rounded-full bg-primary-300 animate-bounce [animation-delay:300ms]"></div>
      </div>
     </div>
    </div>

    <!-- Error state -->
    <div v-else-if="diffError" class="py-10 text-center">
     <PhWarning class="w-8 h-8 text-red-400 mx-auto mb-2" />
     <p class="text-sm font-semibold text-red-700">{{ diffError }}</p>
    </div>

   </div>

   <!-- Compare mode: Phase 2 — diff reader -->
   <div v-else-if="compareMode && diffResult">

    <!-- Version comparison header -->
    <div class="px-6 py-4 border-b border-gray-100 space-y-3">

     <!-- Doc A → Doc B -->
     <div class="flex items-stretch gap-2">

      <!-- Doc A (ก่อน) -->
      <div class="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl ring-1 ring-inset ring-gray-200">
       <div class="w-9 h-9 rounded-xl bg-white ring-1 ring-gray-200 shadow-sm flex items-center justify-center text-sm font-black text-gray-500 shrink-0">
        {{ compareDocuments[0]?.version_number }}
       </div>
       <div class="flex-1 min-w-0">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">ก่อน</p>
        <p class="text-xs font-semibold text-gray-700 truncate leading-snug">{{ compareDocuments[0]?.original_name }}</p>
        <p class="text-[10px] text-gray-400 mt-0.5">{{ formatDate(compareDocuments[0]?.createdAt) }}</p>
       </div>
       <div class="flex gap-0.5 shrink-0">
        <button @click="openPreview(compareDocuments[0], `/curricula/tqf2/${compareDocuments[0]?.id}/preview`, `เวอร์ชันที่ ${compareDocuments[0]?.version_number}`)"
         class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-white active:scale-[0.88] transition-all ease-ios">
         <PhEye class="w-3.5 h-3.5" />
        </button>
        <button @click="downloadVersion(compareDocuments[0]?.id)"
         class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-white active:scale-[0.88] transition-all ease-ios">
         <PhDownloadSimple class="w-3.5 h-3.5" />
        </button>
       </div>
      </div>

      <!-- Arrow -->
      <div class="flex items-center shrink-0">
       <PhArrowRight class="w-4 h-4 text-gray-300" />
      </div>

      <!-- Doc B (หลัง) -->
      <div class="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 bg-primary-50 rounded-xl ring-1 ring-inset ring-primary-200">
       <div class="w-9 h-9 rounded-xl bg-primary-600 shadow-sm flex items-center justify-center text-sm font-black text-white shrink-0">
        {{ compareDocuments[1]?.version_number }}
       </div>
       <div class="flex-1 min-w-0">
        <p class="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-0.5">หลัง</p>
        <p class="text-xs font-semibold text-gray-700 truncate leading-snug">{{ compareDocuments[1]?.original_name }}</p>
        <p class="text-[10px] text-primary-400 mt-0.5">{{ formatDate(compareDocuments[1]?.createdAt) }}</p>
       </div>
       <div class="flex gap-0.5 shrink-0">
        <button @click="openPreview(compareDocuments[1], `/curricula/tqf2/${compareDocuments[1]?.id}/preview`, `เวอร์ชันที่ ${compareDocuments[1]?.version_number}`)"
         class="w-7 h-7 rounded-lg flex items-center justify-center text-primary-400 hover:text-primary-700 hover:bg-white active:scale-[0.88] transition-all ease-ios">
         <PhEye class="w-3.5 h-3.5" />
        </button>
        <button @click="downloadVersion(compareDocuments[1]?.id)"
         class="w-7 h-7 rounded-lg flex items-center justify-center text-primary-400 hover:text-primary-700 hover:bg-white active:scale-[0.88] transition-all ease-ios">
         <PhDownloadSimple class="w-3.5 h-3.5" />
        </button>
       </div>
      </div>

      <!-- Change button -->
      <button @click="exitCompare"
       class="shrink-0 self-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-[0.97] transition-all ease-ios">
       เปลี่ยน
      </button>
     </div>

     <!-- Legend -->
     <div class="flex items-center gap-3 px-1 mb-2">
      <span class="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
       <span class="inline-block w-3 h-3 rounded-sm bg-emerald-100 ring-1 ring-emerald-300"></span>
       เนื้อหาที่เพิ่มขึ้น
      </span>
      <span class="flex items-center gap-1.5 text-[11px] font-semibold text-red-700">
       <span class="inline-block w-3 h-3 rounded-sm bg-red-100 ring-1 ring-red-300"></span>
       เนื้อหาที่ตัดออก
      </span>
     </div>

     <!-- Stats chips -->
     <div class="flex items-center gap-1.5 flex-wrap">
      <span class="text-[11px] font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
       {{ diffResult.sections.length }} หมวด
      </span>
      <span :class="['text-[11px] font-semibold px-2.5 py-1 rounded-full',
       diffResult.sections.filter(s => s.has_changes).length > 0
        ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700']">
       {{ diffResult.sections.filter(s => s.has_changes).length > 0
        ? `${diffResult.sections.filter(s => s.has_changes).length} หมวดเปลี่ยนแปลง`
        : 'เนื้อหาเหมือนกันทุกหมวด' }}
      </span>
      <button @click="expandAll"
       class="ml-auto flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 px-2.5 py-1 rounded-full hover:bg-primary-50 active:scale-[0.97] transition-all ease-ios">
       ขยายทั้งหมด
      </button>
     </div>
    </div>

    <!-- Section navigation pills (sticky) -->
    <div class="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 pt-1.5 pb-1">
     <div class="flex gap-1 overflow-x-auto" style="scrollbar-width: none; -ms-overflow-style: none;">
      <button v-for="(sec, idx) in diffResult.sections" :key="sec.section_number"
       @click="jumpToSection(sec.section_number)"
       :class="['flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ease-ios shrink-0 border active:scale-[0.95]',
        idx === currentSectionIdx
         ? 'border-primary-400 bg-primary-600 text-white shadow-sm'
         : sec.has_changes
          ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
          : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600']">
       <component :is="sectionIcon(sec.section_number)" :class="['w-3 h-3 shrink-0',
        idx === currentSectionIdx ? 'text-white' : sec.has_changes ? 'text-orange-500' : 'text-gray-400']" />
       {{ sec.section_number === 0 ? 'ส่วนนำ' : `หมวด ${sec.section_number}` }}
      </button>
     </div>
     <!-- Current section title — อัปเดตตาม scroll -->
     <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
     >
      <div v-if="currentSection" class="flex items-center gap-1.5 mt-1 min-w-0 border-t border-gray-100 pt-1">
       <component :is="sectionIcon(currentSection.section_number)"
        :class="['w-3 h-3 shrink-0', currentSection.has_changes ? 'text-orange-400' : 'text-primary-400']" />
       <span :class="['text-[10px] font-black uppercase tracking-widest shrink-0',
        currentSection.has_changes ? 'text-orange-600' : 'text-primary-600']">
        {{ currentSection.section_number === 0 ? 'ส่วนนำ' : `หมวด ${currentSection.section_number}` }}
       </span>
       <template v-if="currentSection.section_number !== 0">
        <span class="text-[10px] text-gray-200 shrink-0">|</span>
        <span class="text-[11px] font-medium text-gray-500 truncate">{{ currentSection.title }}</span>
       </template>
      </div>
     </Transition>
    </div>

    <!-- Diff sections -->
    <div class="divide-y divide-gray-100">
     <div v-for="sec in diffResult.sections" :key="sec.section_number"
      :data-section-num="sec.section_number"
      :ref="el => { if (el) sectionEls[sec.section_number] = el; else delete sectionEls[sec.section_number]; }">
      <!-- Section header -->
      <button @click="toggleSection(sec.section_number)"
       :class="['w-full flex items-center gap-3 pl-4 pr-5 py-3.5 text-left transition-colors duration-150 border-l-2',
        expandedSections.has(sec.section_number)
         ? [sectionColor(sec.section_number).headerBg, sectionColor(sec.section_number).contentBorder]
         : sec.has_changes
          ? 'hover:bg-orange-50/40 border-orange-200'
          : 'hover:bg-gray-50/60 border-transparent']">

       <!-- Caret -->
       <PhCaretRight :class="['w-3.5 h-3.5 shrink-0 transition-transform duration-200',
        expandedSections.has(sec.section_number) ? 'rotate-90 text-gray-500' : 'text-gray-300']" />

       <!-- Icon bubble -->
       <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
        expandedSections.has(sec.section_number)
         ? [sectionColor(sec.section_number).dot, 'text-white shadow-sm']
         : sec.has_changes ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400']">
        <component :is="sectionIcon(sec.section_number)" class="w-4 h-4" />
       </div>

       <!-- Title block -->
       <div class="flex-1 min-w-0 py-0.5">
        <p :class="['text-[10px] font-black uppercase tracking-widest mb-0.5 leading-none',
         sec.has_changes ? 'text-orange-500' : 'text-gray-300']">
         {{ sec.section_number === 0 ? 'ส่วนนำ' : `หมวด ${sec.section_number}` }}
        </p>
        <p class="text-sm font-semibold text-gray-800 leading-snug truncate">{{ sec.title }}</p>
       </div>

       <!-- Change indicator -->
       <div class="shrink-0 flex items-center gap-2">
        <div v-if="!sec.has_changes" class="flex items-center gap-1.5 text-gray-300">
         <PhCheck class="w-3.5 h-3.5" />
         <span class="text-[11px] font-medium hidden sm:block">ไม่เปลี่ยนแปลง</span>
        </div>
        <div v-else class="flex items-center gap-2">
         <div class="w-14 h-1 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
          <div class="h-full rounded-full transition-all" :class="changeBarColor(sec.changePercent)" :style="{ width: `${sec.changePercent}%` }" />
         </div>
         <span :class="['text-sm font-black tabular-nums leading-none', changeTextColor(sec.changePercent)]">
          {{ sec.changePercent }}<span class="text-[10px] font-semibold">%</span>
         </span>
        </div>
       </div>
      </button>

      <!-- Diff content -->
      <div v-if="expandedSections.has(sec.section_number)"
       :class="['tqf2-diff-content px-10 py-7 text-sm leading-8 border-t', sectionColor(sec.section_number).contentBg, sectionColor(sec.section_number).contentBorder]"
       v-html="sec.diffHtml" />
     </div>
    </div>

   </div>

   <!-- Normal view: grouped by file type -->
   <div v-else>

    <!-- Column headers -->
    <div class="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
     <span class="w-14 shrink-0 text-center">เวอร์ชัน</span>
     <span class="flex-1">ชื่อไฟล์</span>
     <span class="shrink-0">การดำเนินการ</span>
    </div>

    <template v-for="group in fileGroups" :key="group.type">

     <!-- File type sub-header -->
     <div :class="['px-6 py-2 border-b flex items-center gap-2',
      group.type === 'pdf' ? 'bg-red-50/40 border-red-100/70' : 'bg-indigo-50/20 border-indigo-100/50']">
      <span :class="['text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
       group.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600']">
       {{ group.type === 'pdf' ? 'PDF' : 'DOCX' }}
      </span>
      <span :class="['text-[11px] font-medium', group.type === 'pdf' ? 'text-red-400' : 'text-indigo-400']">
       {{ group.versions.length }} ไฟล์
      </span>
     </div>

     <TransitionGroup tag="div" name="list" appear class="divide-y divide-gray-50">
      <div v-for="v in group.versions" :key="v.id" class="group">
       <div class="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-gray-50/60"
        :class="v.id === versions[0]?.id ? 'bg-gradient-to-r from-primary-50/50 to-transparent' : ''">

        <!-- Version badge -->
        <div class="w-14 shrink-0 flex justify-center">
         <span v-if="v.id === versions[0]?.id"
          class="text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md bg-primary-600 text-white whitespace-nowrap">
          ล่าสุด
         </span>
         <span v-else class="text-xs font-semibold text-gray-400 tabular-nums whitespace-nowrap">
          เวอร์ชันที่ {{ v.version_number }}
         </span>
        </div>

        <!-- File icon -->
        <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
         v.file_type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500']">
         <FileIcon :file-type="v.file_type" size="md" />
        </div>

        <!-- Filename + metadata -->
        <div class="flex-1 min-w-0">
         <div class="flex items-center gap-2 min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">{{ v.original_name }}</p>
          <span :class="['shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide',
           v.file_type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600']">
           {{ v.file_type }}
          </span>
         </div>
         <div class="flex items-center gap-1 mt-0.5 flex-wrap">
          <span class="text-[10px] font-medium text-gray-500">{{ v.uploader?.name || 'ไม่ระบุ' }}</span>
          <span v-if="uploaderLabel(v.uploader)" class="text-[10px] font-medium bg-gray-100 text-gray-500 px-1 py-px rounded">{{ uploaderLabel(v.uploader) }}</span>
          <span class="text-[10px] text-gray-400">{{ formatDate(v.createdAt) }}</span>
          <span v-if="v.academic_year" class="text-[10px] font-bold bg-primary-50 text-primary-600 px-1.5 py-px rounded ring-1 ring-primary-200/60">ปี {{ v.academic_year }}</span>
          <span v-if="v.file_size" class="text-[10px] font-medium bg-gray-100 text-gray-400 px-1 py-px rounded">{{ formatFileSize(v.file_size) }}</span>
          <span v-if="annotationCounts[v.id]"
           class="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 px-1.5 py-px rounded ring-1 ring-orange-200/60">
           <PhHighlighter class="w-2.5 h-2.5" />
           {{ annotationCounts[v.id] }}
          </span>
         </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-0.5 shrink-0">
         <button v-if="!isLocked" @click="openPreview(v, `/curricula/tqf2/${v.id}/preview`, `เวอร์ชันที่ ${v.version_number}`)"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios">
          <PhPencilSimple class="w-4 h-4" />
         </button>
         <button @click="downloadVersion(v.id)"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all ease-ios">
          <PhDownloadSimple class="w-4 h-4" />
         </button>
         <button v-if="canDelete && !isLocked" @click="handleDelete(v)"
          class="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-[0.88] transition-all ease-ios opacity-0 group-hover:opacity-100">
          <PhTrash class="w-4 h-4" />
         </button>
        </div>
       </div>
      </div>
     </TransitionGroup>

    </template>
   </div>

  </div>
 </div>

 <!-- Preview Modal -->
 <DocumentPreviewModal v-if="previewState" :doc="previewState.doc" :api-path="previewState.apiPath"
  :version-label="previewState.versionLabel" document-type="tqf2"
  :can-reject="isAdminReview" :can-approve="isAdminReview"
  @close="previewState = null; fetchAnnotationCounts()" @download="handlePreviewDownload"
  @reject="emit('reject')" @approve="emit('approve')" />

 <!-- Section navigator (floating bottom bar, diff view only) -->
 <Teleport to="body">
  <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0"
   leave-active-class="transition-all duration-200" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
   <div v-if="compareMode && diffResult"
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-stretch bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden select-none">

    <!-- Prev button -->
    <button @click="goPrevSection"
     :class="['flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ease-ios border-r border-gray-100',
      currentSectionIdx === 0 ? 'text-gray-300 cursor-default' : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100']">
     <PhCaretLeft class="w-4 h-4 shrink-0" />
     <span class="hidden sm:block">ก่อนหน้า</span>
    </button>

    <!-- Section info + dot track -->
    <div class="flex flex-col items-center justify-center px-5 py-2.5 w-64 gap-1.5">
     <!-- Section number badge -->
     <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">
      {{ currentSection?.section_number === 0 ? 'ส่วนนำ' : `หมวด ${currentSection?.section_number}` }}
     </span>
     <!-- Full title — wraps, no truncate -->
     <p class="text-xs font-semibold text-gray-800 text-center leading-snug">
      {{ currentSection?.title }}
     </p>
     <!-- Dot track -->
     <div class="flex items-center gap-1">
      <div v-for="(sec, idx) in diffResult.sections" :key="sec.section_number"
       :class="['rounded-full transition-all duration-200',
        idx === currentSectionIdx
         ? 'w-4 h-1.5 bg-primary-600'
         : sec.has_changes
          ? 'w-1.5 h-1.5 bg-orange-300'
          : 'w-1.5 h-1.5 bg-gray-200']">
      </div>
     </div>
     <p class="text-[10px] text-gray-400 tabular-nums">{{ currentSectionIdx + 1 }} / {{ diffResult.sections.length }}</p>
    </div>

    <!-- Next button -->
    <button @click="goNextSection"
     :class="['flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ease-ios border-l border-gray-100',
      currentSectionIdx >= diffResult.sections.length - 1 ? 'text-gray-300 cursor-default' : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100']">
     <span class="hidden sm:block">ถัดไป</span>
     <PhCaretRight class="w-4 h-4 shrink-0" />
    </button>

   </div>
  </Transition>
 </Teleport>

 <!-- Delete Modal -->
 <Teleport to="body">
  <Transition name="modal-premium">
   <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="absolute inset-0 bg-slate-900/60" @click="showDeleteModal = false"></div>
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100">
     <div class="p-6 text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-inset ring-red-100">
       <PhTrash class="w-8 h-8 text-red-600" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-2">ลบ มคอ.2</h3>
      <p class="text-sm text-gray-500 mb-1">เวอร์ชัน <span class="font-bold text-gray-900">{{ deleteTarget?.version_number }}</span> จะถูกลบออกจากระบบถาวร</p>
      <p class="text-xs font-semibold mt-4 bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 rounded-xl px-4 py-3">ไม่สามารถกู้คืนได้หลังจากลบ</p>
     </div>
     <div class="px-6 pb-6 pt-2 flex gap-3">
      <button @click="showDeleteModal = false" class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all ease-ios whitespace-nowrap">ยกเลิก</button>
      <button @click="confirmDelete" class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-sm transition-all ease-ios active:scale-[0.97] flex items-center justify-center gap-2 whitespace-nowrap">
       <PhTrash class="w-4 h-4" /> ลบ มคอ.2
      </button>
     </div>
    </div>
   </div>
  </Transition>
 </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import { formatThaiDateTime } from '@/utils/date';
import { useToast } from '@/composables/useToast';
import { sanitizeHtml } from '@/utils/sanitize';
import {
 PhUploadSimple, PhDownloadSimple, PhArrowsLeftRight, PhArrowRight, PhTrash, PhCheck,
 PhCaretRight, PhCaretLeft,
 PhPencilSimple, PhWarning, PhFile, PhClock,
 PhCheckCircle, PhX, PhInfo,
 PhFileText, PhBookOpen, PhCalendarBlank, PhTarget, PhChartBar, PhChalkboardTeacher, PhFlag,
 PhHighlighter,
} from '@phosphor-icons/vue';
import FileIcon from '@/components/common/FileIcon.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import DocumentPreviewModal from './DocumentPreviewModal.vue';

const props = defineProps({
 curriculumId: { type: [Number, String], required: true },
 curriculum: { type: Object, default: null },
});
const emit = defineEmits(['reject', 'approve', 'uploaded']);
const authStore = useAuthStore();

const versions = ref([]);
const availableYears = ref([]);
const selectedYear = ref('');
const yearOptions = computed(() => [
  { label: 'ทุกปีการศึกษา', value: '' },
  ...availableYears.value.map(y => ({ label: String(y), value: y }))
]);
const loading = ref(false);
const fetchError = ref('');
const uploadError = ref('');
const uploadSuccess = ref('');
const compareMode = ref(false);
const selectedIds = ref([]);
const previewState = ref(null);
const diffResult = ref(null);
const diffLoading = ref(false);
const diffError = ref('');
const expandedSections = ref(new Set());
const sectionEls = {};
let sectionObserver = null;

const setupSectionObserver = () => {
 sectionObserver?.disconnect();
 sectionObserver = null;
 if (!diffResult.value) return;

 sectionObserver = new IntersectionObserver(
  (entries) => {
   const entering = entries
    .filter(e => e.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
   if (!entering.length) return;
   const num = parseInt(entering[0].target.dataset.sectionNum);
   const idx = diffResult.value?.sections.findIndex(s => s.section_number === num) ?? -1;
   if (idx !== -1) currentSectionIdx.value = idx;
  },
  { rootMargin: '-64px 0px -55% 0px', threshold: 0 },
 );

 nextTick(() => {
  diffResult.value?.sections.forEach(sec => {
   const el = sectionEls[sec.section_number];
   if (el) sectionObserver.observe(el);
  });
 });
};

watch(diffResult, (val) => {
 if (val) nextTick(setupSectionObserver);
 else { sectionObserver?.disconnect(); sectionObserver = null; }
});

onUnmounted(() => { sectionObserver?.disconnect(); });

const isDragging = ref(false);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);

const FACULTY_UPLOADABLE = ['pending_department', 'revision'];
const ADMIN_UPLOADABLE   = ['department_submitted', 'under_committee', 'pending_admin_recheck'];
const canUpload = computed(() => {
 const role = authStore.user?.role;
 const status = props.curriculum?.status;
 if (role === 'faculty') return FACULTY_UPLOADABLE.includes(status);
 if (role === 'admin' || role === 'staff') return ADMIN_UPLOADABLE.includes(status) && versions.value.length > 0;
 return false;
});
const canDelete = computed(() => authStore.user?.role === 'admin');

// เหตุผลที่อัปโหลดไม่ได้ — แสดงใน tooltip
const uploadBlockedReason = computed(() => {
  const status = props.curriculum?.status;
  if (status === 'department_submitted')   return 'รอเจ้าหน้าที่ตรวจสอบ ยังอัปโหลดไม่ได้ในขณะนี้';
  if (status === 'pending_admin_recheck')  return 'รอเจ้าหน้าที่ตรวจสอบเอกสารที่แก้ไข';
  if (status === 'under_committee')        return 'อยู่ระหว่างการพิจารณา ไม่สามารถแก้ไขเอกสารได้';
  if (status === 'approved')              return 'หลักสูตรได้รับการอนุมัติแล้ว';
  return 'ไม่สามารถอัปโหลดได้ในขณะนี้';
});
const isAdminReview = computed(() =>
 authStore.user?.role === 'admin' && props.curriculum?.status === 'department_submitted'
);

const FACULTY_LOCKED = ['department_submitted', 'pending_admin_recheck', 'under_committee', 'approved'];
const ADMIN_LOCKED   = ['under_committee', 'approved'];
const isLocked = computed(() => {
 const role   = authStore.user?.role;
 const status = props.curriculum?.status;
 if (role === 'faculty') return FACULTY_LOCKED.includes(status);
 if (role === 'admin')   return ADMIN_LOCKED.includes(status);
 return false;
});
const docxVersions = computed(() => versions.value.filter(v => v.file_type === 'docx'));
const pdfVersions = computed(() => versions.value.filter(v => v.file_type === 'pdf'));
const fileGroups = computed(() => {
 const groups = [];
 if (pdfVersions.value.length) groups.push({ type: 'pdf', versions: pdfVersions.value });
 if (docxVersions.value.length) groups.push({ type: 'docx', versions: docxVersions.value });
 return groups;
});
const compareDocuments = computed(() =>
 selectedIds.value.map(id => versions.value.find(v => v.id === id)).filter(Boolean)
);

const ROLE_LABELS = {
 admin:     'เจ้าหน้าที่หลักสูตรคณะ',
 faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
 staff:     'เจ้าหน้าที่ภาควิชา',
 registrar: 'เจ้าหน้าที่กองบริการการศึกษา',
 executive: 'ผู้บริหารคณะ',
};
const uploaderLabel = (u) => ROLE_LABELS[u?.role] || '';

const formatDate = formatThaiDateTime;
const toast = useToast();
const formatFileSize = (bytes) => {
 if (!bytes) return '-';
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / 1048576).toFixed(1)} MB`;
};

const annotationCounts = ref({});

const fetchAnnotationCounts = async () => {
 const ids = versions.value.map(v => v.id);
 if (!ids.length) return;
 try {
  const { data } = await api.get(`/curricula/annotations/counts?document_type=tqf2&document_ids=${ids.join(',')}`);
  annotationCounts.value = data.data ?? {};
 } catch { /* silent */ }
};

const fetchVersions = async () => {
 loading.value = true;
 fetchError.value = '';
 try {
  const params = selectedYear.value ? { academic_year: selectedYear.value } : {};
  const { data } = await api.get(`/curricula/${props.curriculumId}/tqf2`, { params });
  versions.value = data.data;
  if (data.meta?.availableYears?.length) {
    availableYears.value = data.meta.availableYears;
  }
  fetchAnnotationCounts();
 } catch (e) {
  fetchError.value = e.response?.data?.message || 'ไม่สามารถโหลดข้อมูล มคอ.2 ได้';
 } finally { loading.value = false; }
};

const uploadFile = async (file) => {
 if (!file) return;
 if (!canUpload.value) return;
 uploadError.value = '';
 uploadSuccess.value = '';
 const form = new FormData();
 form.append('file', file);
 try {
  const { data } = await api.post(`/curricula/${props.curriculumId}/tqf2`, form);
  uploadSuccess.value = file.name;
  await fetchVersions();
  emit('uploaded');
  setTimeout(() => { uploadSuccess.value = ''; }, 5000);
 } catch (err) {
  uploadError.value = err.response?.data?.message || 'อัปโหลดไม่สำเร็จ';
 }
};

const handleUpload = (e) => { uploadFile(e.target.files[0]); e.target.value = ''; };
const handleDrop = (e) => {
 isDragging.value = false;
 if (!canUpload.value) return;
 uploadFile(e.dataTransfer?.files?.[0]);
};

const handleDelete = (doc) => { deleteTarget.value = doc; showDeleteModal.value = true; };
const confirmDelete = async () => {
 if (!deleteTarget.value) return;
 await api.delete(`/curricula/tqf2/${deleteTarget.value.id}`);
 showDeleteModal.value = false;
 deleteTarget.value = null;
 await fetchVersions();
};

const downloadFile = async (url, filename) => {
 try {
  const response = await api.get(url, { responseType: 'blob' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(new Blob([response.data]));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
 } catch { uploadError.value = 'ดาวน์โหลดไม่สำเร็จ'; }
};
const downloadVersion = (id) => {
 const v = versions.value.find(x => x.id === id);
 downloadFile(`/curricula/tqf2/${id}/download`, v?.original_name || 'tqf2');
};
const openPreview = (doc, apiPath, versionLabel = '') => { previewState.value = { doc, apiPath, versionLabel }; };
const handlePreviewDownload = () => {
 if (!previewState.value) return;
 const { doc, apiPath } = previewState.value;
 downloadFile(apiPath.replace('/preview', '/download'), doc.original_name);
};

const enterCompare = () => { compareMode.value = true; selectedIds.value = []; diffResult.value = null; diffError.value = ''; };
const exitCompare = () => { compareMode.value = false; selectedIds.value = []; diffResult.value = null; diffError.value = ''; };
const toggleSelect = (id) => {
 if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id);
 else if (selectedIds.value.length < 2) selectedIds.value = [...selectedIds.value, id];
};

const SECTION_COLORS = [
 { dot: 'bg-slate-400', headerBg: 'bg-slate-50', contentBg: 'bg-slate-50/30', contentBorder: 'border-slate-200' },
 { dot: 'bg-primary-600', headerBg: 'bg-primary-50/50', contentBg: 'bg-primary-50/20', contentBorder: 'border-primary-200' },
 { dot: 'bg-indigo-600', headerBg: 'bg-indigo-50/50', contentBg: 'bg-indigo-50/20', contentBorder: 'border-indigo-200' },
 { dot: 'bg-primary-600', headerBg: 'bg-primary-50/50', contentBg: 'bg-primary-50/20', contentBorder: 'border-primary-200' },
 { dot: 'bg-emerald-600', headerBg: 'bg-emerald-50/50', contentBg: 'bg-emerald-50/20', contentBorder: 'border-emerald-200' },
 { dot: 'bg-orange-500', headerBg: 'bg-orange-50/50', contentBg: 'bg-orange-50/20', contentBorder: 'border-orange-200' },
 { dot: 'bg-rose-600', headerBg: 'bg-rose-50/50', contentBg: 'bg-rose-50/20', contentBorder: 'border-rose-200' },
 { dot: 'bg-violet-600', headerBg: 'bg-violet-50/50', contentBg: 'bg-violet-50/20', contentBorder: 'border-violet-200' },
 { dot: 'bg-cyan-600', headerBg: 'bg-cyan-50/50', contentBg: 'bg-cyan-50/20', contentBorder: 'border-cyan-200' },
];
const SECTION_ICONS = {
 0: PhFileText,           // ส่วนนำ — ปกเอกสาร
 1: PhInfo,               // ข้อมูลทั่วไป
 2: PhBookOpen,           // ข้อมูลเฉพาะของหลักสูตร
 3: PhCalendarBlank,      // ระบบการจัดการศึกษา
 4: PhTarget,             // ผลการเรียนรู้ที่คาดหวัง (PLOs)
 5: PhChartBar,           // หลักเกณฑ์การประเมินผล
 6: PhChalkboardTeacher,  // การพัฒนาคณาจารย์
 7: PhFlag,               // ข้อกำหนดและแนวทางการพัฒนา
};
const sectionIcon = (num) => SECTION_ICONS[num] ?? PhFile;
const sectionColor = (num) => SECTION_COLORS[num] ?? SECTION_COLORS[0];
const changeBarColor = (pct) => { if (!pct) return 'bg-gray-200'; if (pct <= 20) return 'bg-emerald-400'; if (pct <= 50) return 'bg-orange-400'; return 'bg-red-500'; };
const changeTextColor = (pct) => { if (!pct) return 'text-gray-300'; if (pct <= 20) return 'text-emerald-500'; if (pct <= 50) return 'text-orange-500'; return 'text-red-500'; };

const toggleSection = (num) => {
 const s = new Set(expandedSections.value);
 if (s.has(num)) s.delete(num); else s.add(num);
 expandedSections.value = s;
};
const expandAll = () => {
 expandedSections.value = new Set(diffResult.value?.sections.map(s => s.section_number) ?? []);
};

const currentSectionIdx = ref(0);
const currentSection = computed(() => diffResult.value?.sections[currentSectionIdx.value]);

const jumpToSection = (num) => {
 const idx = diffResult.value?.sections.findIndex(s => s.section_number === num) ?? -1;
 if (idx !== -1) currentSectionIdx.value = idx;
 const s = new Set(expandedSections.value);
 s.add(num);
 expandedSections.value = s;
 nextTick(() => {
  const el = sectionEls[num];
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
 });
};

const goNextSection = () => {
 const sections = diffResult.value?.sections ?? [];
 const next = Math.min(currentSectionIdx.value + 1, sections.length - 1);
 jumpToSection(sections[next].section_number);
};
const goPrevSection = () => {
 const sections = diffResult.value?.sections ?? [];
 const prev = Math.max(currentSectionIdx.value - 1, 0);
 jumpToSection(sections[prev].section_number);
};

const loadDiff = async () => {
 if (selectedIds.value.length !== 2) return;
 diffLoading.value = true;
 diffResult.value = null;
 diffError.value = '';
 try {
  const [idA, idB] = selectedIds.value;
  const { data } = await api.get('/curricula/tqf2/compare', { params: { id_a: idA, id_b: idB } });
  const sanitized = {
    ...data.data,
    sections: data.data.sections.map(s => ({ ...s, diffHtml: sanitizeHtml(s.diffHtml) })),
  };
  diffResult.value = sanitized;
  currentSectionIdx.value = 0;
  expandedSections.value = new Set(sanitized.sections.filter(s => s.has_changes).map(s => s.section_number));
 } catch (err) {
  diffError.value = err.response?.data?.message || 'ไม่สามารถวิเคราะห์ความแตกต่างได้';
 } finally {
  diffLoading.value = false;
 }
};

watch(selectedIds, (ids) => { if (ids.length === 2) loadDiff(); });
onMounted(fetchVersions);

</script>

<style scoped>
@keyframes shimmer {
 0% { transform: translateX(-150%) skewX(-25deg); }
 100% { transform: translateX(150%) skewX(-25deg); }
}
.tqf2-diff-content {
 font-family: var(--font-document);
 font-size: 0.9375rem;
 line-height: 1.75;
}
:deep(.tqf2-diff-content ins) {
 background-color: #dcfce7; color: #065f46; text-decoration: none;
 border-radius: var(--radius-sm); padding: 1px 4px; margin: 0 1px;
 box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
:deep(.tqf2-diff-content del) {
 background-color: #fee2e2; color: #9f1239; text-decoration: line-through;
 border-radius: var(--radius-sm); padding: 1px 4px; margin: 0 1px;
 box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
:deep(.tqf2-diff-content table) {
 width: 100%; border-collapse: separate; border-spacing: 0;
 font-size: 0.8125rem; margin: 1rem 0; border: 1px solid #E5E5E5;
 border-radius: var(--radius-lg); overflow: hidden;
}
:deep(.tqf2-diff-content td), :deep(.tqf2-diff-content th) { border: 1px solid #f3f4f6; padding: 10px 14px; vertical-align: top; }
:deep(.tqf2-diff-content th) { background-color: #f9fafb; font-weight: 700; }

/* NOTE: tqf2-diff-content dark mode rules live in base.css (global) — see
   TQF2SideBySideComparison.css comment for why :deep() in scoped CSS won't work. */

/* ── AI Compare Button (model-pill style) ──────────────────────────── */
.ai-compare-btn {
  position: relative;
  background: linear-gradient(135deg, #f5f3ff 0%, #f0f4ff 100%);
  transition: box-shadow 0.2s ease;
}
.ai-compare-btn:hover {
  box-shadow: 0 3px 14px rgba(129, 140, 248, 0.28);
}
/* animated gradient border via mask trick */
.ai-compare-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg, #818cf8, #c084fc, #60a5fa, #818cf8);
  background-size: 300% 300%;
  animation: ai-border-flow 4s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
@keyframes ai-border-flow {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
/* Gemini star: สลับระหว่าง 2 state ที่ดูต่างกันใน 4-pointed star */
.gemini-star {
  color: #818cf8;
  animation: gemini-dance 3s ease-in-out infinite;
  transform-origin: center;
}
.ai-compare-btn:hover .gemini-star {
  color: #6366f1;
}
@keyframes gemini-dance {
  0%, 100% { opacity: 1;    scale: 1;    }
  50%       { opacity: 0.45; scale: 0.88; }
}
</style>
