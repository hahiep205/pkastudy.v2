create index if not exists idx_profiles_role_status on public.profiles (role, status);
create index if not exists idx_profiles_created_at on public.profiles (created_at desc);

create index if not exists idx_courses_sort_order on public.courses (sort_order, id);

create index if not exists idx_topics_course_sort on public.topics (course_id, sort_order, id);
create index if not exists idx_topics_owner_created on public.topics (owner_user_id, created_at desc);
create unique index if not exists uq_topics_custom_title_per_owner
  on public.topics (owner_user_id, lower(title))
  where owner_user_id is not null;

create index if not exists idx_flashcards_topic_id on public.flashcards (topic_id, id);
create unique index if not exists uq_flashcards_word_per_topic
  on public.flashcards (topic_id, lower(word));

create index if not exists idx_user_progress_updated_at on public.user_progress (updated_at desc);
create index if not exists idx_user_word_progress_user on public.user_word_progress (user_id, updated_at desc);
create index if not exists idx_srs_reviews_user_due on public.srs_reviews (user_id, next_review_date, flashcard_id);
create index if not exists idx_srs_reviews_flashcard_id on public.srs_reviews (flashcard_id);

create index if not exists idx_toeic_groups_test_part on public.toeic_question_groups (test_id, part, id);
create unique index if not exists uq_toeic_question_number_per_test
  on public.toeic_questions (test_id, question_number);
create index if not exists idx_toeic_questions_group on public.toeic_questions (group_id, question_number);
create index if not exists idx_toeic_test_records_user_created on public.toeic_test_records (user_id, created_at desc);

create index if not exists idx_support_tickets_status_created on public.support_tickets (status, created_at desc);
create index if not exists idx_support_tickets_user_created on public.support_tickets (user_id, created_at desc);
create index if not exists idx_vocab_activity_user_created on public.vocab_activity_logs (user_id, created_at desc);
create index if not exists idx_vocab_activity_mode_created on public.vocab_activity_logs (mode, created_at desc);
