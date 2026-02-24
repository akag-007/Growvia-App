-- Create notes table
create table public.notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'Untitled',
  content text not null default '',
  color text null,
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS for notes
alter table public.notes enable row level security;

create policy "Users can view their own notes" on public.notes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function public.handle_notes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_notes_updated
  before update on public.notes
  for each row
  execute function public.handle_notes_updated_at();
