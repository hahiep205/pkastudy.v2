create or replace function public.sync_identity_sequences()
returns void
language plpgsql
as $$
begin
  perform setval(pg_get_serial_sequence('public.courses', 'id'), coalesce((select max(id) from public.courses), 1), true);
  perform setval(pg_get_serial_sequence('public.topics', 'id'), coalesce((select max(id) from public.topics), 1), true);
  perform setval(pg_get_serial_sequence('public.flashcards', 'id'), coalesce((select max(id) from public.flashcards), 1), true);
  perform setval(pg_get_serial_sequence('public.user_progress', 'id'), coalesce((select max(id) from public.user_progress), 1), true);
  perform setval(pg_get_serial_sequence('public.user_word_progress', 'id'), coalesce((select max(id) from public.user_word_progress), 1), true);
  perform setval(pg_get_serial_sequence('public.srs_reviews', 'id'), coalesce((select max(id) from public.srs_reviews), 1), true);
  perform setval(pg_get_serial_sequence('public.toeic_tests', 'id'), coalesce((select max(id) from public.toeic_tests), 1), true);
  perform setval(pg_get_serial_sequence('public.toeic_question_groups', 'id'), coalesce((select max(id) from public.toeic_question_groups), 1), true);
  perform setval(pg_get_serial_sequence('public.toeic_questions', 'id'), coalesce((select max(id) from public.toeic_questions), 1), true);
  perform setval(pg_get_serial_sequence('public.toeic_test_records', 'id'), coalesce((select max(id) from public.toeic_test_records), 1), true);
  perform setval(pg_get_serial_sequence('public.support_tickets', 'id'), coalesce((select max(id) from public.support_tickets), 1), true);
  perform setval(pg_get_serial_sequence('public.vocab_activity_logs', 'id'), coalesce((select max(id) from public.vocab_activity_logs), 1), true);
end;
$$;
