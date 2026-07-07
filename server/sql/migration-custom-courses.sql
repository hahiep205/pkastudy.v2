-- Migration: Custom Courses & Word Progress
-- Supabase/Postgres version.
-- This script is safe to run multiple times.

-- 1. Add ownership columns for custom topics.
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS owner_user_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_from_topic_id integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS slug varchar(120) DEFAULT NULL;

-- Foreign key to the shared source topic.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_topics_shared_from_topic'
  ) THEN
    ALTER TABLE topics
      ADD CONSTRAINT fk_topics_shared_from_topic
      FOREIGN KEY (shared_from_topic_id) REFERENCES topics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for fast lookup of user-owned topics.
CREATE INDEX IF NOT EXISTS idx_topics_owner_user_id ON topics (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics (user_id);
CREATE INDEX IF NOT EXISTS idx_topics_shared_from_topic_id ON topics (shared_from_topic_id);

-- 2. User word progress table.
CREATE TABLE IF NOT EXISTS user_word_progress (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  flashcard_id integer NOT NULL,
  is_remembered boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_word UNIQUE (user_id, flashcard_id),
  CONSTRAINT fk_uwp_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

ALTER TABLE user_word_progress
  ALTER COLUMN is_remembered TYPE boolean USING (lower(coalesce(is_remembered::text, 'false')) IN ('1', 't', 'true', 'yes', 'y'));

CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id ON user_word_progress (user_id);
