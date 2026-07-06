import api from '@/services/api';

export const documentService = {
  getDocuments:          (curriculumId)         => api.get(`/curricula/${curriculumId}/documents`),
  download:              (id)                   => api.get(`/curricula/documents/${id}/download`, { responseType: 'blob' }),
  upload:                (curriculumId, formData) => api.post(`/curricula/${curriculumId}/documents`, formData),
  remove:                (id)                   => api.delete(`/curricula/documents/${id}`),
  getAnnotations:        (params)               => api.get('/curricula/annotations', { params }),
  getAnnotationCounts:   (documentType, ids)    => api.get('/curricula/annotations/counts', { params: { document_type: documentType, document_ids: ids } }),
  getAnnotationsSummary: ()                     => api.get('/curricula/annotations/summary'),
  createAnnotation:      (data)                 => api.post('/curricula/annotations', data),
  deleteAnnotation:      (id)                   => api.delete(`/curricula/annotations/${id}`),
  resolveAnnotation:     (id)                   => api.patch(`/curricula/annotations/${id}/resolve`),
};
