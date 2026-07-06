create or replace function public.enqueue_immediate_reviews(
  p_user_id uuid,
  p_flashcard_ids bigint[]
)
returns table (
  id bigint,
  topic_id bigint,
  public_id text,
  word text,
  transcription text,
  mean text,
  wordtype text,
  example text,
  example_vi text,
  language text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.srs_reviews (
    user_id,
    flashcard_id,
    interval_days,
    ef,
    repetition,
    next_review_date,
    last_reviewed_at
  )
  select
    p_user_id,
    flashcard_id,
    0,
    2.50,
    0,
    current_date,
    null
  from unnest(p_flashcard_ids) as flashcard_id
  on conflict (user_id, flashcard_id) do update
  set interval_days = excluded.interval_days,
      ef = excluded.ef,
      repetition = excluded.repetition,
      next_review_date = excluded.next_review_date,
      last_reviewed_at = excluded.last_reviewed_at,
      updated_at = now();

  return query
  select
    f.id,
    f.topic_id,
    coalesce(f.external_id, f.id::text) as public_id,
    f.word,
    f.transcription,
    f.meaning as mean,
    f.word_type as wordtype,
    f.example,
    f.example_vi,
    f.language
  from public.flashcards f
  where f.id = any (p_flashcard_ids)
  order by f.id asc;
end;
$$;

create or replace function public.submit_srs_review_batch(
  p_user_id uuid,
  p_reviews jsonb
)
returns table (
  flashcard_id bigint,
  interval_days integer,
  ef numeric(4,2),
  repetition integer,
  next_review_date date,
  word text,
  mean text,
  transcription text,
  wordtype text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  review_item jsonb;
  current_review record;
  current_interval integer;
  current_ef numeric(4,2);
  current_repetition integer;
  next_interval integer;
  next_ef numeric(4,2);
  next_repetition integer;
  quality integer;
  quality_multiplier numeric(6,2);
  ef_delta numeric(10,4);
begin
  for review_item in select * from jsonb_array_elements(p_reviews)
  loop
    quality := (review_item ->> 'quality')::integer;

    select
      r.interval_days,
      r.ef,
      r.repetition
    into current_review
    from public.srs_reviews r
    where r.user_id = p_user_id
      and r.flashcard_id = (review_item ->> 'flashcard_id')::bigint
    for update;

    current_interval := coalesce(current_review.interval_days, 0);
    current_ef := coalesce(current_review.ef, 2.50);
    current_repetition := coalesce(current_review.repetition, 0);

    ef_delta := 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    next_ef := greatest(1.30, round((current_ef + ef_delta)::numeric, 2));
    next_interval := 1;
    next_repetition := 0;

    if quality >= 3 then
      next_repetition := current_repetition + 1;

      if next_repetition = 1 then
        next_interval := case
          when quality = 3 then 2
          when quality = 4 then 4
          else 7
        end;
      elsif next_repetition = 2 then
        next_interval := case
          when quality = 3 then 4
          when quality = 4 then 7
          else 10
        end;
      else
        quality_multiplier := case
          when quality = 3 then 0.85
          when quality = 4 then 1
          else 1.2
        end;
        next_interval := greatest(1, round(current_interval * current_ef * quality_multiplier));
      end if;
    end if;

    insert into public.srs_reviews (
      user_id,
      flashcard_id,
      interval_days,
      ef,
      repetition,
      next_review_date,
      last_reviewed_at,
      fail_count
    )
    values (
      p_user_id,
      (review_item ->> 'flashcard_id')::bigint,
      next_interval,
      next_ef,
      next_repetition,
      current_date + next_interval,
      now(),
      case when quality < 3 then coalesce((select fail_count from public.srs_reviews where user_id = p_user_id and flashcard_id = (review_item ->> 'flashcard_id')::bigint), 0) + 1 else 0 end
    )
    on conflict (user_id, flashcard_id) do update
    set interval_days = excluded.interval_days,
        ef = excluded.ef,
        repetition = excluded.repetition,
        next_review_date = excluded.next_review_date,
        last_reviewed_at = excluded.last_reviewed_at,
        fail_count = excluded.fail_count,
        updated_at = now();
  end loop;

  return query
  select
    r.flashcard_id,
    r.interval_days,
    r.ef,
    r.repetition,
    r.next_review_date,
    f.word,
    f.meaning as mean,
    f.transcription,
    f.word_type as wordtype
  from public.srs_reviews r
  join public.flashcards f on f.id = r.flashcard_id
  where r.user_id = p_user_id
    and r.flashcard_id in (
      select (value ->> 'flashcard_id')::bigint
      from jsonb_array_elements(p_reviews)
    )
  order by r.flashcard_id asc;
end;
$$;
