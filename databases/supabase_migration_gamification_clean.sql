-- ==========================================
-- GAMIFICATION SYSTEM - CLEAN INSTALLATION
-- ==========================================
-- Use this if you have existing gamification tables that need to be updated
-- ==========================================

-- Drop existing tables in correct order (reverse of foreign key dependencies)
DROP TABLE IF EXISTS public.weekly_reset_history CASCADE;
DROP TABLE IF EXISTS public.gamification_settings CASCADE;
DROP TABLE IF EXISTS public.daily_scores CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.weekly_scores CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;
DROP TABLE IF EXISTS public.levels CASCADE;
DROP TABLE IF EXISTS public.xp_logs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS award_xp CASCADE;
DROP FUNCTION IF EXISTS get_user_level CASCADE;
DROP FUNCTION IF EXISTS calculate_consistency_multiplier CASCADE;
DROP FUNCTION IF EXISTS ensure_user_gamification_setup CASCADE;
DROP FUNCTION IF EXISTS get_current_week_info CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_daily_scores_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_weekly_scores_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_gamification_settings_updated_at CASCADE;

-- Now re-run the full migration
-- (Copy content from supabase_migration_gamification.sql and paste here)
