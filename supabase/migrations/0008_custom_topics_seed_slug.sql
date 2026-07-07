create unique index if not exists uq_topics_owner_slug
  on public.topics (owner_user_id, slug)
  where slug is not null;
