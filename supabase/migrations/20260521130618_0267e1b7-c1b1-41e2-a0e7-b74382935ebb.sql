
-- Fix search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke broad EXECUTE on definer functions (triggers still run as owner)
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Tighten access_requests insert policy (replace `true` with field validation)
drop policy "anyone can submit request" on public.access_requests;
create policy "anyone can submit request" on public.access_requests
  for insert to anon, authenticated
  with check (
    length(trim(first_name)) between 1 and 100
    and length(trim(last_name)) between 1 and 100
    and length(trim(email)) between 3 and 255
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(phone)) between 3 and 40
    and (instagram is null or length(instagram) <= 100)
    and (how_heard is null or length(how_heard) <= 500)
    and status = 'pending'
  );
