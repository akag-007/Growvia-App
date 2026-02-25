-- Step 1: drop the old string default ('md') so Postgres can change the type
alter table public.challenges
    alter column cell_size drop default;

-- Step 2: convert existing values to integer pixels
alter table public.challenges
    alter column cell_size type integer
    using (case cell_size
        when 'xs' then 8
        when 'sm' then 14
        when 'md' then 20
        else 14
    end);

-- Step 3: set the new integer default
alter table public.challenges
    alter column cell_size set default 14;

-- Also ensure grid_columns column exists (idempotent)
alter table public.challenges
    add column if not exists grid_columns integer not null default 20;
