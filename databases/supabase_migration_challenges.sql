-- Challenges table
-- grid_cells and categories stored as JSONB for simplicity
-- (avoids thousands of rows for cell-level data).

create table if not exists public.challenges (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    title         text not null,
    description   text,
    type          text not null default 'personal', -- 'personal' | 'community'
    is_private    boolean not null default true,
    start_date    date not null,
    duration_days integer not null,
    tracking_unit text not null default 'days', -- 'hours' | 'days' | 'weeks'
    total_cells   integer not null,
    grid_cells    jsonb not null default '[]'::jsonb,
    categories    jsonb not null default '[]'::jsonb,
    cell_shape    text not null default 'square', -- 'square' | 'rounded' | 'circle'
    cell_size     text not null default 'sm',     -- 'xs' | 'sm' | 'md'
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- RLS
alter table public.challenges enable row level security;

create policy "Users can view their own challenges"
    on public.challenges for select
    using (auth.uid() = user_id);

create policy "Users can insert their own challenges"
    on public.challenges for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own challenges"
    on public.challenges for update
    using (auth.uid() = user_id);

create policy "Users can delete their own challenges"
    on public.challenges for delete
    using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_challenges_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger on_challenges_updated
    before update on public.challenges
    for each row execute function public.handle_challenges_updated_at();

-- Index for quick user lookups
create index if not exists challenges_user_id_idx on public.challenges(user_id);
