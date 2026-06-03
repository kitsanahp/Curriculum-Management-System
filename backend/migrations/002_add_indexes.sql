-- Migration: 002_add_indexes.sql
-- เพิ่ม indexes ทุกตารางที่ขาดอยู่
-- รันครั้งเดียว: mysql -u root -p curriculum_db < 002_add_indexes.sql

-- ════════════════════════════════════════════════════════
-- curricula
-- ════════════════════════════════════════════════════════
ALTER TABLE curricula
  ADD INDEX idx_curricula_department  (department_id),
  ADD INDEX idx_curricula_status      (status),
  ADD INDEX idx_curricula_created_by  (created_by),
  ADD INDEX idx_curricula_step        (current_committee_step_id);

-- ════════════════════════════════════════════════════════
-- documents
-- ════════════════════════════════════════════════════════
ALTER TABLE documents
  ADD INDEX idx_docs_curriculum_deleted  (curriculum_id, is_deleted),
  ADD INDEX idx_docs_curriculum_name     (curriculum_id, original_name(100)),
  ADD INDEX idx_docs_uploaded_by         (uploaded_by);

-- ════════════════════════════════════════════════════════
-- document_versions
-- ════════════════════════════════════════════════════════
ALTER TABLE document_versions
  ADD INDEX        idx_docver_document    (document_id),
  ADD UNIQUE INDEX idx_docver_unique_ver  (document_id, version_number);

-- ════════════════════════════════════════════════════════
-- committee_steps
-- ════════════════════════════════════════════════════════
ALTER TABLE committee_steps
  ADD INDEX        idx_steps_curriculum  (curriculum_id),
  ADD UNIQUE INDEX idx_steps_order       (curriculum_id, step_order);

-- ════════════════════════════════════════════════════════
-- committee_documents
-- ════════════════════════════════════════════════════════
ALTER TABLE committee_documents
  ADD INDEX idx_cdocs_step      (committee_step_id),
  ADD INDEX idx_cdocs_document  (document_id);

-- ════════════════════════════════════════════════════════
-- curriculum_team  (idx_team_user อยู่ใน 003 เพราะต้องเพิ่ม column user_id ก่อน)
-- ════════════════════════════════════════════════════════
ALTER TABLE curriculum_team
  ADD INDEX idx_team_curriculum  (curriculum_id);

-- ════════════════════════════════════════════════════════
-- notifications
-- ════════════════════════════════════════════════════════
ALTER TABLE notifications
  ADD INDEX idx_notif_user_read    (user_id, is_read),
  ADD INDEX idx_notif_curriculum   (curriculum_id);

-- ════════════════════════════════════════════════════════
-- audit_logs
-- ════════════════════════════════════════════════════════
ALTER TABLE audit_logs
  ADD INDEX idx_audit_curriculum  (curriculum_id),
  ADD INDEX idx_audit_user        (user_id);

-- ════════════════════════════════════════════════════════
-- tqf2_documents
-- ════════════════════════════════════════════════════════
ALTER TABLE tqf2_documents
  ADD INDEX idx_tqf2_curriculum_deleted  (curriculum_id, is_deleted);
