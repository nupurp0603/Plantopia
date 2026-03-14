-- Allow email to be null (anonymous users have no email)
alter table public.users
  alter column email drop not null;

-- Update trigger to handle anonymous users gracefully
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
