-- Migration: add source_type and document_id to committee_documents
-- Run once against the database before starting the backend

ALTER TABLE committee_documents
  ADD COLUMN source_type ENUM('upload', 'workspace') NOT NULL DEFAULT 'upload' AFTER uploaded_by,
  ADD COLUMN document_id INT NULL AFTER source_type,
  ADD CONSTRAINT fk_committee_doc_source
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
