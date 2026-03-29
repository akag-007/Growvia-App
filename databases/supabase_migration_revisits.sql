-- Create revisits table
CREATE TYPE revisit_type AS ENUM ('tech', 'leetcode', 'math', 'college', 'book', 'misc');
CREATE TYPE revisit_status AS ENUM ('active', 'done', 'archived');

CREATE TABLE public.revisits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  type revisit_type DEFAULT 'misc',
  resource_url TEXT,
  reason_to_return TEXT,
  notes TEXT,
  
  -- Scaling/Status
  estimated_time_min INTEGER DEFAULT 15,
  difficulty INTEGER DEFAULT 3, -- 1-5 scale (initial difficulty)
  review_count INTEGER DEFAULT 0,
  status revisit_status DEFAULT 'active',
  
  -- Scheduling
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.revisits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own revisits" ON public.revisits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revisits" ON public.revisits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revisits" ON public.revisits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revisits" ON public.revisits
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER on_revisits_updated
  BEFORE UPDATE ON public.revisits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notes_updated_at(); -- Reusing existing function
