-- 1. Add new columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS target_deadline DATE,
  ADD COLUMN IF NOT EXISTS estimated_total_duration INTEGER; -- in minutes

-- 2. Create task_project_links (M:M relationship)
CREATE TABLE IF NOT EXISTS public.task_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, project_id) -- Prevent duplicate linking
);

-- Enable RLS for task_project_links
ALTER TABLE public.task_project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task project links" ON public.task_project_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task project links" ON public.task_project_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task project links" ON public.task_project_links
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Migrate existing 1:M relationships to M:M
INSERT INTO public.task_project_links (user_id, task_id, project_id)
SELECT user_id, id, project_id
FROM public.tasks
WHERE project_id IS NOT NULL 
ON CONFLICT DO NOTHING;

-- 4. Drop the old project_id column from tasks (clean architecture)
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS project_id;

-- 5. Create task_sessions (Append-only log)
CREATE TABLE IF NOT EXISTS public.task_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in seconds
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for task_sessions
ALTER TABLE public.task_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task sessions" ON public.task_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task sessions" ON public.task_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Indices for Performance
CREATE INDEX IF NOT EXISTS task_project_links_project_id_idx ON public.task_project_links(project_id);
CREATE INDEX IF NOT EXISTS task_project_links_task_id_idx ON public.task_project_links(task_id);
CREATE INDEX IF NOT EXISTS task_sessions_task_id_idx ON public.task_sessions(task_id);
