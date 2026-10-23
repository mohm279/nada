-- NADA initial schema. Review and adapt before applying to an existing project.
create extension if not exists pgcrypto;

create table if not exists public.shared_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','leader','member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.account_room_permissions (
  account_id uuid not null references public.shared_accounts(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  role text not null check (role in ('leader','member','admin')),
  primary key (account_id, room_id)
);

create table if not exists public.anasheed (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  created_by uuid references public.shared_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anasheed_title_nonempty check (length(trim(title)) > 0),
  constraint anasheed_content_nonempty check (length(trim(content)) > 0)
);

create table if not exists public.active_selections (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  nasheed_id uuid not null references public.anasheed(id) on delete restrict,
  selected_by uuid references public.shared_accounts(id),
  selected_at timestamptz not null default now()
);

create table if not exists public.selection_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  nasheed_id uuid references public.anasheed(id) on delete set null,
  action text not null check (action in ('select','clear')),
  performed_by uuid references public.shared_accounts(id),
  created_at timestamptz not null default now()
);

create index if not exists anasheed_title_idx on public.anasheed (title);
create index if not exists active_selections_room_idx on public.active_selections (room_id);
create index if not exists selection_history_room_time_idx on public.selection_history (room_id, created_at desc);

insert into public.rooms(name, description)
select 'فرقة الوَتَر', 'غرفة فرقة الوَتَر'
where not exists (select 1 from public.rooms where name = 'فرقة الوَتَر');

insert into public.rooms(name, description)
select 'فرقة الصدى', 'غرفة فرقة الصدى'
where not exists (select 1 from public.rooms where name = 'فرقة الصدى');

-- Enable RLS. Policies and secure RPC functions must be completed before production use.
alter table public.shared_accounts enable row level security;
alter table public.rooms enable row level security;
alter table public.account_room_permissions enable row level security;
alter table public.anasheed enable row level security;
alter table public.active_selections enable row level security;
alter table public.selection_history enable row level security;

-- This starter deliberately does not add permissive policies or security-definer RPCs.
-- Without correct policies, browser queries will be denied (fail closed).
-- Implement and test role-aware SELECT/INSERT/UPDATE/DELETE policies and the RPC functions
-- select_nasheed_for_room(p_room_id uuid, p_nasheed_id uuid)
-- clear_nasheed_for_room(p_room_id uuid)
-- using server-trusted auth.uid() -> shared_accounts.auth_user_id, active status,
-- account_room_permissions, and transactionally writing selection_history.
-- Never put the service_role key in browser code.
