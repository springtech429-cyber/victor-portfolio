-- Run this FIRST if the full schema.sql gave "error fetching API" or the site says:
--   Could not find the table 'public.entries' in the schema cache (PGRST205)
-- It is small, safe to run more than once, and creates only the tables the site reads.
-- Then run supabase/schema.sql again (or step-2) for the security rules, storage and the rest.

create table if not exists public.admins (email text primary key);

create table if not exists public.site_profile (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('project','film','article','oped','story','branding','copy','press','speech','certification')),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null check (char_length(title) between 1 and 200),
  summary     text not null default '',
  body        text not null default '',
  category    text not null default '',
  tags        text[] not null default '{}',
  cover_image text not null default '',
  gallery     text[] not null default '{}',
  links       jsonb not null default '[]'::jsonb,
  entry_date  date,
  featured    boolean not null default false,
  published   boolean not null default true,
  sort_order  int not null default 0,
  meta        jsonb not null default '{}'::jsonb,
  file_url    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists entries_type_published_idx on public.entries (type, published);

-- Reading must work for visitors, so allow public reads of published rows right away.
alter table public.entries enable row level security;
drop policy if exists "published entries public" on public.entries;
create policy "published entries public" on public.entries for select to anon, authenticated using (published = true);
grant select on public.entries to anon, authenticated;

-- Tell the API to notice the new tables immediately.
notify pgrst, 'reload schema';
