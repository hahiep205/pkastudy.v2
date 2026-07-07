-- Cleanup script for the current Supabase production state.
-- Purpose:
-- 1) Remove duplicate/legacy foreign keys on topics.shared_from_topic_id.
-- 2) Keep the canonical constraint used by the production migration.
-- 3) Avoid touching legacy columns that the app still reads for compatibility.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'fk_topics_shared_from_topic'
      and conrelid = 'public.topics'::regclass
  ) then
    alter table public.topics
      drop constraint fk_topics_shared_from_topic;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'topics_shared_from_topic_id_fkey'
      and conrelid = 'public.topics'::regclass
  ) then
    alter table public.topics
      add constraint topics_shared_from_topic_id_fkey
      foreign key (shared_from_topic_id)
      references public.topics(id)
      on delete set null;
  end if;
end $$;

-- Optional sanity indexes for the current schema.
create index if not exists idx_topics_shared_from_topic_id
  on public.topics (shared_from_topic_id);

create index if not exists idx_topics_owner_user_id
  on public.topics (owner_user_id);

create index if not exists idx_topics_user_id
  on public.topics (user_id);

create index if not exists idx_user_word_progress_user_id
  on public.user_word_progress (user_id);
