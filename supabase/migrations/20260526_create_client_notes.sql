-- Client notes table
create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_notes enable row level security;

create policy "admins view client notes" on public.client_notes
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins insert client notes" on public.client_notes
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins update client notes" on public.client_notes
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins delete client notes" on public.client_notes
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index idx_client_notes_client_id on public.client_notes(client_id);
