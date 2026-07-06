<template>
 <div class="min-h-screen flex flex-col lg:flex-row" @click="openDropdown = null">

 <!-- ─── Left: Identity panel (mirrors login) ─── -->
 <aside class="relative flex flex-col w-full lg:w-[45%] shrink-0 overflow-hidden min-h-[320px] lg:min-h-screen">
 <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${loginBg})` }"></div>
 <div class="absolute inset-0" style="background: rgba(49, 46, 129, 0.62);"></div>
 <div class="absolute inset-0" style="background: linear-gradient(to bottom,
 rgba(49,46,129,0.55) 0%,
 rgba(49,46,129,0.15) 40%,
 rgba(49,46,129,0.15) 70%,
 rgba(49,46,129,0.65) 100%);"></div>
 <div class="absolute inset-0 opacity-[0.03]"
 style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 28px 28px;"></div>
 <div class="relative z-10 h-[2px] bg-primary-400/50 shrink-0"></div>

 <div class="relative z-10 flex flex-col flex-1 px-8 py-8 lg:px-12 lg:py-10">

 <!-- University branding -->
 <div class="flex items-center gap-3">
 <!-- ตรา มน. — พื้นขาว badge เดียวกับฝั่งขวา ให้เด่นเท่ากัน -->
 <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
 <img :src="nuLogo" alt="มหาวิทยาลัยนเรศวร" class="w-full h-full object-contain p-0.5" />
 </div>
 <!-- โลโก้คณะ -->
 <div class="w-11 h-11 rounded-full bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
 <img :src="logoSci" alt="คณะวิทยาศาสตร์" class="w-full h-full object-contain p-0.5" />
 </div>
 <div class="border-l border-white/15 pl-3">
 <p class="text-sm font-bold text-white/90 leading-tight">ระบบบริหารจัดการหลักสูตร</p>
 <p class="text-xs text-white/55 mt-0.5">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
 </div>
 </div>

 <div class="flex-1 flex flex-col justify-center relative mt-8 lg:mt-0">
   <!-- Eyebrow — ข้อความล้วน เงียบ ๆ ไม่แย่งหัวข้อ -->
   <span class="inline-flex w-fit items-center gap-1.5 mb-4 text-xs font-semibold text-white/45">
     <PhUserPlus class="w-3.5 h-3.5" weight="bold" />
     สำหรับบุคลากรภายใน
   </span>

   <!-- Heading -->
   <h1 class="text-4xl lg:text-5xl font-bold text-white leading-[1.15]">
     ขอสิทธิ์<br/>เข้าใช้งาน
   </h1>

   <!-- Supporting text — sync กับ stepper ฝั่งขวา -->
   <div class="mt-6 max-w-[280px]">
     <template v-if="!success">
       <!-- คำแนะนำเปลี่ยนแบบ slide เมื่อสลับขั้น -->
       <Transition mode="out-in"
         enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0"
         leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
         <p :key="currentStep" class="text-sm font-bold text-white/90 leading-relaxed">
           {{ steps[currentStep - 1].title }}
         </p>
       </Transition>
       <!-- Progress — ขั้นที่ x/3 + % แทนเส้นเปล่า ๆ -->
       <div class="mt-5">
         <div class="flex items-center justify-between mb-2">
           <span class="text-xs font-medium text-white/50">ขั้นตอนที่ {{ currentStep }} จาก 3</span>
           <span class="text-xs font-medium text-white/55 tabular-nums">{{ Math.round((currentStep / 3) * 100) }}%</span>
         </div>
         <div class="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
           <div class="h-full rounded-full bg-white/80 transition-all duration-500 ease-ios"
             :style="{ width: `${(currentStep / 3) * 100}%` }"></div>
         </div>
       </div>
     </template>
     <p v-else class="text-sm text-white/55 leading-relaxed">
       <span class="font-bold text-white/90">ส่งคำขอเรียบร้อย</span><br/>
       รอผลการอนุมัติทางอีเมล
     </p>
   </div>
 </div>

 <!-- Footer — ไม่มีเส้นคั่น (เหมือน Login) -->
 <div class="mt-8">
 <p class="text-[11px] text-white/30">© 2026 คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
 </div>
 </div>
 </aside>

 <!-- ─── Right: Registration form ─── -->
 <main class="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
 <div class="flex-1 flex flex-col justify-center px-5 py-8 sm:px-8">
 <div class="w-full max-w-[520px] mx-auto">

 <!-- Back link -->
 <div class="flex justify-end mb-4">
 <router-link to="/login"
 class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-xl active:scale-[0.97] transition-all duration-150 ease-ios group shadow-sm">
  <PhCaretLeft weight="bold" class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
  กลับสู่หน้าเข้าสู่ระบบ
 </router-link>
 </div>

 <!-- Registration card -->
 <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-6 py-7">

 <!-- Success state -->
 <div v-if="success" class="text-center py-10">
   <div class="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
     <PhCheckCircle class="w-7 h-7 text-emerald-500" />
   </div>
   <h2 class="text-lg font-bold text-gray-900 mb-2">ส่งคำขอสำเร็จ</h2>
   <p class="text-sm text-gray-500 leading-relaxed">
     ได้รับข้อมูลเรียบร้อยแล้ว<br/>
     กรุณารอรับอีเมลแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ
   </p>
 </div>

 <template v-else>
   <!-- Horizontal stepper -->
   <div class="flex items-center mb-7">
     <template v-for="(s, i) in steps" :key="s.number">
       <div class="flex flex-col items-center gap-1.5 flex-1">
         <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
           :class="currentStep > s.number
             ? 'bg-primary-600 text-white'
             : currentStep === s.number
             ? 'bg-primary-600 text-white ring-4 ring-primary-100'
             : 'bg-gray-100 text-gray-400 border border-gray-200'">
           <svg v-if="currentStep > s.number" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="3" class="w-3 h-3">
             <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
           </svg>
           <span v-else>{{ s.number }}</span>
         </div>
         <span class="text-xs font-medium whitespace-nowrap transition-colors"
           :class="currentStep === s.number ? 'text-primary-700' : currentStep > s.number ? 'text-primary-500' : 'text-gray-400'">
           {{ s.label }}
         </span>
       </div>
       <div v-if="i < steps.length - 1"
         class="flex-1 h-px mx-2 mb-5 transition-all duration-300"
         :class="currentStep > s.number ? 'bg-primary-300' : 'bg-gray-200'"></div>
     </template>
   </div>

   <!-- Step heading -->
   <div class="mb-5">
     <h2 class="text-lg font-bold text-gray-900">
       {{ currentStep === 1 ? 'ข้อมูลส่วนตัว' : currentStep === 2 ? 'ตั้งรหัสผ่าน' : 'ยืนยันข้อมูล' }}
     </h2>
     <p class="text-sm text-gray-500 mt-0.5">{{ steps[currentStep - 1].hint }}</p>
   </div>

 <!-- ── Step 1 — 2-column layout ลดความยาวหน้า (มือถือกลับเป็น 1 คอลัมน์) ── -->
 <div v-if="currentStep === 1" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div class="grid grid-cols-3 gap-2 sm:gap-4 sm:col-span-2">
 <!-- คำนำหน้า — dropdown (3 ช่องเท่ากัน: คำนำหน้า | ชื่อ | นามสกุล) -->
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">คำนำหน้า <span class="text-red-400">*</span></label>
 <div class="relative">
 <button type="button" @click.stop="openDropdown = openDropdown === 'title' ? null : 'title'"
 class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none text-left transition-all truncate shadow-sm"
 :class="form.title ? 'text-gray-900' : 'text-gray-400'">
 {{ form.title || 'เลือก' }}
 </button>
 <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
 :class="{ 'rotate-180': openDropdown === 'title' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
 </svg>
 <transition name="dd">
 <div v-if="openDropdown === 'title'"
 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
 <button type="button" v-for="t in titleOptions" :key="t" @click="form.title = t; openDropdown = null"
 role="option" :aria-selected="form.title === t"
 class="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:bg-primary-50"
 :class="form.title === t ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
 {{ t }}
 </button>
 </div>
 </transition>
 </div>
 </div>
 <!-- ชื่อ -->
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">ชื่อ <span class="text-red-400">*</span></label>
 <input v-model="form.first_name" type="text" placeholder="กรอกชื่อ"
 class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 <!-- นามสกุล -->
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">นามสกุล <span class="text-red-400">*</span></label>
 <input v-model="form.last_name" type="text" placeholder="กรอกนามสกุล"
 class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>

 <div class="space-y-1.5 sm:col-span-2">
 <label class="text-xs font-semibold text-gray-600 block">บทบาทในระบบ <span class="text-red-400">*</span></label>
 <div class="relative">
 <button type="button" @click.stop="openDropdown = openDropdown === 'role' ? null : 'role'"
 class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none text-left transition-all shadow-sm"
 :class="form.role ? 'text-gray-900' : 'text-gray-400'">
 {{ roleOptions.find(r => r.value === form.role)?.label || 'เลือกบทบาทในระบบ' }}
 </button>
 <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
 :class="{ 'rotate-180': openDropdown === 'role' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
 </svg>
 <transition name="dd">
 <div v-if="openDropdown === 'role'"
 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
 <button type="button" v-for="r in roleOptions" :key="r.value" @click="form.role = r.value; openDropdown = null"
 role="option" :aria-selected="form.role === r.value"
 class="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:bg-primary-50"
 :class="form.role === r.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
 {{ r.label }}
 </button>
 </div>
 </transition>
 </div>
 </div>

  <div v-if="['admin', 'staff', 'registrar', 'executive'].includes(form.role)" class="space-y-1.5">
    <label class="text-xs font-semibold text-gray-600 block">
      {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่งงาน' }} <span class="text-red-400">*</span>
    </label>
    <div class="relative">
      <button type="button" @click.stop="openDropdown = openDropdown === 'position' ? null : 'position'"
        class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none text-left transition-all truncate shadow-sm"
        :class="form.position ? 'text-gray-900' : 'text-gray-400'">
        {{ form.position || (form.role === 'executive' ? 'เลือกตำแหน่งบริหาร' : 'เลือกตำแหน่งงาน') }}
      </button>
      <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
        :class="{ 'rotate-180': openDropdown === 'position' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
      <transition name="dd">
        <div v-if="openDropdown === 'position'"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
          <button type="button" v-for="p in (form.role === 'executive' ? ['คณบดี', 'รองคณบดี', 'ผู้ช่วยคณบดี'] : ['นักวิชาการศึกษา', 'เจ้าหน้าที่บริหารงานทั่วไป', 'นักวิทยาศาสตร์'])" :key="p" @click="form.position = p; openDropdown = null"
            role="option" :aria-selected="form.position === p"
            class="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:bg-primary-50"
            :class="form.position === p ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
            {{ p }}
          </button>
        </div>
      </transition>
    </div>
  </div>

  <div v-if="['faculty', 'executive'].includes(form.role)" class="space-y-1.5">
    <label class="text-xs font-semibold text-gray-600 block">ตำแหน่งทางวิชาการ <span class="text-red-400">*</span></label>
    <div class="relative">
      <button type="button" @click.stop="openDropdown = openDropdown === 'academic_position' ? null : 'academic_position'"
        class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none text-left transition-all truncate shadow-sm"
        :class="form.academic_position ? 'text-gray-900' : 'text-gray-400'">
        {{ form.academic_position || 'เลือกตำแหน่งทางวิชาการ' }}
      </button>
      <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
        :class="{ 'rotate-180': openDropdown === 'academic_position' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
      <transition name="dd">
        <div v-if="openDropdown === 'academic_position'"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
          <button type="button" v-for="p in ['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์']" :key="p" @click="form.academic_position = p; openDropdown = null"
            role="option" :aria-selected="form.academic_position === p"
            class="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:bg-primary-50"
            :class="form.academic_position === p ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
            {{ p }}
          </button>
        </div>
      </transition>
    </div>
  </div>

 <transition
 enter-active-class="transition-all duration-300 ease-out"
 enter-from-class="opacity-0 -translate-y-1"
 enter-to-class="opacity-100 translate-y-0"
 leave-active-class="transition-all duration-200 ease-in"
 leave-from-class="opacity-100 translate-y-0"
 leave-to-class="opacity-0 -translate-y-1"
 >
 <div v-if="needsDepartment" class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">สังกัดภาควิชา/หน่วยงาน <span class="text-red-400">*</span></label>
 <div class="relative">
 <button type="button" @click.stop="openDropdown = openDropdown === 'department' ? null : 'department'"
 class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none text-left transition-all truncate shadow-sm"
 :class="form.department_id ? 'text-gray-900' : 'text-gray-400'">
 {{ academicDepartments.find(d => d.id === form.department_id)?.name || 'เลือกภาควิชา' }}
 </button>
 <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
 :class="{ 'rotate-180': openDropdown === 'department' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
 </svg>
 <transition name="dd">
 <div v-if="openDropdown === 'department'"
 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
 <button type="button" v-for="d in academicDepartments" :key="d.id" @click="form.department_id = d.id; openDropdown = null"
 role="option" :aria-selected="form.department_id === d.id"
 class="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:bg-primary-50"
 :class="form.department_id === d.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
 {{ d.name }}
 </button>
 </div>
 </transition>
 </div>
 </div>
 </transition>

 <!-- หน่วยงานคงที่สำหรับเจ้าหน้าที่กองบริการการศึกษา -->
 <div v-if="form.role === 'registrar'" class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">สังกัดภาควิชา/หน่วยงาน <span class="text-red-400">*</span></label>
 <div class="w-full px-3.5 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 shadow-sm">
 กองบริการการศึกษา
 </div>
 </div>

 <!-- ── ช่องทางติดต่อ — ปิดท้ายด้วยอีเมล + เบอร์ (ไม่บังคับ) คู่กัน ── -->
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">อีเมลมหาวิทยาลัย <span class="text-red-400">*</span></label>
 <div class="relative group">
 <PhEnvelope class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
 <input v-model="form.email" type="email" placeholder="ชื่อบัญชี@nu.ac.th"
 class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>

 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">เบอร์ติดต่อ <span class="text-gray-400 font-normal">(ไม่บังคับ)</span></label>
 <div class="relative group">
 <PhPhone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
 <input :value="form.phone" @input="formatPhone" type="tel" placeholder="0XX-XXX-XXXX" maxlength="12"
 class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>
 </div>

 <!-- ── Step 2 ── -->
 <div v-else-if="currentStep === 2" class="space-y-5">

 <!-- Password -->
 <div class="space-y-2">
 <label class="text-xs font-semibold text-gray-600 block">รหัสผ่าน</label>
 <div class="relative group">
 <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
 <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="อย่างน้อย 8 ตัวอักษร" @input="showPwdError = false"
 class="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all text-gray-900" />
 <button type="button" @click="showPwd = !showPwd"
 :aria-label="showPwd ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
 class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded">
 <PhEyeSlash v-if="showPwd" class="w-4 h-4" aria-hidden="true" />
 <PhEye v-else class="w-4 h-4" aria-hidden="true" />
 </button>
 </div>
 <!-- Requirements chips -->
 <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
 <div v-if="form.password !== ''" class="flex flex-wrap gap-1.5 pt-0.5">
  <span v-for="(req, i) in pwdRequirements" :key="i"
  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
  :class="req.met ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200' : 'bg-gray-100 text-gray-400'">
  <svg v-if="req.met" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-2.5 h-2.5 shrink-0">
   <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
  <span v-else class="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"></span>
  {{ req.short }}
  </span>
 </div>
 </Transition>
 <!-- เตือนเมื่อกดถัดไปแต่รหัสยังไม่ครบเกณฑ์ -->
 <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
 <p v-if="showPwdError" class="text-xs font-medium text-red-500 pt-0.5">
 รหัสผ่านยังไม่ตรงตามเกณฑ์ทั้งหมด กรุณาตรวจสอบเงื่อนไขด้านบน
 </p>
 </Transition>
 </div>

 <!-- Confirm password -->
 <div class="space-y-2">
 <label class="text-xs font-semibold text-gray-600 block">ยืนยันรหัสผ่าน</label>
 <div class="relative group">
 <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
 <input v-model="form.confirm_password" :type="showPwd ? 'text' : 'password'" placeholder="พิมพ์รหัสผ่านอีกครั้ง"
 :class="[
  'w-full pl-10 pr-10 py-3 text-sm rounded-xl border bg-white outline-none placeholder:text-gray-400 transition-all text-gray-900',
  form.confirm_password !== '' && !passwordsMatch
  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'
  : 'border-gray-300 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10'
 ]" />
 <div v-if="form.confirm_password !== ''" class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
 <PhCheckCircle v-if="passwordsMatch" class="w-4 h-4 text-emerald-500" />
 <PhXCircle v-else class="w-4 h-4 text-red-400" />
 </div>
 </div>
 <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
 <p v-if="form.confirm_password !== '' && !passwordsMatch" class="text-xs font-medium text-red-500">
 รหัสผ่านไม่ตรงกัน
 </p>
 </Transition>
 </div>

 </div>

 <!-- ── Step 3 ── -->
 <div v-else-if="currentStep === 3" class="space-y-2">
 <div class="bg-white ring-1 ring-inset ring-primary-100 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">ชื่อ-นามสกุล</span>
 <span class="text-sm text-gray-900 font-medium">{{ [form.title, form.first_name, form.last_name].filter(Boolean).join(' ') }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">อีเมล</span>
 <span class="text-sm text-gray-900 font-medium">{{ form.email }}</span>
 </div>
 <div v-if="form.phone" class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">เบอร์ติดต่อ</span>
 <span class="text-sm text-gray-900 font-medium">{{ form.phone }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">
   {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่งงาน' }}
 </span>
 <span class="text-sm text-gray-900 font-medium">
   {{ ['admin', 'staff', 'registrar', 'executive'].includes(form.role) ? (form.position || 'ไม่ระบุ') : (form.academic_position || 'ไม่ระบุ') }}
 </span>
 </div>
 <div v-if="needsDepartment || form.role === 'registrar'" class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">สังกัด</span>
 <span class="text-sm text-gray-900 font-medium">{{ form.role === 'registrar' ? 'กองบริการการศึกษา' : (departments.find(d => d.id === form.department_id)?.name || 'ไม่ระบุ') }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">บทบาทในระบบ</span>
 <span class="text-sm text-gray-900 font-medium">{{ roleOptions.find(r => r.value === form.role)?.label || 'ไม่ระบุ' }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">รหัสผ่าน</span>
 <span class="text-sm text-gray-400 tracking-widest">••••••••</span>
 </div>
 </div>
 <p class="text-xs text-gray-500 pt-2 text-center">
 หลังส่งคำขอ ผู้ดูแลระบบจะตรวจสอบและแจ้งผลทางอีเมล
 </p>
 </div>

 <!-- Error -->
 <div v-if="error" class="flex items-start gap-2.5 p-3.5 bg-red-50 ring-1 ring-inset ring-red-100 rounded-xl mt-4">
 <PhInfo class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
 <p class="text-xs font-medium text-red-700">{{ error }}</p>
 </div>

 <!-- Navigation -->
 <div class="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
   <button v-if="currentStep === 1" type="button" @click="$router.push('/login')"
     class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl active:scale-[0.97] transition-all ease-ios">
     ยกเลิก
   </button>
   <button v-else type="button" @click="prevStep"
     class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl active:scale-[0.97] transition-all ease-ios group">
     <PhCaretLeft weight="bold" class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
     ย้อนกลับ
   </button>

   <button v-if="currentStep < 3" type="button" @click="nextStep"
     class="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-all ease-ios active:scale-[0.97] group">
     ถัดไป
     <PhCaretRight weight="bold" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
   </button>
   <button v-else type="button" @click="handleRegister" :disabled="loading"
     class="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-all ease-ios disabled:opacity-50 active:scale-[0.97]">
     <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
     <PhUserPlus v-else class="w-4 h-4" />
     {{ loading ? 'กำลังส่งคำขอ…' : 'ส่งคำขอลงทะเบียน' }}
   </button>
 </div>
 </template>

 </div><!-- end card -->
 </div>
 </div>
 </main>
 </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import {
 PhEye, PhEyeSlash, PhUserPlus, PhCheckCircle,
 PhEnvelope, PhLockSimple, PhInfo, PhXCircle,
 PhCaretLeft, PhCaretRight, PhPhone
} from '@phosphor-icons/vue';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import loginBg from '@/assets/images/login-bg.jpg';

const router = useRouter();
const form = ref({
 title: '', first_name: '', last_name: '', email: '', phone: '',
 password: '', confirm_password: '',
 role: '', department_id: '', position: '', academic_position: ''
});

const needsDepartment = computed(() => ['faculty', 'staff'].includes(form.value.role));

 watch(() => form.value.role, (newRole) => {
  form.value.position = '';
  if (!['faculty', 'executive'].includes(newRole)) {
    form.value.academic_position = '';
  }
  form.value.department_id = '';
});

const departments = ref([]);
const academicDepartments = computed(() => departments.value.filter(d => d.name !== 'งานบริการการศึกษา'));
const loading = ref(false);
const error = ref('');
const success = ref(false);
const showPwd = ref(false);
const currentStep = ref(1);
const showPwdError = ref(false);
const openDropdown = ref(null);

const steps = [
 { number: 1, label: 'ข้อมูลส่วนตัว', title: 'เริ่มจากข้อมูลของท่าน', hint: 'กรอกชื่อ เลือกบทบาทและสังกัด แล้วระบุช่องทางติดต่อ' },
 { number: 2, label: 'รหัสผ่าน', title: 'ตั้งรหัสผ่านให้ปลอดภัย', hint: 'อย่างน้อย 8 ตัว มีพิมพ์ใหญ่ เล็ก ตัวเลข และอักขระพิเศษ' },
 { number: 3, label: 'ยืนยัน', title: 'ตรวจสอบก่อนส่ง', hint: 'ผู้ดูแลระบบจะตรวจสอบและแจ้งผลทางอีเมล' },
];

const titleOptions = ['นาย', 'นาง', 'นางสาว', 'ดร.'];

const roleOptions = [
 { value: 'faculty', label: 'อาจารย์ผู้รับผิดชอบหลักสูตร' },
 { value: 'staff', label: 'เจ้าหน้าที่สาขาวิชา' },
 { value: 'registrar', label: 'เจ้าหน้าที่หลักสูตร กองบริการการศึกษา' },
 { value: 'executive', label: 'ผู้บริหารคณะวิทยาศาสตร์' },
];

const passwordsMatch = computed(() =>
  form.value.confirm_password !== '' && form.value.password === form.value.confirm_password
);

const pwdRequirements = computed(() => {
 const pwd = form.value.password || '';
 return [
 { short: '8+ ตัวอักษร', met: pwd.length >= 8 },
 { short: 'A-Z', met: /[A-Z]/.test(pwd) },
 { short: 'a-z', met: /[a-z]/.test(pwd) },
 { short: '0-9', met: /\d/.test(pwd) },
 { short: '!@#$%', met: /[^a-zA-Z0-9]/.test(pwd) },
 ];
});

const formatPhone = (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
  let out = digits;
  if (digits.length > 6) out = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
  else if (digits.length > 3) out = digits.slice(0, 3) + '-' + digits.slice(3);
  form.value.phone = out;
};

const nextStep = () => {
 error.value = '';
 if (currentStep.value === 1) {
 if (!form.value.first_name.trim() || !form.value.last_name.trim()) { error.value = 'กรุณากรอกชื่อและนามสกุลของท่านให้ครบถ้วน'; return; }
 if (!form.value.role) { error.value = 'กรุณาเลือกบทบาทในระบบของท่าน'; return; }
 if (needsDepartment.value && !form.value.department_id) { error.value = 'กรุณาเลือกภาควิชาที่ท่านสังกัด'; return; }
 if (!form.value.email.trim()) { error.value = 'กรุณากรอกอีเมลของท่าน'; return; }
 if (!form.value.email.trim().endsWith('@nu.ac.th')) { error.value = 'กรุณาใช้อีเมลมหาวิทยาลัย (@nu.ac.th) เท่านั้น'; return; }
 }
 if (currentStep.value === 2) {
 const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
 if (!passwordRegex.test(form.value.password)) { showPwdError.value = true; return; }
 showPwdError.value = false;
 if (form.value.password !== form.value.confirm_password) { error.value = 'รหัสผ่านไม่ตรงกัน'; return; }
 }
 currentStep.value++;
};

const prevStep = () => { error.value = ''; currentStep.value--; };

const handleRegister = async () => {
 error.value = '';
 loading.value = true;
 try {
 await axios.post('/api/auth/register', {
 title: form.value.title || null,
 first_name: form.value.first_name,
 last_name: form.value.last_name,
 email: form.value.email,
 password: form.value.password,
 role: form.value.role,
 department_id: form.value.department_id || null,
 position: form.value.position || null,
 academic_position: form.value.academic_position || null,
 phone: form.value.phone || null,
 });
 success.value = true;
 } catch (e) {
 error.value = e.response?.data?.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
 } finally {
 loading.value = false;
 }
};

onMounted(async () => {
 try {
 const { data } = await axios.get('/api/auth/departments-public');
 departments.value = data.data || [];
 } catch {}
});
</script>

<style scoped>
/* Dropdown menu — animate เฉพาะ opacity + transform (ไม่แตะ box-shadow, ไม่ scale) จึงไม่กระตุก */
.dd-enter-active {
  transition: opacity 0.18s ease-out, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;
}
.dd-leave-active {
  transition: opacity 0.12s ease-in, transform 0.12s ease-in;
  will-change: transform, opacity;
}
.dd-enter-from,
.dd-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .dd-enter-active,
  .dd-leave-active {
    transition: opacity 0.12s ease;
  }
  .dd-enter-from,
  .dd-leave-to {
    transform: none;
  }
}
</style>