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
 <img :src="nuLogo" alt="Naresuan University" class="h-10 w-auto shrink-0 opacity-90" />
 <img :src="logoSci" alt="Faculty of Science"
 class="h-10 w-10 rounded-full object-contain border border-white/15 p-0.5 opacity-90" />
 <div class="border-l border-white/15 pl-3">
 <p class="text-sm font-bold text-white/90 leading-tight">ระบบบริหารจัดการหลักสูตร</p>
 <p class="text-xs text-white/55 mt-0.5">คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
 </div>
 </div>

 <div class="flex-1 flex flex-col justify-center relative">
   <!-- Decorative line -->
   <div class="w-10 h-[3px] bg-white/60 rounded-full mb-5"></div>

   <!-- Heading -->
   <h1 class="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
     ขอสิทธิ์<br/>เข้าใช้งาน
   </h1>

   <!-- Supporting text -->
   <p class="mt-4 text-sm text-white/55 leading-relaxed max-w-[240px]">
     กรอกข้อมูล 3 ขั้นตอน<br/>
     ผู้ดูแลระบบจะแจ้งผลทางอีเมล
   </p>
 </div>

 <!-- Footer -->
 <div class="mt-8 pt-4 border-t border-white/10">
 <p class="text-[11px] text-white/30">© 2026 คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร</p>
 </div>
 </div>
 </aside>

 <!-- ─── Right: Registration form ─── -->
 <main class="flex-1 flex flex-col bg-primary-50 overflow-y-auto">
 <div class="flex-1 flex flex-col justify-center px-8 py-10 lg:px-12">
 <div class="w-full max-w-[500px] mx-auto">

 <!-- Back link -->
 <div class="flex justify-end mb-8">
 <router-link to="/login"
 class="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3.5 py-2 rounded-lg active:scale-[0.97] transition-all duration-150 ease-ios group">
  <PhCaretLeft weight="bold" class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
  เข้าสู่ระบบ
 </router-link>
 </div>

 <!-- Success state -->
 <div v-if="success" class="text-center py-8">
 <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
 <PhCheckCircle class="w-8 h-8 text-emerald-600" />
 </div>
 <h2 class="text-xl font-bold text-gray-900 mb-2">ส่งคำขอสำเร็จ</h2>
 <p class="text-sm text-gray-500 leading-relaxed">
 ได้รับข้อมูลเรียบร้อยแล้ว<br/>
 กรุณารอรับอีเมลแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ
 </p>
 </div>

 <template v-else>
 <!-- Horizontal stepper -->
 <div class="flex items-start mb-8">
 <template v-for="(s, i) in steps" :key="s.number">
 <div class="flex flex-col items-center gap-1.5 flex-1">
 <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
 :class="currentStep > s.number
 ? 'bg-primary-600 text-white'
 : currentStep === s.number
 ? 'bg-primary-600 text-white ring-4 ring-primary-100'
 : 'bg-gray-200 text-gray-500'">
 <svg v-if="currentStep > s.number" viewBox="0 0 24 24" fill="none" stroke="currentColor"
 stroke-width="3" class="w-3.5 h-3.5">
 <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
 </svg>
 <span v-else>{{ s.number }}</span>
 </div>
 <span class="text-[10px] font-semibold whitespace-nowrap"
 :class="currentStep === s.number ? 'text-primary-700' : 'text-gray-500'">
 {{ s.label }}
 </span>
 </div>
 <div v-if="i < steps.length - 1"
 class="flex-1 h-0.5 mt-4 mx-1 transition-all"
 :class="currentStep > s.number ? 'bg-primary-400' : 'bg-gray-200'"></div>
 </template>
 </div>

 <!-- Step heading -->
 <div class="mb-6">
 <h2 class="text-xl font-bold text-gray-900">
 {{ currentStep === 1 ? 'ข้อมูลส่วนตัว' : currentStep === 2 ? 'ตั้งรหัสผ่าน' : 'ยืนยันข้อมูล' }}
 </h2>
 </div>

 <!-- ── Step 1 ── -->
 <div v-if="currentStep === 1" class="space-y-4">
 <div class="grid grid-cols-2 gap-4">
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">ชื่อจริง</label>
 <input v-model="form.first_name" type="text" placeholder="กรอกชื่อจริง"
 class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">นามสกุล</label>
 <input v-model="form.last_name" type="text" placeholder="กรอกนามสกุล"
 class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>

 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">อีเมลมหาวิทยาลัย</label>
 <div class="relative">
 <PhEnvelope class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input v-model="form.email" type="email" placeholder="ชื่อบัญชี@nu.ac.th"
 class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>

 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">เบอร์ติดต่อ <span class="text-gray-400 font-normal">(ไม่บังคับ)</span></label>
 <div class="relative">
 <PhPhone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input v-model="form.phone" type="tel" placeholder="0XX-XXX-XXXX"
 class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all shadow-sm text-gray-900" />
 </div>
 </div>

 <div class="space-y-1.5">
 <label class="text-xs font-semibold text-gray-600 block">บทบาทในระบบ</label>
 <div class="relative">
 <button type="button" @click.stop="openDropdown = openDropdown === 'role' ? null : 'role'"
 class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 outline-none text-left transition-all shadow-sm"
 :class="form.role ? 'text-gray-900' : 'text-gray-400'">
 {{ roleOptions.find(r => r.value === form.role)?.label || 'เลือกบทบาทในระบบ' }}
 </button>
 <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
 :class="{ 'rotate-180': openDropdown === 'role' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
 </svg>
 <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
 <div v-if="openDropdown === 'role'"
 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
 <div v-for="r in roleOptions" :key="r.value" @click="form.role = r.value; openDropdown = null"
 class="px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700"
 :class="form.role === r.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
 {{ r.label }}
 </div>
 </div>
 </transition>
 </div>
 </div>

  <div v-if="['admin', 'staff', 'registrar', 'executive'].includes(form.role)" class="space-y-1.5">
    <label class="text-xs font-semibold text-gray-600 block">
      {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่ง' }}
    </label>
    <div class="relative">
      <button type="button" @click.stop="openDropdown = openDropdown === 'position' ? null : 'position'"
        class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 outline-none text-left transition-all truncate shadow-sm"
        :class="form.position ? 'text-gray-900' : 'text-gray-400'">
        {{ form.position || (form.role === 'executive' ? 'เลือกตำแหน่งบริหาร' : 'เลือกตำแหน่ง') }}
      </button>
      <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
        :class="{ 'rotate-180': openDropdown === 'position' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
        <div v-if="openDropdown === 'position'"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
          <div v-for="p in (form.role === 'executive' ? ['คณบดี', 'รองคณบดี', 'ผู้ช่วยคณบดี'] : ['นักวิชาการศึกษา', 'เจ้าหน้าที่บริหารงานทั่วไป', 'นักวิชาการคอมพิวเตอร์'])" :key="p" @click="form.position = p; openDropdown = null"
            class="px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700"
            :class="form.position === p ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
            {{ p }}
          </div>
        </div>
      </transition>
    </div>
  </div>

  <div v-if="['faculty', 'executive'].includes(form.role)" class="space-y-1.5">
    <label class="text-xs font-semibold text-gray-600 block">ตำแหน่งวิชาการ</label>
    <div class="relative">
      <button type="button" @click.stop="openDropdown = openDropdown === 'academic_position' ? null : 'academic_position'"
        class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 outline-none text-left transition-all truncate shadow-sm"
        :class="form.academic_position ? 'text-gray-900' : 'text-gray-400'">
        {{ form.academic_position || 'เลือกตำแหน่งวิชาการ' }}
      </button>
      <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
        :class="{ 'rotate-180': openDropdown === 'academic_position' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
        <div v-if="openDropdown === 'academic_position'"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
          <div v-for="p in ['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์']" :key="p" @click="form.academic_position = p; openDropdown = null"
            class="px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700"
            :class="form.academic_position === p ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
            {{ p }}
          </div>
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
 <label class="text-xs font-semibold text-gray-600 block">ภาควิชาสังกัด</label>
 <div class="relative">
 <button type="button" @click.stop="openDropdown = openDropdown === 'department' ? null : 'department'"
 class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:border-primary-400 outline-none text-left transition-all truncate shadow-sm"
 :class="form.department_id ? 'text-gray-900' : 'text-gray-400'">
 {{ departments.find(d => d.id === form.department_id)?.name || 'เลือกภาควิชา' }}
 </button>
 <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none transition-transform"
 :class="{ 'rotate-180': openDropdown === 'department' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
 </svg>
 <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
 <div v-if="openDropdown === 'department'"
 class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
 <div v-for="d in departments" :key="d.id" @click="form.department_id = d.id; openDropdown = null"
 class="px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-ios hover:bg-primary-50 hover:text-primary-700"
 :class="form.department_id === d.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 font-medium'">
 {{ d.name }}
 </div>
 </div>
 </transition>
 </div>
 </div>
 </transition>
 </div>

 <!-- ── Step 2 ── -->
 <div v-else-if="currentStep === 2" class="space-y-5">

 <!-- Password -->
 <div class="space-y-2">
 <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase block">รหัสผ่าน</label>
 <div class="relative">
 <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="อย่างน้อย 8 ตัวอักษร"
 class="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none placeholder:text-gray-400 transition-all text-gray-900" />
 <button type="button" @click="showPwd = !showPwd"
 class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-all duration-150 ease-ios">
 <PhEyeSlash v-if="showPwd" class="w-4 h-4" />
 <PhEye v-else class="w-4 h-4" />
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
 </div>

 <!-- Confirm password -->
 <div class="space-y-2">
 <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase block">ยืนยันรหัสผ่าน</label>
 <div class="relative">
 <PhLockSimple class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
 <span class="text-sm text-gray-900 font-medium">{{ form.first_name }} {{ form.last_name }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">อีเมล</span>
 <span class="text-sm text-gray-900 font-medium">{{ form.email }}</span>
 </div>
 <div class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">
   {{ form.role === 'executive' ? 'ตำแหน่งบริหาร' : 'ตำแหน่ง' }}
 </span>
 <span class="text-sm text-gray-900 font-medium">
   {{ ['admin', 'staff', 'registrar', 'executive'].includes(form.role) ? (form.position || 'ไม่ระบุ') : (form.academic_position || 'ไม่ระบุ') }}
 </span>
 </div>
 <div v-if="needsDepartment" class="flex items-center px-5 py-3.5 gap-4">
 <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">ภาควิชา</span>
 <span class="text-sm text-gray-900 font-medium">{{ departments.find(d => d.id === form.department_id)?.name || 'ไม่ระบุ' }}</span>
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
 <div class="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
 <button v-if="currentStep === 1" type="button" @click="$router.push('/login')"
 class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 rounded-xl active:scale-[0.97] transition-all ease-ios">
 ยกเลิก
 </button>
 <button v-else type="button" @click="prevStep"
 class="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 rounded-xl active:scale-[0.97] transition-all ease-ios group">
 <PhCaretLeft weight="bold" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
 ย้อนกลับ
 </button>

 <button v-if="currentStep < 3" type="button" @click="nextStep"
 class="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm transition-all ease-ios active:scale-[0.97] group">
 ถัดไป
 <PhCaretRight weight="bold" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
 </button>
 <button v-else type="button" @click="handleRegister" :disabled="loading"
 class="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-sm transition-all ease-ios disabled:opacity-50 active:scale-[0.97]">
 <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
 <PhUserPlus v-else class="w-4 h-4" />
 {{ loading ? 'กำลังส่งคำขอ…' : 'ส่งคำขอลงทะเบียน' }}
 </button>
 </div>
 </template>

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
 PhGraduationCap, PhEnvelope, PhLockSimple, PhInfo, PhXCircle,
 PhCaretLeft, PhCaretRight, PhPhone
} from '@phosphor-icons/vue';
import nuLogo from '@/assets/images/logo-nu.png';
import logoSci from '@/assets/images/logo-sci.png';
import loginBg from '@/assets/images/login-bg.jpg';

const router = useRouter();
const form = ref({
 first_name: '', last_name: '', email: '', phone: '',
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
const loading = ref(false);
const error = ref('');
const success = ref(false);
const showPwd = ref(false);
const currentStep = ref(1);
const showPwdError = ref(false);
const openDropdown = ref(null);

const steps = [
 { number: 1, label: 'ข้อมูลส่วนตัว' },
 { number: 2, label: 'รหัสผ่าน' },
 { number: 3, label: 'ยืนยัน' },
];

const roleOptions = [
 { value: 'faculty', label: 'อาจารย์ผู้รับผิดชอบหลักสูตร' },
 { value: 'staff', label: 'เจ้าหน้าที่สาขา' },
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

const nextStep = () => {
 error.value = '';
 if (currentStep.value === 1) {
 if (!form.value.first_name.trim() || !form.value.last_name.trim()) { error.value = 'กรุณากรอกชื่อและนามสกุล'; return; }
 if (!form.value.email.trim()) { error.value = 'กรุณากรอกอีเมล'; return; }
 if (!form.value.email.trim().endsWith('@nu.ac.th')) { error.value = 'กรุณาใช้อีเมลมหาวิทยาลัย (@nu.ac.th) เท่านั้น'; return; }
 if (!form.value.role) { error.value = 'กรุณาเลือกบทบาทในระบบ'; return; }
 if (needsDepartment.value && !form.value.department_id) { error.value = 'กรุณาเลือกภาควิชาสังกัด'; return; }
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