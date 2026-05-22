
create type public.booking_status as enum ('pending','confirmed','cancelled','rejected');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index bookings_one_confirmed_per_day
  on public.bookings(date) where status = 'confirmed';

create index bookings_user_idx on public.bookings(user_id);
create index bookings_date_idx on public.bookings(date);

alter table public.bookings enable row level security;

create policy "users view own bookings" on public.bookings
  for select to authenticated using (auth.uid() = user_id);

create policy "users create own bookings" on public.bookings
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and date >= current_date
    and (notes is null or length(notes) <= 1000)
  );

create policy "users cancel own pending" on public.bookings
  for update to authenticated
  using (auth.uid() = user_id and status in ('pending','confirmed'))
  with check (auth.uid() = user_id and status = 'cancelled');

create policy "admins view all bookings" on public.bookings
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins manage bookings" on public.bookings
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins delete bookings" on public.bookings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- closed days
create table public.closed_days (
  date date primary key,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.closed_days enable row level security;

create policy "anyone view closed days" on public.closed_days
  for select to anon, authenticated using (true);

create policy "admins manage closed days" on public.closed_days
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
