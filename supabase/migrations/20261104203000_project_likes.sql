-- Likes partagés, sans compte visiteur.
-- Un même navigateur peut aimer puis retirer son like.
-- Ce n'est pas une garantie d'unicité par personne.

create table if not exists public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  unique (project_id, visitor_id)
);

create index if not exists project_likes_project_id_idx
  on public.project_likes (project_id);

alter table public.project_likes enable row level security;

create policy project_likes_public_select
  on public.project_likes
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_likes.project_id
        and projects.status = 'published'
    )
  );

revoke all on public.project_likes from public, anon, authenticated;
grant select on public.project_likes to anon, authenticated;

create or replace function public.toggle_project_like(target_project uuid, visitor uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
  recent integer;
begin
  if visitor is null then
    raise exception 'visitor required';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = target_project
      and status = 'published'
  ) then
    raise exception 'publication unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_project::text), hashtext(visitor::text));

  if exists (
    select 1
    from public.project_likes
    where project_id = target_project
      and visitor_id = visitor
  ) then
    delete from public.project_likes
    where project_id = target_project
      and visitor_id = visitor;
  else
    select count(*)
      into recent
    from public.project_likes
    where visitor_id = visitor
      and created_at > now() - interval '1 hour';

    if recent >= 40 then
      raise exception 'too many likes';
    end if;

    insert into public.project_likes (project_id, visitor_id)
    values (target_project, visitor);
  end if;

  select count(*)
    into total
  from public.project_likes
  where project_id = target_project;

  return total;
end;
$$;

revoke all on function public.toggle_project_like(uuid, uuid) from public;
grant execute on function public.toggle_project_like(uuid, uuid) to anon, authenticated;
