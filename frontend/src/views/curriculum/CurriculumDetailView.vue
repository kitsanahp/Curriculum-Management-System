<template>
  <div v-if="curriculumStore.loading" class="space-y-6">
    <div class="h-12 bg-white rounded-2xl border border-gray-200 w-3/4 animate-pulse"></div>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div class="h-96 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
      <div class="h-96 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
    </div>
  </div>
  
  <div v-else-if="!c" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="bg-gray-50 p-8 rounded-full mb-4">
      <PhFile class="w-12 h-12 text-gray-300" aria-hidden="true" />
    </div>
    <h3 class="text-lg font-bold text-gray-900">ไม่พบหลักสูตร</h3>
    <p class="text-sm text-gray-500 mt-1">ข้อมูลอาจถูกลบหรือท่านไม่มีสิทธิ์เข้าถึง</p>
    <button @click="router.back()" class="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
      <PhCaretLeft class="w-4 h-4" aria-hidden="true" />
      กลับไปหน้าก่อนหน้า
    </button>
  </div>

  <div v-else class="space-y-5">
    <!-- Hero Header Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 ">

      <!-- Title + Status -->
      <div class="px-4 sm:px-6 lg:px-8 pt-6 pb-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

          <!-- Left: back button + dept icon tile + identity -->
          <div class="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
            <button type="button" @click="router.back()" aria-label="ย้อนกลับ"
              class="cursor-pointer shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 active:scale-[0.88] transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <PhCaretLeft class="w-5 h-5" />
            </button>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500 truncate">{{ c.department?.name || 'ไม่ระบุภาควิชา' }}</p>
              <h1 class="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-1">
                {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
              </h1>
              <p v-if="c.field_of_study && c.degree_name" class="text-sm sm:text-base font-medium text-gray-600 mt-1 truncate">
                {{ c.degree_name }}
              </p>

              <!-- Meta badges (ภาควิชาย้ายไปเป็น eyebrow ด้านบน) -->
              <div class="flex flex-wrap items-center gap-1.5 mt-3">
                <span :class="[
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                  { bachelor: 'bg-blue-50 text-blue-700', master: 'bg-purple-50 text-purple-700', doctoral: 'bg-indigo-50 text-indigo-700' }[c.degree_level] || 'bg-gray-100 text-gray-500'
                ]">
                  {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
                </span>
                <span :class="[
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  c.curriculum_type === 'new'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                    : 'bg-sky-50 text-sky-700 ring-sky-600/20'
                ]">
                  {{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}
                </span>
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  ปีหลักสูตร {{ c.curriculum_year }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right: status -->
          <div class="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
            <RevisionCycleBadge :curriculum-year="c.curriculum_year" />
            <StatusBadge :status="c.status" :curriculum="c" />
          </div>

        </div>
      </div>

      <!-- Tab Navigation (Clean Underline Style - Like Image) -->
      <div class="border-t border-gray-200 px-4 sm:px-6 bg-white rounded-b-2xl">
        <nav class="flex flex-nowrap gap-5 sm:gap-8 overflow-x-auto -mb-px" style="scrollbar-width:none" aria-label="Tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="switchTab(tab.key)"
            :aria-selected="activeTab === tab.key"
            role="tab"
            :class="[
              'group inline-flex items-center gap-2 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ease-ios outline-none select-none border-b-2',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ]">
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Workflow action bar (decision zone) -->
    <div v-if="hasActions"
      class="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 sm:px-5 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">

        <!-- Context: next-step indicator (badge + title inline, hint below) -->
        <div v-if="actionContext" class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 shrink-0">
              <PhListChecks class="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
              ขั้นตอนถัดไป
            </span>
            <p class="text-sm sm:text-[15px] font-bold text-gray-900">{{ actionContext.title }}</p>
          </div>
          <p class="text-xs sm:text-[13px] text-red-500 leading-relaxed mt-1 min-w-0">
            {{ actionContext.hint }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap shrink-0">
          <!-- Faculty ส่งหลักสูตรครั้งแรก / Admin ส่งแทนภาควิชา -->
          <span
            v-if="(authStore.isFaculty || authStore.isAdmin) && (c.status === 'pending_department' || (c.status === 'revision' && !c.current_committee_step_id))"
            :data-tooltip="!hasDocuments ? 'กรุณาอัปโหลดเอกสารก่อนส่งหลักสูตร' : undefined"
            data-tooltip-left>
            <button
              :disabled="submitting || !hasDocuments"
              @click="handleSubmit"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 h-11 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhPaperPlaneTilt class="w-4 h-4" weight="bold" aria-hidden="true" />
              {{ authStore.isAdmin ? 'ส่งหลักสูตรแทนภาควิชา' : 'ส่งหลักสูตรเพื่อตรวจสอบ' }}
            </button>
          </span>

          <!-- Faculty ส่งคืนหลังคณะกรรมการตีกลับ / Admin ส่งแทนภาควิชา -->
          <span
            v-if="(authStore.isFaculty || authStore.isAdmin) && c.status === 'revision' && c.current_committee_step_id"
            :data-tooltip="!hasDocuments ? 'กรุณาอัปโหลดเอกสารก่อนส่งหลักสูตร' : undefined"
            data-tooltip-left>
            <button
              :disabled="submitting || !hasDocuments"
              @click="handleResubmit"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 h-11 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhPaperPlaneTilt class="w-4 h-4" weight="bold" aria-hidden="true" />
              {{ authStore.isAdmin ? 'ส่งแทนภาควิชาเข้าขั้นตอนเดิม' : 'ส่งให้งานหลักสูตรตรวจสอบ' }}
            </button>
          </span>

          <!-- Admin: ตรวจสอบครั้งแรก (department_submitted) -->
          <template v-if="authStore.isAdmin && c.status === 'department_submitted'">
            <button :disabled="submitting" @click="showRejectModal = true"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 h-11 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50 hover:ring-red-400 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhArrowCounterClockwise class="w-4 h-4" weight="bold" aria-hidden="true" />
              ส่งกลับแก้ไข
            </button>
            <button :disabled="submitting" @click="handleApprove"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 h-11 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhCheck class="w-4 h-4" weight="bold" aria-hidden="true" />
              นำเข้าที่ประชุมคณะกรรมการ
            </button>
          </template>

          <!-- Admin: ตรวจสอบหลังคณะกรรมการตีกลับ (pending_admin_recheck) -->
          <template v-if="authStore.isAdmin && c.status === 'pending_admin_recheck'">
            <button :disabled="submitting" @click="showRecheckRejectModal = true"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 h-11 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50 hover:ring-red-400 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhArrowCounterClockwise class="w-4 h-4" weight="bold" aria-hidden="true" />
              ส่งกลับแก้ไข
            </button>
            <button :disabled="submitting" @click="handleApproveRecheck"
              class="shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 h-11 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200 ease-ios">
              <PhCheck class="w-4 h-4" weight="bold" aria-hidden="true" />
              นำเข้าที่ประชุมคณะกรรมการ
            </button>
          </template>
        </div>
      </div>
    <!-- /workflow action bar card -->

    <!-- Main Grid Layout -->
    <div :class="['grid grid-cols-1 gap-5 items-start', activeTab === 'info' ? 'lg:grid-cols-[1fr_minmax(280px,360px)]' : '']">

      <!-- Left/Main Column (Tab Content) -->
      <div class="min-w-0">
        <div class="space-y-5">

        <!-- Tab: Info -->
        <template v-if="activeTab === 'info'">

          <!-- Detailed Info Card -->
          <section class="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                <PhFileText class="w-4 h-4 text-gray-400 shrink-0" />
                ข้อมูลหลักสูตร
              </h2>
              <button v-if="canEdit && !editingInfo" @click="startEditInfoBridge"
                class="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-all duration-150 ease-ios">
                แก้ไข
              </button>
            </div>
            <!-- View Mode — Perfectly aligned with Edit Mode -->
            <div v-if="!editingInfo" class="px-6 py-5">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- ระดับปริญญา -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ระดับปริญญา</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                    {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] || '-' }}
                  </dd>
                </div>
                <!-- ภาควิชา/งานบริการการศึกษา -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ภาควิชา/งานบริการการศึกษา</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                    {{ c.department?.name || '-' }}
                  </dd>
                </div>
                <!-- สาขาวิชา -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">สาขาวิชา</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                    {{ c.field_of_study || '-' }}
                  </dd>
                </div>
                <!-- ประเภทหลักสูตร -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ประเภทหลักสูตร</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                    {{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}
                  </dd>
                </div>
                <!-- ปีหลักสูตร -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ปีหลักสูตร</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300 tabular-nums">
                    {{ c.curriculum_year || '-' }}
                  </dd>
                </div>
                <!-- กำหนดส่ง -->
                <div>
                  <dt class="block text-sm font-semibold text-gray-700 mb-1.5">กำหนดส่ง</dt>
                  <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                    {{ c.deadline ? formatThaiDate(c.deadline) : '-' }}
                  </dd>
                </div>
                <!-- ชื่อปริญญา + ชื่อย่อ (แถวเดียวกัน: ชื่อ 2/3, ย่อ 1/3) -->
                <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div class="sm:col-span-2">
                    <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อปริญญา (ภาษาไทย)</dt>
                    <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                      {{ c.degree_name || '-' }}
                    </dd>
                  </div>
                  <div class="sm:col-span-1">
                    <dt class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อย่อปริญญา</dt>
                    <dd class="block w-full rounded-lg border border-gray-200 bg-gray-50/70 py-3 px-3 text-sm font-semibold text-gray-900 transition-all hover:bg-white hover:border-gray-300">
                      {{ c.degree_name_abbr || '-' }}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
            <!-- Edit Mode -->
            <div v-else class="px-6 py-5 bg-gray-50/30">
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- ระดับปริญญา (โครงสร้าง — แก้ไม่ได้) -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ระดับปริญญา</label>
                  <div class="block w-full rounded-lg border border-gray-200 bg-gray-100 py-3 px-3 text-sm text-gray-500">{{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] || '-' }}</div>
                </div>
                <!-- ภาควิชา (โครงสร้าง — แก้ไม่ได้) -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ภาควิชา/งานบริการการศึกษา</label>
                  <div class="block w-full rounded-lg border border-gray-200 bg-gray-100 py-3 px-3 text-sm text-gray-500">{{ c.department?.name || '-' }}</div>
                </div>
                <!-- สาขาวิชา -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">สาขาวิชา</label>
                  <input v-model="editForm.field_of_study" type="text" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
                </div>
                <!-- ประเภทหลักสูตร (โครงสร้าง — แก้ไม่ได้) -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ประเภทหลักสูตร</label>
                  <div class="block w-full rounded-lg border border-gray-200 bg-gray-100 py-3 px-3 text-sm text-gray-500">{{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}</div>
                </div>
                <!-- ปีหลักสูตร -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ปีหลักสูตร</label>
                  <FormCombobox v-model="editForm.curriculum_year" :options="yearOptions" placeholder="เลือกหรือพิมพ์ปีหลักสูตร" />
                </div>
                <!-- กำหนดส่ง -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">กำหนดส่ง</label>
                  <FormDatePicker v-model="editForm.deadline" placeholder="เลือกวันที่กำหนดส่ง" />
                </div>
                <!-- ชื่อปริญญา + ชื่อย่อ (แถวเดียวกัน: ชื่อ 2/3, ย่อ 1/3) -->
                <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อปริญญา (ภาษาไทย)</label>
                    <input v-model="editForm.degree_name" type="text" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
                  </div>
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อย่อปริญญา</label>
                    <input v-model="editForm.degree_name_abbr" type="text" class="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm transition-all" />
                  </div>
                </div>
               </div>
               <p class="mt-4 text-xs text-red-500">หมายเหตุ: ระดับปริญญา ภาควิชา และประเภทหลักสูตร เป็นข้อมูลที่กำหนดไว้ตั้งแต่ขั้นตอนการสร้างหลักสูตร จึงไม่สามารถแก้ไขได้</p>
               <div class="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                  <button type="button" @click="cancelEditInfo" class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-5 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 shadow-2xs active:scale-[0.97] transition-all duration-150 ease-ios">ยกเลิก</button>
                  <button type="button" @click="saveInfoBridge" :disabled="savingInfo" class="cursor-pointer rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">บันทึกข้อมูล</button>
               </div>
            </div>
          </section>

          <!-- Team Section -->
          <section class="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                <PhUsersThree class="w-4 h-4 text-gray-400 shrink-0" />
                ทีมผู้รับผิดชอบหลักสูตร
              </h2>
              <button v-if="canEdit && !editingTeam" @click="startEditTeamBridge"
                class="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-all duration-150 ease-ios">
                จัดการรายชื่อ
              </button>
            </div>
            <div v-if="!editingTeam" role="list" class="p-5 sm:p-6 space-y-2">
              <div v-for="member in c.team" :key="member.id" role="listitem"
                class="flex items-center gap-3.5 rounded-xl border border-gray-100/80 bg-gray-50/80 px-3.5 py-2.5 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all duration-200 group">
                <UserAvatar :name="member.name" size="sm" class="shrink-0 ring-2 ring-white shadow-2xs group-hover:scale-105 transition-transform duration-200" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-gray-800 leading-snug group-hover:text-primary-700 transition-colors">
                    {{ member.position ? `${member.position} ` : '' }}{{ member.name }}
                  </p>
                  <p v-if="member.email" class="mt-0.5 text-xs text-gray-500 flex items-center gap-1.5 truncate">
                    <PhEnvelope class="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors shrink-0" />{{ member.email }}
                  </p>
                </div>
                <span :class="[ROLE_BADGE[member.role_in_curriculum], 'shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset shadow-2xs']">
                  {{ ROLE_LABELS[member.role_in_curriculum] }}
                </span>
              </div>
              <p v-if="!c.team?.length" class="text-sm text-gray-400 text-center py-6">ยังไม่มีรายชื่อทีม</p>
            </div>
            <div v-else>
              <!-- Toggle: กรองอาจารย์ตามภาควิชา / แสดงข้ามภาควิชา -->
              <label v-if="c?.department_id" class="flex items-center justify-end gap-2 px-6 pt-3 text-xs font-medium text-gray-500 cursor-pointer select-none">
                <input type="checkbox" v-model="showAllTeamDepts" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                แสดงอาจารย์ทุกภาควิชา
              </label>
              <!-- Team member rows -->
              <div v-for="(member, idx) in teamForm" :key="idx"
                class="px-6 py-4 border-b border-gray-50 last:border-b-0 space-y-3">
                <!-- Role + Remove -->
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <FormSelect
                      v-model="member.role_in_curriculum"
                      :options="[
                        { label: 'ประธานหลักสูตร',          value: 'president'    },
                        { label: 'อาจารย์ผู้รับผิดชอบหลักสูตร', value: 'responsible'  },
                      ]"
                    />
                  </div>
                  <button type="button" @click="teamForm.splice(idx, 1)"
                    class="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150 ease-ios">
                    <PhTrash class="w-4 h-4" />
                  </button>
                </div>
                <!-- Name (with autocomplete) -->
                <div class="relative">
                  <input v-model="member.name" type="text" placeholder="ชื่อ-นามสกุล *"
                    @focus="focusedTeamMember = idx"
                    @blur="() => setTimeout(() => { if (focusedTeamMember === idx) focusedTeamMember = -1 }, 150)"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
                  <ul v-if="focusedTeamMember === idx && getTeamSuggestions(idx).length"
                    class="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-48 overflow-y-auto">
                    <li v-for="u in getTeamSuggestions(idx)" :key="u.id">
                      <button type="button" @mousedown.prevent="selectTeamMember(idx, u); focusedTeamMember = -1"
                        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                        <span class="font-medium text-gray-900">{{ formatUserName(u) }}</span>
                        <span v-if="u.email" class="ml-2 text-xs text-gray-400">{{ u.email }}</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <!-- Position + Email -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormSelect
                    v-model="member.position"
                    :options="[
                      { label: 'ไม่ระบุ', value: '' },
                      { label: 'อาจารย์', value: 'อาจารย์' },
                      { label: 'ผู้ช่วยศาสตราจารย์', value: 'ผู้ช่วยศาสตราจารย์' },
                      { label: 'รองศาสตราจารย์', value: 'รองศาสตราจารย์' },
                      { label: 'ศาสตราจารย์', value: 'ศาสตราจารย์' }
                    ]"
                  />
                  <input v-model="member.email" type="email" placeholder="อีเมล"
                    class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
                </div>
              </div>

              <!-- Add member -->
              <div class="px-6 py-3 border-b border-gray-50">
                <button type="button"
                  @click="teamForm.push({ name: '', role_in_curriculum: nextTeamRole(), position: '', email: '', _userSelected: false })"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-all duration-150 ease-ios">
                  <PhPlus class="w-4 h-4" />
                  เพิ่มสมาชิกในทีม
                </button>
              </div>

              <!-- Save / Cancel -->
              <div class="px-6 py-4 bg-gray-50/60 flex items-center justify-end gap-3">
                <button type="button" @click="cancelEditTeam"
                  class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-6 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 shadow-2xs active:scale-[0.97] transition-all duration-150 ease-ios">
                  ยกเลิก
                </button>
                <button type="button" @click="saveTeamBridge" :disabled="savingTeam"
                  class="cursor-pointer rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                  {{ savingTeam ? 'กำลังบันทึก…' : 'บันทึกรายชื่อ' }}
                </button>
              </div>
            </div>
          </section>
        </template>

        <!-- KeepAlive: mount ครั้งเดียว สลับแท็บไม่ remount/ไม่ fetch ซ้ำ (กันกระตุก) -->
        <KeepAlive>
          <TQF2Panel v-if="activeTab === 'tqf2'" :curriculum-id="c.id" :curriculum="c" @reject="showRejectModal = true" @approve="handleApprove" @uploaded="onDocumentUploaded" />
        </KeepAlive>

        <KeepAlive>
          <DocumentsPanel v-if="activeTab === 'documents'" :curriculum-id="c.id" :curriculum="c" @reject="showRejectModal = true" @approve="handleApprove" @uploaded="onDocumentUploaded" />
        </KeepAlive>

        <KeepAlive>
          <CommitteePanel v-if="activeTab === 'committee'" :curriculum="c" @curriculum-updated="handleCurriculumUpdated" />
        </KeepAlive>

        <template v-if="activeTab === 'history'">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm ">

            <!-- Card header — same pattern as DocumentsPanel / TQF2Panel -->
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                  <PhClipboardText class="w-4 h-4 text-gray-400" />
                  ประวัติการดำเนินการ
                </h2>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span v-if="auditLogs.length" class="text-xs font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ auditLogs.length }} รายการ</span>
                  <span class="text-sm text-gray-500">การดำเนินการทั้งหมดของหลักสูตร</span>
                </div>
              </div>
              <!-- Active-filter pill + clear — ปรากฏเฉพาะตอนกรองอยู่ -->
              <div v-if="activityFilter !== 'all'" class="flex items-center gap-2 shrink-0">
                <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm ring-1 ring-gray-100', getFilterStyle(activityFilter).text]">
                  <component :is="ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.icon" class="w-3.5 h-3.5" />
                  {{ ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.label }}
                  <span class="text-xs font-bold bg-white/50 px-1 py-px rounded">{{ filteredAuditLogs.length }}</span>
                </span>
                <button @click="activityFilter = 'all'"
                  class="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 active:scale-[0.88] transition-all duration-150 ease-ios">
                  <PhXCircle class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Filter toolbar -->
            <div v-if="!historyLoading && auditLogs.length > 0"
              class="px-4 py-2 border-b border-gray-100 overflow-x-auto" style="scrollbar-width:none">
              <div class="flex items-center gap-0.5 w-max">
                <button
                  v-for="f in ACTIVITY_FILTERS"
                  :key="f.key"
                  @click="activityFilter = f.key"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap active:scale-[0.95] transition-all duration-150 ease-ios select-none',
                    activityFilter === f.key
                      ? 'bg-gray-100 text-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  ]"
                >
                  <component :is="f.icon" class="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {{ f.label }}
                  <span v-if="filterCount(f.key) > 0"
                    :class="[
                      'tabular-nums text-xs font-bold min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center',
                      activityFilter === f.key ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-400'
                    ]">{{ filterCount(f.key) }}</span>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-6">

              <!-- Loading -->
              <div v-if="historyLoading" class="flex justify-center py-12">
                <div class="w-7 h-7 border-[3px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              </div>

              <!-- Empty — ไม่มีข้อมูลเลย -->
              <div v-else-if="!auditLogs.length" class="flex flex-col items-center py-16 text-center">
                <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <PhClock class="w-7 h-7 text-gray-300" />
                </div>
                <p class="text-sm font-bold text-gray-500">ยังไม่มีประวัติการดำเนินการ</p>
              </div>

              <!-- Empty — กรองแล้วไม่มีผล -->
              <div v-else-if="!filteredAuditLogs.length"
                class="flex flex-col items-center py-12 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                <PhClipboardText class="w-8 h-8 text-gray-300 mb-2" />
                <p class="text-sm font-bold text-gray-400">ไม่มีรายการในหมวดนี้</p>
                <button @click="activityFilter = 'all'" class="mt-2 text-xs text-primary-600 font-semibold hover:underline">
                  ดูทั้งหมด
                </button>
              </div>

              <!-- Activity feed (timeline) -->
              <div v-else class="pt-1">
                <div v-for="(log, idx) in filteredAuditLogs" :key="log.id" class="flex gap-3.5">

                  <!-- Rail: action icon + connecting line -->
                  <div class="flex flex-col items-center shrink-0">
                    <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', getActionTheme(log.action).bg]">
                      <component :is="getActionIcon(log.action)" :class="['w-4 h-4', getActionTheme(log.action).icon]" />
                    </div>
                    <div v-if="idx < filteredAuditLogs.length - 1" class="w-0.5 flex-1 bg-gray-200 rounded-full mt-1.5 min-h-[1.25rem]"></div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0 pb-5">
                    <div class="flex items-start justify-between gap-3 flex-wrap">
                      <p :class="['text-sm font-semibold leading-normal', getActionLabelClass(log.action)]">{{ getActionLabel(log) }}</p>
                      <p class="text-xs text-gray-500 font-medium tabular-nums shrink-0 whitespace-nowrap mt-0.5">
                        {{ formatDate(dayjs(log.createdAt).format('YYYY-MM-DD')) }}
                        <span class="text-gray-400 ml-1">{{ dayjs(log.createdAt).format('HH:mm') }} น.</span>
                      </p>
                    </div>

                    <!-- Detail -->
                    <div v-if="log.details?.file_name"
                      class="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg ring-1 ring-inset ring-gray-100">
                      <PhFile class="w-3 h-3 shrink-0 text-gray-400" />
                      <span class="break-all">{{ log.details.file_name }}</span>
                    </div>
                    <div v-else-if="log.details?.notes"
                      class="mt-2 flex items-start gap-1.5 text-xs text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg ring-1 ring-inset ring-orange-100">
                      <PhWarning class="w-3 h-3 shrink-0 mt-px text-orange-500" />
                      <span class="whitespace-pre-wrap leading-relaxed">{{ log.details.notes }}</span>
                    </div>
                    <div v-else-if="log.details?.before" class="mt-2 space-y-1.5">
                      <div v-for="(val, key) in log.details.before" :key="key"
                        class="flex items-center gap-1.5 text-xs flex-wrap">
                        <span class="text-xs font-bold text-gray-600 shrink-0">{{ FIELD_LABELS[key] || key }}</span>
                        <span class="line-through text-gray-400">{{ formatChangeValue(key, val) }}</span>
                        <PhArrowRight class="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span class="font-semibold text-primary-700">{{ formatChangeValue(key, log.details.after?.[key]) }}</span>
                      </div>
                    </div>

                    <!-- Actor -->
                    <p class="text-xs text-gray-500 mt-2">
                      โดย <span class="font-semibold text-gray-900">{{ formatUserName(log.user) || 'ระบบ' }}</span><span v-if="USER_ROLE_LABELS[log.user?.role]" class="text-gray-500"> ({{ USER_ROLE_LABELS[log.user?.role] }})</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </template>
        </div>
      </div>

      <!-- Right Side Area (Sidebar) — แสดงเฉพาะ tab ข้อมูลทั่วไป -->
      <div v-if="activeTab === 'info'" class="space-y-5 self-start">
        <!-- Unified Status Card: Progress + Deadline -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <!-- Card header -->
          <div class="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 bg-gray-50/40">
            <div class="flex items-center gap-2">
              <PhChartLineUp class="w-4 h-4 text-gray-500 shrink-0" />
              <h2 class="text-sm sm:text-base font-bold text-gray-900">ภาพรวมสถานะ</h2>
            </div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
              {{ miniApprovedCount }} / {{ miniSteps.length }} ขั้น
            </span>
          </div>

          <!-- Progress section -->
          <div class="p-5">
            <div class="rounded-xl border border-gray-200 bg-gray-50/50 p-4 mb-2">
              <div class="flex items-center justify-between mb-2.5">
                <div>
                  <p class="text-xs font-semibold text-gray-700">ความคืบหน้าหลักสูตร</p>
                  <p v-if="miniSteps.length" class="text-[11px] text-gray-500 mt-0.5">
                    ผ่านแล้ว {{ miniApprovedCount }} จาก {{ miniSteps.length }} ขั้น
                  </p>
                </div>
                <div class="flex items-baseline gap-0.5">
                  <span class="text-lg font-bold tabular-nums text-gray-900">{{ progressPercentage }}</span>
                  <span class="text-xs font-semibold text-gray-500">%</span>
                </div>
              </div>
              <div class="h-2 bg-gray-200/80 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width] duration-500 ease-out"
                  :class="progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary-600'"
                  :style="{ width: `${progressPercentage}%` }"
                />
              </div>
            </div>
          </div>

          <!-- Deadline section -->
          <div v-if="effectiveDeadline" class="border-t border-gray-100 px-5 pt-4 pb-5">
            <p class="text-xs font-semibold text-gray-700 mb-2">
              {{ c.status === 'revision' && c.revision_deadline ? 'กำหนดส่งแก้ไข' : 'กำหนดส่งหลักสูตร' }}
            </p>
            <div class="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 flex items-center justify-between gap-2">
              <p class="text-sm font-bold text-gray-900">{{ formatDate(effectiveDeadline) }}</p>
              <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0',
                isDateOverdue(effectiveDeadline)
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              ]">
                {{ daysRemaining < 0 ? `เกิน ${Math.abs(daysRemaining)} วัน` : `เหลือ ${daysRemaining} วัน` }}
              </span>
            </div>
          </div>

          <!-- ขั้นตอนคณะกรรมการ -->
          <div v-if="c.committee_steps?.length" class="border-t border-gray-100 px-5 pt-4 pb-5">
            <p class="text-xs font-semibold text-gray-700 mb-4">สถานะการพิจารณาตามลำดับขั้น</p>

            <!-- vertical timeline -->
            <div>
              <div v-for="(step, idx) in miniSteps" :key="step.id" class="flex gap-3">
                <!-- node + connector column -->
                <div class="flex flex-col items-center">
                  <div :class="['w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-200',
                    step.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-300 shadow-2xs' :
                    step.status === 'revision'  ? 'bg-orange-50 text-orange-600 border border-orange-300 shadow-2xs' :
                    step.id === miniCurrentId ? 'bg-primary-50 text-primary-600 border border-primary-300 ring-2 ring-primary-500/15 shadow-2xs font-extrabold scale-105' :
                    'bg-gray-50 text-gray-400 border border-gray-200'
                  ]">
                    <PhCheck v-if="step.status === 'approved'" class="w-3.5 h-3.5 stroke-[2.5]" />
                    <PhArrowCounterClockwise v-else-if="step.status === 'revision'" class="w-3.5 h-3.5" />
                    <span v-else>{{ idx + 1 }}</span>
                  </div>
                  <div v-if="idx < miniSteps.length - 1"
                    class="w-0.5 flex-1 my-1.5 rounded-full"
                    :class="step.status === 'approved' ? 'bg-emerald-200' : 'bg-gray-150'" />
                </div>
                <!-- label -->
                <div :class="['flex-1 min-w-0', idx < miniSteps.length - 1 ? 'pb-3.5' : '']">
                  <p v-if="step.id === miniCurrentStep?.id"
                    :class="['text-[11px] font-bold mb-0.5', step.status === 'revision' ? 'text-orange-600' : 'text-primary-600']">
                    {{ step.status === 'revision' ? 'ส่งกลับให้แก้ไข' : 'กำลังพิจารณา' }}
                  </p>
                  <p :class="['text-xs sm:text-[13px] leading-snug',
                    step.id === miniCurrentStep?.id ? 'font-bold text-gray-900' :
                    step.status === 'approved' ? 'font-medium text-gray-600' :
                    'font-normal text-gray-400'
                  ]">
                    {{ stepLabelFull(step) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- /main grid -->

    <!-- Reject Modal (first review) -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ">
              <div class="px-6 pt-6 pb-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <PhArrowCounterClockwise class="h-5 w-5 text-red-600" />
                  </div>
                  <h3 class="text-base font-bold text-gray-900">ส่งกลับแก้ไข</h3>
                </div>

                <!-- Reference deadlines -->
                <div v-if="c.deadline || c.revision_deadline" class="mb-4 rounded-lg bg-gray-50 ring-1 ring-gray-200 divide-y divide-gray-100 ">
                  <div v-if="c.deadline" class="flex items-center justify-between px-3 py-2">
                    <span class="text-xs text-gray-500">กำหนดส่งหลักสูตรเดิม</span>
                    <span class="text-xs font-semibold text-gray-700">{{ formatDate(c.deadline) }}</span>
                  </div>
                  <div v-if="c.revision_deadline" class="flex items-center justify-between px-3 py-2">
                    <span class="text-xs text-orange-600">กำหนดส่งแก้ไขครั้งก่อน</span>
                    <span class="text-xs font-semibold text-orange-700">{{ formatDate(c.revision_deadline) }}</span>
                  </div>
                </div>

                <label class="block text-sm font-semibold text-gray-700 mb-1.5">กำหนดส่งแก้ไขรอบนี้ <span class="font-normal text-gray-400">(ไม่บังคับ)</span></label>
                <FormDatePicker v-model="rejectDeadline" placeholder="เลือกวันที่กำหนดส่ง" />
              </div>
              <div class="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
                <button type="button" class="w-full sm:flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition-all ease-ios whitespace-nowrap" @click="showRejectModal = false">ยกเลิก</button>
                <button type="button" class="w-full sm:flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 active:scale-[0.97] transition-all ease-ios whitespace-nowrap" @click="handleReject">ยืนยันการส่งกลับ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Recheck Reject Modal (after committee revision) -->
    <Teleport to="body">
      <div v-if="showRecheckRejectModal" class="relative z-[100]" aria-labelledby="recheck-modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity backdrop-blur-sm"></div>
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ">
              <div class="px-6 pt-6 pb-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <PhArrowCounterClockwise class="h-5 w-5 text-red-600" />
                  </div>
                  <h3 id="recheck-modal-title" class="text-base font-bold text-gray-900">ส่งกลับแก้ไขเพิ่มเติม</h3>
                </div>

                <!-- Reference deadlines -->
                <div v-if="c.deadline || c.revision_deadline" class="mb-4 rounded-lg bg-gray-50 ring-1 ring-gray-200 divide-y divide-gray-100 ">
                  <div v-if="c.deadline" class="flex items-center justify-between px-3 py-2">
                    <span class="text-xs text-gray-500">กำหนดส่งหลักสูตรเดิม</span>
                    <span class="text-xs font-semibold text-gray-700">{{ formatDate(c.deadline) }}</span>
                  </div>
                  <div v-if="c.revision_deadline" class="flex items-center justify-between px-3 py-2">
                    <span class="text-xs text-orange-600">กำหนดส่งแก้ไขครั้งก่อน</span>
                    <span class="text-xs font-semibold text-orange-700">{{ formatDate(c.revision_deadline) }}</span>
                  </div>
                </div>

                <label class="block text-sm font-semibold text-gray-700 mb-1.5">กำหนดส่งแก้ไขรอบนี้ <span class="font-normal text-gray-400">(ไม่บังคับ)</span></label>
                <FormDatePicker v-model="recheckRejectDeadline" placeholder="เลือกวันที่กำหนดส่ง" />
              </div>
              <div class="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
                <button type="button" class="w-full sm:flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition-all ease-ios whitespace-nowrap" @click="showRecheckRejectModal = false">ยกเลิก</button>
                <button type="button" class="w-full sm:flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 active:scale-[0.97] transition-all ease-ios whitespace-nowrap" @click="handleRejectRecheck">ยืนยันการส่งกลับ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCurriculumStore } from '@/stores/curriculum';
import { useAuthStore } from '@/stores/auth';
import { useAuditLog, ACTIVITY_FILTERS } from '@/composables/useAuditLog';
import { useTeamEditor } from '@/composables/useTeamEditor';
import { useInfoEditor } from '@/composables/useInfoEditor';
import { useCountUp } from '@/composables/useCountUp';
import StatusBadge from '@/components/common/StatusBadge.vue';
import RevisionCycleBadge from '@/components/curriculum/RevisionCycleBadge.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormCombobox from '@/components/common/FormCombobox.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import DocumentsPanel from '@/components/curriculum/DocumentsPanel.vue';
import CommitteePanel from '@/components/curriculum/CommitteePanel.vue';
import TQF2Panel from '@/components/curriculum/TQF2Panel.vue';
import FileIcon from '@/components/common/FileIcon.vue';
import FormDatePicker from '@/components/common/FormDatePicker.vue';
import {
  PhCaretLeft, PhUser, PhPencil, PhPlus, PhPaperPlaneTilt,
  PhArrowCircleRight, PhWarning, PhInfo,
  PhCheckCircle, PhClock, PhArrowsClockwise, PhCaretRight,
  PhNotePencil, PhUsersThree, PhFilePlus, PhTrash, PhXCircle,
  PhFile, PhArrowCounterClockwise, PhBank,
  PhUploadSimple, PhFileText,
  PhFolderOpen, PhGraduationCap, PhClipboardText, PhEnvelope,
  PhArrowRight, PhBook, PhListChecks, PhChartLineUp
} from '@phosphor-icons/vue';
import { PhCaretDown, PhCheck } from '@phosphor-icons/vue';
import { getDept } from '@/constants/departments';
import { COMMITTEE_LABELS } from '@/constants/committees';
import dayjs from 'dayjs';
import { formatThaiDate, formatThaiDateTime, isOverdue as isDateOverdue } from '@/utils/date';
import { formatUserName } from '@/utils/user';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const route = useRoute();
const router = useRouter();
const curriculumStore = useCurriculumStore();
const authStore = useAuthStore();
const toast = useToast();
const { open: confirm } = useConfirm();

const c = computed(() => curriculumStore.current);

// จำนวน committee steps สูงสุดต่อระดับปริญญา (bachelor=7, master/doctoral=7)
const MAX_COMMITTEE_STEPS = 7;

// ─── Progress Stepper Logic ───
const COMMITTEE_FLOW = {
  bachelor: [
    { type: 'faculty_academic', order: 1, label: 'คณะกรรมการวิชาการประจำคณะ' },
    { type: 'faculty_board', order: 2, label: 'คณะกรรมการประจำคณะ' },
    { type: 'general_education', order: 3, label: 'คณะกรรมการตรวจวิชาศึกษาทั่วไป' },
    { type: 'university_academic', order: 4, label: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'university_council_academic', order: 5, label: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'university_council', order: 6, label: 'คณะกรรมการสภามหาวิทยาลัย' },
    { type: 'cisa', order: 7, label: 'CISA (สป.อว.)' }
  ],
  master: [
    { type: 'faculty_academic', order: 1, label: 'คณะกรรมการวิชาการประจำคณะ' },
    { type: 'faculty_board', order: 2, label: 'คณะกรรมการประจำคณะ' },
    { type: 'university_academic', order: 3, label: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'graduate_school', order: 4, label: 'คณะกรรมการประจำบัณฑิตวิทยาลัย' },
    { type: 'university_council_academic', order: 5, label: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'university_council', order: 6, label: 'คณะกรรมการสภามหาวิทยาลัย' },
    { type: 'cisa', order: 7, label: 'CISA (สป.อว.)' }
  ],
  doctoral: [
    { type: 'faculty_academic', order: 1, label: 'คณะกรรมการวิชาการประจำคณะ' },
    { type: 'faculty_board', order: 2, label: 'คณะกรรมการประจำคณะ' },
    { type: 'university_academic', order: 3, label: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'graduate_school', order: 4, label: 'คณะกรรมการประจำบัณฑิตวิทยาลัย' },
    { type: 'university_council_academic', order: 5, label: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร' },
    { type: 'university_council', order: 6, label: 'คณะกรรมการสภามหาวิทยาลัย' },
    { type: 'cisa', order: 7, label: 'CISA (สป.อว.)' }
  ]
};

const currentSteps = computed(() => {
  if (!c.value?.degree_level) return [];
  return COMMITTEE_FLOW[c.value.degree_level] || [];
});

// % ความคืบหน้า (8 ขั้น): ขั้น 1 = งานหลักสูตร คณะวิทยาศาสตร์ ตรวจผ่าน = 20
// จากนั้นผ่านคณะกรรมการแต่ละชุด +10 ต่อชุด, ผ่าน CISA (อนุมัติ) = 100
// สเกล: 0 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 100
const progressPercentage = computed(() => {
  if (!c.value) return 0;
  const status = c.value.status;
  if (status === 'approved') return 100;
  const approved = (c.value.committee_steps || []).filter(s => s.status === 'approved').length;
  // ผ่าน "งานหลักสูตร" แล้ว = ถูกนำเข้าสู่คณะกรรมการ (admin อนุมัติเข้าแล้ว)
  const passedOffice = approved > 0
    || ['under_committee', 'pending_admin_recheck'].includes(status)
    || (status === 'revision' && c.value.current_committee_step_id != null);
  if (!passedOffice) return 0;
  return Math.min(100, 20 + approved * 10);
});

// ── ขั้นที่ 1 (virtual) งานหลักสูตร คณะวิทยาศาสตร์ — สำหรับ mini pipeline ให้ครบ 8 ขั้น ──
const OFFICE_STEP_ID = 'science-office';
const miniSteps = computed(() => {
  const steps = c.value?.committee_steps;
  if (!steps?.length) return [];
  const s = c.value.status;
  const passed = steps.some(st => st.status === 'approved')
    || ['under_committee', 'pending_admin_recheck', 'approved'].includes(s)
    || (s === 'revision' && c.value.current_committee_step_id != null);
  let officeStatus = 'pending';
  if (passed) officeStatus = 'approved';
  else if (s === 'revision' && c.value.current_committee_step_id == null) officeStatus = 'revision';
  return [{ id: OFFICE_STEP_ID, step_order: 0, status: officeStatus }, ...steps];
});
const miniCurrentId = computed(() =>
  c.value?.status === 'department_submitted' ? OFFICE_STEP_ID : c.value?.current_committee_step_id
);
const miniApprovedCount = computed(() => miniSteps.value.filter(s => s.status === 'approved').length);
// ขั้นที่กำลังดำเนินการ — revision มาก่อน (โดนตีกลับ) แล้วค่อยขั้น current ปกติ
const miniCurrentStep = computed(() => {
  const steps = miniSteps.value;
  if (!steps.length || c.value?.status === 'approved') return null;
  return steps.find(s => s.status === 'revision')
    || steps.find(s => s.id === miniCurrentId.value)
    || null;
});
const stepLabelFull = (step) => {
  if (!step) return '';
  if (step.id === OFFICE_STEP_ID) return 'งานหลักสูตร คณะวิทยาศาสตร์';
  return COMMITTEE_LABELS[step.committee_type] || 'คณะกรรมการพิจารณา';
};

// ST01 count-up สำหรับ % progress
const countProgress = useCountUp(progressPercentage, { duration: 800, delay: 200 });

const getStepStatus = (stepType) => {
  if (!c.value?.committee_steps) return 'waiting';
  const step = c.value.committee_steps.find(s => s.committee_type === stepType);
  if (!step) return 'waiting';
  return step.status; // 'pending', 'approved', 'revision'
};

const effectiveDeadline = computed(() => {
  if (!c.value) return null;
  if (c.value.status === 'pending_department') return c.value.deadline || null;
  if (c.value.status === 'revision') return c.value.revision_deadline || null;
  return null;
});

const daysRemaining = computed(() => {
  if (!effectiveDeadline.value) return null;
  return dayjs(effectiveDeadline.value).diff(dayjs(), 'day');
});

const activeTab = ref('info');

// ── Tab sliding indicator ────────────────────────────────────────────────────
const tabNavRef    = ref(null);
const tabButtonRefs = ref({});

// ตำแหน่งและขนาดของ indicator — อัปเดตเมื่อ tab เปลี่ยน
const tabIndicatorStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: '0' });

const updateIndicator = async () => {
  await nextTick();
  const btn = tabButtonRefs.value[activeTab.value];
  const nav = tabNavRef.value;
  if (!btn || !nav) return;
  const btnRect = btn.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();
  const left    = btnRect.left - navRect.left + nav.scrollLeft;
  tabIndicatorStyle.value = {
    width:     `${btnRect.width}px`,
    transform: `translateX(${left}px)`,
    opacity:   '1',
  };
};

// switchTab — เปลี่ยนแท็บแล้วอัปเดต indicator
const switchTab = (key) => {
  activeTab.value = key;
  updateIndicator();
};

// อัปเดต indicator เมื่อ tab เปลี่ยน (นอกเหนือจาก switchTab)
watch(activeTab, updateIndicator);
// resize listener จัดการใน onMounted ด้านล่าง (merged)
const showRejectModal = ref(false);
const rejectNote = ref('');
const rejectDeadline = ref('');
const showRecheckRejectModal = ref(false);
const recheckRejectNote = ref('');
const recheckRejectDeadline = ref('');

// ── Composables ────────────────────────────────────────────────────────────────
const { auditLogs, historyLoading, activityFilter, filteredAuditLogs, filterCount, loadHistory } = useAuditLog();

const hasDocuments = computed(() => (c.value?.documents?.length ?? 0) > 0);

const onDocumentUploaded = async () => {
  loadHistory();
  await curriculumStore.fetchById(route.params.id);
};

const {
  editingInfo, savingInfo, editForm,
  startEdit: startEditInfo, cancelEdit: cancelEditInfo, save: saveInfo,
} = useInfoEditor(route.params.id);

const {
  editingTeam, savingTeam, teamForm, focusedTeamMember, allUsers, showAllDepts: showAllTeamDepts,
  nextRole: nextTeamRole, startEdit: startEditTeam, cancelEdit: cancelEditTeam,
  save: saveTeamFn, getSuggestions: getTeamSuggestions, selectMember: selectTeamMember, loadUsers,
} = useTeamEditor(route.params.id, () => curriculumStore.fetchById(route.params.id), () => c.value?.department_id);

const ROLE_LABELS = {
  president: 'ประธานหลักสูตร',
  secretary: 'เลขาธิการหลักสูตร',
  responsible: 'อาจารย์ผู้รับผิดชอบหลักสูตร'
};
const ROLE_BADGE = {
  president: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  secretary: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  responsible: 'bg-gray-50 text-gray-600 ring-gray-500/10'
};

const currentYear = new Date().getFullYear() + 543;
const yearOptions = [
  currentYear + 2,
  currentYear + 1,
  currentYear,
  currentYear - 1,
  currentYear - 2
].map(y => ({ label: String(y), value: String(y) }));

const getActionLabel = (log) => {
  const ct = log.details?.committee_type;
  const c = ct ? (COMMITTEE_LABELS[ct] || ct) : '';
  switch (log.action) {
    case 'CREATE_CURRICULUM':        return 'สร้างหลักสูตร';
    case 'UPDATE_CURRICULUM':        return 'แก้ไขข้อมูลหลักสูตร';
    case 'UPDATE_TEAM':              return 'แก้ไขผู้รับผิดชอบหลักสูตร';
    case 'UPLOAD_DOCUMENT':          return 'อัปโหลดเอกสาร';
    case 'UPLOAD_TQF2':              return 'อัปโหลดเอกสาร ร่างหลักสูตร (มคอ.2)';
    case 'DELETE_DOCUMENT':          return 'ลบเอกสาร';
    case 'DELETE_TQF2':              return 'ลบเอกสาร ร่างหลักสูตร (มคอ.2)';
    case 'DEPARTMENT_SUBMIT':        return log.details?.on_behalf ? 'เจ้าหน้าที่นำส่งหลักสูตรแทนภาควิชา' : 'ส่งหลักสูตรเพื่อตรวจสอบ';
    case 'ADMIN_APPROVE':            return 'ผ่านการตรวจสอบ เข้าสู่กระบวนการคณะกรรมการ';
    case 'ADMIN_REJECT':             return 'งานหลักสูตรคณะส่งกลับแก้ไข';
    case 'COMMITTEE_APPROVED':       return c ? `${c} เห็นชอบ` : 'คณะกรรมการเห็นชอบ';
    case 'COMMITTEE_REVISION':       return c ? `${c} ส่งกลับแก้ไข` : 'คณะกรรมการส่งกลับแก้ไข';
    case 'RESUBMIT_AFTER_REVISION':  return log.details?.on_behalf ? 'เจ้าหน้าที่นำส่งแทนภาควิชา หลังคณะกรรมการตีกลับ' : 'ส่งให้งานหลักสูตรตรวจสอบ หลังคณะกรรมการตีกลับ';
    case 'ADMIN_APPROVE_RECHECK':    return 'งานหลักสูตรอนุมัติ ส่งคืนคณะกรรมการ';
    case 'ADMIN_REJECT_RECHECK':     return 'งานหลักสูตรส่งกลับแก้ไขเพิ่มเติม';
    default:                         return log.action;
  }
};

const getActionIcon = (action) => {
  const m = {
    CREATE_CURRICULUM:       PhFilePlus,
    UPDATE_CURRICULUM:       PhPencil,
    UPDATE_TEAM:             PhUsersThree,
    UPLOAD_DOCUMENT:         PhUploadSimple,
    UPLOAD_TQF2:             PhUploadSimple,
    DELETE_DOCUMENT:         PhTrash,
    DELETE_TQF2:             PhTrash,
    DEPARTMENT_SUBMIT:       PhPaperPlaneTilt,
    ADMIN_APPROVE:           PhCheckCircle,
    ADMIN_REJECT:            PhArrowCounterClockwise,
    COMMITTEE_APPROVED:      PhCheckCircle,
    COMMITTEE_REVISION:      PhArrowCounterClockwise,
    RESUBMIT_AFTER_REVISION:  PhArrowsClockwise,
    ADMIN_APPROVE_RECHECK:    PhCheckCircle,
    ADMIN_REJECT_RECHECK:     PhArrowCounterClockwise,
  };
  return m[action] || PhClock;
};

const USER_ROLE_LABELS = {
  admin:     'เจ้าหน้าที่หลักสูตรคณะ',
  faculty:   'อาจารย์ผู้รับผิดชอบหลักสูตร',
  staff:     'เจ้าหน้าที่สาขาวิชา',
  registrar: 'เจ้าหน้าที่กองบริการการศึกษา',
  executive: 'ผู้บริหารคณะ',
};

const FIELD_LABELS = {
  degree_name: 'ชื่อปริญญา',
  degree_name_abbr: 'ชื่อย่อ',
  field_of_study: 'สาขาวิชา',
  curriculum_year: 'ปีหลักสูตร',
  deadline: 'กำหนดส่ง'
};

// format ค่า before/after ใน audit log — field วันที่ให้เป็นรูปแบบไทย
const DATE_FIELDS = ['deadline', 'revision_deadline'];
const formatChangeValue = (key, val) => {
  if (val === null || val === undefined || val === '') return 'ว่าง';
  return DATE_FIELDS.includes(key) ? formatThaiDate(val) : val;
};

const FILTER_STYLES = {
  all:        { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
  document:   { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
  submission: { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
  review:     { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
  committee:  { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
  manage:     { active: 'bg-gray-900 text-white', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-500' },
};
const getFilterStyle = (key) => FILTER_STYLES[key] || FILTER_STYLES.all;

const getActionTheme = (action) => {
  const themes = {
    CREATE_CURRICULUM:        { icon: 'text-indigo-600',  bg: 'bg-indigo-100'  },
    UPDATE_CURRICULUM:        { icon: 'text-blue-600',    bg: 'bg-blue-100'    },
    UPDATE_TEAM:              { icon: 'text-violet-600',  bg: 'bg-violet-100'  },
    UPLOAD_DOCUMENT:          { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
    UPLOAD_TQF2:              { icon: 'text-teal-600',    bg: 'bg-teal-100'    },
    DELETE_DOCUMENT:          { icon: 'text-rose-600',    bg: 'bg-rose-100'    },
    DELETE_TQF2:              { icon: 'text-rose-600',    bg: 'bg-rose-100'    },
    DEPARTMENT_SUBMIT:        { icon: 'text-orange-500',  bg: 'bg-orange-100'  },
    ADMIN_APPROVE:            { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
    ADMIN_REJECT:             { icon: 'text-rose-600',    bg: 'bg-rose-100'    },
    COMMITTEE_APPROVED:       { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
    COMMITTEE_REVISION:       { icon: 'text-rose-600',    bg: 'bg-rose-100'    },
    RESUBMIT_AFTER_REVISION:  { icon: 'text-sky-600',     bg: 'bg-sky-100'     },
    ADMIN_APPROVE_RECHECK:    { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
    ADMIN_REJECT_RECHECK:     { icon: 'text-rose-600',    bg: 'bg-rose-100'    },
  };
  return themes[action] || { icon: 'text-gray-500', bg: 'bg-gray-100' };
};

const APPROVED_ACTIONS  = ['COMMITTEE_APPROVED', 'ADMIN_APPROVE', 'ADMIN_APPROVE_RECHECK'];
const REVISION_ACTIONS  = ['COMMITTEE_REVISION', 'ADMIN_REJECT', 'ADMIN_REJECT_RECHECK'];

const getRowHighlight = (action) => {
  if (APPROVED_ACTIONS.includes(action)) return 'bg-emerald-50/50 hover:bg-emerald-50/80';
  if (REVISION_ACTIONS.includes(action))  return 'bg-rose-50/50 hover:bg-rose-50/80';
  return 'hover:bg-gray-50/60';
};

const getActionLabelClass = (action) => {
  if (APPROVED_ACTIONS.includes(action)) return 'text-emerald-800';
  if (REVISION_ACTIONS.includes(action))  return 'text-rose-700';
  return 'text-gray-800';
};

const tabs = computed(() => [
  { key: 'info',      label: 'รายละเอียดหลักสูตร',   desc: 'รายละเอียดและทีมหลักสูตร',       icon: PhInfo },
  { key: 'tqf2',     label: 'ร่างหลักสูตร (มคอ.2)', desc: 'เอกสารหลักและการเปรียบเทียบ',   icon: PhFileText },
  { key: 'documents',label: 'เอกสารประกอบหลักสูตร',          desc: 'เอกสารและหลักฐานประกอบหลักสูตร', icon: PhFolderOpen },
  { key: 'committee',label: 'สถานะการพิจารณา',             desc: 'มติและขั้นตอนการพิจารณาของคณะกรรมการ',        icon: PhGraduationCap },
  { key: 'history',  label: 'ประวัติการดำเนินการหลักสูตร',        desc: 'ประวัติการดำเนินการทั้งหมดของหลักสูตร',        icon: PhClipboardText }
]);

const canEdit = computed(() => {
  if (!c.value) return false;
  if (authStore.isAdmin) return true;
  if (authStore.isFaculty && c.value.department_id === authStore.user?.department_id) return true;
  return false;
});

const COMMITTEE_TYPE_LABELS = {
  faculty_academic: 'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์',
  faculty_board: 'คณะกรรมการประจำคณะวิทยาศาสตร์',
  general_education: 'คณะกรรมการตรวจวิชาศึกษาทั่วไป',
  university_academic: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร',
  graduate_school: 'คณะกรรมการประจำบัณฑิตวิทยาลัย',
  university_council_academic: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร',
  university_council: 'คณะกรรมการสภามหาวิทยาลัย',
  cisa: 'CISA'
};

// แสดงแถวปุ่ม action เฉพาะสถานะที่ผู้ใช้ทำอะไรได้ (แทนแบนเนอร์เดิม)
const hasActions = computed(() => {
  if (!c.value) return false;
  const status = c.value.status;
  if (authStore.isFaculty) return status === 'pending_department' || status === 'revision';
  // admin: ตรวจสอบตามปกติ + ดำเนินการแทนภาควิชาได้ในสถานะรอภาควิชา (กรณีภาควิชาล่าช้า)
  if (authStore.isAdmin)   return ['department_submitted', 'pending_admin_recheck', 'pending_department', 'revision'].includes(status);
  return false;
});

// ข้อความบริบทฝั่งซ้ายของแถบ action (decision zone)
const actionContext = computed(() => {
  if (!c.value) return null;
  const status = c.value.status;
  if (authStore.isFaculty) {
    if (status === 'pending_department')
      return { title: 'ตรวจสอบและนำส่งหลักสูตร', hint: 'โปรดตรวจสอบความถูกต้องและอัปโหลดเอกสารให้ครบถ้วนสมบูรณ์ ก่อนนำส่งงานหลักสูตร คณะวิทยาศาสตร์ เพื่อพิจารณาดำเนินการต่อไป' };
    if (status === 'revision' && !c.value.current_committee_step_id)
      return { title: 'ปรับแก้เอกสารตามข้อเสนอแนะ', hint: 'โปรดปรับแก้เอกสารตามข้อเสนอแนะให้ครบถ้วนสมบูรณ์ แล้วนำส่งงานหลักสูตร คณะวิทยาศาสตร์ เพื่อพิจารณาตรวจสอบอีกครั้ง' };
    if (status === 'revision' && c.value.current_committee_step_id)
      return { title: 'ปรับแก้ตามมติคณะกรรมการ', hint: 'โปรดปรับแก้เอกสารให้เป็นไปตามมติที่ประชุมคณะกรรมการโดยครบถ้วน แล้วนำส่งงานหลักสูตร คณะวิทยาศาสตร์ เพื่อพิจารณาตรวจสอบก่อนเสนอที่ประชุมต่อไป' };
  }
  if (authStore.isAdmin) {
    if (status === 'department_submitted')
      return { title: 'ตรวจสอบความถูกต้องของเอกสาร', hint: 'โปรดตรวจสอบความถูกต้องครบถ้วนของเอกสารที่ภาควิชานำส่ง และพิจารณาดำเนินการในขั้นตอนต่อไป' };
    if (status === 'pending_admin_recheck')
      return { title: 'ตรวจสอบเอกสารที่ปรับแก้', hint: 'โปรดตรวจสอบเอกสารที่ภาควิชาปรับแก้เพิ่มเติม และพิจารณาดำเนินการในขั้นตอนต่อไป' };
    if (status === 'pending_department')
      return { title: 'รอภาควิชาดำเนินการ', hint: 'กรณีเร่งด่วนหรือภาควิชาไม่ดำเนินการในระบบ เจ้าหน้าที่สามารถอัปโหลดเอกสารและนำส่งหลักสูตรแทนภาควิชาได้' };
    if (status === 'revision' && !c.value.current_committee_step_id)
      return { title: 'รอภาควิชาปรับแก้เอกสาร', hint: 'กรณีเร่งด่วนหรือภาควิชาไม่ดำเนินการในระบบ เจ้าหน้าที่สามารถปรับแก้เอกสารและนำส่งหลักสูตรแทนภาควิชาได้' };
    if (status === 'revision' && c.value.current_committee_step_id)
      return { title: 'รอภาควิชาปรับแก้ตามมติคณะกรรมการ', hint: 'กรณีเร่งด่วนหรือภาควิชาไม่ดำเนินการในระบบ เจ้าหน้าที่สามารถปรับแก้เอกสารและนำส่งแทนภาควิชา เพื่อกลับเข้าสู่ขั้นตอนการพิจารณาเดิมได้' };
  }
  return null;
});

const formatDate = formatThaiDate;
const formatDateTime = formatThaiDateTime;
const isOverdue = isDateOverdue;

// bridge composable methods to template-expected names
const startEditInfoBridge = () => startEditInfo(c.value);
const saveInfoBridge = () => saveInfo(toast);
const startEditTeamBridge = () => startEditTeam(c.value.team);
const saveTeamBridge = () => saveTeamFn(toast);

watch(activeTab, (tab) => {
  if (tab === 'history' && !auditLogs.value.length) loadHistory();
});

const submitting = ref(false);

const handleSubmit = async () => {
  const onBehalf = authStore.isAdmin;
  const ok = await confirm({
    title: onBehalf ? 'ส่งหลักสูตรแทนภาควิชา' : 'ส่งหลักสูตรเพื่อตรวจสอบ',
    message: onBehalf
      ? 'ระบบจะนำส่งหลักสูตรเข้าสู่ขั้นตอนการตรวจสอบแทนภาควิชา และแจ้งให้ทีมหลักสูตรทราบ'
      : 'ระบบจะนำส่งหลักสูตรให้งานหลักสูตรคณะวิทยาศาสตร์พิจารณาตรวจสอบต่อไป',
    confirmLabel: onBehalf ? 'ส่งแทนภาควิชา' : 'ส่งหลักสูตร',
    type: 'primary',
  });
  if (!ok || submitting.value) return;
  submitting.value = true;
  try {
    await curriculumStore.submitByDepartment(route.params.id);
    loadHistory();
    toast.success(
      onBehalf ? 'ส่งแทนภาควิชาเรียบร้อยแล้ว' : 'ส่งหลักสูตรเรียบร้อยแล้ว',
      onBehalf ? 'แจ้งทีมหลักสูตรให้ทราบแล้ว' : 'รอเจ้าหน้าที่ตรวจสอบ'
    );
  } catch {
    toast.error('ส่งหลักสูตรไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleApprove = async () => {
  if (submitting.value) return;
  const name = c.value?.field_of_study ? `สาขาวิชา${c.value.field_of_study}` : c.value?.degree_name || 'หลักสูตรนี้';
  const ok = await confirm({
    title: `นำ${name}เข้าสู่กระบวนการคณะกรรมการ`,
    confirmLabel: 'ยืนยัน',
    type: 'primary',
  });
  if (!ok) return;
  submitting.value = true;
  try {
    await curriculumStore.approveByAdmin(route.params.id);
    loadHistory();
    activeTab.value = 'committee';
    toast.success('นำเข้าสู่กระบวนการสำเร็จ', 'หลักสูตรเข้าสู่กระบวนการพิจารณาของคณะกรรมการแล้ว');
  } catch {
    toast.error('ดำเนินการไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleReject = async () => {
  try {
    await curriculumStore.rejectByAdmin(route.params.id, rejectNote.value, rejectDeadline.value);
    showRejectModal.value = false;
    rejectNote.value = '';
    rejectDeadline.value = '';

    loadHistory();
    toast.warning('ส่งกลับภาควิชาเรียบร้อยแล้ว');
  } catch (e) {
    toast.error('ส่งกลับไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  }
};

const handleResubmit = async () => {
  if (submitting.value) return;
  const onBehalf = authStore.isAdmin;
  const ok = await confirm({
    title: onBehalf ? 'ส่งแทนภาควิชาเข้าขั้นตอนเดิม' : 'ส่งให้งานหลักสูตรตรวจสอบ',
    message: onBehalf
      ? 'ระบบจะนำส่งหลักสูตรกลับเข้าสู่ขั้นตอนการพิจารณาแทนภาควิชา และแจ้งให้ทีมหลักสูตรทราบ'
      : 'ระบบจะส่งหลักสูตรกลับให้งานหลักสูตรคณะวิทยาศาสตร์พิจารณาตรวจสอบอีกครั้ง',
    confirmLabel: onBehalf ? 'ส่งแทนภาควิชา' : 'ส่งให้ตรวจสอบ',
    type: 'primary',
  });
  if (!ok) return;
  submitting.value = true;
  try {
    await curriculumStore.resubmitAfterRevision(route.params.id);
    loadHistory();
    toast.success(onBehalf ? 'ส่งแทนภาควิชาเรียบร้อยแล้ว' : 'ส่งให้งานหลักสูตรตรวจสอบเรียบร้อยแล้ว');
  } catch {
    toast.error('ส่งไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleApproveRecheck = async () => {
  if (submitting.value) return;
  const name = c.value?.field_of_study ? `สาขาวิชา${c.value.field_of_study}` : c.value?.degree_name || 'หลักสูตรนี้';
  const ok = await confirm({
    title: `นำ${name}เข้าที่ประชุมคณะกรรมการ`,
    message: `หลักสูตร${name} จะถูกส่งกลับเข้าสู่การพิจารณาของคณะกรรมการในขั้นตอนที่ตีกลับทันที`,
    confirmLabel: 'ยืนยัน', type: 'primary',
  });
  if (!ok) return;
  submitting.value = true;
  try {
    await curriculumStore.approveRecheck(route.params.id);
    loadHistory();
    activeTab.value = 'committee';
    toast.success('นำเข้าสู่กระบวนการสำเร็จ', 'หลักสูตรเข้าสู่กระบวนการพิจารณาของคณะกรรมการแล้ว');
  } catch {
    toast.error('ดำเนินการไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleRejectRecheck = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await curriculumStore.rejectRecheck(route.params.id, recheckRejectNote.value, recheckRejectDeadline.value);
    showRecheckRejectModal.value = false;
    recheckRejectNote.value = '';
    recheckRejectDeadline.value = '';
    loadHistory();
    toast.warning('ส่งกลับภาควิชาเรียบร้อยแล้ว');
  } catch {
    toast.error('ส่งกลับไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};
const handleCurriculumUpdated = async () => { await curriculumStore.fetchById(route.params.id); };

onMounted(async () => {
  window.addEventListener('resize', updateIndicator);
  await Promise.all([
    curriculumStore.fetchById(route.params.id),
    loadUsers(),
  ]);
  // indicator อัปเดตหลังข้อมูล + tabs render เสร็จ
  updateIndicator();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator);
});
</script>

<style scoped>
/* ── Sliding underline indicator ─────────────────────────────────────────── */
.tab-slider-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: theme('colors.primary.600');
  border-radius: 2px 2px 0 0;
  transition:
    transform  250ms cubic-bezier(0.22, 1, 0.36, 1),
    width      250ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity    200ms ease;
  pointer-events: none;
  z-index: 2;
}

/* ── Tab button hover state ──────────────────────────────────────────────── */
.tab-btn {
  transition: color 150ms ease, background-color 150ms ease;
  border-radius: 6px 6px 0 0;
  position: relative;
}
.tab-btn:hover:not([aria-selected="true"]) {
  background-color: rgba(99, 102, 241, 0.04);
}
.tab-btn:active {
  transform: scale(0.97);
}

/* ── Icon spring เมื่อ active ────────────────────────────────────────────── */
.tab-icon-active {
  animation: tab-icon-spring 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes tab-icon-spring {
  0%   { transform: scale(1);    }
  40%  { transform: scale(1.22); }
  70%  { transform: scale(0.94); }
  100% { transform: scale(1);    }
}

/* ── Subtitle fade-in (tab-sub transition) ───────────────────────────────── */
.tab-sub-enter-active { transition: opacity 180ms ease-out, transform 180ms ease-out; }
.tab-sub-leave-active { transition: opacity 100ms ease-in; position: absolute; }
.tab-sub-enter-from   { opacity: 0; transform: translateY(-3px); }
.tab-sub-leave-to     { opacity: 0; }

/* ── Tab content cross-fade ──────────────────────────────────────────────── */
.tab-content-enter-active {
  transition: opacity 150ms ease-out;
}
.tab-content-leave-active {
  transition: opacity 90ms ease-in;
  position: absolute;
  width: 100%;
  pointer-events: none;
}
.tab-content-enter-from { opacity: 0; }
.tab-content-leave-to   { opacity: 0; }
</style>

