<template>
  <div class="space-y-4 max-w-7xl mx-auto">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
        {{ isFaculty ? 'ภาพรวมหลักสูตร' : 'ภาพรวมระบบ' }}
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        {{ isFaculty
          ? (authStore.user?.department?.name || 'ภาควิชา')
          : authStore.isExecutive
            ? 'ภาพรวมและสถานะหลักสูตรทั้งหมดในคณะ'
            : 'สถิติและสถานะหลักสูตรทั้งหมดในระบบ' }}
      </p>
    </div>

    <!-- ───────────── Faculty / Staff Content ───────────── -->
    <template v-if="isFaculty">

      <!-- Action Banners -->
      <div v-if="revisionItems.length" class="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3.5">
        <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <PhWarning class="w-5 h-5 text-red-600" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-red-900">{{ revisionItems.length }} หลักสูตรรอการแก้ไข</p>
          <p class="text-xs text-red-500 mt-0.5">กรุณาตรวจสอบและแก้ไขเอกสาร แล้วส่งกลับคืน</p>
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <router-link v-for="c in revisionItems" :key="c.id" :to="`/curricula/${c.id}`"
              class="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 active:scale-[0.95] transition-all duration-150 ease-ios shadow-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span class="truncate max-w-[200px]">{{ c.field_of_study || c.degree_name }}</span>
            </router-link>
            <router-link to="/curricula" class="text-xs font-bold text-red-600 hover:text-red-700 ml-1 inline-flex items-center gap-0.5 transition-colors">
              ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="pendingItems.length" class="rounded-xl border border-orange-200 bg-orange-50/60 px-5 py-4 flex items-start gap-3">
        <div class="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2"></div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-orange-900">{{ pendingItems.length }} หลักสูตรรอส่งเอกสาร</p>
          <p class="text-xs text-orange-500 mt-0.5">กรุณาอัปโหลดเอกสารให้ครบแล้วกดส่ง</p>
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <router-link v-for="c in pendingItems" :key="c.id" :to="`/curricula/${c.id}`"
              class="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 active:scale-[0.95] transition-all duration-150 ease-ios shadow-sm">
              <span class="truncate max-w-[200px]">{{ c.field_of_study || c.degree_name }}</span>
            </router-link>
            <router-link to="/curricula" class="text-xs font-bold text-orange-600 hover:text-orange-700 ml-1 inline-flex items-center gap-0.5 transition-colors">
              ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 md:grid-cols-[1fr_252px] gap-4 items-start">

        <!-- Curricula List -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p class="text-xs font-semibold text-gray-500">หลักสูตรทั้งหมด</p>
            <router-link to="/curricula"
              class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-all duration-150 ease-ios">
              ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
            </router-link>
          </div>
          <div v-if="dashLoading" class="p-4 space-y-3 animate-pulse">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <div class="h-4 bg-gray-100 rounded w-8 shrink-0"></div>
              <div class="h-4 bg-gray-100 rounded flex-1"></div>
              <div class="h-5 bg-gray-100 rounded w-20 shrink-0"></div>
            </div>
          </div>
          <EmptyState
            v-else-if="!dashCurricula.length"
            title="ยังไม่มีหลักสูตรที่ได้รับมอบหมาย"
            description="รอรับมอบหมายจากเจ้าหน้าที่คณะ เมื่อได้รับมอบหมายแล้ว หลักสูตรจะปรากฏที่นี่"
            :icon="PhFileText"
            size="sm"
          />
          <div v-else class="divide-y divide-gray-50">
            <router-link v-for="item in dashCurricula" :key="item.id" :to="`/curricula/${item.id}`"
              class="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/80 active:bg-gray-100 transition-all ease-ios group">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                    {{ { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' }[item.degree_level] }}
                  </span>
                  <p class="text-sm font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                    {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
                  </p>
                </div>
                <p v-if="item.field_of_study && item.degree_name" class="text-[11px] text-gray-500 truncate">{{ item.degree_name }}</p>
                <p class="text-[10px] text-gray-400 mt-0.5">ปีหลักสูตร {{ item.curriculum_year }}</p>
                <div v-if="item.status === 'under_committee' && item.committee_steps?.length" class="mt-2">
                  <div class="flex gap-px mb-1">
                    <div v-for="step in item.committee_steps.length" :key="step"
                      class="h-1 flex-1 rounded-full transition-all duration-300"
                      :class="step <= item.committee_steps.filter(s => s.status === 'approved').length ? 'bg-blue-500' : 'bg-gray-100'" />
                  </div>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="text-[10px] font-medium text-blue-500">ขั้นที่ {{ item.committee_steps.filter(s => s.status === 'approved').length }} จาก {{ item.committee_steps.length }}</span>
                    <span class="text-[10px] font-medium bg-blue-50 text-blue-500 px-1 py-px rounded">{{ committeeStepLabel(item) }}</span>
                  </div>
                </div>
              </div>
              <StatusBadge :status="item.status" :curriculum="item" class="shrink-0 mt-0.5" />
            </router-link>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="space-y-4">
          <!-- Status Donut -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-semibold text-gray-500">ภาพรวมสถานะ</p>
              <span class="text-[11px] font-bold text-gray-400 tabular-nums">{{ dashCurricula.length }} หลักสูตร</span>
            </div>
            <div v-if="!dashCurricula.length" class="flex flex-col items-center py-6 text-gray-400">
              <PhFileText class="w-8 h-8 text-gray-200 mb-2" />
              <p class="text-xs font-medium">ไม่มีข้อมูล</p>
            </div>
            <div v-else>
              <div class="relative w-32 h-32 mx-auto mb-5">
                <div class="absolute inset-0 rounded-full transition-all duration-700" :style="facultyDonutStyle"></div>
                <div class="absolute inset-[18%] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span class="text-2xl font-black text-gray-900 leading-none tabular-nums">{{ dashCurricula.length }}</span>
                  <span class="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wide">หลักสูตร</span>
                </div>
              </div>
              <div class="space-y-2.5">
                <div v-for="s in facultyStatusBreakdown" :key="s.key" class="flex items-center gap-2 justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: s.hex }"></div>
                    <span class="text-xs text-gray-600 truncate">{{ s.label }}</span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs font-bold text-gray-900 tabular-nums">{{ s.count }}</span>
                    <span class="text-[10px] text-gray-400 w-7 text-right tabular-nums">
                      {{ Math.round((s.count / dashCurricula.length) * 100) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Deadline -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <PhCalendar class="w-4 h-4 text-gray-400" />
              กำหนดส่ง
            </h3>
            <div v-if="!facultyDeadlines.length" class="text-center py-6">
              <PhCheckCircle class="mx-auto h-8 w-8 text-emerald-400" />
              <p class="mt-2 text-xs text-gray-500 font-medium">ไม่มีกำหนดส่งในเร็วๆ นี้</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in facultyDeadlines" :key="item.id" class="space-y-1.5">
                <router-link :to="`/curricula/${item.id}`" class="flex items-start gap-2.5 group transition-all duration-150 ease-ios">
                  <div :class="['w-2 h-2 rounded-full mt-1.5 shrink-0',
                    item.daysLeft < 0 ? 'bg-red-500 animate-pulse' :
                    item.daysLeft <= 7 ? 'bg-orange-400' : 'bg-primary-500']"></div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">
                      {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
                    </p>
                    <p :class="['text-[10px] mt-0.5 font-medium', item.daysLeft < 0 ? 'text-red-600' : 'text-gray-400']">
                      {{ item.daysLeft < 0 ? 'เกินกำหนด ' : '' }}{{ formatDate(item.deadline) }}
                    </p>
                  </div>
                  <span :class="['text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md',
                    item.daysLeft < 0 ? 'bg-red-100 text-red-700' :
                    item.daysLeft <= 7 ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600']">
                    {{ item.daysLeft < 0 ? `เกิน ${Math.abs(item.daysLeft)} วัน` : item.daysLeft === 0 ? 'วันนี้' : `${item.daysLeft} วัน` }}
                  </span>
                </router-link>
                <div class="ml-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                    :class="item.daysLeft < 0 ? 'bg-red-400' : item.daysLeft <= 7 ? 'bg-orange-400' : 'bg-primary-400'"
                    :style="`width: ${Math.max(5, Math.min(100, (1 - Math.max(0, item.daysLeft) / 30) * 100))}%`" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ───────────── Executive Content ───────────── -->
    <template v-if="authStore.isExecutive">

      <!-- ① At-risk alert — most urgent, always first -->
      <div v-if="atRiskCurricula.length"
        class="rounded-xl border border-orange-200 bg-orange-50/60 overflow-hidden">
        <div class="px-5 py-3 flex items-center gap-3">
          <PhWarning class="w-4 h-4 text-orange-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-orange-900">
              {{ atRiskCurricula.length }} หลักสูตรค้างสถานะนานกว่า 30 วัน ต้องเร่งติดตาม
            </p>
          </div>
          <button @click="showAtRisk = !showAtRisk"
            class="text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors shrink-0">
            {{ showAtRisk ? 'ซ่อน ▲' : 'ดูรายการ ▼' }}
          </button>
        </div>
        <Transition
          enter-active-class="transition-all duration-200 overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition-all duration-150 overflow-hidden"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0">
          <div v-if="showAtRisk" class="border-t border-orange-200 divide-y divide-orange-100">
            <router-link v-for="c in atRiskCurricula" :key="c.id" :to="`/curricula/${c.id}`"
              class="flex items-center gap-4 px-5 py-3 bg-white hover:bg-orange-50/40 transition-colors group">
              <div class="shrink-0 text-center w-12">
                <p class="text-xl font-black tabular-nums leading-none"
                  :class="(c.days_in_status || 0) >= 60 ? 'text-red-600' : 'text-orange-500'">
                  {{ c.days_in_status ?? 0 }}
                </p>
                <p class="text-[10px] text-gray-400 mt-0.5">วัน</p>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
                <p class="text-[11px] text-gray-400 mt-0.5">
                  {{ c.department?.name || 'ไม่ระบุภาควิชา' }}
                  <span class="mx-1 text-gray-200">/</span>
                  <span :class="(c.days_in_status || 0) >= 60 ? 'text-red-500' : 'text-orange-500'" class="font-semibold">
                    {{ EXEC_FULL_STATUS_LABELS[c.status] || c.status }}
                  </span>
                </p>
              </div>
              <PhCaretRight class="w-4 h-4 text-orange-300 group-hover:text-orange-500 shrink-0 transition-colors" />
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ② KPI strip — DC01 stagger + DC02 count-up + DC03 hover-lift -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 hover-lift animate-card-in stagger-1">
          <p class="text-3xl font-black text-gray-900 tabular-nums leading-none">{{ execCountTotal }}</p>
          <p class="text-xs font-semibold text-gray-500 mt-2">หลักสูตรทั้งหมด</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 hover-lift animate-card-in stagger-2">
          <p class="text-3xl font-black tabular-nums leading-none text-emerald-600">{{ execCountApproved }}</p>
          <p class="text-xs font-semibold text-gray-500 mt-2">
            อนุมัติแล้ว
            <span v-if="execStats.approvalRate > 0" class="text-emerald-500 ml-1">{{ execStats.approvalRate }}%</span>
          </p>
        </div>
        <button
          @click="togglePipelineStage('committee')"
          class="bg-white rounded-xl border shadow-sm px-4 py-4 text-left hover-lift animate-card-in stagger-3 transition-colors"
          :class="selectedPipelineStage === 'committee'
            ? 'border-blue-300 bg-blue-50/40'
            : 'border-gray-200'">
          <p class="text-3xl font-black tabular-nums leading-none text-blue-600">{{ execCountCommittee }}</p>
          <p class="text-xs font-semibold mt-2"
            :class="selectedPipelineStage === 'committee' ? 'text-blue-500' : 'text-gray-400'">
            อยู่ระหว่างคณะกรรมการ
          </p>
        </button>
        <button
          @click="togglePipelineStage('review')"
          class="bg-white rounded-xl border shadow-sm px-4 py-4 text-left hover-lift animate-card-in stagger-4 transition-colors"
          :class="selectedPipelineStage === 'review'
            ? 'border-orange-300 bg-orange-50/40'
            : 'border-gray-200'">
          <p class="text-3xl font-black tabular-nums leading-none"
            :class="execStats.needsAction > 0 ? 'text-orange-500' : 'text-gray-300'">
            {{ execCountNeeds }}
          </p>
          <p class="text-xs font-semibold mt-2"
            :class="selectedPipelineStage === 'review' ? 'text-orange-500' : 'text-gray-400'">
            รอดำเนินการ
          </p>
        </button>
      </div>

      <!-- KPI drill-down (needs action list) -->
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-150"
        leave-to-class="opacity-0 -translate-y-1">
        <div v-if="selectedPipelineStage && pipelineDrillDown.length"
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: execPipeline.find(s => s.key === selectedPipelineStage)?.color }"></span>
              <p class="text-sm font-bold text-gray-900">
                {{ execPipeline.find(s => s.key === selectedPipelineStage)?.label }}
              </p>
              <span class="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full tabular-nums">
                {{ pipelineDrillDown.length }} หลักสูตร
              </span>
            </div>
            <button @click="selectedPipelineStage = null"
              class="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              ปิด ×
            </button>
          </div>
          <div class="divide-y divide-gray-50">
            <router-link v-for="c in pipelineDrillDown" :key="c.id" :to="`/curricula/${c.id}`"
              class="flex items-center gap-3.5 px-5 py-3 hover:bg-gray-50/80 active:bg-gray-100 transition-all duration-150 ease-ios group">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                    {{ { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' }[c.degree_level] }}
                  </span>
                  <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                    {{ c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุชื่อ' }}
                  </p>
                </div>
                <p class="text-[11px] text-gray-400 truncate">{{ c.department?.name || 'ไม่ระบุภาควิชา' }}</p>
              </div>
              <PhCaretRight class="w-4 h-4 text-gray-300 group-hover:text-primary-400 shrink-0 transition-colors" />
            </router-link>
          </div>
        </div>
      </Transition>

      <!-- ③ Deadline — T13 เพิ่ม deadline section สำหรับผู้บริหาร -->
      <div v-if="execDeadlineItems.length"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-card-in">
        <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <PhCalendar class="w-4 h-4 text-gray-400 shrink-0" />
            <h3 class="text-sm font-bold text-gray-900">กำหนดส่งใกล้ถึง</h3>
            <span class="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full tabular-nums">
              {{ execDeadlineItems.length }} หลักสูตร
            </span>
          </div>
          <router-link to="/curricula"
            class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors">
            ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
          </router-link>
        </div>
        <div class="divide-y divide-gray-50">
          <router-link v-for="item in execDeadlineItems" :key="item.id" :to="`/curricula/${item.id}`"
            class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/80 active:bg-gray-100 transition-all duration-150 ease-ios group">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
              </p>
              <p class="text-[10px] text-gray-400 mt-0.5 truncate">{{ item.department?.name || 'ไม่ระบุ' }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-xs font-semibold text-gray-700">{{ formatDate(item.deadline) }}</p>
              <span :class="[
                'text-[11px] font-black tabular-nums px-2 py-0.5 rounded mt-0.5 inline-block',
                item.daysLeft < 0 ? 'text-red-600 bg-red-50'
                  : item.daysLeft === 0 ? 'text-red-600 bg-red-50'
                  : item.daysLeft <= 2 ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-500 bg-gray-100'
              ]">
                {{ item.daysLeft < 0 ? `เกิน ${Math.abs(item.daysLeft)} วัน` : item.daysLeft === 0 ? 'วันนี้' : `เหลือ ${item.daysLeft} วัน` }}
              </span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ④ Committee status — unified card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Card header + filter chips -->
        <div class="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-gray-900">สถานะคณะกรรมการ</h3>
            <p class="text-xs text-gray-400 mt-0.5">หลักสูตรที่อยู่ระหว่างพิจารณาและผ่านการอนุมัติ</p>
          </div>
          <!-- Filter chips inline -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button v-for="deg in execDegreeOptions" :key="deg.key"
              @click="selectedExecDegree = selectedExecDegree === deg.key ? null : deg.key"
              class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all"
              :style="selectedExecDegree === deg.key
                ? { backgroundColor: deg.color, borderColor: deg.color, color: 'white' }
                : { backgroundColor: deg.color + '10', borderColor: deg.color + '40', color: deg.color }">
              {{ deg.label }}
            </button>
            <span v-if="execDegreeOptions.length && execDeptOptions.length" class="text-gray-200 text-xs">|</span>
            <button v-for="dept in execDeptOptions" :key="dept.key"
              @click="selectedExecDept = selectedExecDept === dept.key ? null : dept.key"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all"
              :style="selectedExecDept === dept.key
                ? { backgroundColor: dept.color, borderColor: dept.color, color: 'white' }
                : { backgroundColor: dept.color + '10', borderColor: dept.color + '40', color: dept.color }">
              <component :is="dept.icon" weight="bold" class="w-3 h-3 shrink-0"
                :style="{ color: selectedExecDept === dept.key ? 'white' : dept.color }" />
              {{ dept.short }}
            </button>
            <button v-if="hasExecFilter" @click="clearExecFilters"
              class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors ml-1">
              ล้าง ×
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!deptCards.length" class="py-14 flex flex-col items-center text-center">
          <PhClock class="w-8 h-8 text-gray-300 mb-3" />
          <p class="text-sm font-semibold text-gray-500">ยังไม่มีหลักสูตรในขั้นพิจารณา</p>
        </div>

        <template v-else>
          <!-- Degree progress bars -->
          <div v-if="degreeProgressChart.length" class="px-3 sm:px-6 pt-5 pb-4">
            <div class="space-y-3 mb-2">
              <div v-for="deg in degreeProgressChart" :key="deg.key" class="flex items-center gap-3">
                <div class="w-16 sm:w-20 shrink-0 text-right">
                  <span class="text-[11px] font-bold" :style="{ color: deg.color }">{{ deg.label }}</span>
                </div>
                <!-- h-8 = 16px flag zone above + h-4 bar at bottom -->
                <div class="flex-1 relative h-8">
                  <div class="absolute bottom-0 inset-x-0 h-4 bg-gray-100 rounded overflow-hidden">
                    <div class="absolute inset-0 flex pointer-events-none">
                      <div v-for="s in MATRIX_STAGES" :key="s.key"
                        class="flex-1 border-r border-white/60 last:border-0"></div>
                    </div>
                    <div class="absolute left-0 top-0 h-full transition-all duration-700"
                      :style="{ width: deg.widthPct + '%', backgroundColor: deg.color }"></div>
                  </div>
                  <PhFlag v-if="deg.stageIdx >= 0"
                    weight="fill"
                    class="absolute bottom-4 w-3.5 h-3.5 pointer-events-none"
                    :style="{ left: `calc(${deg.widthPct}% - 2px)`, color: deg.color }" />
                </div>
              </div>
            </div>
            <div class="flex ml-[76px] sm:ml-[92px]">
              <div v-for="s in MATRIX_STAGES" :key="s.key"
                class="flex-1 text-center px-0.5 pt-1.5 border-t border-gray-100">
                <span class="text-[8px] leading-tight text-gray-400 block">{{ s.label }}</span>
              </div>
            </div>
          </div>

          <!-- Stage list (click to filter dept cards below) -->
          <div v-if="pipelineByStage.length" class="border-t border-gray-100 divide-y divide-gray-100">
            <button v-for="stage in pipelineByStage" :key="stage.key"
              @click="toggleMatrixStage(stage.key)"
              class="w-full text-left flex items-start gap-4 px-5 py-3.5 transition-colors group"
              :class="selectedMatrixStage === stage.key
                ? 'bg-primary-50/60 hover:bg-primary-50/80'
                : 'hover:bg-gray-50/70'">
              <div class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-black tabular-nums mt-0.5 transition-colors"
                :class="selectedMatrixStage === stage.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'">
                {{ stage.stepIndex }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-bold mb-1.5 transition-colors"
                  :class="selectedMatrixStage === stage.key ? 'text-primary-700' : 'text-gray-700'">
                  {{ stage.label }}
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="c in stage.curricula" :key="c.id"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    :style="{
                      backgroundColor: c.deptColor + '15',
                      color: c.deptColor,
                      borderColor: c.deptColor + '35',
                    }">
                    <component v-if="c.deptIcon" :is="c.deptIcon" weight="bold" class="w-3 h-3 shrink-0" :style="{ color: c.deptColor }" />
                    {{ c.label }}
                  </span>
                </div>
              </div>
              <PhCaretRight class="w-4 h-4 shrink-0 transition-all mt-1"
                :class="selectedMatrixStage === stage.key
                  ? 'text-primary-500 rotate-90'
                  : 'text-gray-300 group-hover:text-gray-500'" />
            </button>
          </div>

          <!-- Dept cards — drill-down, shown only when stage selected -->
          <Transition
            enter-active-class="transition-all duration-200 overflow-hidden"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-150 overflow-hidden"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="selectedMatrixStage && filteredDeptCards.length"
              class="border-t border-primary-100 bg-gray-50/40">
              <div class="px-5 py-2 flex items-center justify-between">
                <p class="text-[11px] font-bold text-gray-400">รายละเอียดตามสาขา</p>
                <button @click="clearMatrixFilter"
                  class="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  ปิด ×
                </button>
              </div>
              <div class="px-3 pb-3 space-y-2">
                <div v-for="dept in filteredDeptCards" :key="dept.key"
                  class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div class="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <component :is="dept.icon" weight="bold" class="w-3.5 h-3.5 shrink-0" :style="{ color: dept.color }" />
                    <span class="text-xs font-bold text-gray-800">{{ dept.short }}</span>
                    <span class="ml-auto text-[10px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full tabular-nums">
                      {{ dept.curricula.length }}
                    </span>
                  </div>
                  <div class="divide-y divide-gray-50">
                    <router-link v-for="c in dept.curricula" :key="c.id" :to="`/curricula/${c.id}`"
                      class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                      <div class="shrink-0 text-center w-8 pt-0.5">
                        <span class="text-base font-black tabular-nums leading-none"
                          :class="c.status === 'approved' ? 'text-emerald-600' : 'text-primary-600'">
                          {{ c.completedSteps }}
                        </span>
                        <p class="text-[10px] text-gray-400 mt-0.5">จาก {{ c.totalSteps }}</p>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                          <span class="text-[10px] font-bold bg-gray-100 text-gray-400 px-1 py-0.5 rounded shrink-0">
                            {{ { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' }[c.degreeLevel] }}
                          </span>
                          <p class="text-[12px] font-bold text-gray-800 truncate group-hover:text-primary-700 transition-colors">
                            {{ c.name }}
                          </p>
                        </div>
                        <div class="mt-2">
                          <!-- h-4 = 12px flag zone above + 4px bar at bottom, flag base sits on bar top -->
                          <div class="relative h-4">
                            <div class="absolute bottom-0 inset-x-0 flex gap-[2px]">
                              <div v-for="idx in c.totalSteps" :key="idx"
                                :class="[
                                  'flex-1 h-1 rounded-sm',
                                  idx - 1 < c.completedSteps
                                    ? (c.status === 'approved' ? 'bg-emerald-500' : 'bg-primary-500')
                                    : idx - 1 === c.completedSteps && c.status !== 'approved'
                                      ? 'bg-primary-300'
                                      : 'bg-gray-100'
                                ]"></div>
                            </div>
                            <PhFlag v-if="c.status !== 'approved' && c.completedSteps < c.totalSteps"
                              weight="fill"
                              class="absolute bottom-1 w-3 h-3 text-primary-500 pointer-events-none"
                              :style="{ left: `calc(${(c.completedSteps / c.totalSteps) * 100}%)` }" />
                          </div>
                          <p class="text-[10px] mt-0.5 font-semibold"
                            :class="c.status === 'approved' ? 'text-emerald-600' : 'text-gray-400'">
                            {{ c.status === 'approved' ? '✓ อนุมัติ' : c.currentStageLabel }}
                          </p>
                        </div>
                      </div>
                      <PhCaretRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 shrink-0 mt-1 transition-colors" />
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </template>
      </div>

    </template>

    <!-- ───────────── Admin Dashboard ───────────── -->
    <template v-if="authStore.isAdmin">

      <!-- ── Row 1: KPI Cards — DC01 stagger + DC02 count-up + DC03 hover-lift ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <!-- Total -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5 hover-lift animate-card-in stagger-1">
          <p class="text-4xl font-black text-gray-900 tabular-nums leading-none">{{ countTotal }}</p>
          <p class="text-xs font-semibold text-gray-500 mt-3">หลักสูตรทั้งหมด</p>
        </div>

        <!-- Needs Action — border-l accent แทน top line บาง -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5 relative overflow-hidden hover-lift animate-card-in stagger-2 border-l-4"
          :class="adminStats.needsAction > 0 ? 'border-l-orange-400' : 'border-l-gray-200'">
          <p class="text-4xl font-black tabular-nums leading-none"
            :class="adminStats.needsAction > 0 ? 'text-orange-500' : 'text-gray-300'">
            {{ countNeedsAction }}
          </p>
          <p class="text-xs font-semibold mt-3"
            :class="adminStats.needsAction > 0 ? 'text-orange-500' : 'text-gray-500'">
            รอตรวจสอบ
          </p>
        </div>

        <!-- Revision -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5 hover-lift animate-card-in stagger-3">
          <p class="text-4xl font-black tabular-nums leading-none"
            :class="adminStats.revision > 0 ? 'text-red-500' : 'text-gray-300'">
            {{ countRevision }}
          </p>
          <p class="text-xs font-semibold text-gray-500 mt-3">ส่งกลับแก้ไข</p>
        </div>

        <!-- Approved -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5 hover-lift animate-card-in stagger-4">
          <div class="flex items-end gap-2 leading-none">
            <p class="text-4xl font-black text-emerald-600 tabular-nums leading-none">{{ countApproved }}</p>
            <span v-if="adminStats.approvalRate > 0"
              class="text-sm font-bold text-emerald-400 tabular-nums mb-0.5">
              {{ adminStats.approvalRate }}%
            </span>
          </div>
          <p class="text-xs font-semibold text-gray-500 mt-3">อนุมัติแล้ว</p>
        </div>

      </div>

      <!-- ── Row 2: Action Queue + Deadline ── -->
      <div class="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 items-stretch">

        <!-- Action Queue -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <p class="text-sm font-bold text-gray-800">รายการที่ต้องดำเนินการ</p>
              <span v-if="actionQueue.length"
                class="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full tabular-nums">
                {{ actionQueue.length }}
              </span>
            </div>
            <router-link to="/curricula"
              class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors duration-150">
              ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
            </router-link>
          </div>

          <EmptyState
            v-if="!actionQueue.length"
            variant="success"
            title="ไม่มีรายการค้างดำเนินการ"
            description="หลักสูตรทุกรายการอยู่ในสถานะปกติ"
            :icon="PhCheckCircle"
            size="sm"
          />

          <div v-else class="divide-y divide-gray-50">
            <router-link v-for="item in actionQueue" :key="item.id" :to="`/curricula/${item.id}`"
              class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 active:bg-gray-100 transition-all duration-150 ease-ios group">
              <!-- Urgency dot -->
              <div class="shrink-0 w-1.5 h-1.5 rounded-full mt-0.5"
                :class="item.status === 'pending_admin_recheck' ? 'bg-blue-400' : 'bg-orange-400'">
              </div>
              <!-- Name -->
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] text-gray-400 truncate">{{ item.department?.name || 'ไม่ระบุ' }}</span>
                  <span class="text-gray-200">·</span>
                  <span class="text-[10px] font-medium"
                    :class="item.status === 'pending_admin_recheck' ? 'text-blue-500' : 'text-orange-500'">
                    {{ item.status === 'pending_admin_recheck' ? 'ภาควิชาแก้ไขแล้ว' : 'รอตรวจสอบเอกสาร' }}
                  </span>
                </div>
              </div>
              <PhCaretRight class="w-4 h-4 text-gray-300 group-hover:text-primary-400 shrink-0 transition-colors" />
            </router-link>
          </div>
        </div>

        <!-- Deadline Countdown -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-gray-100">
            <p class="text-sm font-bold text-gray-800">กำหนดส่งใกล้ถึง</p>
          </div>

          <div v-if="!deadlineItems.length" class="flex flex-col items-center justify-center flex-1 text-center px-4 py-10">
            <p class="text-xs font-medium text-gray-400">ไม่มีกำหนดส่งใน 7 วันข้างหน้า</p>
          </div>

          <div v-else class="divide-y divide-gray-50 flex-1">
            <router-link v-for="item in deadlineItems" :key="item.id" :to="`/curricula/${item.id}`"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 active:bg-gray-100 transition-all duration-150 ease-ios group">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-gray-800 leading-snug group-hover:text-primary-700 transition-colors truncate">
                  {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
                <p class="text-[10px] text-gray-400 mt-0.5 truncate">{{ item.department?.name || 'ไม่ระบุ' }}</p>
              </div>
              <span :class="[
                'shrink-0 text-[11px] font-black tabular-nums px-2 py-0.5 rounded',
                item.daysLeft < 0 ? 'text-red-600 bg-red-50'
                  : item.daysLeft === 0 ? 'text-red-600 bg-red-50'
                  : item.daysLeft <= 2 ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-500 bg-gray-100'
              ]">
                {{ item.daysLeft < 0 ? `เกิน ${Math.abs(item.daysLeft)} วัน` : item.daysLeft === 0 ? 'วันนี้' : `${item.daysLeft} วัน` }}
              </span>
            </router-link>
          </div>
        </div>

      </div>

      <!-- ── Row 3: Recent Curricula ── -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p class="text-sm font-bold text-gray-800">หลักสูตรล่าสุด</p>
          <router-link to="/curricula"
            class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors duration-150">
            ดูทั้งหมด <PhCaretRight class="w-3 h-3" />
          </router-link>
        </div>

        <div v-if="dashLoading" class="p-5 space-y-4 animate-pulse">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3">
            <div class="h-3.5 bg-gray-100 rounded w-8 shrink-0"></div>
            <div class="h-3.5 bg-gray-100 rounded flex-1"></div>
            <div class="h-4 bg-gray-100 rounded w-20 shrink-0"></div>
          </div>
        </div>

        <div v-else-if="!recentCurricula.length" class="py-14 text-center">
          <PhFileText class="mx-auto h-8 w-8 text-gray-300" />
          <p class="mt-2 text-xs font-medium text-gray-400">ยังไม่มีหลักสูตรในระบบ</p>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <router-link v-for="item in recentCurricula" :key="item.id" :to="`/curricula/${item.id}`"
            class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 active:bg-gray-100 transition-all duration-150 ease-ios group">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                  {{ { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' }[item.degree_level] }}
                </span>
                <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                  {{ item.field_of_study ? `สาขาวิชา${item.field_of_study}` : item.degree_name || 'ไม่ระบุชื่อ' }}
                </p>
              </div>
              <p class="text-[11px] text-gray-400 truncate">{{ item.department?.name || 'ไม่ระบุภาควิชา' }}</p>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <span v-if="(item.days_in_status || 0) > 14 && item.status !== 'approved'"
                class="text-[10px] font-bold text-orange-500 tabular-nums bg-orange-50 px-1.5 py-0.5 rounded">
                {{ item.days_in_status }} วัน
              </span>
              <StatusBadge :status="item.status" :curriculum="item" />
            </div>
          </router-link>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { useDashboard } from '@/composables/useDashboard';
import { useCountUp } from '@/composables/useCountUp';
import { formatThaiDateNumeric } from '@/utils/date';
import StatusBadge from '@/components/common/StatusBadge.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import {
  PhCaretRight, PhFileText, PhWarning,
  PhCheckCircle, PhBank, PhSquaresFour, PhCalendar,
  PhClock, PhArrowCounterClockwise, PhClipboardText,
  PhGraduationCap, PhChartBar, PhListBullets, PhFunnel, PhFlag,
  PhPaperPlaneTilt,
} from '@phosphor-icons/vue';
import { DEPT_CONFIG } from '@/constants/deptConfig';

const authStore = useAuthStore();
const {
  curricula: dashCurricula, loading: dashLoading, fetch: fetchDashboard,
  revisionItems, pendingItems,
} = useDashboard();

const isFaculty = computed(() =>
  authStore.user?.role === 'faculty' || authStore.user?.role === 'staff'
);

const formatDate = formatThaiDateNumeric;


const COMMITTEE_TYPE_LABEL = {
  faculty_academic:          'คณะกรรมการวิชาการประจำคณะ',
  faculty_board:             'คณะกรรมการประจำคณะ',
  general_education:         'คณะกรรมการตรวจรายวิชาฯ',
  university_academic:       'คณะกรรมการวิชาการ มน.',
  graduate_school:           'คณะกรรมการบัณฑิตวิทยาลัย',
  university_council_academic: 'สภาวิชาการ มน.',
  university_council:        'สภามหาวิทยาลัย',
  cisa:                      'CISA',
};

const committeeStepLabel = (item) => {
  const steps = item.committee_steps ?? [];
  // Find the current active step: first non-approved, falling back to last step
  const active = steps.find(s => s.id === item.current_committee_step_id)
    ?? steps.find(s => s.status !== 'approved')
    ?? steps[steps.length - 1];
  return active ? (COMMITTEE_TYPE_LABEL[active.committee_type] ?? active.committee_type) : '';
};

const FACULTY_STATUS_META = [
  { key: 'approved',             label: 'อนุมัติโดย สป.อว.',        hex: '#10b981' },
  { key: 'under_committee',      label: 'อยู่ระหว่างคณะกรรมการ', hex: '#3b82f6' },
  { key: 'department_submitted', label: 'รอตรวจสอบ',             hex: '#f59e0b' },
  { key: 'revision',             label: 'ส่งกลับแก้ไข',          hex: '#ef4444' },
  { key: 'pending_department',   label: 'รอดำเนินการ',           hex: '#94a3b8' },
];

const facultyStatusBreakdown = computed(() =>
  FACULTY_STATUS_META
    .map(s => ({ ...s, count: dashCurricula.value.filter(c => c.status === s.key).length }))
    .filter(s => s.count > 0)
);

const facultyDonutStyle = computed(() => {
  const total = dashCurricula.value.length;
  if (!total) return { background: '#f1f5f9' };
  const active = facultyStatusBreakdown.value;
  if (!active.length) return { background: '#f1f5f9' };
  let pct = 0;
  const stops = active.map(s => {
    const from = pct.toFixed(2);
    pct += (s.count / total) * 100;
    return `${s.hex} ${from}% ${pct.toFixed(2)}%`;
  });
  return { background: `conic-gradient(from -90deg, ${stops.join(', ')})` };
});

const facultyDeadlines = computed(() => {
  const today = dayjs();
  return dashCurricula.value
    .filter(c => c.deadline && c.status !== 'approved')
    .map(c => ({ ...c, daysLeft: dayjs(c.deadline).diff(today, 'day') }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
});

// ─── Shared config (imported from @/constants/deptConfig) ─────────────────────

// ─── Status metadata (used in both donut + dept bars + proportion bar) ────────
const STATUS_META = [
  { key: 'approved',             label: 'อนุมัติโดย สป.อว.',       shortLabel: 'อนุมัติ',       hex: '#10b981' },
  { key: 'under_committee',      label: 'อยู่ระหว่างพิจารณา',   shortLabel: 'ระหว่างพิจารณา', hex: '#3b82f6' },
  { key: 'department_submitted', label: 'รอตรวจสอบเอกสาร',      shortLabel: 'รอตรวจสอบ',     hex: '#f59e0b' },
  { key: 'pending_admin_recheck',label: 'รอเจ้าหน้าที่ตรวจสอบ',      shortLabel: 'หลังแก้ไข',      hex: '#8b5cf6' },
  { key: 'revision',             label: 'ส่งกลับแก้ไข',          shortLabel: 'ส่งกลับแก้ไข',   hex: '#ef4444' },
  { key: 'pending_department',   label: 'รอภาควิชาส่งเอกสาร',   shortLabel: 'รอภาควิชา',      hex: '#94a3b8' },
];

// ─── Executive computed ───────────────────────────────────────────────────────
const selectedExecDept   = ref(null);
const selectedExecDegree = ref(null);
const showAtRisk         = ref(false);

const EXEC_DEGREE_OPTIONS = [
  { key: 'bachelor', label: 'ปริญญาตรี', short: 'ตรี',  color: '#3b82f6' },
  { key: 'master',   label: 'ปริญญาโท',  short: 'โท',   color: '#f97316' },
  { key: 'doctoral', label: 'ปริญญาเอก', short: 'เอก',  color: '#10b981' },
];

const execDeptOptions = computed(() => {
  const names = new Set(dashCurricula.value.map(c => c.department?.name).filter(Boolean));
  return DEPT_CONFIG.filter(d => names.has(d.key));
});

const execDegreeOptions = computed(() => {
  const keys = new Set(dashCurricula.value.map(c => c.degree_level).filter(Boolean));
  return EXEC_DEGREE_OPTIONS.filter(d => keys.has(d.key));
});

const execCurricula = computed(() => {
  let all = dashCurricula.value;
  if (selectedExecDept.value)   all = all.filter(c => c.department?.name === selectedExecDept.value);
  if (selectedExecDegree.value) all = all.filter(c => c.degree_level    === selectedExecDegree.value);
  return all;
});

const hasExecFilter = computed(() => !!(selectedExecDept.value || selectedExecDegree.value));

const clearExecFilters = () => {
  selectedExecDept.value   = null;
  selectedExecDegree.value = null;
  selectedMatrixStage.value = null;
  selectedMatrixDept.value  = null;
};

const execStats = computed(() => {
  const all = execCurricula.value;
  const total = all.length;
  const approved = all.filter(c => c.status === 'approved').length;
  return {
    total,
    approved,
    approvalRate: total ? Math.round((approved / total) * 100) : 0,
    underCommittee: all.filter(c => c.status === 'under_committee').length,
    needsAction: all.filter(c => ['department_submitted', 'revision', 'pending_department'].includes(c.status)).length,
  };
});

// DC02 count-up refs — exec KPI cards
const execCountTotal     = useCountUp(computed(() => execStats.value.total),          { duration: 650, delay: 50  });
const execCountApproved  = useCountUp(computed(() => execStats.value.approved),       { duration: 650, delay: 100 });
const execCountCommittee = useCountUp(computed(() => execStats.value.underCommittee), { duration: 650, delay: 150 });
const execCountNeeds     = useCountUp(computed(() => execStats.value.needsAction),    { duration: 650, delay: 200 });

const EXEC_FULL_STATUS_LABELS = {
  pending_department:    'รอภาควิชาจัดส่งเอกสาร',
  revision:              'อยู่ระหว่างการแก้ไขตามข้อเสนอแนะ',
  department_submitted:  'รอการตรวจสอบเอกสารจากเจ้าหน้าที่',
  pending_admin_recheck: 'รอการตรวจสอบภายหลังการแก้ไข',
  under_committee:       'อยู่ระหว่างการพิจารณาของคณะกรรมการ',
};

const execPipeline = computed(() => [
  { key: 'pending',   label: 'รอภาควิชาจัดส่งเอกสาร',                  color: '#94a3b8', statuses: ['pending_department'] },
  { key: 'revision',  label: 'อยู่ระหว่างการแก้ไขตามข้อเสนอแนะ',       color: '#ef4444', statuses: ['revision'] },
  { key: 'review',    label: 'รอการตรวจสอบเอกสารจากเจ้าหน้าที่',        color: '#f59e0b', statuses: ['department_submitted', 'pending_admin_recheck'] },
  { key: 'committee', label: 'อยู่ระหว่างการพิจารณาของคณะกรรมการ',      color: '#3b82f6', statuses: ['under_committee'] },
  { key: 'approved',  label: 'ผ่านการอนุมัติเรียบร้อยแล้ว',             color: '#10b981', statuses: ['approved'] },
].map(stage => ({
  ...stage,
  count: dashCurricula.value.filter(c => stage.statuses.includes(c.status)).length,
})));

const selectedPipelineStage = ref(null);
const togglePipelineStage = (key) => {
  selectedPipelineStage.value = selectedPipelineStage.value === key ? null : key;
};
const pipelineDrillDown = computed(() => {
  if (!selectedPipelineStage.value) return [];
  const stage = execPipeline.value.find(s => s.key === selectedPipelineStage.value);
  if (!stage) return [];
  return dashCurricula.value
    .filter(c => stage.statuses.includes(c.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
});

const atRiskCurricula = computed(() =>
  dashCurricula.value
    .filter(c => c.status !== 'approved' && (c.days_in_status || 0) >= 30)
    .sort((a, b) => (b.days_in_status || 0) - (a.days_in_status || 0))
    .slice(0, 6)
);

const EXEC_COMMITTEE_LABELS = [
  'คณะกรรมการวิชาการประจำคณะ',
  'คณะกรรมการประจำคณะ',
  'คณะกรรมการตรวจรายวิชาฯ',
  'คณะกรรมการวิชาการ มน.',
  'คณะกรรมการบัณฑิตวิทยาลัย',
  'สภาวิชาการ มน.',
  'สภามหาวิทยาลัย',
  'CISA',
];

const COMMITTEE_FULL_NAMES = {
  faculty_academic:            'คณะกรรมการวิชาการประจำคณะ',
  faculty_board:               'คณะกรรมการประจำคณะ',
  general_education:           'คณะกรรมการตรวจรายวิชาศึกษาทั่วไป',
  university_academic:         'คณะกรรมการวิชาการ มน.',
  graduate_school:             'คณะกรรมการประจำบัณฑิตวิทยาลัย',
  university_council_academic: 'คณะกรรมการสภาวิชาการ มน.',
  university_council:          'สภามหาวิทยาลัย',
  cisa:                        'CISA',
};

const COMMITTEE_SEQUENCE = {
  bachelor: ['faculty_academic', 'faculty_board', 'general_education', 'university_academic', 'university_council_academic', 'university_council', 'cisa'],
  master:   ['faculty_academic', 'faculty_board', 'university_academic', 'graduate_school', 'university_council_academic', 'university_council', 'cisa'],
  doctoral: ['faculty_academic', 'faculty_board', 'university_academic', 'graduate_school', 'university_council_academic', 'university_council', 'cisa'],
};

const selectedCommitteeDept = ref(null);

watch([selectedExecDept, selectedExecDegree], () => {
  selectedCommitteeDept.value = null;
  selectedMatrixStage.value   = null;
  selectedMatrixDept.value    = null;
});

// ─── Degree-level progress chart ─────────────────────────────────────────────
const DEGREE_CHART_CONFIG = [
  { key: 'bachelor', label: 'ปริญญาตรี', color: '#3b82f6' },
  { key: 'master',   label: 'ปริญญาโท',  color: '#f97316' },
  { key: 'doctoral', label: 'ปริญญาเอก', color: '#10b981' },
];

const degreeProgressChart = computed(() =>
  DEGREE_CHART_CONFIG
    .map(deg => {
      const curricula = execCurricula.value.filter(
        c => c.status === 'under_committee' && c.degree_level === deg.key
      );
      let maxStageIdx = -1;
      curricula.forEach(c => {
        const stageKey = getCurrentStageKey(c);
        if (stageKey) {
          const idx = MATRIX_STAGES.findIndex(s => s.key === stageKey);
          if (idx > maxStageIdx) maxStageIdx = idx;
        }
      });
      return {
        ...deg,
        count:      curricula.length,
        stageIdx:   maxStageIdx,
        widthPct:   maxStageIdx >= 0 ? ((maxStageIdx + 1) / MATRIX_STAGES.length) * 100 : 0,
        stageLabel: maxStageIdx >= 0 ? MATRIX_STAGES[maxStageIdx].label : null,
      };
    })
    .filter(d => d.count > 0)
);

// ─── Executive Matrix ─────────────────────────────────────────────────────────
const MATRIX_STAGES = [
  { key: 'faculty_academic',            label: 'คณะกรรมการวิชาการประจำคณะวิทยาศาสตร์' },
  { key: 'faculty_board',               label: 'คณะกรรมการประจำคณะวิทยาศาสตร์' },
  { key: 'general_education',           label: 'คณะกรรมการตรวจรายวิชาศึกษาทั่วไป' },
  { key: 'university_academic',         label: 'คณะกรรมการวิชาการ มหาวิทยาลัยนเรศวร' },
  { key: 'graduate_school',             label: 'คณะกรรมการประจำบัณฑิตวิทยาลัย' },
  { key: 'university_council_academic', label: 'คณะกรรมการสภาวิชาการ มหาวิทยาลัยนเรศวร' },
  { key: 'university_council',          label: 'คณะกรรมการสภามหาวิทยาลัย' },
  { key: 'cisa',                        label: 'สป.อว. (CISA)' },
];

const selectedMatrixStage = ref(null);
const selectedMatrixDept  = ref(null);

const getCurrentStageKey = (c) => {
  if (c.status !== 'under_committee') return null;
  if (!c.current_committee_step_id || !c.committee_steps?.length) return null;
  const step = c.committee_steps.find(s => s.id === c.current_committee_step_id);
  return step?.committee_type || null;
};

const matrixActiveDepts = computed(() => {
  const names = new Set(
    execCurricula.value
      .filter(c => c.status === 'under_committee')
      .map(c => c.department?.name)
      .filter(Boolean)
  );
  return DEPT_CONFIG.filter(d => names.has(d.key));
});

const matrixCellCount = (stageKey, deptKey) =>
  execCurricula.value.filter(c =>
    c.status === 'under_committee' &&
    c.department?.name === deptKey &&
    getCurrentStageKey(c) === stageKey
  ).length;

const matrixRowHasData = (stageKey) =>
  matrixActiveDepts.value.some(d => matrixCellCount(stageKey, d.key) > 0);

const isSelectedCell = (stageKey, deptKey) =>
  selectedMatrixStage.value === stageKey && selectedMatrixDept.value === deptKey;

const toggleMatrixCell = (stageKey, deptKey) => {
  if (isSelectedCell(stageKey, deptKey)) {
    selectedMatrixStage.value = null;
    selectedMatrixDept.value  = null;
  } else {
    selectedMatrixStage.value = stageKey;
    selectedMatrixDept.value  = deptKey;
  }
};

const clearMatrixFilter = () => {
  selectedMatrixStage.value = null;
  selectedMatrixDept.value  = null;
};

const toggleMatrixStage = (stageKey) => {
  if (selectedMatrixStage.value === stageKey) {
    selectedMatrixStage.value = null;
  } else {
    selectedMatrixStage.value = stageKey;
    selectedMatrixDept.value  = null;
  }
};

const pipelineByStage = computed(() => {
  const degreeLabel = { bachelor: 'ตรี', master: 'โท', doctoral: 'เอก' };
  const underCommittee = execCurricula.value.filter(c => c.status === 'under_committee');
  return MATRIX_STAGES
    .map((stage, idx) => {
      const curricula = underCommittee
        .filter(c => getCurrentStageKey(c) === stage.key)
        .map(c => {
          const dept = DEPT_CONFIG.find(d => d.key === c.department?.name);
          const dl = degreeLabel[c.degree_level];
          return {
            id:        c.id,
            label:     `${dept?.short ?? c.department?.name ?? '?'}${dl ? ' ' + dl : ''}`,
            deptColor: dept?.color ?? '#94a3b8',
            deptIcon:  dept?.icon  ?? null,
          };
        });
      return { ...stage, stepIndex: idx + 1, curricula };
    })
    .filter(s => s.curricula.length > 0);
});

const deptCards = computed(() =>
  DEPT_CONFIG.map(dept => {
    const curricula = execCurricula.value
      .filter(c => c.department?.name === dept.key && ['under_committee', 'approved'].includes(c.status))
      .map(c => {
        const seq = COMMITTEE_SEQUENCE[c.degree_level] || COMMITTEE_SEQUENCE.master;
        const totalSteps = seq.length;
        const approvedCount = (c.committee_steps || []).filter(s => s.status === 'approved').length;
        const completedSteps = c.status === 'approved' ? totalSteps : approvedCount;
        const currentStep = c.committee_steps?.find(s => s.id === c.current_committee_step_id);
        const currentStageKey = c.status !== 'approved' ? (currentStep?.committee_type || null) : null;
        const currentStageLabel = MATRIX_STAGES.find(s => s.key === currentStageKey)?.label ?? 'ไม่ระบุ';
        return {
          id: c.id,
          name: c.field_of_study ? `สาขาวิชา${c.field_of_study}` : (c.degree_name || 'ไม่ระบุ'),
          degreeLevel: c.degree_level,
          status: c.status,
          completedSteps,
          totalSteps,
          currentStageKey,
          currentStageLabel,
        };
      })
      .sort((a, b) => b.completedSteps - a.completedSteps);
    return { ...dept, curricula };
  }).filter(d => d.curricula.length > 0)
);

const filteredDeptCards = computed(() => {
  let cards = deptCards.value;
  if (selectedMatrixDept.value)
    cards = cards.filter(d => d.key === selectedMatrixDept.value);
  if (selectedMatrixStage.value)
    cards = cards
      .map(d => ({ ...d, curricula: d.curricula.filter(c => c.currentStageKey === selectedMatrixStage.value) }))
      .filter(d => d.curricula.length > 0);
  return cards;
});

const execCommitteeProgress = computed(() => {
  return DEPT_CONFIG.map(dept => {
    const cs = execCurricula.value.filter(c =>
      c.department?.name === dept.key &&
      ['under_committee', 'approved'].includes(c.status)
    );
    const curricula = cs.map(c => {
      const seq = COMMITTEE_SEQUENCE[c.degree_level] || COMMITTEE_SEQUENCE.master;
      const totalSteps = seq.length;
      const approvedCount = (c.committee_steps || []).filter(s => s.status === 'approved').length;
      const completedSteps = c.status === 'approved' ? totalSteps : approvedCount;
      const currentStep = c.committee_steps?.find(s => s.id === c.current_committee_step_id);
      const currentStageLabel = currentStep
        ? (MATRIX_STAGES.find(s => s.key === currentStep.committee_type)?.label ?? currentStep.committee_type)
        : (c.status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่ระบุ');
      return {
        id: c.id,
        name: c.field_of_study ? `สาขาวิชา${c.field_of_study}` : c.degree_name || 'ไม่ระบุ',
        degreeLevel: c.degree_level,
        status: c.status,
        completedSteps,
        totalSteps,
        currentStageLabel,
        stepLabels: seq.map(k => COMMITTEE_FULL_NAMES[k] || k),
      };
    }).sort((a, b) => b.completedSteps - a.completedSteps);

    return { ...dept, curricula };
  }).filter(d => d.curricula.length > 0).sort((a, b) => b.curricula.length - a.curricula.length);
});

const filteredCommitteeProgress = computed(() =>
  selectedCommitteeDept.value
    ? execCommitteeProgress.value.filter(d => d.key === selectedCommitteeDept.value)
    : execCommitteeProgress.value
);

const degreeBreakdown = computed(() => [
  { key: 'bachelor', label: 'ปริญญาตรี' },
  { key: 'master',   label: 'ปริญญาโท' },
  { key: 'doctoral', label: 'ปริญญาเอก' },
].map(deg => {
  const cs = execCurricula.value.filter(c => c.degree_level === deg.key);
  const segments = DEPT_CONFIG
    .map(d => ({ ...d, count: cs.filter(c => c.department?.name === d.key).length }))
    .filter(s => s.count > 0);
  return { ...deg, total: cs.length, segments };
}));
const maxDegreeTotal = computed(() => Math.max(...degreeBreakdown.value.map(d => d.total), 1));

// ─── Admin KPI stats ──────────────────────────────────────────────────────────
const adminStats = computed(() => {
  const all = dashCurricula.value;
  const total = all.length;
  const approved = all.filter(c => c.status === 'approved').length;
  return {
    total,
    approved,
    approvalRate: total ? Math.round((approved / total) * 100) : 0,
    submitted:       all.filter(c => c.status === 'department_submitted').length,
    revision:        all.filter(c => c.status === 'revision').length,
    underCommittee:  all.filter(c => c.status === 'under_committee').length,
    pending:         all.filter(c => c.status === 'pending_department').length,
    // needsAction = รอตรวจสอบ (admin ต้องทำ): ส่งมาใหม่ + ส่งกลับหลังแก้ไข
    needsAction:     all.filter(c => ['department_submitted', 'pending_admin_recheck'].includes(c.status)).length,
  };
});

// ── DC02 count-up refs — admin KPI cards ─────────────────────────────────────
const countTotal       = useCountUp(computed(() => adminStats.value.total),       { duration: 700, delay: 50  });
const countNeedsAction = useCountUp(computed(() => adminStats.value.needsAction), { duration: 700, delay: 100 });
const countRevision    = useCountUp(computed(() => adminStats.value.revision),    { duration: 700, delay: 150 });
const countApproved    = useCountUp(computed(() => adminStats.value.approved),    { duration: 700, delay: 200 });

// ─── Status breakdown (donut legend) ─────────────────────────────────────────
const statusBreakdown = computed(() => {
  const all = dashCurricula.value;
  return STATUS_META.map(s => ({
    ...s,
    count: all.filter(c => c.status === s.key).length,
  }));
});

// ─── Department performance ───────────────────────────────────────────────────
const deptPerformance = computed(() => {
  const all = dashCurricula.value;
  return DEPT_CONFIG.map(dept => {
    const cs = all.filter(c => c.department?.name === dept.key);
    const segments = STATUS_META.map(s => ({
      key:   s.key,
      label: s.label,
      hex:   s.hex,
      count: cs.filter(c => c.status === s.key).length,
    })).filter(s => s.count > 0);
    return { ...dept, total: cs.length, segments };
  })
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);
});

// ─── Deadline countdown (active curricula with deadline set) ─────────────────
const deadlineItems = computed(() => {
  const today = dayjs();
  return dashCurricula.value
    .filter(c => c.deadline && c.status !== 'approved')
    .map(c => ({ ...c, daysLeft: dayjs(c.deadline).diff(today, 'day') }))
    .filter(c => c.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);
});

// Executive deadline — แสดง 14 วัน (ขยายกว่า admin เพราะผู้บริหารต้องการภาพรวมกว้างกว่า)
const execDeadlineItems = computed(() => {
  const today = dayjs();
  return execCurricula.value
    .filter(c => c.deadline && c.status !== 'approved')
    .map(c => ({ ...c, daysLeft: dayjs(c.deadline).diff(today, 'day') }))
    .filter(c => c.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);
});

// ─── Shared computed ──────────────────────────────────────────────────────────
const recentCurricula = computed(() =>
  [...dashCurricula.value]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
);

const actionQueue = computed(() =>
  dashCurricula.value
    .filter(c => ['department_submitted', 'pending_admin_recheck'].includes(c.status))
    .sort((a, b) => (a.status === 'pending_admin_recheck' ? -1 : 1))
    .slice(0, 8)
);


onMounted(() => fetchDashboard());
</script>
