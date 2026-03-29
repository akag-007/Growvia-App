-- Add priority column to tasks table for Eisenhower Matrix
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority TEXT
    CHECK (priority IN (
      'important_urgent',
      'important_not_urgent',
      'not_important_urgent',
      'not_important_not_urgent'
    ));
