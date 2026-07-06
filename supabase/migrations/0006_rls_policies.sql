create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.courses enable row level security;
alter table public.topics enable row level security;
alter table public.flashcards enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.srs_reviews enable row level security;
alter table public.toeic_tests enable row level security;
alter table public.toeic_question_groups enable row level security;
alter table public.toeic_questions enable row level security;
alter table public.toeic_test_records enable row level security;
alter table public.support_tickets enable row level security;
alter table public.vocab_activity_logs enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists user_progress_select_own_or_admin on public.user_progress;
create policy user_progress_select_own_or_admin on public.user_progress
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_progress_update_own_or_admin on public.user_progress;
create policy user_progress_update_own_or_admin on public.user_progress
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses
for select using (true);

drop policy if exists courses_admin_write on public.courses;
create policy courses_admin_write on public.courses
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists topics_select_policy on public.topics;
create policy topics_select_policy on public.topics
for select using (
  owner_user_id is null
  or owner_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists topics_insert_policy on public.topics;
create policy topics_insert_policy on public.topics
for insert with check (
  public.is_admin()
  or owner_user_id = auth.uid()
);

drop policy if exists topics_update_policy on public.topics;
create policy topics_update_policy on public.topics
for update using (
  public.is_admin()
  or owner_user_id = auth.uid()
)
with check (
  public.is_admin()
  or owner_user_id = auth.uid()
);

drop policy if exists topics_delete_policy on public.topics;
create policy topics_delete_policy on public.topics
for delete using (
  public.is_admin()
  or owner_user_id = auth.uid()
);

drop policy if exists flashcards_select_policy on public.flashcards;
create policy flashcards_select_policy on public.flashcards
for select using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (
        t.owner_user_id is null
        or t.owner_user_id = auth.uid()
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
      and (public.is_admin() or t.owner_user_id = auth.uid())
  )
);

drop policy if exists flashcards_update_policy on public.flashcards;
create policy flashcards_update_policy on public.flashcards
for update using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (public.is_admin() or t.owner_user_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (public.is_admin() or t.owner_user_id = auth.uid())
  )
);

drop policy if exists flashcards_delete_policy on public.flashcards;
create policy flashcards_delete_policy on public.flashcards
for delete using (
  exists (
    select 1
    from public.topics t
    where t.id = flashcards.topic_id
      and (public.is_admin() or t.owner_user_id = auth.uid())
  )
);

drop policy if exists user_word_progress_policy on public.user_word_progress;
create policy user_word_progress_policy on public.user_word_progress
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists srs_reviews_policy on public.srs_reviews;
create policy srs_reviews_policy on public.srs_reviews
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists toeic_tests_public_read on public.toeic_tests;
create policy toeic_tests_public_read on public.toeic_tests
for select using (true);

drop policy if exists toeic_tests_admin_write on public.toeic_tests;
create policy toeic_tests_admin_write on public.toeic_tests
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists toeic_question_groups_public_read on public.toeic_question_groups;
create policy toeic_question_groups_public_read on public.toeic_question_groups
for select using (true);

drop policy if exists toeic_question_groups_admin_write on public.toeic_question_groups;
create policy toeic_question_groups_admin_write on public.toeic_question_groups
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists toeic_questions_public_read on public.toeic_questions;
create policy toeic_questions_public_read on public.toeic_questions
for select using (true);

drop policy if exists toeic_questions_admin_write on public.toeic_questions;
create policy toeic_questions_admin_write on public.toeic_questions
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists toeic_test_records_policy on public.toeic_test_records;
create policy toeic_test_records_policy on public.toeic_test_records
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists support_tickets_select_policy on public.support_tickets;
create policy support_tickets_select_policy on public.support_tickets
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists support_tickets_insert_policy on public.support_tickets;
create policy support_tickets_insert_policy on public.support_tickets
for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists support_tickets_update_policy on public.support_tickets;
create policy support_tickets_update_policy on public.support_tickets
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists vocab_activity_logs_policy on public.vocab_activity_logs;
create policy vocab_activity_logs_policy on public.vocab_activity_logs
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
