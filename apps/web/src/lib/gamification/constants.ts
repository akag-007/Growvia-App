// ==========================================
// GAMIFICATION CONSTANTS & CONFIGURATION
// ==========================================

/**
 * XP Amounts for different activities
 */
export const XP_AMOUNTS = {
  TASK_COMPLETION: {
    MIN: 10,
    MAX: 50,
    BASE: 25,
  },
  REVISIT_COMPLETION: {
    BASE: 15,
    MULTIPLIER: 5, // XP increases by this amount per revisit
    MAX_MULTIPLIER: 5, // Max 5 revisits counted
  },
  LONG_TASK: {
    INTERVAL_MINUTES: 30,
    XP_PER_INTERVAL: 5,
  },
  DAILY_CHECK_IN: 5,
  STREAK_BONUS: {
    BASE: 10,
    MULTIPLIER: 2, // XP increases by this amount per streak day
  },
  LEVEL_BONUS_BASE: 10, // Base bonus for level up
} as const;

/**
 * XP Multipliers based on task difficulty/priority
 */
export const XP_MULTIPLIERS = {
  LOW: 0.8,
  MEDIUM: 1.0,
  HIGH: 1.3,
  VERY_HIGH: 1.5,
} as const;

/**
 * Level Configuration
 */
export const LEVEL_CONFIG = [
  { level: 1, title: 'Amateur I', xp_threshold: 0, bonus_xp: 0, required_league: null },
  { level: 2, title: 'Amateur II', xp_threshold: 25, bonus_xp: 10, required_league: null },
  { level: 3, title: 'Amateur III', xp_threshold: 50, bonus_xp: 15, required_league: null },
  { level: 4, title: 'Focused I', xp_threshold: 100, bonus_xp: 25, required_league: 'bronze' as const },
  { level: 5, title: 'Focused II', xp_threshold: 150, bonus_xp: 35, required_league: 'bronze' as const },
  { level: 6, title: 'Disciplined I', xp_threshold: 250, bonus_xp: 50, required_league: 'silver' as const },
  { level: 7, title: 'Disciplined II', xp_threshold: 350, bonus_xp: 75, required_league: 'silver' as const },
  { level: 8, title: 'Master I', xp_threshold: 500, bonus_xp: 100, required_league: 'gold' as const },
  { level: 9, title: 'Master II', xp_threshold: 750, bonus_xp: 150, required_league: 'gold' as const },
  { level: 10, title: 'Monk', xp_threshold: 1000, bonus_xp: 200, required_league: 'platinum' as const },
  { level: 11, title: 'Grandmaster', xp_threshold: 1500, bonus_xp: 300, required_league: 'platinum' as const },
  { level: 12, title: 'Legend', xp_threshold: 2500, bonus_xp: 500, required_league: 'diamond' as const },
  { level: 13, title: 'Mythic', xp_threshold: 5000, bonus_xp: 1000, required_league: 'diamond' as const },
  { level: 14, title: 'Immortal', xp_threshold: 10000, bonus_xp: 2000, required_league: 'diamond' as const },
  { level: 15, title: 'Transcendent', xp_threshold: 25000, bonus_xp: 5000, required_league: 'diamond' as const },
] as const;

/**
 * League Configuration
 */
export const LEAGUE_CONFIG = {
  bronze: {
    id: 'bronze' as const,
    name: 'Bronze League',
    description: 'The starting league for new productivity warriors',
    min_xp_weekly: 0,
    max_xp_weekly: 99,
    promotion_count: 3,
    relegation_count: 3,
    users_per_league: 100,
    rank_min: 1,
    rank_max: 100,
    color: '#cd7f32',
    icon: '🥉',
  },
  silver: {
    id: 'silver' as const,
    name: 'Silver League',
    description: 'For those building consistent habits',
    min_xp_weekly: 100,
    max_xp_weekly: 249,
    promotion_count: 3,
    relegation_count: 3,
    users_per_league: 100,
    rank_min: 101,
    rank_max: 200,
    color: '#c0c0c0',
    icon: '🥈',
  },
  gold: {
    id: 'gold' as const,
    name: 'Gold League',
    description: 'Where productivity champions compete',
    min_xp_weekly: 250,
    max_xp_weekly: 499,
    promotion_count: 3,
    relegation_count: 3,
    users_per_league: 100,
    rank_min: 201,
    rank_max: 300,
    color: '#ffd700',
    icon: '🥇',
  },
  platinum: {
    id: 'platinum' as const,
    name: 'Platinum League',
    description: 'Elite productivity masters',
    min_xp_weekly: 500,
    max_xp_weekly: 999,
    promotion_count: 3,
    relegation_count: 3,
    users_per_league: 100,
    rank_min: 301,
    rank_max: 400,
    color: '#e5e4e2',
    icon: '💎',
  },
  diamond: {
    id: 'diamond' as const,
    name: 'Diamond League',
    description: 'The pinnacle of productivity achievement',
    min_xp_weekly: 1000,
    max_xp_weekly: null,
    promotion_count: 0,
    relegation_count: 3,
    users_per_league: 100,
    rank_min: 401,
    rank_max: 500,
    color: '#b9f2ff',
    icon: '👑',
  },
} as const;

/**
 * Default Gamification Settings
 */
export const DEFAULT_GAMIFICATION_SETTINGS = {
  notifications_enabled: true,
  weekly_reminder_enabled: true,
  leaderboard_enabled: true,
  daily_streak_threshold: 10, // Minimum score to maintain streak
  show_on_leaderboard: true,
  allow_friend_requests: true,
} as const;

/**
 * Streak Freeze Configuration
 */
export const STREAK_FREEZE_CONFIG = {
  BASE_COST: 50, // Base XP cost to use streak freeze
  COST_PER_STREAK_DAY: 10, // Additional XP cost per streak day
  MAX_FREEZES_PER_WEEK: 1,
  INITIAL_FREEZES: 1,
} as const;

/**
 * Badge Configuration
 */
export const BADGE_RARITY = {
  common: {
    color: '#9ca3af',
    glow: 'rgba(156, 163, 175, 0.5)',
    probability: 0.5,
  },
  rare: {
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.5)',
    probability: 0.3,
  },
  epic: {
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.5)',
    probability: 0.15,
  },
  legendary: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.5)',
    probability: 0.05,
  },
} as const;

/**
 * Badge Categories with colors
 */
export const BADGE_CATEGORY_COLORS = {
  streak: '#f59e0b',
  tasks: '#6366f1',
  xp: '#3b82f6',
  time: '#10b981',
  special: '#ec4899',
} as const;

/**
 * Consistency Multiplier Configuration
 */
export const CONSISTENCY_CONFIG = {
  MIN_MULTIPLIER: 0.1429, // 1 day / 7
  MAX_MULTIPLIER: 1.0, // 7 days / 7
  DAYS_IN_WEEK: 7,
} as const;

/**
 * Leaderboard Configuration
 */
export const LEADERBOARD_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  REFRESH_INTERVAL: 30000, // 30 seconds
  SHOW_MOVEMENT_THRESHOLD: 3, // Minimum rank change to show movement indicator
} as const;

/**
 * XP Graph Configuration
 */
export const XP_GRAPH_CONFIG = {
  DAYS_TO_DISPLAY: 7,
  ANIMATION_DURATION: 1000, // milliseconds
  HIGHLIGHT_PEAK: true,
  SMOOTH_LINES: true,
} as const;

/**
 * Weekly Reset Configuration
 */
export const WEEKLY_RESET_CONFIG = {
  RESET_DAY: 0, // Sunday (0 = Sunday, 1 = Monday, etc.)
  RESET_HOUR: 0, // Midnight
  RESET_MINUTE: 0,
  RESULT_SCREEN_DURATION: 5000, // 5 seconds
  AUTO_DISMISS: true,
} as const;

/**
 * Notification Configuration
 */
export const NOTIFICATION_CONFIG = {
  LEVEL_UP: {
    enabled: true,
    duration: 5000,
    sound: true,
  },
  BADGE_UNLOCK: {
    enabled: true,
    duration: 5000,
    sound: true,
  },
  STREAK_WARNING: {
    enabled: true,
    threshold_hours: 4, // Warn 4 hours before streak breaks
    duration: 5000,
  },
  PROMOTION_WARNING: {
    enabled: true,
    days_remaining: 3, // Warn 3 days before week ends
    duration: 5000,
  },
  RELEGATION_WARNING: {
    enabled: true,
    days_remaining: 3, // Warn 3 days before week ends
    duration: 5000,
  },
  DAILY_CHECK_IN: {
    enabled: true,
    delay_seconds: 3, // Show 3 seconds after opening app
    duration: 3000,
  },
} as const;

/**
 * Animation Configuration
 */
export const ANIMATION_CONFIG = {
  XP_GAIN: {
    duration: 1500,
    particle_count: 10,
    particle_color: '#fbbf24',
  },
  LEVEL_UP: {
    duration: 2000,
    particle_count: 20,
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
  },
  PROMOTION: {
    duration: 2500,
    particle_count: 30,
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
  },
  BADGE_UNLOCK: {
    duration: 2000,
    particle_count: 15,
    colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
  },
  STREAK_COMPLETE: {
    duration: 1800,
    particle_count: 12,
    colors: ['#ef4444', '#f59e0b', '#fbbf24'],
  },
} as const;

/**
 * Edge Case Handling Configuration
 */
export const EDGE_CASE_CONFIG = {
  // Offline sync
  OFFLINE_QUEUE_MAX_SIZE: 100,
  OFFLINE_SYNC_RETRY_INTERVAL: 5000, // 5 seconds
  OFFLINE_SYNC_MAX_RETRIES: 3,

  // Duplicate prevention
  DUPLICATE_CHECK_WINDOW: 60000, // 1 minute in milliseconds
  IDEMPOTENCY_KEY_EXPIRY: 86400000, // 24 hours in milliseconds

  // Timezone handling
  DEFAULT_TIMEZONE: 'UTC',
  WEEK_START_DAY: 0, // Sunday

  // Week boundary handling
  WEEK_BOUNDARY_BUFFER: 300000, // 5 minutes in milliseconds

  // Streak calculation
  STREAK_GRACE_PERIOD: 86400000, // 24 hours in milliseconds
  STREAK_CALCULATION_OFFSET: 0, // Hours to offset for timezone

  // Leaderboard ties
  TIEBREAKER: 'timestamp', // Use timestamp as tiebreaker
  SHOW_TIED_INDICATOR: true,
} as const;

/**
 * Performance Configuration
 */
export const PERFORMANCE_CONFIG = {
  // Caching
  USER_PROFILE_CACHE_TTL: 300000, // 5 minutes
  LEADERBOARD_CACHE_TTL: 60000, // 1 minute
  BADGES_CACHE_TTL: 3600000, // 1 hour

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Batch operations
  XP_BATCH_SIZE: 100,
  BADGE_CHECK_BATCH_SIZE: 50,

  // Rate limiting
  XP_AWARD_RATE_LIMIT: {
    max_requests: 10,
    window_ms: 60000, // 1 minute
  },
} as const;

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  XP: {
    MIN_AMOUNT: -1000, // Allow negative XP (penalties)
    MAX_AMOUNT: 1000,
  },
  STREAK: {
    MIN_STREAK: 0,
    MAX_STREAK: 3650, // 10 years
  },
  LEVEL: {
    MIN_LEVEL: 1,
    MAX_LEVEL: 100,
  },
  LEAGUE: {
    VALID_LEAGUES: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
  },
  TASK_DURATION: {
    MIN_MINUTES: 1,
    MAX_MINUTES: 1440, // 24 hours
  },
  BADGE_PROGRESS: {
    MIN_PROGRESS: 0,
    MAX_PROGRESS: 100,
  },
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  GAMIFICATION_PAGE: {
    REFRESH_INTERVAL: 30000, // 30 seconds
    SHOW_LEAGUE_PRESSURE_ALWAYS: true,
    SHOW_STREAK_WARNING_THRESHOLD: 2, // Hours before streak breaks
  },
  LEADERBOARD: {
    HIGHLIGHT_CURRENT_USER: true,
    SHOW_MOVEMENT_INDICATORS: true,
    MOVEMENT_THRESHOLD: 3,
  },
  XP_GRAPH: {
    ANIMATE: true,
    ANIMATION_DURATION: 1000,
    SHOW_PEAK_DAY: true,
    SHOW_AVERAGE_LINE: false,
  },
  BADGES: {
    GRID_COLUMNS: 4,
    SHOW_LOCKED_BADGES: true,
    SHOW_PROGRESS_FOR_LOCKED: true,
  },
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  ENDPOINTS: {
    GET_USER_PROFILE: '/api/gamification/profile',
    AWARD_XP: '/api/gamification/award-xp',
    DAILY_CHECK_IN: '/api/gamification/check-in',
    GET_LEADERBOARD: '/api/gamification/leaderboard',
    GET_BADGES: '/api/gamification/badges',
    GET_WEEKLY_STATS: '/api/gamification/weekly-stats',
    USE_STREAK_FREEZE: '/api/gamification/streak-freeze',
    GET_WEEKLY_XP_GRAPH: '/api/gamification/xp-graph',
    GET_NOTIFICATIONS: '/api/gamification/notifications',
    MARK_NOTIFICATION_READ: '/api/gamification/notifications/:id/read',
  },
  TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    LONG: 30000, // 30 seconds
  },
} as const;

/**
 * Export all constants as a single object
 */
export const GAMIFICATION_CONSTANTS = {
  XP_AMOUNTS,
  XP_MULTIPLIERS,
  LEVEL_CONFIG,
  LEAGUE_CONFIG,
  DEFAULT_GAMIFICATION_SETTINGS,
  STREAK_FREEZE_CONFIG,
  BADGE_RARITY,
  BADGE_CATEGORY_COLORS,
  CONSISTENCY_CONFIG,
  LEADERBOARD_CONFIG,
  XP_GRAPH_CONFIG,
  WEEKLY_RESET_CONFIG,
  NOTIFICATION_CONFIG,
  ANIMATION_CONFIG,
  EDGE_CASE_CONFIG,
  PERFORMANCE_CONFIG,
  VALIDATION_CONFIG,
  UI_CONFIG,
  API_CONFIG,
} as const;
