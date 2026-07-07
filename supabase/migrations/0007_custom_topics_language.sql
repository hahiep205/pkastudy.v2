alter table public.topics
  add column if not exists language text not null default 'en';

update public.topics t
set language = coalesce(
  nullif((
    select f.language
    from public.flashcards f
    where f.topic_id = t.id
    order by f.id asc
    limit 1
  ), ''),
  (
    select c.language
    from public.courses c
    where c.id = t.course_id
  ),
  'en'
)
where t.language is null or t.language = '';
