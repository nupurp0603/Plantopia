-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.plants enable row level security;
alter table public.plant_care enable row level security;
alter table public.tasks enable row level security;
alter table public.chat_messages enable row level security;

-- Users: can only see/edit own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Plants: users own their plants
create policy "Users can view own plants" on public.plants
  for select using (auth.uid() = user_id);

create policy "Users can insert own plants" on public.plants
  for insert with check (auth.uid() = user_id);

create policy "Users can update own plants" on public.plants
  for update using (auth.uid() = user_id);

create policy "Users can delete own plants" on public.plants
  for delete using (auth.uid() = user_id);

-- Plant care: accessible if user owns the plant
create policy "Users can view own plant care" on public.plant_care
  for select using (
    exists (select 1 from public.plants where plants.id = plant_care.plant_id and plants.user_id = auth.uid())
  );

create policy "Users can insert own plant care" on public.plant_care
  for insert with check (
    exists (select 1 from public.plants where plants.id = plant_care.plant_id and plants.user_id = auth.uid())
  );

create policy "Users can update own plant care" on public.plant_care
  for update using (
    exists (select 1 from public.plants where plants.id = plant_care.plant_id and plants.user_id = auth.uid())
  );

-- Tasks: users own their tasks
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Chat messages: users own their messages
create policy "Users can view own messages" on public.chat_messages
  for select using (auth.uid() = user_id);

create policy "Users can insert own messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
