import api from '@/services/api';

export const committeeService = {
  getSteps:         (curriculumId) => api.get(`/curricula/${curriculumId}/committee-steps`),
  submitDecision:   (stepId, formData) => api.post(`/curricula/committee-steps/${stepId}/decision`, formData),
  downloadDocument: (docId) => api.get(`/curricula/committee-documents/${docId}/download`, { responseType: 'blob' }),
};
