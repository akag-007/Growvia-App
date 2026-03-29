-- Add actual_duration to tasks table
alter table public.tasks 
add column actual_duration integer not null default 0; -- in seconds
