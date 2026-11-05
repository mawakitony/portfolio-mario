-- Rôle admin attribué uniquement par grant_admin(), depuis l'éditeur SQL.
-- Le compte doit déjà exister et avoir un e-mail confirmé.
-- Le premier utilisateur Auth ne devient pas administrateur.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.admin_grant_in_progress()
returns boolean
language sql
stable
as $$
  select current_setting('app.grant_admin', true) = 'on';
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.role = 'admin' and not public.admin_grant_in_progress() then
    raise exception 'admin role requires grant_admin';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role and not public.admin_grant_in_progress() then
    raise exception 'admin role requires grant_admin';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.grant_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  confirmed_at timestamptz;
begin
  if auth.uid() is not null then
    raise exception 'grant_admin cannot be called from the API';
  end if;

  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  select email_confirmed_at
    into confirmed_at
  from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'user not found';
  end if;

  if confirmed_at is null then
    raise exception 'email is not confirmed';
  end if;

  perform set_config('app.grant_admin', 'on', true);

  insert into public.profiles (id)
  values (target_user_id)
  on conflict (id) do nothing;

  update public.profiles
    set role = 'admin'
    where id = target_user_id;
end;
$$;

revoke all on function public.grant_admin(uuid) from public, anon, authenticated, service_role;

create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger projects_stamp_published_at
  before insert or update on public.projects
  for each row execute function public.stamp_published_at();

create or replace function public.enforce_media_visibility()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  project_status text;
begin
  if new.visibility <> 'public' then
    return new;
  end if;

  if new.project_id is null then
    raise exception 'unattached media cannot be public';
  end if;

  select status
    into project_status
  from public.projects
  where id = new.project_id;

  if project_status is distinct from 'published' then
    raise exception 'only a published project can expose media';
  end if;

  return new;
end;
$$;

create trigger project_media_enforce_visibility
  before insert or update on public.project_media
  for each row execute function public.enforce_media_visibility();

create or replace function public.lock_media_when_unpublished()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'published' and new.status is distinct from 'published' then
    update public.project_media
      set visibility = 'private'
      where project_id = new.id
        and visibility = 'public';
  end if;
  return new;
end;
$$;

create trigger projects_lock_media
  before update on public.projects
  for each row execute function public.lock_media_when_unpublished();

revoke all on function public.admin_grant_in_progress() from public, anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;
revoke all on function public.protect_profile_role() from public, anon, authenticated, service_role;
revoke all on function public.stamp_published_at() from public, anon, authenticated, service_role;
revoke all on function public.enforce_media_visibility() from public, anon, authenticated, service_role;
revoke all on function public.lock_media_when_unpublished() from public, anon, authenticated, service_role;
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;

create policy profiles_select_self_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_self_or_admin
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy categories_public_select
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy categories_admin_write
  on public.categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy projects_public_select
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy projects_admin_write
  on public.projects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy project_categories_public_select
  on public.project_categories
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.projects
      where projects.id = project_categories.project_id
        and projects.status = 'published'
    )
  );

create policy project_categories_admin_write
  on public.project_categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy project_media_public_select
  on public.project_media
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      visibility = 'public'
      and exists (
        select 1
        from public.projects
        where projects.id = project_media.project_id
          and projects.status = 'published'
      )
    )
  );

create policy project_media_admin_write
  on public.project_media
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy services_public_select
  on public.services
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy services_admin_write
  on public.services
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy testimonials_public_select
  on public.testimonials
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy testimonials_admin_write
  on public.testimonials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy contact_messages_insert
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and char_length(name) between 1 and 120
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and char_length(email) <= 320
    and (phone is null or char_length(phone) <= 40)
    and (subject is null or char_length(subject) <= 160)
    and char_length(message) between 1 and 5000
  );

create policy contact_messages_admin_read
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

create policy contact_messages_admin_update
  on public.contact_messages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy contact_messages_admin_delete
  on public.contact_messages
  for delete
  to authenticated
  using (public.is_admin());

create policy site_settings_public_select
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy site_settings_admin_write
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy project_views_insert
  on public.project_views
  for insert
  to anon, authenticated
  with check (
    viewed_on = current_date
    and exists (
      select 1
      from public.projects
      where projects.id = project_views.project_id
        and projects.status = 'published'
    )
  );

create policy project_views_admin_select
  on public.project_views
  for select
  to authenticated
  using (public.is_admin());

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_categories from anon, authenticated;
revoke all on table public.project_media from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.testimonials from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.project_views from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;
grant select on table public.project_categories to anon, authenticated;
grant insert, update, delete on table public.project_categories to authenticated;
grant select on table public.project_media to anon, authenticated;
grant insert, update, delete on table public.project_media to authenticated;
grant select on table public.services to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;
grant select on table public.testimonials to anon, authenticated;
grant insert, update, delete on table public.testimonials to authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select, update, delete on table public.contact_messages to authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;
grant insert on table public.project_views to anon, authenticated;
grant select on table public.project_views to authenticated;
