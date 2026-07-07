alter table public.topics
  add column if not exists shared_from_topic_id bigint;

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

