-- Buckets privés. Un fichier n'est lisible par un visiteur que s'il est
-- rattaché à un projet publié et marqué public dans project_media.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'images',
    'images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'videos',
    'videos',
    false,
    104857600,
    array['video/mp4', 'video/webm']
  ),
  (
    'posters',
    'posters',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
on conflict (id) do nothing;

create policy media_objects_select
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('images', 'videos', 'posters')
    and (
      public.is_admin()
      or exists (
        select 1
        from public.project_media
        join public.projects on projects.id = project_media.project_id
        where project_media.bucket = storage.objects.bucket_id
          and project_media.storage_path = storage.objects.name
          and project_media.visibility = 'public'
          and project_media.provider = 'storage'
          and projects.status = 'published'
      )
    )
  );

create policy media_objects_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    public.is_admin()
    and bucket_id in ('images', 'videos', 'posters')
  );

create policy media_objects_update
  on storage.objects
  for update
  to authenticated
  using (
    public.is_admin()
    and bucket_id in ('images', 'videos', 'posters')
  )
  with check (
    public.is_admin()
    and bucket_id in ('images', 'videos', 'posters')
  );

create policy media_objects_delete
  on storage.objects
  for delete
  to authenticated
  using (
    public.is_admin()
    and bucket_id in ('images', 'videos', 'posters')
  );
