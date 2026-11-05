-- Ajouts non destructifs pour le dashboard.
-- N'efface aucune ligne. À exécuter une seule fois dans le SQL Editor.

alter table public.projects
  add column if not exists external_links jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_external_links_array'
  ) then
    alter table public.projects
      add constraint projects_external_links_array
      check (jsonb_typeof(external_links) = 'array');
  end if;
end $$;

-- Le logo et le portrait enregistrés dans site_settings.branding
-- doivent être lisibles par les visiteurs. Les brouillons restent privés.
drop policy if exists media_objects_branding_select on storage.objects;

create policy media_objects_branding_select
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'images'
    and exists (
      select 1
      from public.site_settings
      where site_settings.key = 'branding'
        and (
          (
            site_settings.value -> 'logo' ->> 'path' = storage.objects.name
            and site_settings.value -> 'logo' ->> 'bucket' = storage.objects.bucket_id
          )
          or (
            site_settings.value -> 'portrait' ->> 'path' = storage.objects.name
            and site_settings.value -> 'portrait' ->> 'bucket' = storage.objects.bucket_id
          )
        )
    )
  );
