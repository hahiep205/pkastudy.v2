-- Production migration for custom topics on Supabase/Postgres.
-- This is the single authoritative script for custom personal topics.

-- Profiles need a seed marker for the personal sample topic.
alter table public.profiles
  add column if not exists sample_personal_topic_seeded_at timestamptz;

-- Topics schema for custom topics.
alter table public.topics
  add column if not exists language text not null default 'en',
  add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists user_id text default null,
  add column if not exists is_custom boolean not null default false,
  add column if not exists shared_from_topic_id bigint default null,
  add column if not exists slug varchar(120) default null;

alter table public.topics enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'topics_shared_from_topic_id_fkey'
  ) then
    alter table public.topics
      add constraint topics_shared_from_topic_id_fkey
      foreign key (shared_from_topic_id)
      references public.topics(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_topics_owner_user_id
  on public.topics (owner_user_id);

create index if not exists idx_topics_user_id
  on public.topics (user_id);

create index if not exists idx_topics_shared_from_topic_id
  on public.topics (shared_from_topic_id);

create unique index if not exists uq_topics_owner_slug
  on public.topics (owner_user_id, slug)
  where slug is not null;

-- Allow one sample/personal slug per user without colliding with public topics.
create unique index if not exists uq_topics_user_slug
  on public.topics (user_id, slug)
  where slug is not null;

-- Rebuild topic policies so the database matches the current app logic.
drop policy if exists topics_select_policy on public.topics;
create policy topics_select_policy on public.topics
for select using (
  coalesce(owner_user_id::text, user_id::text) is null
  or coalesce(owner_user_id::text, user_id::text) = auth.uid()::text
  or public.is_admin()
);

drop policy if exists topics_insert_policy on public.topics;
create policy topics_insert_policy on public.topics
for insert with check (
  public.is_admin()
  or coalesce(owner_user_id::text, user_id::text) = auth.uid()::text
);

drop policy if exists topics_update_policy on public.topics;
create policy topics_update_policy on public.topics
for update using (
  public.is_admin()
  or coalesce(owner_user_id::text, user_id::text) = auth.uid()::text
)
with check (
  public.is_admin()
  or coalesce(owner_user_id::text, user_id::text) = auth.uid()::text
);

drop policy if exists topics_delete_policy on public.topics;
create policy topics_delete_policy on public.topics
for delete using (
  public.is_admin()
  or coalesce(owner_user_id::text, user_id::text) = auth.uid()::text
);

drop policy if exists flashcards_select_policy on public.flashcards;
create policy flashcards_select_policy on public.flashcards
for select using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        coalesce(t.owner_user_id::text, t.user_id::text) is null
        or coalesce(t.owner_user_id::text, t.user_id::text) = auth.uid()::text
        or public.is_admin()
      )
  )
);

drop policy if exists flashcards_insert_policy on public.flashcards;
create policy flashcards_insert_policy on public.flashcards
for insert with check (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        public.is_admin()
        or coalesce(t.owner_user_id::text, t.user_id::text) = auth.uid()::text
      )
  )
);

drop policy if exists flashcards_update_policy on public.flashcards;
create policy flashcards_update_policy on public.flashcards
for update using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        public.is_admin()
        or coalesce(t.owner_user_id::text, t.user_id::text) = auth.uid()::text
      )
  )
)
with check (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        public.is_admin()
        or coalesce(t.owner_user_id::text, t.user_id::text) = auth.uid()::text
      )
  )
);

drop policy if exists flashcards_delete_policy on public.flashcards;
create policy flashcards_delete_policy on public.flashcards
for delete using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        public.is_admin()
        or coalesce(t.owner_user_id::text, t.user_id::text) = auth.uid()::text
      )
  )
);

-- User word progress for custom topics.
create table if not exists public.user_word_progress (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  flashcard_id bigint not null references public.flashcards(id) on delete cascade,
  is_remembered boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint uq_user_word unique (user_id, flashcard_id)
);

alter table public.user_word_progress enable row level security;

drop policy if exists user_word_progress_policy on public.user_word_progress;
create policy user_word_progress_policy on public.user_word_progress
for all using (user_id::text = auth.uid()::text or public.is_admin())
with check (user_id::text = auth.uid()::text or public.is_admin());

create index if not exists idx_user_word_progress_user_id
  on public.user_word_progress (user_id);
