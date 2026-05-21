
-- ROLES
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "admins view roles" on public.user_roles
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "users view own role" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users view own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "admins view all profiles" on public.profiles
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

create policy "users insert own profile" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- ACCESS REQUESTS
create type public.request_status as enum ('pending', 'approved', 'rejected');

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  instagram text,
  how_heard text,
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.access_requests enable row level security;

-- Anyone (anon + auth) can submit a request
create policy "anyone can submit request" on public.access_requests
  for insert to anon, authenticated
  with check (true);

create policy "admins view all requests" on public.access_requests
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins update requests" on public.access_requests
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- TRIGGER: on new user, create profile + assign role (admin if sister's email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );

  if lower(new.email) = 'frafabri@yahoo.it' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
