-- Portfolio backend (version 2). Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once, and safe on a project that already runs version 1:
-- your existing projects are COPIED into the new `entries` table; nothing is deleted.

-- 1) Tables -----------------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

create table if not exists public.site_profile (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 254),
  message    text not null check (char_length(message) between 1 and 5000),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- One table for every kind of content: web projects, films, articles, op-eds, short stories,
-- branding copy, copywriting, press copy, speeches and certifications. Type-specific details live in `meta`.
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

-- Contact form protection. Anyone can send a message, so cap the damage of a flood:
-- at most 5 per sender and 40 in total per 10 minutes, and the email must look like an email.
alter table public.messages drop constraint if exists messages_email_format;
alter table public.messages add constraint messages_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;

create or replace function public.throttle_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.messages where lower(email) = lower(new.email) and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.messages where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'Too many messages. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists messages_throttle on public.messages;
create trigger messages_throttle before insert on public.messages for each row execute function public.throttle_messages();

-- 2) Copy projects from version 1 (only if that table exists). The old table is left untouched.
do $$
begin
  if to_regclass('public.projects') is not null then
    insert into public.entries
      (id, type, slug, title, summary, body, category, tags, cover_image, gallery, links,
       entry_date, featured, published, sort_order, meta, created_at)
    select
      p.id, 'project',
      coalesce(nullif(trim(both '-' from lower(regexp_replace(p.title, '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'project')
        || '-' || substr(p.id::text, 1, 4),
      p.title, p.summary, p.description, p.category, p.tags, p.cover_image, p.gallery, p.links,
      p.created_at::date, p.featured, p.published, p.sort_order,
      jsonb_strip_nulls(jsonb_build_object(
        'status', nullif(p.status, ''), 'client', nullif(p.client, ''), 'year', nullif(p.year, ''))),
      p.created_at
    from public.projects p
    on conflict (id) do nothing;
  end if;
end $$;

-- 3) Who is the admin? --------------------------------------------------------------------------
-- NEW PROJECTS ONLY: add your sign-in email once (it must match the user you create under
-- Authentication > Users). If version 1 already ran, this is already done; skip it.
-- insert into public.admins (email) values ('you@example.com') on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 4) Row Level Security -------------------------------------------------------------------------
alter table public.admins       enable row level security;  -- no policies: nobody can read it directly
alter table public.site_profile enable row level security;
alter table public.entries      enable row level security;
alter table public.messages     enable row level security;

drop policy if exists "profile is public"         on public.site_profile;
drop policy if exists "admin writes profile"      on public.site_profile;
drop policy if exists "published entries public"  on public.entries;
drop policy if exists "admin writes entries"      on public.entries;
drop policy if exists "anyone can send a message" on public.messages;
drop policy if exists "admin reads messages"      on public.messages;
drop policy if exists "admin updates messages"    on public.messages;
drop policy if exists "admin deletes messages"    on public.messages;

create policy "profile is public" on public.site_profile
  for select to anon, authenticated using (true);
create policy "admin writes profile" on public.site_profile
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "published entries public" on public.entries
  for select to anon, authenticated using (published = true or public.is_admin());
create policy "admin writes entries" on public.entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "anyone can send a message" on public.messages
  for insert to anon, authenticated with check (true);
create policy "admin reads messages" on public.messages
  for select to authenticated using (public.is_admin());
create policy "admin updates messages" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes messages" on public.messages
  for delete to authenticated using (public.is_admin());

grant select on public.site_profile, public.entries to anon, authenticated;
grant insert on public.messages to anon, authenticated;
grant insert, update, delete on public.site_profile, public.entries to authenticated;
grant select, update, delete on public.messages to authenticated;

-- 5) File storage (pictures and PDFs, 10 MB max each) ------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 10485760,
        array['image/jpeg','image/png','image/gif','image/webp','application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin uploads portfolio files" on storage.objects;
drop policy if exists "admin edits portfolio files"   on storage.objects;
drop policy if exists "admin deletes portfolio files" on storage.objects;
drop policy if exists "admin uploads portfolio images" on storage.objects;
drop policy if exists "admin edits portfolio images"   on storage.objects;
drop policy if exists "admin deletes portfolio images" on storage.objects;

create policy "admin uploads portfolio files" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
create policy "admin edits portfolio files" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_admin());
create policy "admin deletes portfolio files" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());
