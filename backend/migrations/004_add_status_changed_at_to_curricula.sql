-- Migration: Add status_changed_at to curricula table for Aging Management
-- Author: Senior System Analyst
-- Date: 2024-05-19

ALTER TABLE curricula 
ADD COLUMN status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status;

-- Initialize status_changed_at with updated_at for existing records
UPDATE curricula SET status_changed_at = updated_at;
