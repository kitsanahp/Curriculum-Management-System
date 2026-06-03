-- Migration: 003_add_user_id_to_curriculum_team.sql
-- เพิ่ม column user_id + index ใน curriculum_team
-- ต้องรัน 003 นี้ก่อน แล้วค่อยรัน 002 ส่วนที่เหลือ

ALTER TABLE curriculum_team
  ADD COLUMN user_id INT NULL AFTER curriculum_id,
  ADD CONSTRAINT fk_team_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_team_user (user_id);
