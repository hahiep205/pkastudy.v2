create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_progress_set_updated_at on public.user_progress;
create trigger trg_user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_set_updated_at on public.courses;
create trigger trg_courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists trg_topics_set_updated_at on public.topics;
create trigger trg_topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

drop trigger if exists trg_flashcards_set_updated_at on public.flashcards;
create trigger trg_flashcards_set_updated_at
before update on public.flashcards
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_word_progress_set_updated_at on public.user_word_progress;
create trigger trg_user_word_progress_set_updated_at
before update on public.user_word_progress
for each row execute function public.set_updated_at();

drop trigger if exists trg_srs_reviews_set_updated_at on public.srs_reviews;
create trigger trg_srs_reviews_set_updated_at
before update on public.srs_reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_toeic_tests_set_updated_at on public.toeic_tests;
create trigger trg_toeic_tests_set_updated_at
before update on public.toeic_tests
for each row execute function public.set_updated_at();

drop trigger if exists trg_toeic_question_groups_set_updated_at on public.toeic_question_groups;
create trigger trg_toeic_question_groups_set_updated_at
before update on public.toeic_question_groups
for each row execute function public.set_updated_at();

drop trigger if exists trg_toeic_questions_set_updated_at on public.toeic_questions;
create trigger trg_toeic_questions_set_updated_at
before update on public.toeic_questions
for each row execute function public.set_updated_at();

drop trigger if exists trg_toeic_test_records_set_updated_at on public.toeic_test_records;
create trigger trg_toeic_test_records_set_updated_at
before update on public.toeic_test_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_support_tickets_set_updated_at on public.support_tickets;
create trigger trg_support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.profiles.name),
      updated_at = now();

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();
