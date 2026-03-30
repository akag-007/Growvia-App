// ==========================================
// XP CALCULATION LOGIC
// ==========================================

import { XP_AMOUNTS, XP_MULTIPLIERS, VALIDATION_CONFIG } from '../constants';
import type { XPCalculationParams } from '@/types/gamification';

/**
 * Calculate XP for task completion based on duration and priority
 */
export function calculateTaskCompletionXP(params: XPCalculationParams = {}): number {
  const {
    task_duration_minutes = 0,
    task_priority = 'medium',
    long_task_threshold = 120, // 2 hours
  } = params;

  // Calculate base XP based on duration
  let baseXP = XP_AMOUNTS.TASK_COMPLETION.BASE;

  // Adjust XP based on duration (longer tasks = more XP)
  if (task_duration_minutes > 0) {
    const durationMultiplier = Math.min(
      (task_duration_minutes / 60), // Hours
      2 // Max 2x multiplier
    );
    baseXP = XP_AMOUNTS.TASK_COMPLETION.MIN +
      (XP_AMOUNTS.TASK_COMPLETION.MAX - XP_AMOUNTS.TASK_COMPLETION.MIN) *
      Math.min(durationMultiplier, 1);
  }

  // Apply priority multiplier
  const priorityMultiplier = XP_MULTIPLIERS[task_priority.toUpperCase() as keyof typeof XP_MULTIPLIERS];
  const finalXP = Math.round(baseXP * priorityMultiplier);

  // Validate XP amount
  return validateXPAmount(finalXP);
}

/**
 * Calculate XP for revisit completion
 * Revisit completions give more XP, multiplied by revisit count
 */
export function calculateRevisitCompletionXP(
  revisitCount: number,
  taskDurationMinutes?: number
): number {
  const baseXP = calculateTaskCompletionXP({
    task_duration_minutes: taskDurationMinutes,
    task_priority: 'medium',
  });

  // Calculate revisit multiplier (capped at max)
  const revisitMultiplier = Math.min(
    revisitCount,
    XP_AMOUNTS.REVISIT_COMPLETION.MAX_MULTIPLIER
  );

  // Add revisit bonus
  const revisitBonus = XP_AMOUNTS.REVISIT_COMPLETION.MULTIPLIER * revisitMultiplier;

  const finalXP = Math.round(baseXP + revisitBonus);

  return validateXPAmount(finalXP);
}

/**
 * Calculate XP for long task progress
 * Award XP for every interval of time spent on a task
 */
export function calculateLongTaskXP(
  totalMinutesSpent: number,
  intervalMinutes: number = XP_AMOUNTS.LONG_TASK.INTERVAL_MINUTES
): number {
  const intervalsCompleted = Math.floor(totalMinutesSpent / intervalMinutes);
  const xpEarned = intervalsCompleted * XP_AMOUNTS.LONG_TASK.XP_PER_INTERVAL;

  return validateXPAmount(xpEarned);
}

/**
 * Calculate streak bonus XP
 * Bonus increases with streak length
 */
export function calculateStreakBonusXP(streakDays: number): number {
  if (streakDays < 3) return 0;

  const bonus = XP_AMOUNTS.STREAK_BONUS.BASE +
    (streakDays - 3) * XP_AMOUNTS.STREAK_BONUS.MULTIPLIER;

  return validateXPAmount(bonus);
}

/**
 * Calculate daily check-in XP
 * Fixed small amount for daily engagement
 */
export function calculateDailyCheckInXP(): number {
  return XP_AMOUNTS.DAILY_CHECK_IN;
}

/**
 * Calculate level bonus XP
 * Bonus awarded when reaching a new level
 */
export function calculateLevelBonusXP(level: number): number {
  const baseBonus = XP_AMOUNTS.LEVEL_BONUS_BASE;
  const levelMultiplier = Math.floor(level / 3); // Every 3 levels, bonus increases

  const bonus = baseBonus * (levelMultiplier + 1);

  return validateXPAmount(bonus);
}

/**
 * Calculate XP penalty for various reasons
 * (e.g., missed tasks, streak breaks, etc.)
 */
export function calculateXPPenalty(
  penaltyType: 'streak_break' | 'task_missed' | 'inactivity',
  severity: 'low' | 'medium' | 'high' = 'medium'
): number {
  const basePenalty = {
    streak_break: 20,
    task_missed: 5,
    inactivity: 10,
  }[penaltyType];

  const severityMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 2.0,
  }[severity];

  const penalty = Math.round(basePenalty * severityMultiplier);

  return validateXPAmount(-penalty); // Return negative value
}

/**
 * Validate XP amount is within acceptable bounds
 */
export function validateXPAmount(xp: number): number {
  const clampedXP = Math.max(
    VALIDATION_CONFIG.XP.MIN_AMOUNT,
    Math.min(VALIDATION_CONFIG.XP.MAX_AMOUNT, xp)
  );

  return clampedXP;
}

/**
 * Calculate XP to next level
 */
export function calculateXPToNextLevel(currentXP: number, currentLevel: number): number {
  // Import LEVEL_CONFIG dynamically to avoid circular dependency
  const { LEVEL_CONFIG } = require('../constants');

  const nextLevelConfig = LEVEL_CONFIG.find(level => level.level === currentLevel + 1);

  if (!nextLevelConfig) {
    return 0; // Already at max level
  }

  const xpToNext = nextLevelConfig.xp_threshold - currentXP;

  return Math.max(0, xpToNext);
}

/**
 * Calculate level progress percentage (0-100)
 */
export function calculateLevelProgress(
  currentXP: number,
  currentLevel: number
): number {
  // Import LEVEL_CONFIG dynamically to avoid circular dependency
  const { LEVEL_CONFIG } = require('../constants');

  const currentLevelConfig = LEVEL_CONFIG.find(level => level.level === currentLevel);
  const nextLevelConfig = LEVEL_CONFIG.find(level => level.level === currentLevel + 1);

  if (!currentLevelConfig || !nextLevelConfig) {
    return 100; // Max level or invalid level
  }

  const totalXPForLevel = nextLevelConfig.xp_threshold - currentLevelConfig.xp_threshold;
  const xpEarnedInLevel = currentXP - currentLevelConfig.xp_threshold;

  if (totalXPForLevel <= 0) {
    return 100;
  }

  const progress = Math.min(100, Math.max(0, (xpEarnedInLevel / totalXPForLevel) * 100));

  return Math.round(progress);
}

/**
 * Get level information for a given XP amount
 */
export function getLevelInfoForXP(totalXP: number) {
  const { LEVEL_CONFIG } = require('../constants');

  // Find the highest level whose threshold is <= current XP
  const level = LEVEL_CONFIG.reduce((highest, config) => {
    return (config.xp_threshold <= totalXP && config.level > highest.level)
      ? config
      : highest;
  }, LEVEL_CONFIG[0]);

  const nextLevel = LEVEL_CONFIG.find(config => config.level === level.level + 1);

  return {
    level: level.level,
    title: level.title,
    xp_threshold: level.xp_threshold,
    bonus_xp: level.bonus_xp,
    required_league: level.required_league,
    xp_to_next: nextLevel ? nextLevel.xp_threshold - totalXP : 0,
    xp_progress: calculateLevelProgress(totalXP, level.level),
  };
}

/**
 * Calculate total XP required to reach a specific level
 */
export function calculateXPToReachLevel(targetLevel: number): number {
  const { LEVEL_CONFIG } = require('../constants');

  const targetConfig = LEVEL_CONFIG.find(config => config.level === targetLevel);

  if (!targetConfig) {
    return 0; // Invalid level
  }

  return targetConfig.xp_threshold;
}

/**
 * Check if user is close to leveling up (within 10% of next level)
 */
export function isCloseToLevelUp(currentXP: number, currentLevel: number, threshold: number = 10): boolean {
  const progress = calculateLevelProgress(currentXP, currentLevel);
  return progress >= (100 - threshold);
}

/**
 * Calculate effective XP for weekly leaderboard
 * Applies consistency multiplier
 */
export function calculateEffectiveXP(baseXP: number, activeDays: number, daysInWeek: number = 7): number {
  const consistencyMultiplier = Math.max(
    1 / daysInWeek, // At least 1 day
    Math.min(1, activeDays / daysInWeek) // At most all days
  );

  const effectiveXP = Math.round(baseXP * consistencyMultiplier);

  return effectiveXP;
}

/**
 * Calculate XP for a specific time period
 */
export function calculateXPForPeriod(
  dailyScores: Array<{ date: Date; xp_earned: number }>,
  startDate: Date,
  endDate: Date
): number {
  return dailyScores
    .filter(score => {
      const scoreDate = new Date(score.date);
      return scoreDate >= startDate && scoreDate <= endDate;
    })
    .reduce((total, score) => total + score.xp_earned, 0);
}

/**
 * Calculate XP statistics for a user
 */
export function calculateXPStatistics(xpLogs: Array<{ xp_amount: number; created_at: Date }>) {
  const totalXP = xpLogs.reduce((sum, log) => sum + log.xp_amount, 0);
  const positiveXP = xpLogs.filter(log => log.xp_amount > 0).reduce((sum, log) => sum + log.xp_amount, 0);
  const negativeXP = xpLogs.filter(log => log.xp_amount < 0).reduce((sum, log) => sum + log.xp_amount, 0);

  // Calculate XP earned in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7DaysXP = xpLogs
    .filter(log => new Date(log.created_at) >= sevenDaysAgo && log.xp_amount > 0)
    .reduce((sum, log) => sum + log.xp_amount, 0);

  // Calculate XP earned in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30DaysXP = xpLogs
    .filter(log => new Date(log.created_at) >= thirtyDaysAgo && log.xp_amount > 0)
    .reduce((sum, log) => sum + log.xp_amount, 0);

  return {
    totalXP,
    positiveXP,
    negativeXP,
    last7DaysXP,
    last30DaysXP,
    averageXPPerDay: Math.round(totalXP / Math.max(1, xpLogs.length)),
  };
}
