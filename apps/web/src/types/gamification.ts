// ==========================================
// GAMIFICATION SYSTEM TYPES
// ==========================================

/**
 * User Profile - Extended user data for gamification
 */
export interface UserProfile {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_league: LeagueId;
  current_streak: number;
  max_streak: number;
  total_tasks_completed: number;
  total_hours_completed: number;
  last_check_in: Date | null;
  streak_freezes_available: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * XP Log - Append-only log of XP events
 */
export interface XPLog {
  id: string;
  user_id: string;
  xp_amount: number;
  source: XPSource;
  source_id: string | null;
  source_metadata: Record<string, any> | null;
  week_number: number;
  year: number;
  created_at: Date;
}

/**
 * XP Source Types
 */
export type XPSource =
  | 'task_completion'
  | 'revisit_completion'
  | 'long_task'
  | 'daily_check_in'
  | 'streak_bonus'
  | 'level_bonus'
  | 'penalty'
  | 'streak_freeze_used';

/**
 * Level Information
 */
export interface Level {
  level: number;
  title: string;
  xp_threshold: number;
  bonus_xp: number;
  required_league: LeagueId | null;
  created_at: Date;
}

/**
 * Level Information with progress
 */
export interface LevelInfo extends Level {
  xp_to_next: number;
  xp_progress: number; // 0-100 percentage
}

/**
 * League IDs
 */
export type LeagueId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * League Information
 */
export interface League {
  id: LeagueId;
  name: string;
  description: string | null;
  min_xp_weekly: number;
  max_xp_weekly: number | null;
  promotion_count: number;
  relegation_count: number;
  users_per_league: number;
  rank_min: number;
  rank_max: number;
  color: string;
  icon: string | null;
  created_at: Date;
}

/**
 * Weekly Score - User's performance in weekly competition
 */
export interface WeeklyScore {
  id: string;
  user_id: string;
  league_id: LeagueId;
  week_number: number;
  year: number;
  base_xp: number;
  consistency_multiplier: number;
  effective_xp: number;
  rank: number;
  previous_rank: number | null;
  promoted: boolean;
  relegated: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Weekly Score with user data
 */
export interface WeeklyScoreWithUser extends WeeklyScore {
  user_profile: Pick<UserProfile, 'total_xp' | 'current_level' | 'current_streak'>;
  username?: string;
  avatar_url?: string;
}

/**
 * Badge Categories
 */
export type BadgeCategory = 'streak' | 'tasks' | 'xp' | 'time' | 'special';

/**
 * Badge Requirement Types
 */
export type BadgeRequirementType =
  | 'streak_days'
  | 'tasks_completed'
  | 'xp_total'
  | 'hours_total'
  | 'custom';

/**
 * Badge Rarity
 */
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Badge - Achievement definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement_type: BadgeRequirementType;
  requirement_value: number;
  rarity: BadgeRarity;
  tier: number;
  parent_badge_id: string | null;
  color: string | null;
  background_color: string | null;
  created_at: Date;
}

/**
 * User Badge - User's unlocked badge with progress
 */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  current_progress: number;
  unlocked_at: Date;
  badge: Badge;
  is_unlocked: boolean;
  progress_percentage: number; // 0-100
}

/**
 * Daily Score - Daily activity tracking
 */
export interface DailyScore {
  id: string;
  user_id: string;
  date: Date;
  score: number;
  tasks_completed: number;
  hours_logged: number;
  xp_earned: number;
  meets_streak_threshold: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Weekly Reset Result Types
 */
export type WeeklyResetResult = 'promoted' | 'stayed' | 'relegated';

/**
 * Weekly Reset History - History of weekly league resets
 */
export interface WeeklyResetHistory {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  previous_league: LeagueId;
  new_league: LeagueId;
  previous_rank: number;
  new_rank: number;
  result: WeeklyResetResult;
  summary: WeeklyResetSummary | null;
  viewed: boolean;
  created_at: Date;
}

/**
 * Weekly Reset Summary
 */
export interface WeeklyResetSummary {
  total_xp_earned: number;
  tasks_completed: number;
  active_days: number;
  consistency_multiplier: number;
  league_changes: {
    promoted: boolean;
    relegated: boolean;
    rank_change: number;
  };
}

/**
 * Gamification Settings - User preferences
 */
export interface GamificationSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  weekly_reminder_enabled: boolean;
  leaderboard_enabled: boolean;
  daily_streak_threshold: number;
  show_on_leaderboard: boolean;
  allow_friend_requests: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username?: string;
  avatar_url?: string;
  effective_xp: number;
  base_xp: number;
  consistency_multiplier: number;
  league_id: LeagueId;
  current_level: number;
  current_streak: number;
  movement: 'up' | 'down' | 'same';
  movement_amount: number;
  is_current_user: boolean;
}

/**
 * Leaderboard Data
 */
export interface LeaderboardData {
  entries: LeaderboardEntry[];
  current_user_rank: number;
  total_users: number;
  week_number: number;
  year: number;
}

/**
 * Leaderboard Types
 */
export type LeaderboardType = 'global' | 'friends' | 'league';

/**
 * League Pressure - How close user is to promotion/relegation
 */
export interface LeaguePressure {
  to_promotion: number; // XP needed to reach promotion zone
  to_relegation: number; // XP before falling into relegation zone
  in_promotion_zone: boolean;
  in_relegation_zone: boolean;
  safe_zone: boolean;
}

/**
 * Weekly XP Data for graph
 */
export interface WeeklyXPData {
  date: Date;
  xp: number;
  tasks: number;
  hours: number;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  day_name: string; // 'Mon', 'Tue', etc.
}

/**
 * XP Award Result
 */
export interface XPAwardResult {
  success: boolean;
  new_total_xp: number;
  level_upped: boolean;
  new_level: number;
  message?: string;
}

/**
 * Daily Check-in Result
 */
export interface DailyCheckInResult {
  success: boolean;
  xp_awarded: number;
  already_checked_in: boolean;
  new_streak?: number;
  badges_unlocked?: Badge[];
}

/**
 * Streak Freeze Usage Result
 */
export interface StreakFreezeResult {
  success: boolean;
  xp_cost: number;
  streak_saved: boolean;
  new_freezes_available: number;
  message?: string;
}

/**
 * Gamification Statistics
 */
export interface GamificationStats {
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  current_league: LeagueId;
  league_rank: number;
  league_pressure: LeaguePressure;
  current_streak: number;
  max_streak: number;
  streak_freezes_available: number;
  total_tasks_completed: number;
  total_hours_completed: number;
  unlocked_badges_count: number;
  total_badges_count: number;
  weekly_xp: number;
  weekly_rank: number;
  weekly_consistency: number;
}

/**
 * Personal Stats Display Data
 */
export interface PersonalStats {
  total_xp: number;
  max_streak: number;
  current_streak: number;
  current_league: string;
  level: string;
  total_tasks: number;
  this_week_xp: number;
  this_week_rank: number;
  active_days_this_week: number;
}

/**
 * XP Graph Data
 */
export interface XPGraphData {
  weekly_data: WeeklyXPData[];
  peak_day: WeeklyXPData | null;
  total_xp: number;
  average_xp: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Badge Progress
 */
export interface BadgeProgress {
  badge: Badge;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  is_unlocked: boolean;
  next_tier_badge?: Badge;
}

/**
 * Weekly Competition Data
 */
export interface WeeklyCompetitionData {
  current_week: {
    week_number: number;
    year: number;
    days_remaining: number;
    start_date: Date;
    end_date: Date;
  };
  user_performance: {
    base_xp: number;
    effective_xp: number;
    consistency_multiplier: number;
    rank: number;
    active_days: number;
  };
  league_info: League;
  league_pressure: LeaguePressure;
  nearby_competitors: LeaderboardEntry[];
}

/**
 * Notification Types for Gamification
 */
export type GamificationNotificationType =
  | 'level_up'
  | 'badge_unlocked'
  | 'streak_achieved'
  | 'streak_warning'
  | 'promotion_imminent'
  | 'relegation_warning'
  | 'daily_check_in_reminder'
  | 'weekly_reset_summary'
  | 'league_promoted'
  | 'league_relegated';

/**
 * Gamification Notification
 */
export interface GamificationNotification {
  id: string;
  user_id: string;
  type: GamificationNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: Date;
}

/**
 * XP Calculation Parameters
 */
export interface XPCalculationParams {
  task_duration_minutes?: number;
  task_priority?: 'low' | 'medium' | 'high';
  revisit_count?: number;
  long_task_threshold?: number; // minutes
}

/**
 * League Movement Type
 */
export type LeagueMovement = 'promoted' | 'stayed' | 'relegated';

/**
 * User Activity Summary
 */
export interface UserActivitySummary {
  today: {
    tasks_completed: number;
    hours_logged: number;
    xp_earned: number;
    score: number;
  };
  this_week: {
    tasks_completed: number;
    hours_logged: number;
    xp_earned: number;
    active_days: number;
    effective_xp: number;
  };
  all_time: {
    tasks_completed: number;
    hours_logged: number;
    total_xp: number;
    max_streak: number;
  };
}

/**
 * Gamification State (for Zustand)
 */
export interface GamificationState {
  // User data
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;

  // XP
  totalXP: number;
  setTotalXP: (xp: number) => void;

  // Level
  currentLevel: number;
  levelInfo: LevelInfo | null;
  setCurrentLevel: (level: number) => void;
  setLevelInfo: (info: LevelInfo) => void;

  // League
  currentLeague: LeagueId;
  leagueInfo: League | null;
  leagueRank: number;
  leaguePressure: LeaguePressure | null;
  setCurrentLeague: (league: LeagueId) => void;
  setLeagueInfo: (info: League) => void;
  setLeagueRank: (rank: number) => void;
  setLeaguePressure: (pressure: LeaguePressure) => void;

  // Streak
  currentStreak: number;
  maxStreak: number;
  streakFreezes: number;
  setCurrentStreak: (streak: number) => void;
  setMaxStreak: (streak: number) => void;
  setStreakFreezes: (freezes: number) => void;

  // Badges
  unlockedBadges: UserBadge[];
  lockedBadges: Badge[];
  setUnlockedBadges: (badges: UserBadge[]) => void;
  setLockedBadges: (badges: Badge[]) => void;
  addUnlockedBadge: (badge: UserBadge) => void;

  // Leaderboard
  leaderboard: LeaderboardData | null;
  setLeaderboard: (data: LeaderboardData) => void;

  // Weekly data
  weeklyXPData: WeeklyXPData[];
  setWeeklyXPData: (data: WeeklyXPData[]) => void;

  // Check-in
  lastCheckIn: Date | null;
  canCheckIn: boolean;
  setLastCheckIn: (date: Date | null) => void;
  setCanCheckIn: (canCheckIn: boolean) => void;

  // Stats
  personalStats: PersonalStats | null;
  setPersonalStats: (stats: PersonalStats) => void;

  // Notifications
  notifications: GamificationNotification[];
  setNotifications: (notifications: GamificationNotification[]) => void;
  addNotification: (notification: GamificationNotification) => void;

  // Weekly reset
  pendingWeeklyReset: WeeklyResetHistory | null;
  setPendingWeeklyReset: (reset: WeeklyResetHistory | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Reset state
  resetGamificationState: () => void;
}
