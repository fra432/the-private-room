
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );

  if lower(new.email) in ('frafabri@yahoo.it', 'theroomjf@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$function$;

-- If the user already exists, promote now
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where lower(email) = 'theroomjf@gmail.com'
on conflict (user_id, role) do nothing;
