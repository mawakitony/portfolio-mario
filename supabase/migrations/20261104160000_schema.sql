-- Schéma MARDIGITAL. Aucune donnée de contenu n'est insérée.
-- RLS est activée ici, sans politique : refus par défaut jusqu'à la migration suivante.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text,
  description text,
  client_name text,
  year integer check (year between 1900 and 2100),
  tools text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_published_timestamp check (
    status <> 'published' or published_at is not null
  )
);

create table public.project_categories (
  project_id uuid not null references public.projects (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  sort_order integer not null default 0,
  primary key (project_id, category_id)
);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  bucket text,
  storage_path text,
  mime_type text,
  kind text not null check (kind in ('image', 'video', 'poster', 'embed')),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  alt_text text,
  caption text,
  role text not null default 'gallery' check (role in ('cover', 'gallery', 'video', 'document', 'poster')),
  sort_order integer not null default 0,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  provider text not null default 'storage' check (provider in ('storage', 'youtube', 'vimeo')),
  external_url text,
  external_id text,
  poster_media_id uuid references public.project_media (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_media_source check (
    (
      provider = 'storage'
      and bucket in ('images', 'videos', 'posters')
      and storage_path is not null
      and external_id is null
    )
    or (
      provider in ('youtube', 'vimeo')
      and external_id is not null
      and bucket is null
      and storage_path is null
    )
  )
);

create unique index project_media_storage_unique
  on public.project_media (bucket, storage_path)
  where storage_path is not null;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text,
  body text,
  items text[] not null default '{}',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  quote text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  visitor_hash text not null check (char_length(visitor_hash) between 32 and 128),
  viewed_on date not null,
  created_at timestamptz not null default now(),
  unique (project_id, visitor_hash, viewed_on)
);

create index projects_public_order_idx
  on public.projects (status, is_featured, sort_order);

create index project_categories_category_idx
  on public.project_categories (category_id);

create index project_media_project_order_idx
  on public.project_media (project_id, sort_order);

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

create index project_views_day_idx
  on public.project_views (project_id, viewed_on);

create index services_public_order_idx
  on public.services (status, sort_order);

create index testimonials_public_order_idx
  on public.testimonials (status, sort_order);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger project_media_set_updated_at
  before update on public.project_media
  for each row execute function public.set_updated_at();

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_media enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.project_views enable row level security;
