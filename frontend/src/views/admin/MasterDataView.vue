<template>
  <div class="max-w-5xl mx-auto space-y-4">

    <PageHeader
      title="ภาควิชาและชื่อวุฒิ"
      subtitle="ข้อมูลหลักที่ใช้ในการสร้างหลักสูตรและการลงทะเบียนผู้ใช้" />

    <!-- ══ ภาควิชา / หน่วยงาน ══ -->
    <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div class="px-5 py-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3 flex-wrap">
        <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <PhBuildings class="w-4 h-4 text-primary-600" aria-hidden="true" />
        </div>
        <span class="text-sm font-bold text-gray-900 flex-1">ภาควิชา / หน่วยงาน</span>
        <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full tabular-nums">{{ departments.length }} รายการ</span>
        <button v-if="!deptAdding" type="button" @click="startAddDept"
          class="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50 active:scale-[0.97] transition-all duration-150 ease-ios">
          <PhPlus class="w-3.5 h-3.5" aria-hidden="true" />
          เพิ่มภาควิชา
        </button>
      </div>

      <!-- ฟอร์มเพิ่มภาควิชา (inline) -->
      <div v-if="deptAdding" class="px-5 py-4 border-b border-gray-100 bg-primary-50/30">
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
          <input ref="deptNameInput" v-model="deptForm.name" type="text" placeholder="ชื่อภาควิชา เช่น ภาควิชาสถิติ *"
            @keydown.enter="saveDept" @keydown.escape="cancelDept"
            class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          <input v-model="deptForm.code" type="text" placeholder="ตัวย่อ (ไม่บังคับ)"
            @keydown.enter="saveDept" @keydown.escape="cancelDept"
            class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
        </div>
        <div class="flex items-center justify-end gap-3 mt-3">
          <button type="button" @click="cancelDept"
            class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
            ยกเลิก
          </button>
          <button type="button" @click="saveDept" :disabled="deptSaving || !deptForm.name.trim()"
            class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
            {{ deptSaving ? 'กำลังบันทึก…' : 'บันทึกภาควิชา' }}
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="deptLoading" class="divide-y divide-gray-50 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-14 mx-5 my-1.5 rounded-lg bg-gray-100"></div>
      </div>

      <!-- รายการภาควิชา -->
      <div v-else class="divide-y divide-gray-50">
        <div v-for="d in departments" :key="d.id"
          class="group/row px-5 py-3.5 hover:bg-gray-50 transition-colors duration-100">

          <!-- โหมดแก้ไข -->
          <template v-if="editingDeptId === d.id">
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
              <input v-model="deptForm.name" type="text" placeholder="ชื่อภาควิชา *"
                @keydown.enter="saveDept" @keydown.escape="cancelDept"
                class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
              <input v-model="deptForm.code" type="text" placeholder="ตัวย่อ (ไม่บังคับ)"
                @keydown.enter="saveDept" @keydown.escape="cancelDept"
                class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>
            <div class="flex items-center justify-end gap-3 mt-3">
              <button type="button" @click="cancelDept"
                class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
                ยกเลิก
              </button>
              <button type="button" @click="saveDept" :disabled="deptSaving || !deptForm.name.trim()"
                class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                {{ deptSaving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}
              </button>
            </div>
          </template>

          <!-- โหมดแสดงผล -->
          <div v-else>
            <div class="flex items-center gap-3">
              <!-- กดชื่อภาควิชาเพื่อกาง/หุบรายการสาขา -->
              <button type="button" @click="toggleDept(d.id)" :aria-expanded="expandedDepts.has(d.id)"
                class="cursor-pointer flex-1 min-w-0 flex items-center gap-2 flex-wrap text-left group/toggle py-0.5">
                <PhCaretRight :class="['w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200', expandedDepts.has(d.id) && 'rotate-90']" aria-hidden="true" />
                <span class="text-sm font-semibold text-gray-900 group-hover/toggle:text-primary-700 transition-colors">{{ d.name }}</span>
                <span v-if="d.code" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ d.code }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-[11px] font-medium text-primary-700 tabular-nums">{{ (d.majors || []).length }} สาขา</span>
              </button>
              <div class="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                <button type="button" @click="startEditDept(d)" aria-label="แก้ไขภาควิชา"
                  class="cursor-pointer w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all duration-150">
                  <PhNotePencil class="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" @click="deleteDept(d)" aria-label="ลบภาควิชา"
                  class="cursor-pointer w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150">
                  <PhTrash class="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- สาขาวิชาในภาควิชา — แยกตามระดับปริญญา -->
            <div v-if="expandedDepts.has(d.id)" class="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
              <template v-for="level in LEVELS" :key="level.value">
                <!-- หัวกลุ่มระดับ -->
                <div class="px-4 py-2 flex items-center gap-2.5 border-b border-gray-100 bg-white/70">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold', level.badge]">{{ level.label }}</span>
                  <span class="text-[11px] text-gray-400 tabular-nums flex-1">{{ majorsOf(d, level.value).length }} สาขา</span>
                  <button v-if="!(addingMajor && addingMajor.deptId === d.id && addingMajor.level === level.value)"
                    type="button" @click="startAddMajor(d.id, level.value)"
                    class="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 active:scale-[0.97] transition-all duration-150 ease-ios">
                    <PhPlus class="w-3.5 h-3.5" aria-hidden="true" />
                    เพิ่มสาขา
                  </button>
                </div>

                <!-- ฟอร์มเพิ่มสาขา -->
                <div v-if="addingMajor && addingMajor.deptId === d.id && addingMajor.level === level.value"
                  class="px-4 py-3 border-b border-gray-100 bg-primary-50/40">
                  <input ref="majorNameInput" v-model="majorForm.name" type="text" placeholder="ชื่อสาขา เช่น คณิตศาสตร์ *"
                    @keydown.enter="saveMajor" @keydown.escape="cancelMajor"
                    class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  <div class="flex items-center justify-end gap-3 mt-2.5">
                    <button type="button" @click="cancelMajor"
                      class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-3.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
                      ยกเลิก
                    </button>
                    <button type="button" @click="saveMajor" :disabled="majorSaving || !majorForm.name.trim()"
                      class="cursor-pointer rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                      {{ majorSaving ? 'กำลังบันทึก…' : 'บันทึกสาขา' }}
                    </button>
                  </div>
                </div>

                <!-- รายการสาขา -->
                <div v-for="m in majorsOf(d, level.value)" :key="m.id"
                  class="group/major px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-white transition-colors duration-100">
                  <!-- โหมดแก้ไขสาขา -->
                  <template v-if="editingMajorId === m.id">
                    <input v-model="majorForm.name" type="text" placeholder="ชื่อสาขา *"
                      @keydown.enter="saveMajor" @keydown.escape="cancelMajor"
                      class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    <div class="flex items-center justify-end gap-3 mt-2.5">
                      <button type="button" @click="cancelMajor"
                        class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-3.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
                        ยกเลิก
                      </button>
                      <button type="button" @click="saveMajor" :disabled="majorSaving || !majorForm.name.trim()"
                        class="cursor-pointer rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                        {{ majorSaving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}
                      </button>
                    </div>
                  </template>
                  <!-- โหมดแสดงสาขา -->
                  <div v-else class="flex items-center gap-2 min-h-[32px]">
                    <p class="flex-1 min-w-0 text-sm text-gray-800">{{ m.name }}</p>
                    <div class="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/major:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                      <button type="button" @click="startEditMajor(m)" aria-label="แก้ไขสาขา"
                        class="cursor-pointer w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all duration-150">
                        <PhNotePencil class="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" @click="deleteMajor(m)" aria-label="ลบสาขา"
                        class="cursor-pointer w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150">
                        <PhTrash class="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="!majorsOf(d, level.value).length && !(addingMajor && addingMajor.deptId === d.id && addingMajor.level === level.value)"
                  class="text-xs text-gray-400 px-4 py-2 border-b border-gray-100 last:border-b-0">ยังไม่มีสาขาระดับ{{ level.label }}</p>
              </template>
            </div>
          </div>
        </div>

        <p v-if="!departments.length" class="text-sm text-gray-400 text-center py-8">ยังไม่มีภาควิชาในระบบ</p>
      </div>
    </div>

    <!-- ══ ชื่อวุฒิ / ชื่อปริญญา ══ -->
    <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div class="px-5 py-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3 flex-wrap">
        <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <PhGraduationCap class="w-4 h-4 text-primary-600" aria-hidden="true" />
        </div>
        <div class="flex-1 min-w-0">
          <span class="text-sm font-bold text-gray-900 block">ชื่อวุฒิ / ชื่อปริญญา</span>
          <span class="text-xs text-gray-500">ใช้เป็นตัวเลือกในขั้นตอนสร้างหลักสูตร แยกตามระดับปริญญา</span>
        </div>
        <span class="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full tabular-nums">{{ titles.length }} รายการ</span>
      </div>

      <!-- Skeleton -->
      <div v-if="titleLoading" class="divide-y divide-gray-50 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-14 mx-5 my-1.5 rounded-lg bg-gray-100"></div>
      </div>

      <template v-else>
        <template v-for="level in LEVELS" :key="level.value">
          <!-- หัวกลุ่มระดับปริญญา -->
          <div class="px-5 py-2.5 bg-gray-50 border-y border-gray-100 first:border-t-0 flex items-center gap-2.5">
            <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold', level.badge]">{{ level.label }}</span>
            <span class="text-xs text-gray-400 tabular-nums flex-1">{{ titlesByLevel[level.value].length }} รายการ</span>
            <button v-if="addingLevel !== level.value && editingTitleId === null" type="button" @click="startAddTitle(level.value)"
              class="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 active:scale-[0.97] transition-all duration-150 ease-ios">
              <PhPlus class="w-3.5 h-3.5" aria-hidden="true" />
              เพิ่มชื่อวุฒิ
            </button>
          </div>

          <!-- ฟอร์มเพิ่มชื่อวุฒิ (inline ใต้หัวกลุ่ม) -->
          <div v-if="addingLevel === level.value" class="px-5 py-4 border-b border-gray-100 bg-primary-50/30">
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
              <input ref="titleNameInput" v-model="titleForm.name" type="text" placeholder="ชื่อวุฒิ เช่น วิทยาศาสตรบัณฑิต *"
                @keydown.enter="saveTitle" @keydown.escape="cancelTitle"
                class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
              <input v-model="titleForm.abbr" type="text" placeholder="ชื่อย่อ เช่น วท.บ."
                @keydown.enter="saveTitle" @keydown.escape="cancelTitle"
                class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>
            <div class="flex items-center justify-end gap-3 mt-3">
              <button type="button" @click="cancelTitle"
                class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
                ยกเลิก
              </button>
              <button type="button" @click="saveTitle" :disabled="titleSaving || !titleForm.name.trim()"
                class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                {{ titleSaving ? 'กำลังบันทึก…' : 'บันทึกชื่อวุฒิ' }}
              </button>
            </div>
          </div>

          <!-- รายการชื่อวุฒิของระดับนี้ -->
          <div class="divide-y divide-gray-50">
            <div v-for="t in titlesByLevel[level.value]" :key="t.id"
              class="group/row px-5 py-3 hover:bg-gray-50 transition-colors duration-100">

              <!-- โหมดแก้ไข -->
              <template v-if="editingTitleId === t.id">
                <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
                  <input v-model="titleForm.name" type="text" placeholder="ชื่อวุฒิ *"
                    @keydown.enter="saveTitle" @keydown.escape="cancelTitle"
                    class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  <input v-model="titleForm.abbr" type="text" placeholder="ชื่อย่อ"
                    @keydown.enter="saveTitle" @keydown.escape="cancelTitle"
                    class="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
                <div class="flex items-center justify-end gap-3 mt-3">
                  <button type="button" @click="cancelTitle"
                    class="cursor-pointer rounded-lg border-2 border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-500 active:scale-[0.97] transition-all duration-150 ease-ios">
                    ยกเลิก
                  </button>
                  <button type="button" @click="saveTitle" :disabled="titleSaving || !titleForm.name.trim()"
                    class="cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-150 ease-ios">
                    {{ titleSaving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}
                  </button>
                </div>
              </template>

              <!-- โหมดแสดงผล -->
              <div v-else class="flex items-center gap-3">
                <div class="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-gray-900">{{ t.name }}</p>
                  <span v-if="t.abbr" class="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{{ t.abbr }}</span>
                </div>
                <div class="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                  <button type="button" @click="startEditTitle(t)" aria-label="แก้ไขชื่อวุฒิ"
                    class="cursor-pointer w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.88] transition-all duration-150">
                    <PhNotePencil class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="button" @click="deleteTitle(t)" aria-label="ลบชื่อวุฒิ"
                    class="cursor-pointer w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-[0.88] transition-all duration-150">
                    <PhTrash class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <p v-if="!titlesByLevel[level.value].length && addingLevel !== level.value"
              class="text-xs text-gray-400 px-5 py-3">ยังไม่มีชื่อวุฒิระดับ{{ level.label }}</p>
          </div>
        </template>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { departmentService, degreeTitleService, majorService } from '@/services/departmentService';
import { useDepartmentStore } from '@/stores/department';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import PageHeader from '@/components/common/PageHeader.vue';
import { PhBuildings, PhGraduationCap, PhPlus, PhNotePencil, PhTrash, PhCaretRight } from '@phosphor-icons/vue';

const toast = useToast();
const { open: confirm } = useConfirm();
const deptStore = useDepartmentStore();

const LEVELS = [
  { value: 'bachelor', label: 'ปริญญาตรี', badge: 'bg-blue-50 text-blue-700' },
  { value: 'master',   label: 'ปริญญาโท',  badge: 'bg-purple-50 text-purple-700' },
  { value: 'doctoral', label: 'ปริญญาเอก', badge: 'bg-indigo-50 text-indigo-700' },
];

// ─── ภาควิชา ──────────────────────────────────────────────────────────────────
const departments = ref([]);
const deptLoading = ref(false);
const deptAdding = ref(false);
const editingDeptId = ref(null);
const deptSaving = ref(false);
const deptForm = ref({ name: '', code: '' });
const deptNameInput = ref(null);

const fetchDepartments = async () => {
  deptLoading.value = true;
  try {
    const { data } = await departmentService.getAll();
    departments.value = data.data || [];
  } catch {
    toast.error('โหลดข้อมูลภาควิชาไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    deptLoading.value = false;
  }
};

const startAddDept = async () => {
  editingDeptId.value = null;
  deptForm.value = { name: '', code: '' };
  deptAdding.value = true;
  await nextTick();
  deptNameInput.value?.focus();
};

const startEditDept = (d) => {
  deptAdding.value = false;
  editingDeptId.value = d.id;
  deptForm.value = { name: d.name, code: d.code || '' };
};

const cancelDept = () => {
  deptAdding.value = false;
  editingDeptId.value = null;
};

const saveDept = async () => {
  if (!deptForm.value.name.trim() || deptSaving.value) return;
  deptSaving.value = true;
  try {
    if (editingDeptId.value) {
      await departmentService.update(editingDeptId.value, deptForm.value);
      toast.success('บันทึกภาควิชาแล้ว', deptForm.value.name);
    } else {
      await departmentService.create(deptForm.value);
      toast.success('เพิ่มภาควิชาแล้ว', deptForm.value.name);
    }
    cancelDept();
    deptStore.invalidate();
    await fetchDepartments();
  } catch (err) {
    toast.error('บันทึกไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    deptSaving.value = false;
  }
};

const deleteDept = async (d) => {
  const ok = await confirm({
    title: 'ลบภาควิชา',
    message: `"${d.name}" จะถูกลบออกจากระบบ (ลบได้เฉพาะภาควิชาที่ยังไม่มีผู้ใช้หรือหลักสูตรสังกัด)`,
    confirmLabel: 'ลบภาควิชา',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await departmentService.remove(d.id);
    toast.success('ลบภาควิชาแล้ว', d.name);
    deptStore.invalidate();
    await fetchDepartments();
  } catch (err) {
    toast.error('ลบไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

// ─── สาขาวิชาในภาควิชา ────────────────────────────────────────────────────────
const expandedDepts = ref(new Set());
const addingMajor = ref(null);        // { deptId, level } ที่กำลังเปิดฟอร์มเพิ่ม
const editingMajorId = ref(null);
const majorSaving = ref(false);
const majorForm = ref({ name: '' });
const majorNameInput = ref(null);

const toggleDept = (id) => {
  const s = new Set(expandedDepts.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedDepts.value = s;
};

const majorsOf = (dept, level) => (dept.majors || []).filter(m => m.degree_level === level);

const startAddMajor = async (deptId, level) => {
  editingMajorId.value = null;
  majorForm.value = { name: '' };
  addingMajor.value = { deptId, level };
  await nextTick();
  // ref ใน v-for อาจเป็น array — รองรับทั้งสองแบบ
  const el = Array.isArray(majorNameInput.value) ? majorNameInput.value[0] : majorNameInput.value;
  el?.focus();
};

const startEditMajor = (m) => {
  addingMajor.value = null;
  editingMajorId.value = m.id;
  majorForm.value = { name: m.name };
};

const cancelMajor = () => {
  addingMajor.value = null;
  editingMajorId.value = null;
};

const saveMajor = async () => {
  if (!majorForm.value.name.trim() || majorSaving.value) return;
  majorSaving.value = true;
  try {
    if (editingMajorId.value) {
      await majorService.update(editingMajorId.value, { name: majorForm.value.name });
      toast.success('บันทึกสาขาแล้ว', majorForm.value.name);
    } else {
      await majorService.create({
        department_id: addingMajor.value.deptId,
        degree_level: addingMajor.value.level,
        name: majorForm.value.name,
      });
      toast.success('เพิ่มสาขาแล้ว', majorForm.value.name);
    }
    cancelMajor();
    deptStore.invalidate();
    await fetchDepartments();
  } catch (err) {
    toast.error('บันทึกไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    majorSaving.value = false;
  }
};

const deleteMajor = async (m) => {
  const ok = await confirm({
    title: 'ลบสาขาวิชา',
    message: `"${m.name}" จะถูกลบออกจากตัวเลือก (ไม่กระทบหลักสูตรที่บันทึกชื่อนี้ไปแล้ว)`,
    confirmLabel: 'ลบสาขา',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await majorService.remove(m.id);
    toast.success('ลบสาขาแล้ว', m.name);
    deptStore.invalidate();
    await fetchDepartments();
  } catch (err) {
    toast.error('ลบไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

// ─── ชื่อวุฒิ ─────────────────────────────────────────────────────────────────
const titles = ref([]);
const titleLoading = ref(false);
const addingLevel = ref(null);       // level ที่กำลังเปิดฟอร์มเพิ่ม
const editingTitleId = ref(null);
const titleSaving = ref(false);
const titleForm = ref({ name: '', abbr: '' });
const titleNameInput = ref(null);

const titlesByLevel = computed(() => {
  const map = { bachelor: [], master: [], doctoral: [] };
  for (const t of titles.value) map[t.degree_level]?.push(t);
  return map;
});

const fetchTitles = async () => {
  titleLoading.value = true;
  try {
    const { data } = await degreeTitleService.getAll();
    titles.value = data.data || [];
  } catch {
    toast.error('โหลดข้อมูลชื่อวุฒิไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    titleLoading.value = false;
  }
};

const startAddTitle = async (level) => {
  editingTitleId.value = null;
  titleForm.value = { name: '', abbr: '' };
  addingLevel.value = level;
  await nextTick();
  // ref ใน v-for ของ template refs อาจเป็น array — รองรับทั้งสองแบบ
  const el = Array.isArray(titleNameInput.value) ? titleNameInput.value[0] : titleNameInput.value;
  el?.focus();
};

const startEditTitle = (t) => {
  addingLevel.value = null;
  editingTitleId.value = t.id;
  titleForm.value = { name: t.name, abbr: t.abbr || '' };
};

const cancelTitle = () => {
  addingLevel.value = null;
  editingTitleId.value = null;
};

const saveTitle = async () => {
  if (!titleForm.value.name.trim() || titleSaving.value) return;
  titleSaving.value = true;
  try {
    if (editingTitleId.value) {
      await degreeTitleService.update(editingTitleId.value, titleForm.value);
      toast.success('บันทึกชื่อวุฒิแล้ว', titleForm.value.name);
    } else {
      await degreeTitleService.create({ ...titleForm.value, degree_level: addingLevel.value });
      toast.success('เพิ่มชื่อวุฒิแล้ว', titleForm.value.name);
    }
    cancelTitle();
    await fetchTitles();
  } catch (err) {
    toast.error('บันทึกไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  } finally {
    titleSaving.value = false;
  }
};

const deleteTitle = async (t) => {
  const ok = await confirm({
    title: 'ลบชื่อวุฒิ',
    message: `"${t.name}" จะถูกลบออกจากตัวเลือก (ไม่กระทบหลักสูตรที่บันทึกชื่อนี้ไปแล้ว)`,
    confirmLabel: 'ลบชื่อวุฒิ',
    type: 'danger',
  });
  if (!ok) return;
  try {
    await degreeTitleService.remove(t.id);
    toast.success('ลบชื่อวุฒิแล้ว', t.name);
    await fetchTitles();
  } catch (err) {
    toast.error('ลบไม่สำเร็จ', err.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
  }
};

onMounted(() => {
  fetchDepartments();
  fetchTitles();
});
</script>
