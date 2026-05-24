-- Migration: Custom Courses & Word Progress
-- Run once to add support for user-owned custom topics and per-user word progress tracking

-- 1. Add user_id column to Topics to support custom (user-owned) topics
ALTER TABLE Topics
  ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_custom TINYINT(1) NOT NULL DEFAULT 0;

-- Add FK if not already there (MySQL will error if already exists, wrap in procedure if needed)
-- Run separately if FK already exists:
ALTER TABLE Topics
  ADD CONSTRAINT fk_topics_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE;

-- Index for fast lookup of user's custom topics
ALTER TABLE Topics
  ADD INDEX IF NOT EXISTS idx_topics_user_id (user_id);

-- 2. Create User_Word_Progress table to track "remembered" state per user per flashcard
CREATE TABLE IF NOT EXISTS User_Word_Progress (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  flashcard_id INT NOT NULL,
  is_remembered TINYINT(1) NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_word (user_id, flashcard_id),
  CONSTRAINT fk_uwp_user       FOREIGN KEY (user_id)      REFERENCES Users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_uwp_flashcard  FOREIGN KEY (flashcard_id) REFERENCES Flashcards(id) ON DELETE CASCADE,
  INDEX idx_uwp_user_id (user_id)
);
