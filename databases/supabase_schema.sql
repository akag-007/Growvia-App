-- Create categories table
create table public.categories (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  name text not null,
  color text not null,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS for categories
alter table public.categories enable row level security;

create policy "Users can view their own categories" on public.categories
  for select using (auth.uid() = user_id);

create policy "Users can insert their own categories" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own categories" on public.categories
  for update using (auth.uid() = user_id);

create policy "Users can delete their own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Create tasks table
create table public.tasks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  title text not null,
  description text null,
  is_completed boolean not null default false,
  estimated_duration integer null, -- in minutes
  category_id uuid null,
  due_date date not null default current_date,
  created_at timestamp with time zone not null default now(),
  constraint tasks_pkey primary key (id),
  constraint tasks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint tasks_category_id_fkey foreign key (category_id) references public.categories (id) on delete set null
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;

create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);
