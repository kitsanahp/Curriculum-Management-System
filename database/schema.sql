-- ============================================================
-- Curriculum Management System - Database Schema
-- Faculty of Science, Naresuan University
-- ============================================================

CREATE DATABASE IF NOT EXISTS curriculum_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE curriculum_db;

-- ------------------------------------------------------------
-- 1. departments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(50)  NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  position      VARCHAR(100)  NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,
  role          ENUM('admin','faculty','registrar','executive') NOT NULL,
  department_id INT           NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. curricula
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curricula (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  department_id               INT          NOT NULL,
  degree_level                ENUM('bachelor','master','doctoral') NOT NULL,
  curriculum_type             ENUM('new','revised') NOT NULL,
  curriculum_year             VARCHAR(10)  NOT NULL,
  degree_name                 VARCHAR(255) NULL,
  degree_name_abbr            VARCHAR(100) NULL,
  field_of_study              VARCHAR(255) NULL,
  status                      ENUM(
                                'draft',
                                'pending_department',
                                'department_submitted',
                                'under_committee',
                                'revision',
                                'approved'
                              ) NOT NULL DEFAULT 'pending_department',
  current_committee_step_id   INT          NULL,
  deadline                    DATE         NULL,
  created_by                  INT          NOT NULL,
  created_at                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_curricula_dept    FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_curricula_creator FOREIGN KEY (created_by)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. curriculum_team
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curriculum_team (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id         INT          NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  position              VARCHAR(255) NULL,
  role_in_curriculum    ENUM('president','secretary','responsible') NOT NULL,
  email                 VARCHAR(255) NULL,
  phone                 VARCHAR(50)  NULL,
  created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_curriculum FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. documents  (workspace files — Google Drive style)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT           NOT NULL,
  original_name VARCHAR(500)  NOT NULL,
  stored_name   VARCHAR(500)  NOT NULL,
  file_type     ENUM('pdf','docx') NOT NULL,
  file_size     INT           NULL,
  uploaded_by   INT           NOT NULL,
  is_deleted    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_docs_curriculum FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE,
  CONSTRAINT fk_docs_uploader   FOREIGN KEY (uploaded_by)   REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. document_versions  (full version history)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  document_id    INT          NOT NULL,
  version_number INT          NOT NULL,
  stored_name    VARCHAR(500) NOT NULL,
  original_name  VARCHAR(500) NOT NULL,
  file_size      INT          NULL,
  uploaded_by    INT          NOT NULL,
  note           TEXT         NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_doc      FOREIGN KEY (document_id)  REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_versions_uploader FOREIGN KEY (uploaded_by)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. committee_steps
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committee_steps (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id  INT  NOT NULL,
  committee_type ENUM(
                   'faculty_academic',
                   'faculty_board',
                   'general_education',
                   'university_academic',
                   'graduate_school',
                   'university_council_academic',
                   'university_council',
                   'cisa'
                 ) NOT NULL,
  step_order     INT          NOT NULL,
  status         ENUM('pending','approved','revision') NOT NULL DEFAULT 'pending',
  decision_date  DATE         NULL,
  meeting_number VARCHAR(100) NULL,
  notes          TEXT         NULL,
  uploaded_by    INT          NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_steps_curriculum FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE,
  UNIQUE KEY uq_step (curriculum_id, committee_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. committee_documents  (มติที่ประชุม)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committee_documents (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  committee_step_id   INT          NOT NULL,
  original_name       VARCHAR(500) NOT NULL,
  stored_name         VARCHAR(500) NOT NULL,
  uploaded_by         INT          NOT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cdocs_step     FOREIGN KEY (committee_step_id) REFERENCES committee_steps(id) ON DELETE CASCADE,
  CONSTRAINT fk_cdocs_uploader FOREIGN KEY (uploaded_by)       REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. audit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT          NULL,
  user_id       INT          NOT NULL,
  action        VARCHAR(255) NOT NULL,
  details       JSON         NULL,
  ip_address    VARCHAR(50)  NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. announcements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  content     TEXT         NOT NULL,
  image_url   VARCHAR(1000) NULL,
  link_url    VARCHAR(1000) NULL,
  created_by  INT          NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_announce_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  title         VARCHAR(500) NOT NULL,
  message       TEXT         NOT NULL,
  type          ENUM('info','warning','success','error') DEFAULT 'info',
  curriculum_id INT          NULL,
  is_read       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- resources  (forms / files / links library)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(500)  NOT NULL,
  type        ENUM('file','link') NOT NULL DEFAULT 'file',
  file_url    VARCHAR(1000) NULL,
  link_url    VARCHAR(1000) NULL,
  description TEXT          NULL,
  category    VARCHAR(100)  NULL,
  created_by  INT           NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- calendar_events  (user personal calendar highlights)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  event_date  DATE          NOT NULL,
  color       VARCHAR(20)   NOT NULL DEFAULT 'blue',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calevent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed: Departments
-- ============================================================
INSERT IGNORE INTO departments (name) VALUES
  ('ภาควิชาคณิตศาสตร์'),
  ('ภาควิชาเคมี'),
  ('ภาควิชาชีววิทยา'),
  ('ภาควิชาฟิสิกส์'),
  ('ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ');

-- ============================================================
-- Seed: Default admin user  (password: Admin@1234)
-- ============================================================
INSERT INTO users (name, email, password, role, is_active)
VALUES (
  'นักวิชาการศึกษาคณะ',
  'admin@sci.nu.ac.th',
  '$2a$10$qoG45NXKZAit3IBkIlcwFee2A6YGIf2hQNN7hWDx5w17ylw0eLzOW',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE
  password = '$2a$10$qoG45NXKZAit3IBkIlcwFee2A6YGIf2hQNN7hWDx5w17ylw0eLzOW',
  role = 'admin',
  is_active = 1;
