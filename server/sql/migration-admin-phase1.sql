-- Migration: Admin manager phase 1 foundation
-- Adds role/status for user authorization and thumbnail support for courses.

ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER name,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER role,
  ADD INDEX IF NOT EXISTS idx_users_name (name),
  ADD INDEX IF NOT EXISTS idx_users_role_status (role, status),
  ADD INDEX IF NOT EXISTS idx_users_created_at (created_at);

UPDATE Users
SET role = 'user'
WHERE role IS NULL OR role = '';

UPDATE Users
SET status = 'active'
WHERE status IS NULL OR status = '';

ALTER TABLE Courses
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) DEFAULT NULL AFTER description,
  ADD INDEX IF NOT EXISTS idx_courses_sort_order (sort_order);
