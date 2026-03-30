-- ==========================================
-- GAMIFICATION SYSTEM DATABASE SCHEMA
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USER PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Gamification stats
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_league TEXT NOT NULL DEFAULT 'bronze',
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  total_tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_hours_completed DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Daily check-in
  last_check_in TIMESTAMP WITH TIME ZONE,

  -- Streak freeze system
  streak_freezes_available INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id)
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_total_xp ON public.user_profiles(total_xp DESC);

-- ==========================================
-- 2. XP LOGS (APPEND-ONLY)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  xp_amount INTEGER NOT NULL, -- Can be negative for penalties
  source TEXT NOT NULL, -- 'task_completion', 'revisit_completion', 'long_task', 'daily_check_in', 'streak_bonus', 'level_bonus', 'penalty'
  source_id UUID, -- Reference to task/revisit/etc
  source_metadata JSONB, -- Additional context about the source

  -- Weekly tracking
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT xp_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS for xp_logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_logs
CREATE POLICY "Users can view their own XP logs"
  ON public.xp_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP logs"
  ON public.xp_logs FOR INSERT
  WITH CHECK (true); -- Allow system/trigger to insert

-- Create indexes for performance
CREATE INDEX idx_xp_logs_user_id ON public.xp_logs(user_id);
CREATE INDEX idx_xp_logs_created_at ON public.xp_logs(created_at DESC);
CREATE INDEX idx_xp_logs_week_year ON public.xp_logs(week_number, year);
CREATE INDEX idx_xp_logs_source ON public.xp_logs(source);

-- ==========================================
-- 3. LEVELS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.levels (
  level INTEGER NOT NULL,
  title TEXT NOT NULL,
  xp_threshold INTEGER NOT NULL,
  bonus_xp INTEGER NOT NULL DEFAULT 0, -- XP rewarded on reaching this level

  -- League requirement (optional, for advanced features)
  required_league TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT levels_pkey PRIMARY KEY (level)
);

-- No RLS needed for levels - it's system data

-- Insert initial levels
INSERT INTO public.levels (level, title, xp_threshold, bonus_xp, required_league) VALUES
  (1, 'Amateur I', 0, 0, NULL),
  (2, 'Amateur II', 25, 10, NULL),
  (3, 'Amateur III', 50, 15, NULL),
  (4, 'Focused I', 100, 25, 'bronze'),
  (5, 'Focused II', 150, 35, 'bronze'),
  (6, 'Disciplined I', 250, 50, 'silver'),
  (7, 'Disciplined II', 350, 75, 'silver'),
  (8, 'Master I', 500, 100, 'gold'),
  (9, 'Master II', 750, 150, 'gold'),
  (10, 'Monk', 1000, 200, 'platinum'),
  (11, 'Grandmaster', 1500, 300, 'platinum'),
  (12, 'Legend', 2500, 500, 'diamond'),
  (13, 'Mythic', 5000, 1000, 'diamond'),
  (14, 'Immortal', 10000, 2000, 'diamond'),
  (15, 'Transcendent', 25000, 5000, 'diamond')
ON CONFLICT (level) DO NOTHING;

-- ==========================================
-- 4. LEAGUES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- XP requirements
  min_xp_weekly INTEGER NOT NULL DEFAULT 0,
  max_xp_weekly INTEGER,

  -- League settings
  promotion_count INTEGER NOT NULL DEFAULT 3,
  relegation_count INTEGER NOT NULL DEFAULT 3,
  users_per_league INTEGER NOT NULL DEFAULT 100,

  -- Rank range
  rank_min INTEGER NOT NULL,
  rank_max INTEGER NOT NULL,

  -- Visual styling
  color TEXT NOT NULL,
  icon TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT leagues_pkey PRIMARY KEY (id)
);

-- No RLS needed for leagues - it's system data

-- Insert initial leagues
INSERT INTO public.leagues (id, name, description, min_xp_weekly, max_xp_weekly, rank_min, rank_max, color, icon) VALUES
  ('bronze', 'Bronze League', 'The starting league for new productivity warriors', 0, 99, 1, 100, '#cd7f32', '🥉'),
  ('silver', 'Silver League', 'For those building consistent habits', 100, 249, 101, 200, '#c0c0c0', '🥈'),
  ('gold', 'Gold League', 'Where productivity champions compete', 250, 499, 201, 300, '#ffd700', '🥇'),
  ('platinum', 'Platinum League', 'Elite productivity masters', 500, 999, 301, 400, '#e5e4e2', '💎'),
  ('diamond', 'Diamond League', 'The pinnacle of productivity achievement', 1000, NULL, 401, 500, '#b9f2ff', '👑')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 5. WEEKLY SCORES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.weekly_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  league_id TEXT NOT NULL REFERENCES public.leagues(id),

  -- Time tracking
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  -- XP calculations
  base_xp INTEGER NOT NULL DEFAULT 0,
  consistency_multiplier DECIMAL(5, 4) NOT NULL DEFAULT 1.0,
  effective_xp INTEGER NOT NULL DEFAULT 0,

  -- Ranking
  rank INTEGER NOT NULL,
  previous_rank INTEGER,

  -- League movement
  promoted BOOLEAN NOT NULL DEFAULT false,
  relegated BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_scores_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_scores_user_week_unique UNIQUE (user_id, week_number, year)
);

-- Enable RLS for weekly_scores
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_scores
CREATE POLICY "Users can view their own weekly scores"
  ON public.weekly_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all weekly scores for leaderboard"
  ON public.weekly_scores FOR SELECT
  USING (true); -- Allow viewing all for leaderboard functionality

CREATE POLICY "System can insert weekly scores"
  ON public.weekly_scores FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_weekly_scores_user_id ON public.weekly_scores(user_id);
CREATE INDEX idx_weekly_scores_league_week ON public.weekly_scores(league_id, week_number, year);
CREATE INDEX idx_weekly_scores_effective_xp ON public.weekly_scores(effective_xp DESC);
CREATE INDEX idx_weekly_scores_rank ON public.weekly_scores(rank);

-- ==========================================
-- 6. BADGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Badge details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL, -- 'streak', 'tasks', 'xp', 'time', 'special'
  requirement_type TEXT NOT NULL, -- 'streak_days', 'tasks_completed', 'xp_total', 'hours_total', 'custom'
  requirement_value INTEGER NOT NULL,

  -- Rarity and progression
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  tier INTEGER NOT NULL DEFAULT 1, -- For progressive badges (e.g., 3-day, 7-day, 30-day streak)
  parent_badge_id UUID REFERENCES public.badges(id), -- For progressive chains

  -- Visuals
  color TEXT,
  background_color TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT badges_pkey PRIMARY KEY (id)
);

-- No RLS needed for badges - it's system data

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, rarity, tier, color) VALUES
  -- Streak badges
  ('First Steps', 'Complete your first 3-day streak', '🔥', 'streak', 'streak_days', 3, 'common', 1, '#f59e0b'),
  ('Week Warrior', 'Complete a 7-day streak', '⚡', 'streak', 'streak_days', 7, 'rare', 2, '#eab308'),
  ('Monthly Master', 'Achieve a 30-day streak', '🏆', 'streak', 'streak_days', 30, 'epic', 3, '#22c55e'),
  ('Quarter Champion', 'Reach a 90-day streak', '👑', 'streak', 'streak_days', 90, 'legendary', 4, '#8b5cf6'),

  -- Task badges
  ('Task Starter', 'Complete 10 tasks', '✅', 'tasks', 'tasks_completed', 10, 'common', 1, '#6366f1'),
  ('Task Master', 'Complete 50 tasks', '📋', 'tasks', 'tasks_completed', 50, 'rare', 2, '#8b5cf6'),
  ('Task Legend', 'Complete 100 tasks', '🎯', 'tasks', 'tasks_completed', 100, 'epic', 3, '#ec4899'),
  ('Task God', 'Complete 500 tasks', '⚡', 'tasks', 'tasks_completed', 500, 'legendary', 4, '#f43f5e'),

  -- XP badges
  ('XP Collector', 'Earn 100 XP', '💎', 'xp', 'xp_total', 100, 'common', 1, '#3b82f6'),
  ('XP Hunter', 'Earn 500 XP', '💰', 'xp', 'xp_total', 500, 'rare', 2, '#06b6d4'),
  ('XP Tycoon', 'Earn 2500 XP', '💵', 'xp', 'xp_total', 2500, 'epic', 3, '#10b981'),
  ('XP Mogul', 'Earn 10000 XP', '🏦', 'xp', 'xp_total', 10000, 'legendary', 4, '#f59e0b'),

  -- Time badges
  ('Hour One', 'Complete 1 hour of focused work', '⏰', 'time', 'hours_total', 1, 'common', 1, '#64748b'),
  ('Day Dedicated', 'Complete 8 hours of focused work', '📅', 'time', 'hours_total', 8, 'rare', 2, '#0ea5e9'),
  ('Week Warrior', 'Complete 40 hours of focused work', '📆', 'time', 'hours_total', 40, 'epic', 3, '#8b5cf6'),
  ('Month Master', 'Complete 160 hours of focused work', '🗓️', 'time', 'hours_total', 160, 'legendary', 4, '#d946ef'),

  -- Special badges
  ('Early Bird', 'Complete a task before 8 AM', '🌅', 'special', 'custom', 1, 'rare', 1, '#fbbf24'),
  ('Night Owl', 'Complete a task after 10 PM', '🦉', 'special', 'custom', 1, 'rare', 1, '#6366f1'),
  ('Perfect Week', 'Complete tasks all 7 days of a week', '🎉', 'special', 'custom', 7, 'epic', 1, '#22c55e'),
  ('League Jumper', 'Get promoted twice in one week', '🚀', 'special', 'custom', 1, 'legendary', 1, '#ef4444')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 7. USER BADGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,

  -- Progress tracking for progressive badges
  current_progress INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own badge progress"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);

-- ==========================================
-- 8. DAILY SCORES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Date tracking
  date DATE NOT NULL,

  -- Daily metrics
  score INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  hours_logged DECIMAL(5, 2) NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,

  -- Streak calculation
  meets_streak_threshold BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT daily_scores_pkey PRIMARY KEY (id),
  CONSTRAINT daily_scores_user_date_unique UNIQUE (user_id, date)
);

-- Enable RLS for daily_scores
ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_scores
CREATE POLICY "Users can view their own daily scores"
  ON public.daily_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert daily scores"
  ON public.daily_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update daily scores"
  ON public.daily_scores FOR UPDATE
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_daily_scores_user_id ON public.daily_scores(user_id);
CREATE INDEX idx_daily_scores_date ON public.daily_scores(date);
CREATE INDEX idx_daily_scores_user_date ON public.daily_scores(user_id, date);

-- ==========================================
-- 9. WEEKLY RESET HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.weekly_reset_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Time tracking
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  -- League changes
  previous_league TEXT NOT NULL,
  new_league TEXT NOT NULL,

  -- Rank changes
  previous_rank INTEGER NOT NULL,
  new_rank INTEGER NOT NULL,

  -- Result
  result TEXT NOT NULL, -- 'promoted', 'stayed', 'relegated'

  -- Summary data
  summary JSONB,

  -- Viewed status
  viewed BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_reset_history_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_reset_history_user_week_unique UNIQUE (user_id, week_number, year)
);

-- Enable RLS for weekly_reset_history
ALTER TABLE public.weekly_reset_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_reset_history
CREATE POLICY "Users can view their own reset history"
  ON public.weekly_reset_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert reset history"
  ON public.weekly_reset_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can mark reset history as viewed"
  ON public.weekly_reset_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_weekly_reset_history_user_id ON public.weekly_reset_history(user_id);
CREATE INDEX idx_weekly_reset_history_week_year ON public.weekly_reset_history(week_number, year);

-- ==========================================
-- 10. GAMIFICATION SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gamification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User preferences
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  leaderboard_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Thresholds
  daily_streak_threshold INTEGER NOT NULL DEFAULT 10, -- Minimum score to maintain streak

  -- Privacy
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT true,
  allow_friend_requests BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT gamification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_settings_user_id_unique UNIQUE (user_id)
);

-- Enable RLS for gamification_settings
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gamification_settings
CREATE POLICY "Users can view their own settings"
  ON public.gamification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.gamification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.gamification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get current week number and year
CREATE OR REPLACE FUNCTION get_current_week_info()
RETURNS TABLE(week_number INTEGER, year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER AS week_number,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate consistency multiplier
CREATE OR REPLACE FUNCTION calculate_consistency_multiplier(user_id UUID, week_number INTEGER, year INTEGER)
RETURNS DECIMAL(5, 4) AS $$
DECLARE
  active_days INTEGER;
BEGIN
  SELECT COUNT(DISTINCT date)
  INTO active_days
  FROM public.daily_scores
  WHERE
    user_id = $1
    AND EXTRACT(WEEK FROM date) = $2
    AND EXTRACT(YEAR FROM date) = $3
    AND score > 0;

  -- Return active days / 7, minimum 0.1429 (1 day), maximum 1.0 (7 days)
  RETURN GREATEST(0.1429, LEAST(1.0, active_days::DECIMAL / 7.0));
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current level info
CREATE OR REPLACE FUNCTION get_user_level(user_xp INTEGER)
RETURNS TABLE(level INTEGER, title TEXT, xp_threshold INTEGER, xp_to_next INTEGER) AS $$
DECLARE
  current_level RECORD;
  next_level RECORD;
BEGIN
  SELECT * INTO current_level
  FROM public.levels
  WHERE xp_threshold <= user_xp
  ORDER BY xp_threshold DESC
  LIMIT 1;

  SELECT * INTO next_level
  FROM public.levels
  WHERE level = current_level.level + 1;

  RETURN QUERY
  SELECT
    current_level.level,
    current_level.title,
    current_level.xp_threshold,
    COALESCE(next_level.xp_threshold - user_xp, 0) AS xp_to_next;
END;
$$ LANGUAGE plpgsql;

-- Function to award XP (with duplicate prevention)
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_source_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_total_xp INTEGER, level_upped BOOLEAN, new_level INTEGER) AS $$
DECLARE
  existing_log RECORD;
  current_profile RECORD;
  new_total INTEGER;
  level_info RECORD;
  old_level INTEGER;
  new_level INTEGER;
  level_up BOOLEAN;
BEGIN
  -- Check for duplicate XP event (within last minute)
  SELECT * INTO existing_log
  FROM public.xp_logs
  WHERE
    user_id = p_user_id
    AND source = p_source
    AND source_id = p_source_id
    AND created_at > NOW() - INTERVAL '1 minute'
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT false, 0, false, 0;
    RETURN;
  END IF;

  -- Get current week info
  SELECT week_number, year INTO existing_log
  FROM get_current_week_info();

  -- Get current profile
  SELECT * INTO current_profile
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Insert XP log
  INSERT INTO public.xp_logs (
    user_id, xp_amount, source, source_id, source_metadata,
    week_number, year
  )
  VALUES (
    p_user_id, p_xp_amount, p_source, p_source_id, p_source_metadata,
    existing_log.week_number, existing_log.year
  );

  -- Update total XP
  new_total := current_profile.total_xp + p_xp_amount;

  -- Get current level
  SELECT * INTO level_info
  FROM get_user_level(current_profile.total_xp);
  old_level := level_info.level;

  -- Update profile
  UPDATE public.user_profiles
  SET
    total_xp = new_total,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Check for level up
  SELECT * INTO level_info
  FROM get_user_level(new_total);
  new_level := level_info.level;
  level_up := (new_level > old_level);

  -- Award level bonus if leveled up
  IF level_up THEN
    INSERT INTO public.xp_logs (
      user_id, xp_amount, source, week_number, year
    )
    VALUES (
      p_user_id,
      (SELECT bonus_xp FROM public.levels WHERE level = new_level),
      'level_bonus',
      existing_log.week_number,
      existing_log.year
    );

    -- Update total XP again with bonus
    SELECT bonus_xp INTO existing_log
    FROM public.levels
    WHERE level = new_level;

    new_total := new_total + existing_log.bonus_xp;

    UPDATE public.user_profiles
    SET
      total_xp = new_total,
      current_level = new_level,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY SELECT true, new_total, level_up, new_level;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update updated_at timestamp on user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Update updated_at timestamp on daily_scores
CREATE OR REPLACE FUNCTION update_daily_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_scores_updated_at
  BEFORE UPDATE ON public.daily_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_scores_updated_at();

-- Update updated_at timestamp on weekly_scores
CREATE OR REPLACE FUNCTION update_weekly_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_weekly_scores_updated_at
  BEFORE UPDATE ON public.weekly_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_scores_updated_at();

-- Update updated_at timestamp on gamification_settings
CREATE OR REPLACE FUNCTION update_gamification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gamification_settings_updated_at
  BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_settings_updated_at();

-- ==========================================
-- INITIAL DATA SETUP
-- ==========================================

-- Create default gamification settings function
CREATE OR REPLACE FUNCTION ensure_user_gamification_setup(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create user profile if not exists
  INSERT INTO public.user_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default settings if not exists
  INSERT INTO public.gamification_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create initial daily score for today if not exists
  INSERT INTO public.daily_scores (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile for gamification data including XP, levels, leagues, and streaks';
COMMENT ON TABLE public.xp_logs IS 'Append-only log of all XP events for tracking and audit';
COMMENT ON TABLE public.levels IS 'Level configuration with XP thresholds and titles';
COMMENT ON TABLE public.leagues IS 'League configuration for weekly competition';
COMMENT ON TABLE public.weekly_scores IS 'Weekly league scores with consistency weighting';
COMMENT ON TABLE public.badges IS 'Badge/achievement definitions with requirements';
COMMENT ON TABLE public.user_badges IS 'Users unlocked badges with progress tracking';
COMMENT ON TABLE public.daily_scores IS 'Daily activity tracking for consistency calculation';
COMMENT ON TABLE public.weekly_reset_history IS 'History of weekly league resets and promotions/relegations';
COMMENT ON TABLE public.gamification_settings IS 'User preferences and settings for gamification features';

COMMENT ON FUNCTION award_xp IS 'Award XP to user with duplicate prevention and automatic level up detection';
COMMENT ON FUNCTION calculate_consistency_multiplier IS 'Calculate consistency multiplier based on active days in a week';
COMMENT ON FUNCTION get_user_level IS 'Get user level information including XP to next level';
COMMENT ON FUNCTION ensure_user_gamification_setup IS 'Ensure user has required gamification tables initialized';

-- ==========================================
-- COMPLETION
-- ==========================================

-- Gamification schema migration complete
-- Run this migration to set up the complete gamification system
