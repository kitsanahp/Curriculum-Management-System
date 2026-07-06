import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { curriculumService } from '@/services/curriculumService';
import dayjs from 'dayjs';
import {
  PhClipboardText, PhFolderOpen, PhPaperPlaneTilt,
  PhCheckCircle, PhBank, PhNotePencil,
} from '@phosphor-icons/vue';

const ACTIVITY_FILTER_GROUPS = {
  document:   ['UPLOAD_DOCUMENT', 'UPLOAD_TQF2', 'DELETE_DOCUMENT', 'DELETE_TQF2'],
  submission: ['DEPARTMENT_SUBMIT', 'RESUBMIT_AFTER_REVISION'],
  review:     ['ADMIN_APPROVE', 'ADMIN_REJECT', 'ADMIN_APPROVE_RECHECK', 'ADMIN_REJECT_RECHECK'],
  committee:  ['COMMITTEE_APPROVED', 'COMMITTEE_REVISION'],
  manage:     ['CREATE_CURRICULUM', 'UPDATE_CURRICULUM', 'UPDATE_TEAM'],
};

export const ACTIVITY_FILTERS = [
  { key: 'all',        label: 'ทั้งหมด',        icon: PhClipboardText  },
  { key: 'document',   label: 'ไฟล์เอกสาร',     icon: PhFolderOpen     },
  { key: 'submission', label: 'การนำส่ง',        icon: PhPaperPlaneTilt },
  { key: 'review',     label: 'การตรวจสอบ',      icon: PhCheckCircle    },
  { key: 'committee',  label: 'มติที่ประชุม',    icon: PhBank           },
  { key: 'manage',     label: 'ข้อมูลหลักสูตร',  icon: PhNotePencil     },
];

export function useAuditLog() {
  const route = useRoute();
  const auditLogs = ref([]);
  const historyLoading = ref(false);
  const activityFilter = ref('all');

  const filteredAuditLogs = computed(() => {
    if (activityFilter.value === 'all') return auditLogs.value;
    const allowed = ACTIVITY_FILTER_GROUPS[activityFilter.value] || [];
    return auditLogs.value.filter(l => allowed.includes(l.action));
  });

  const filterCount = (key) => {
    if (key === 'all') return auditLogs.value.length;
    const allowed = ACTIVITY_FILTER_GROUPS[key] || [];
    return auditLogs.value.filter(l => allowed.includes(l.action)).length;
  };

  const loadHistory = async () => {
    historyLoading.value = true;
    try {
      const { data } = await curriculumService.getAuditLogs(route.params.id);
      auditLogs.value = data.data || [];
    } finally { historyLoading.value = false; }
  };

  return { auditLogs, historyLoading, activityFilter, filteredAuditLogs, filterCount, loadHistory };
}
