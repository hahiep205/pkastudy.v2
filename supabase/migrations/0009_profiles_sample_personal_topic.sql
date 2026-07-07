alter table public.profiles
  add column if not exists sample_personal_topic_seeded_at timestamptz;
