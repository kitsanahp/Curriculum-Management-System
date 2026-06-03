<template>
  <div v-if="curriculumStore.loading" class="space-y-6">
    <div class="h-12 bg-white rounded-xl border border-gray-200 w-3/4 animate-pulse"></div>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div class="h-96 bg-white rounded-xl border border-gray-200 animate-pulse"></div>
      <div class="h-96 bg-white rounded-xl border border-gray-200 animate-pulse"></div>
    </div>
  </div>
  
  <div v-else-if="!c" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="bg-gray-50 p-8 rounded-full mb-4">
      <PhFile class="w-12 h-12 text-gray-300" />
    </div>
    <h3 class="text-lg font-bold text-gray-900">ไม่พบหลักสูตร</h3>
    <p class="text-sm text-gray-500 mt-1">ข้อมูลอาจถูกลบหรือท่านไม่มีสิทธิ์เข้าถึง</p>
    <button @click="router.back()" class="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ease-ios">
      <PhCaretLeft class="w-4 h-4" />
      กลับไปหน้าก่อนหน้า
    </button>
  </div>

  <div v-else class="space-y-5">
    <!-- Hero Header Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 ">

      <!-- Title + Actions -->
      <div class="px-4 sm:px-6 lg:px-8 pt-5 pb-4">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

          <!-- Left: back button + title info -->
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <button @click="router.back()" aria-label="ย้อนกลับ"
              class="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-100 transition-all duration-150 ease-ios focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.88]">
              <PhCaretLeft class="w-4 h-4" />
            </button>
            <div class="flex-1 min-w-0">
              <!-- h1 มาก่อน — Visual Hierarchy: primary content ต้องอ่านก่อน metadata -->
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight mb-1">
                {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อหลักสูตร' }}
              </h1>
              <p v-if="c.field_of_study && c.degree_name" class="text-sm text-gray-600 truncate mb-2">
                {{ c.degree_name }}
              </p>
              <p class="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                <component v-if="getDept(c.department?.name)" :is="getDept(c.department?.name).icon"
                  weight="bold" class="w-3.5 h-3.5 shrink-0"
                  :style="{ color: getDept(c.department?.name).color }" />
                {{ c.department?.name || 'ไม่ระบุภาควิชา' }}
              </p>

              <!-- badges มาหลัง h1 — metadata เป็น context เสริม ไม่ใช่ primary -->
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}
                </span>
                <span class="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  ปีหลักสูตร {{ c.curriculum_year }}
                </span>
                <span :class="[
                  'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  c.curriculum_type === 'new'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                    : 'bg-sky-50 text-sky-700 ring-sky-600/20'
                ]">
                  {{ c.curriculum_type === 'new' ? 'หลักสูตรใหม่' : 'หลักสูตรปรับปรุง' }}
                </span>
                <StatusBadge :status="c.status" :curriculum="c" />
              </div>

              <!-- under_committee info banner -->
              <div v-if="c.status === 'under_committee'"
                class="mt-2.5 inline-flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm0 3a1 1 0 011 1v4a1 1 0 01-2 0V8a1 1 0 011-1zm0 8a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 15z"/>
                </svg>
                ขณะนี้อยู่ระหว่างการพิจารณา ท่านไม่ต้องดำเนินการใดๆ
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Tab Navigation — sliding indicator -->
      <div class="border-t border-gray-100 relative">
        <!-- gradient fade-out ขวา (mobile scroll hint) -->
        <div class="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 lg:hidden dark:from-[var(--dm-surface)]"></div>

        <nav
          ref="tabNavRef"
          class="relative flex overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pr-10 lg:pr-8"
          aria-label="Tabs">

          <!-- ✨ Sliding underline indicator — เลื่อนลื่นตามแท็บ -->
          <div
            class="tab-slider-indicator"
            :style="tabIndicatorStyle"
          />

          <button
            v-for="tab in tabs"
            :key="tab.key"
            :ref="el => { if (el) tabButtonRefs[tab.key] = el }"
            @click="switchTab(tab.key)"
            :class="[
              activeTab === tab.key
                ? 'text-primary-700'
                : 'text-gray-500 hover:text-gray-700',
              'tab-btn inline-flex items-center gap-2 px-3 py-3.5 text-sm font-bold whitespace-nowrap select-none -mb-px outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset rounded-t'
            ]"
            :aria-selected="activeTab === tab.key"
            role="tab">

            <!-- ✨ Icon spring เมื่อ active -->
            <component
              :is="tab.icon"
              :class="[
                'w-4 h-4 shrink-0 transition-all duration-200',
                activeTab === tab.key
                  ? 'text-primary-600 tab-icon-active'
                  : 'text-gray-400'
              ]"
              aria-hidden="true"
            />

            <span class="flex flex-col items-start">
              <span>{{ tab.label }}</span>
              <!-- ✨ Subtitle — fade+slide-down เมื่อโผล่ -->
              <Transition name="tab-sub" mode="out-in">
                <span
                  v-if="activeTab === tab.key"
                  :key="tab.key"
                  class="text-[10px] font-normal text-primary-400 leading-none mt-0.5">
                  {{ tab.desc }}
                </span>
              </Transition>
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Action Banner + Action Buttons -->
    <div v-if="actionBanner" :class="['animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl ring-1 overflow-hidden', bannerStyle.ring]">
      <!-- Banner: icon + text + action button in one row -->
      <div :class="['px-5 py-4 flex items-center gap-4', bannerStyle.bg]">
        <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', bannerStyle.iconBg]">
          <component :is="actionBanner.icon" :class="['h-4 w-4', bannerStyle.icon]" aria-hidden="true" />
        </div>
        <div class="flex-1 min-w-0">
          <p :class="['text-[13px] font-bold', bannerStyle.title]">{{ actionBanner.title }}</p>
          <p :class="['mt-0.5 text-sm leading-relaxed', bannerStyle.body]">{{ actionBanner.body }}</p>
        </div>

        <!-- Faculty: ส่งหลักสูตรครั้งแรก -->
        <button
          v-if="authStore.isFaculty && (c.status === 'pending_department' || (c.status === 'revision' && !c.current_committee_step_id))"
          :disabled="submitting"
          @click="handleSubmit"
          class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
          <PhPaperPlaneTilt class="w-4 h-4" aria-hidden="true" />
          ส่งหลักสูตรเพื่อตรวจสอบ
        </button>

        <!-- Faculty: ส่งให้งานหลักสูตรตรวจสอบ (หลังคณะกรรมการตีกลับ) -->
        <button
          v-if="authStore.isFaculty && c.status === 'revision' && c.current_committee_step_id"
          :disabled="submitting"
          @click="handleResubmit"
          class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
          <PhPaperPlaneTilt class="w-4 h-4" aria-hidden="true" />
          ส่งให้งานหลักสูตรตรวจสอบ
        </button>

        <!-- Admin: ตรวจสอบครั้งแรก (department_submitted) -->
        <template v-if="authStore.isAdmin && c.status === 'department_submitted'">
          <button :disabled="submitting" @click="showRejectModal = true"
            class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
            <PhArrowCounterClockwise class="w-4 h-4" aria-hidden="true" />
            ส่งกลับแก้ไข
          </button>
          <button :disabled="submitting" @click="handleApprove"
            class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
            <PhCheck class="w-4 h-4" aria-hidden="true" />
            นำเข้าที่ประชุมคณะกรรมการ
          </button>
        </template>

        <!-- Admin: ตรวจสอบหลังคณะกรรมการตีกลับ (pending_admin_recheck) -->
        <template v-if="authStore.isAdmin && c.status === 'pending_admin_recheck'">
          <button :disabled="submitting" @click="showRecheckRejectModal = true"
            class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
            <PhArrowCounterClockwise class="w-4 h-4" aria-hidden="true" />
            ส่งกลับแก้ไข
          </button>
          <button :disabled="submitting" @click="handleApproveRecheck"
            class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-60 transition-all duration-150 ease-ios">
            <PhCheck class="w-4 h-4" aria-hidden="true" />
            นำเข้าที่ประชุมคณะกรรมการ
          </button>
        </template>

      </div>
    </div>

    <!-- Main Grid Layout -->
    <div :class="['grid grid-cols-1 gap-5 items-start', activeTab === 'info' ? 'lg:grid-cols-[1fr_260px]' : '']">

      <!-- Left/Main Column (Tab Content) — ✨ cross-fade เมื่อเปลี่ยนแท็บ -->
      <div class="min-w-0">
        <Transition name="tab-content" mode="out-in">
        <div :key="activeTab" class="space-y-4">

        <!-- Tab: Info -->
        <template v-if="activeTab === 'info'">

          <!-- Detailed Info Card -->
          <section class="bg-white rounded-xl border border-gray-200 ">
            <div class="px-6 py-3 flex items-center justify-between border-b border-gray-100">
              <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                <PhFileText class="w-4 h-4 text-gray-400 shrink-0" />
                ข้อมูลหลักสูตร
              </h2>
              <button v-if="canEdit && !editingInfo" @click="startEditInfoBridge"
                class="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-all duration-150 ease-ios">
                แก้ไข
              </button>
            </div>
            <!-- View Mode -->
            <div v-if="!editingInfo" class="px-6 py-4">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div class="sm:col-span-2">
                  <dt class="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                    <PhGraduationCap class="w-3.5 h-3.5 shrink-0" />
                    ชื่อปริญญา (ภาษาไทย)
                  </dt>
                  <dd class="text-base font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    {{ c.degree_name || '-' }}
                    <span v-if="c.degree_name_abbr" class="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {{ c.degree_name_abbr }}
                    </span>
                  </dd>
                </div>
                <div v-if="c.field_of_study">
                  <dt class="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                    <PhBook class="w-3.5 h-3.5 shrink-0" />
                    สาขาวิชา
                  </dt>
                  <dd class="text-base font-semibold text-gray-800">{{ c.field_of_study }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                    <PhGraduationCap class="w-3.5 h-3.5 shrink-0" />
                    ระดับปริญญา
                  </dt>
                  <dd class="text-base font-semibold text-gray-800">{{ { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }[c.degree_level] }}</dd>
                </div>
              </dl>
            </div>
            <!-- Edit Mode -->
            <div v-else class="px-6 py-5 bg-gray-50/30">
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อปริญญา (ภาษาไทย)</label>
                  <input v-model="editForm.degree_name" type="text" class="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อย่อ</label>
                  <input v-model="editForm.degree_name_abbr" type="text" class="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">ปีหลักสูตร</label>
                  <input v-model="editForm.curriculum_year" type="text" class="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">สาขาวิชา</label>
                  <input v-model="editForm.field_of_study" type="text" class="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all" />
                </div>
               </div>
               <div class="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                  <button type="button" @click="cancelEditInfo" class="text-sm font-bold text-gray-500 hover:text-gray-700">ยกเลิก</button>
                  <button type="button" @click="saveInfoBridge" :disabled="savingInfo" class="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 transition-all">บันทึกข้อมูล</button>
               </div>
            </div>
          </section>

          <!-- Team Section -->
          <section class="bg-white rounded-xl border border-gray-200 ">
            <div class="px-6 py-3 flex items-center justify-between border-b border-gray-100">
              <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                <PhUsersThree class="w-4 h-4 text-gray-400 shrink-0" />
                ทีมผู้รับผิดชอบหลักสูตร
              </h2>
              <button v-if="canEdit && !editingTeam" @click="startEditTeamBridge"
                class="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-all duration-150 ease-ios">
                จัดการรายชื่อ
              </button>
            </div>
            <ul v-if="!editingTeam" role="list" class="divide-y divide-gray-50">
              <li v-for="member in c.team" :key="member.id" class="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <UserAvatar :name="member.name" size="sm" class="shrink-0 ring-2 ring-gray-100" />
                <div class="min-w-0 flex-1">
                  <p class="text-base font-semibold text-gray-900 leading-tight">
                    {{ member.position ? `${member.position} ` : '' }}{{ member.name }}
                  </p>
                  <p v-if="member.email" class="mt-0.5 text-sm text-gray-500 flex items-center gap-1 truncate">
                    <PhEnvelope class="w-3 h-3 shrink-0" />{{ member.email }}
                  </p>
                </div>
                <span :class="[ROLE_BADGE[member.role_in_curriculum], 'shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset']">
                  {{ ROLE_LABELS[member.role_in_curriculum] }}
                </span>
              </li>
            </ul>
            <div v-else>
              <!-- Team member rows -->
              <div v-for="(member, idx) in teamForm" :key="idx"
                class="px-6 py-4 border-b border-gray-50 last:border-b-0 space-y-3">
                <!-- Role + Remove -->
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <FormSelect
                      v-model="member.role_in_curriculum"
                      :options="[
                        { label: 'ประธานหลักสูตร',     value: 'president'    },
                        { label: 'เลขาธิการหลักสูตร',  value: 'secretary'    },
                        { label: 'อาจารย์ผู้รับผิดชอบ', value: 'responsible'  },
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
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
                  <ul v-if="focusedTeamMember === idx && getTeamSuggestions(idx).length"
                    class="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-48 overflow-y-auto">
                    <li v-for="u in getTeamSuggestions(idx)" :key="u.id">
                      <button type="button" @mousedown.prevent="selectTeamMember(idx, u); focusedTeamMember = -1"
                        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                        <span class="font-medium text-gray-900">{{ u.name }}</span>
                        <span v-if="u.email" class="ml-2 text-xs text-gray-400">{{ u.email }}</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <!-- Position + Email -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input v-model="member.position" type="text" placeholder="ตำแหน่ง เช่น ผศ.ดร."
                    class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
                  <input v-model="member.email" type="email" placeholder="อีเมล"
                    class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
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
              <div class="px-6 py-4 bg-gray-50/60">
                <button type="button" @click="saveTeamBridge" :disabled="savingTeam"
                  class="w-full rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-500 disabled:opacity-60 active:scale-[0.97] transition-all duration-150 ease-ios">
                  {{ savingTeam ? 'กำลังบันทึก…' : 'บันทึกรายชื่อ' }}
                </button>
                <button type="button" @click="cancelEditTeam"
                  class="w-full mt-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all duration-150 ease-ios">
                  ยกเลิก
                </button>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="activeTab === 'tqf2'">
          <TQF2Panel :curriculum-id="c.id" :curriculum="c" @reject="showRejectModal = true" @approve="handleApprove" @uploaded="loadHistory" />
        </template>

        <template v-else-if="activeTab === 'documents'">
          <DocumentsPanel :curriculum-id="c.id" :curriculum="c" @reject="showRejectModal = true" @approve="handleApprove" @uploaded="loadHistory" />
        </template>

        <template v-else-if="activeTab === 'committee'">
          <CommitteePanel :curriculum="c" @curriculum-updated="handleCurriculumUpdated" />
        </template>

        <template v-else-if="activeTab === 'history'">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm ">

            <!-- Card header — same pattern as DocumentsPanel / TQF2Panel -->
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 class="text-base font-bold text-gray-900 flex items-center gap-2">
                  <PhClipboardText class="w-4 h-4 text-gray-400" />
                  บันทึกกิจกรรม
                </h2>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span v-if="auditLogs.length" class="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ auditLogs.length }} รายการ</span>
                  <span class="text-sm text-gray-400">ติดตามการเปลี่ยนแปลงทั้งหมด</span>
                </div>
              </div>
              <!-- Active-filter pill + clear — ปรากฏเฉพาะตอนกรองอยู่ -->
              <div v-if="activityFilter !== 'all'" class="flex items-center gap-2 shrink-0">
                <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm ring-1 ring-gray-100', getFilterStyle(activityFilter).text]">
                  <component :is="ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.icon" class="w-3.5 h-3.5" />
                  {{ ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.label }}
                  <span class="text-[10px] font-bold bg-white/50 px-1 py-px rounded">{{ filteredAuditLogs.length }}</span>
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
                      'tabular-nums text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center',
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
                <p class="text-sm font-bold text-gray-500">ยังไม่มีบันทึกกิจกรรม</p>
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

              <!-- Table -->
              <div v-else class="-mx-6 -mb-6">
                <table class="w-full">
                  <thead class="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th class="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3 w-36">วันที่และเวลา</th>
                      <th class="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">กิจกรรม</th>
                      <th class="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">รายละเอียด</th>
                      <th class="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3 w-44">ผู้ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="log in filteredAuditLogs" :key="log.id"
                      :class="['transition-colors duration-100', getRowHighlight(log.action)]">

                      <!-- วันที่และเวลา -->
                      <td class="px-6 py-3.5 whitespace-nowrap align-top">
                        <p class="text-xs font-semibold text-gray-700 tabular-nums">{{ formatDate(dayjs(log.createdAt).format('YYYY-MM-DD')) }}</p>
                        <p class="text-[10px] text-gray-400 tabular-nums mt-0.5">{{ dayjs(log.createdAt).format('HH:mm') }} น.</p>
                      </td>

                      <!-- กิจกรรม -->
                      <td class="px-4 py-3.5 align-top">
                        <div class="flex items-start gap-2.5">
                          <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', getActionTheme(log.action).bg]">
                            <component :is="getActionIcon(log.action)" :class="['w-3.5 h-3.5', getActionTheme(log.action).icon]" />
                          </div>
                          <p :class="['text-xs font-semibold leading-snug pt-1', getActionLabelClass(log.action)]">{{ getActionLabel(log) }}</p>
                        </div>
                      </td>

                      <!-- รายละเอียด -->
                      <td class="px-4 py-3.5 align-top">
                        <div v-if="log.details?.file_name"
                          class="inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg ring-1 ring-inset ring-gray-100">
                          <PhFile class="w-3 h-3 shrink-0 text-gray-400" />
                          <span class="break-all">{{ log.details.file_name }}</span>
                        </div>
                        <div v-else-if="log.details?.notes"
                          class="flex items-start gap-1.5 text-[11px] text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg ring-1 ring-inset ring-orange-100">
                          <PhWarning class="w-3 h-3 shrink-0 mt-px text-orange-500" />
                          <span class="whitespace-pre-wrap leading-relaxed">{{ log.details.notes }}</span>
                        </div>
                        <div v-else-if="log.details?.before" class="space-y-1.5">
                          <div v-for="(val, key) in log.details.before" :key="key"
                            class="flex items-center gap-1.5 text-[11px] flex-wrap">
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">{{ FIELD_LABELS[key] || key }}</span>
                            <span class="line-through text-gray-300">{{ val || 'ว่าง' }}</span>
                            <PhArrowRight class="w-2.5 h-2.5 text-gray-300 shrink-0" />
                            <span class="font-semibold text-primary-700">{{ log.details.after?.[key] || 'ว่าง' }}</span>
                          </div>
                        </div>
                        <span v-else class="text-xs text-gray-300">ไม่มีข้อมูล</span>
                      </td>

                      <!-- ผู้ดำเนินการ -->
                      <td class="px-4 py-3.5 align-top">
                        <p class="text-xs font-semibold text-gray-700 leading-snug">{{ log.user?.name || 'ระบบ' }}</p>
                        <p class="text-[10px] text-gray-400 mt-0.5 leading-snug">{{ USER_ROLE_LABELS[log.user?.role] || '' }}</p>
                      </td>

                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </template>
        </div>
        </Transition>
      </div>

      <!-- Right Side Area (Sidebar) — แสดงเฉพาะ tab ข้อมูลทั่วไป -->
      <div v-if="activeTab === 'info'" class="space-y-4">
        <!-- Unified Status Card: Progress + Deadline -->
        <div class="bg-white rounded-xl border border-gray-200 ">

          <!-- ST01 Progress section — count-up % + fill animation -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-500">ความคืบหน้า</p>
              <span class="text-2xl font-black text-gray-900 tabular-nums">{{ countProgress }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full animate-progress-fill"
                :class="progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary-500'"
                :style="{ width: `${progressPercentage}%`, animationDuration: '800ms' }"
              />
            </div>
            <div class="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <PhCopySimple class="w-3.5 h-3.5 shrink-0 text-gray-300" />
              เวอร์ชันที่ {{ c.committee_steps?.length ? c.committee_steps.filter(s => s.status === 'approved').length + 1 : 1 }}
            </div>
          </div>

          <!-- Deadline section -->
          <div v-if="effectiveDeadline" class="border-t border-gray-100 p-5">
            <p class="text-xs font-semibold text-gray-500 mb-3">
              {{ c.status === 'revision' && c.revision_deadline ? 'กำหนดส่งแก้ไข' : 'กำหนดส่งหลักสูตร' }}
            </p>
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-bold text-gray-900">{{ formatDate(effectiveDeadline) }}</p>
              <span :class="['text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shrink-0',
                isDateOverdue(effectiveDeadline)
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
              ]">
                {{ daysRemaining < 0 ? `เกิน ${Math.abs(daysRemaining)} วัน` : `${daysRemaining} วัน` }}
              </span>
            </div>
            <div class="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full animate-progress-fill', daysRemaining < 0 ? 'bg-red-400' : 'bg-emerald-400']"
                :style="{ width: daysRemaining < 0 ? '100%' : `${Math.max(5, Math.min(100, (daysRemaining / 30) * 100))}%`, animationDuration: '600ms' }"
              />
            </div>
          </div>
        </div>

        <!-- Mini Committee Pipeline -->
        <div v-if="c.committee_steps?.length" class="bg-white rounded-xl border border-gray-200 ">
          <div class="p-4">
            <p class="text-xs font-semibold text-gray-500 mb-3">ขั้นตอนคณะกรรมการ</p>
            <div class="flex items-center">
              <template v-for="(step, idx) in c.committee_steps" :key="step.id">
                <div
                  :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all',
                    step.status === 'approved' ? 'bg-emerald-500 text-white' :
                    step.status === 'revision'  ? 'bg-orange-400 text-white' :
                    step.id === c.current_committee_step_id ? 'bg-primary-600 text-white ring-2 ring-primary-100' :
                    'bg-gray-100 text-gray-400'
                  ]">
                  <PhCheck v-if="step.status === 'approved'" class="w-3 h-3" />
                  <span v-else>{{ step.step_order }}</span>
                </div>
                <div v-if="idx < c.committee_steps.length - 1"
                  class="h-0.5 flex-1 min-w-[3px] transition-all"
                  :class="step.status === 'approved' ? 'bg-emerald-200' : 'bg-gray-100'" />
              </template>
            </div>
            <p class="text-xs text-gray-400 mt-3">
              ผ่านแล้ว <span class="font-bold text-gray-700">{{ c.committee_steps.filter(s => s.status === 'approved').length }}</span> จาก {{ c.committee_steps.length }} ขั้นตอน
            </p>
          </div>
        </div>
      </div>
    </div>

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
              <div class="px-6 pb-6 flex gap-2">
                <button type="button" class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition-all ease-ios" @click="showRejectModal = false">ยกเลิก</button>
                <button type="button" class="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 active:scale-[0.97] transition-all ease-ios" @click="handleReject">ยืนยันการส่งกลับ</button>
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
              <div class="px-6 pb-6 flex gap-2">
                <button type="button" class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition-all ease-ios" @click="showRecheckRejectModal = false">ยกเลิก</button>
                <button type="button" class="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 active:scale-[0.97] transition-all ease-ios" @click="handleRejectRecheck">ยืนยันการส่งกลับ</button>
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
import FormSelect from '@/components/common/FormSelect.vue';
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
  PhUploadSimple, PhCopySimple, PhFileText,
  PhFolderOpen, PhGraduationCap, PhClipboardText, PhEnvelope,
  PhArrowRight, PhBook
} from '@phosphor-icons/vue';
import { PhCaretDown, PhCheck } from '@phosphor-icons/vue';
import { getDept } from '@/constants/deptConfig';
import { COMMITTEE_LABELS } from '@/constants/committees';
import api from '@/services/api';
import dayjs from 'dayjs';
import { formatThaiDate, formatThaiDateTime, isOverdue as isDateOverdue } from '@/utils/date';
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

const progressPercentage = computed(() => {
  if (!c.value) return 0;
  if (c.value.status === 'approved') return 100;
  if (['pending_department', 'department_submitted', 'pending_admin_recheck'].includes(c.value.status)) return 5;
  
  const steps = c.value.committee_steps || [];
  const approvedCount = steps.filter(s => s.status === 'approved').length;
  return Math.round((approvedCount / (steps.length || MAX_COMMITTEE_STEPS)) * 100);
});

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

const {
  editingInfo, savingInfo, editForm,
  startEdit: startEditInfo, cancelEdit: cancelEditInfo, save: saveInfo,
} = useInfoEditor(route.params.id);

const {
  editingTeam, savingTeam, teamForm, focusedTeamMember, allUsers,
  nextRole: nextTeamRole, startEdit: startEditTeam, cancelEdit: cancelEditTeam,
  save: saveTeamFn, getSuggestions: getTeamSuggestions, selectMember: selectTeamMember, loadUsers,
} = useTeamEditor(route.params.id, () => curriculumStore.fetchById(route.params.id));

const ROLE_LABELS = {
  president: 'ประธานหลักสูตร',
  secretary: 'เลขาธิการหลักสูตร',
  responsible: 'อาจารย์ผู้รับผิดชอบ'
};
const ROLE_BADGE = {
  president: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  secretary: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  responsible: 'bg-gray-50 text-gray-600 ring-gray-500/10'
};

const getActionLabel = (log) => {
  const ct = log.details?.committee_type;
  const c = ct ? (COMMITTEE_LABELS[ct] || ct) : '';
  switch (log.action) {
    case 'CREATE_CURRICULUM':        return 'สร้างหลักสูตร';
    case 'UPDATE_CURRICULUM':        return 'แก้ไขข้อมูลหลักสูตร';
    case 'UPDATE_TEAM':              return 'แก้ไขผู้รับผิดชอบหลักสูตร';
    case 'UPLOAD_DOCUMENT':          return 'อัปโหลดเอกสาร';
    case 'UPLOAD_TQF2':              return 'อัปโหลดเอกสาร มคอ.2';
    case 'DELETE_DOCUMENT':          return 'ลบเอกสาร';
    case 'DELETE_TQF2':              return 'ลบเอกสาร มคอ.2';
    case 'DEPARTMENT_SUBMIT':        return 'ส่งหลักสูตรเพื่อตรวจสอบ';
    case 'ADMIN_APPROVE':            return 'ผ่านการตรวจสอบ เข้าสู่กระบวนการคณะกรรมการ';
    case 'ADMIN_REJECT':             return 'งานหลักสูตรคณะส่งกลับแก้ไข';
    case 'COMMITTEE_APPROVED':       return c ? `${c} เห็นชอบ` : 'คณะกรรมการเห็นชอบ';
    case 'COMMITTEE_REVISION':       return c ? `${c} ส่งกลับแก้ไข` : 'คณะกรรมการส่งกลับแก้ไข';
    case 'RESUBMIT_AFTER_REVISION':  return 'ส่งให้งานหลักสูตรตรวจสอบ หลังคณะกรรมการตีกลับ';
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
  staff:     'เจ้าหน้าที่ภาควิชา',
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
  { key: 'documents',label: 'เอกสารประกอบ',          desc: 'เอกสารและหลักฐานที่เกี่ยวข้อง', icon: PhFolderOpen },
  { key: 'committee',label: 'การพิจารณา',             desc: 'มติและขั้นตอนการอนุมัติ',        icon: PhGraduationCap },
  { key: 'history',  label: 'ความเคลื่อนไหว',        desc: 'ติดตามทุกการเปลี่ยนแปลง',        icon: PhClipboardText }
]);

const BANNER_COLOR_MAP = {
  orange: { ring: 'ring-orange-200', bg: 'bg-orange-50/60', bgBar: 'bg-orange-50/80 border-orange-100', iconBg: 'bg-orange-100', icon: 'text-orange-500', title: 'text-orange-900', body: 'text-orange-700' },
  red:   { ring: 'ring-red-200',   bg: 'bg-red-50',      bgBar: 'bg-red-50/80 border-red-100',       iconBg: 'bg-red-100',    icon: 'text-red-600',   title: 'text-red-900',   body: 'text-red-700'    },
  blue:  { ring: 'ring-blue-200',  bg: 'bg-blue-50',     bgBar: 'bg-blue-50/80 border-blue-100',     iconBg: 'bg-blue-100',   icon: 'text-blue-600',  title: 'text-blue-900',  body: 'text-blue-600'   },
  gray:  { ring: 'ring-gray-200',  bg: 'bg-gray-50',     bgBar: 'bg-gray-50/80 border-gray-100',     iconBg: 'bg-gray-100',   icon: 'text-gray-500',  title: 'text-gray-800',  body: 'text-gray-500'   },
};
const bannerStyle = computed(() => BANNER_COLOR_MAP[actionBanner.value?.color] ?? BANNER_COLOR_MAP.gray);

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

const actionBanner = computed(() => {
  if (!c.value) return null;
  const status = c.value.status;
  const isAdmin = authStore.isAdmin;
  const isFaculty = authStore.isFaculty;

  if (status === 'pending_department') {
    if (isFaculty) return {
      icon: PhClock, color: 'orange',
      title: 'รอการดำเนินการจากภาควิชา',
      body: 'กรุณาอัปโหลดเอกสารร่างหลักสูตร (มคอ.2) และเอกสารอ้างอิงให้ครบถ้วน แล้วส่งหลักสูตรเพื่อตรวจสอบ',
    };
    if (isAdmin) return {
      icon: PhClock, color: 'orange',
      title: 'รอข้อมูลจากภาควิชา',
      body: 'หลักสูตรนี้อยู่ระหว่างการจัดเตรียมเอกสารโดยภาควิชา',
    };
  }
  if (status === 'revision') {
    if (isFaculty) return {
      icon: PhWarning, color: 'red',
      title: 'หลักสูตรถูกส่งกลับให้แก้ไข',
      body: 'กรุณาตรวจสอบข้อเสนอแนะ ปรับปรุงเอกสารให้ครบถ้วน แล้วส่งกลับเพื่อดำเนินการต่อ',
    };
  }
  if (status === 'department_submitted' && isAdmin) return {
    icon: PhCheckCircle, color: 'blue',
    title: 'ภาควิชาส่งหลักสูตรแล้ว',
    body: 'กรุณาตรวจสอบความถูกต้องและครบถ้วนของเอกสารก่อนนำเข้าสู่กระบวนการพิจารณาของคณะกรรมการ',
  };
  if (status === 'pending_admin_recheck') {
    if (isAdmin) return {
      icon: PhClock, color: 'orange',
      title: 'รอตรวจสอบก่อนนำเข้าคณะกรรมการ',
      body: 'สาขาส่งเอกสารที่แก้ไขตามมติคณะกรรมการคืนมาแล้ว กรุณาตรวจสอบความถูกต้องก่อนส่งคืนคณะกรรมการ',
    };
    if (isFaculty) return {
      icon: PhClock, color: 'orange',
      title: 'อยู่ระหว่างการตรวจสอบโดยงานหลักสูตร คณะวิทยาศาสตร์',
      body: 'เอกสารถูกส่งให้งานหลักสูตร คณะวิทยาศาสตร์ตรวจสอบแล้ว กรุณารอผลการตรวจสอบก่อนนำเข้าสู่ที่ประชุมคณะกรรมการ',
    };
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
  const ok = await confirm({
    title: 'ส่งหลักสูตรเพื่อตรวจสอบ',
    confirmLabel: 'ส่งหลักสูตร',
    type: 'primary',
  });
  if (!ok || submitting.value) return;
  submitting.value = true;
  try {
    await curriculumStore.submitByDepartment(route.params.id);
    loadHistory();
    toast.success('ส่งหลักสูตรเรียบร้อยแล้ว', 'รอเจ้าหน้าที่ตรวจสอบ');
  } catch {
    toast.error('ส่งหลักสูตรไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleApprove = async () => {
  if (submitting.value) return;
  const name = c.value?.field_of_study ? `สาขาวิชา${c.value.field_of_study}` : c.value?.degree_name || 'หลักสูตรนี้';
  const ok = await confirm({
    title: 'นำเข้าสู่กระบวนการคณะกรรมการ',
    subject: name,
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
  const ok = await confirm({ title: 'ส่งให้งานหลักสูตรตรวจสอบ', confirmLabel: 'ส่งให้ตรวจสอบ', type: 'primary' });
  if (!ok) return;
  submitting.value = true;
  try {
    await curriculumStore.resubmitAfterRevision(route.params.id);
    loadHistory();
    toast.success('ส่งให้งานหลักสูตรตรวจสอบเรียบร้อยแล้ว');
  } catch {
    toast.error('ส่งไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally { submitting.value = false; }
};

const handleApproveRecheck = async () => {
  if (submitting.value) return;
  const name = c.value?.field_of_study ? `สาขาวิชา${c.value.field_of_study}` : c.value?.degree_name || 'หลักสูตรนี้';
  const ok = await confirm({
    title: 'นำเข้าที่ประชุมคณะกรรมการ', subject: name,
    message: 'จะถูกส่งกลับเข้าสู่การพิจารณาของคณะกรรมการในขั้นตอนที่ตีกลับทันที',
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
  transition: opacity 200ms ease-out, transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.tab-content-leave-active {
  transition: opacity 120ms ease-in;
  position: absolute;
  width: 100%;
  pointer-events: none;
}
.tab-content-enter-from { opacity: 0; transform: translateY(6px); }
.tab-content-leave-to   { opacity: 0; }
</style>
