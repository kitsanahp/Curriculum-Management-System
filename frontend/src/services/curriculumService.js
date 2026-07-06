import api from '@/services/api';

export const curriculumService = {
  getAll:           (params)                  => api.get('/curricula', { params }),
  getById:          (id)                      => api.get(`/curricula/${id}`),
  create:           (payload)                 => api.post('/curricula', payload),
  update:           (id, payload)             => api.put(`/curricula/${id}`, payload),
  remove:           (id)                      => api.delete(`/curricula/${id}`),
  getArchived:      ()                        => api.get('/curricula/archived'),
  restore:          (id)                      => api.post(`/curricula/${id}/restore`),
  forceDelete:      (id)                      => api.delete(`/curricula/${id}/permanent`),
  forceDeleteAll:   ()                        => api.delete('/curricula/archived/all'),
  getYears:         ()                        => api.get('/curricula/years'),
  submit:           (id)                      => api.post(`/curricula/${id}/submit`),
  reject:           (id, note, deadline)      => api.post(`/curricula/${id}/reject`, { note, revision_deadline: deadline || null }),
  approve:          (id)                      => api.post(`/curricula/${id}/approve`),
  resubmit:         (id)                      => api.post(`/curricula/${id}/resubmit`),
  approveRecheck:   (id)                      => api.post(`/curricula/${id}/approve-recheck`),
  rejectRecheck:    (id, note, deadline)      => api.post(`/curricula/${id}/reject-recheck`, { note, revision_deadline: deadline || null }),
  updateTeam:       (id, team)                => api.put(`/curricula/${id}/team`, { team }),
  getAuditLogs:     (id)                      => api.get(`/curricula/${id}/audit-logs`),
};
