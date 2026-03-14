-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

-- Plants table
create table public.plants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plant_name text not null,
  scientific_name text not null,
  image_url text,
  description text,
  created_at timestamptz default now() not null
);

-- Plant care instructions
create table public.plant_care (
  id uuid default gen_random_uuid() primary key,
  plant_id uuid references public.plants(id) on delete cascade not null unique,
  watering_frequency_days integer not null default 7,
  light_requirement text not null,
  fertilizer_schedule text not null,
  care_instructions jsonb default '{}',
  common_problems jsonb default '[]'
);

-- Care tasks / reminders
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  plant_id uuid references public.plants(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  task_type text not null check (task_type in ('water', 'fertilize', 'repot', 'rotate')),
  due_date date not null,
  completed boolean default false not null,
  created_at timestamptz default now() not null
);

-- Chat messages
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plant_id uuid references public.plants(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now() not null
);

-- Indexes for common queries
create index plants_user_id_idx on public.plants(user_id);
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_plant_id_idx on public.tasks(plant_id);
create index tasks_due_date_idx on public.tasks(due_date);
create index chat_messages_user_id_idx on public.chat_messages(user_id);
create index chat_messages_plant_id_idx on public.chat_messages(plant_id);
