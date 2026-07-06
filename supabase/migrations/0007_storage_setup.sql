insert into storage.buckets (id, name, public)
values ('toeic-media', 'toeic-media', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists toeic_media_public_read on storage.objects;
create policy toeic_media_public_read on storage.objects
for select using (bucket_id = 'toeic-media');

drop policy if exists toeic_media_admin_insert on storage.objects;
create policy toeic_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'toeic-media' and public.is_admin());

drop policy if exists toeic_media_admin_update on storage.objects;
create policy toeic_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'toeic-media' and public.is_admin())
with check (bucket_id = 'toeic-media' and public.is_admin());

drop policy if exists toeic_media_admin_delete on storage.objects;
create policy toeic_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'toeic-media' and public.is_admin());
