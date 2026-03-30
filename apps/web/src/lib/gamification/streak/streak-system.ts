// ==========================================
// STREAK SYSTEM LOGIC
// ==========================================

import { STREAK_FREEZE_CONFIG, EDGE_CASE_CONFIG } from '../constants';
import type { DailyScore } from '@/types/gamification';

/**
 * Check if a date is consecutive with another date (1 day difference)
 */
export function areDatesConsecutive(date1: Date, date2: Date): boolean {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

/**
 * Check if a date is within grace period of another date
 */
export function isWithinGracePeriod(date1: Date, date2: Date, graceHours: number = 24): boolean {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffHours = diffTime / (1000 * 60 * 60);

  return diffHours <= graceHours;
}

/**
 * Calculate current streak from daily scores
 */
export function calculateCurrentStreak(dailyScores: DailyScore[], currentDate: Date = new Date()): number {
  if (dailyScores.length === 0) {
    return 0;
  }

  // Sort by date descending (most recent first)
  const sortedScores = [...dailyScores].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  let currentDatePointer = new Date(currentDate);

  // Check if today or yesterday has activity
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayScore = sortedScores.find(score => {
    const scoreDate = new Date(score.date);
    scoreDate.setHours(0, 0, 0, 0);
    return scoreDate.getTime() === today.getTime();
  });

  const yesterdayScore = sortedScores.find(score => {
    const scoreDate = new Date(score.date);
    scoreDate.setHours(0, 0, 0, 0);
    return scoreDate.getTime() === yesterday.getTime();
  });

  // If no activity today or yesterday, streak is broken
  if (!todayScore && !yesterdayScore) {
    return 0;
  }

  // Start counting streak from most recent active day
  const startDate = todayScore || yesterdayScore;
  currentDatePointer = new Date(startDate!.date);

  // Count consecutive days
  for (const score of sortedScores) {
    const scoreDate = new Date(score.date);

    // Skip if score date is after current pointer (future dates)
    if (scoreDate > currentDatePointer) {
      continue;
    }

    // Check if date is consecutive
    if (areDatesConsecutive(currentDatePointer, scoreDate) || scoreDate.getTime() === currentDatePointer.getTime()) {
      streak++;
      currentDatePointer = scoreDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate maximum streak from daily scores
 */
export function calculateMaxStreak(dailyScores: DailyScore[]): number {
  if (dailyScores.length === 0) {
    return 0;
  }

  // Sort by date ascending (oldest first)
  const sortedScores = [...dailyScores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate: Date | null = null;

  for (const score of sortedScores) {
    const scoreDate = new Date(score.date);

    if (previousDate === null) {
      // First day
      currentStreak = 1;
    } else if (areDatesConsecutive(previousDate, scoreDate)) {
      // Consecutive day
      currentStreak++;
    } else {
      // Streak broken
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }

    previousDate = scoreDate;
  }

  // Update max streak one more time
  maxStreak = Math.max(maxStreak, currentStreak);

  return maxStreak;
}

/**
 * Check if streak will break if user doesn't act today
 */
export function willStreakBreakToday(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) {
    return false; // No streak to break
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // If last active was yesterday, streak will break today if no activity
  const lastActiveDateOnly = new Date(lastActiveDate);
  lastActiveDateOnly.setHours(0, 0, 0, 0);

  const yesterdayOnly = new Date(yesterday);
  yesterdayOnly.setHours(0, 0, 0, 0);

  return lastActiveDateOnly.getTime() === yesterdayOnly.getTime();
}

/**
 * Get hours until streak breaks
 */
export function getHoursUntilStreakBreak(lastActiveDate: Date | null, graceHours: number = 24): number {
  if (!lastActiveDate) {
    return Infinity; // No streak
  }

  const lastActiveDateOnly = new Date(lastActiveDate);
  lastActiveDateOnly.setHours(0, 0, 0, 0);

  const today = new Date();
  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);

  const lastActiveHour = lastActiveDate.getHours();
  const breakTime = new Date(todayOnly);
  breakTime.setHours(lastActiveHour + graceHours, 0, 0, 0);

  const hoursUntilBreak = (breakTime.getTime() - today.getTime()) / (1000 * 60 * 60);

  return Math.max(0, hoursUntilBreak);
}

/**
 * Check if user can maintain streak with daily score threshold
 */
export function canMaintainStreak(dailyScore: number, threshold: number): boolean {
  return dailyScore >= threshold;
}

/**
 * Get streak status message
 */
export function getStreakStatusMessage(
  currentStreak: number,
  maxStreak: number,
  lastActiveDate: Date | null
): string {
  if (currentStreak === 0) {
    return "Start your streak today!";
  }

  if (currentStreak === 1) {
    return "Great start! Keep going!";
  }

  if (currentStreak < 7) {
    return `You're on a ${currentStreak}-day streak! Keep it up!`;
  }

  if (currentStreak < 30) {
    return `Impressive ${currentStreak}-day streak! You're building momentum!`;
  }

  if (currentStreak < 90) {
    return `Amazing ${currentStreak}-day streak! You're crushing it!`;
  }

  if (currentStreak < 365) {
    return `Incredible ${currentStreak}-day streak! You're unstoppable!`;
  }

  return `LEGENDARY ${currentStreak}-day streak! You're a productivity god!`;
}

/**
 * Calculate streak freeze cost
 */
export function calculateStreakFreezeCost(streakDays: number): number {
  const baseCost = STREAK_FREEZE_CONFIG.BASE_COST;
  const additionalCost = streakDays * STREAK_FREEZE_CONFIG.COST_PER_STREAK_DAY;

  return baseCost + additionalCost;
}

/**
 * Check if user can afford streak freeze
 */
export function canAffordStreakFreeze(
  totalXP: number,
  streakDays: number,
  freezesAvailable: number
): boolean {
  if (freezesAvailable <= 0) {
    return false;
  }

  const cost = calculateStreakFreezeCost(streakDays);
  return totalXP >= cost;
}

/**
 * Use streak freeze
 */
export function useStreakFreeze(
  totalXP: number,
  streakDays: number,
  freezesAvailable: number
): { success: boolean; newXP: number; newFreezes: number; cost: number } {
  if (freezesAvailable <= 0) {
    return { success: false, newXP: totalXP, newFreezes: freezesAvailable, cost: 0 };
  }

  const cost = calculateStreakFreezeCost(streakDays);

  if (totalXP < cost) {
    return { success: false, newXP: totalXP, newFreezes: freezesAvailable, cost };
  }

  return {
    success: true,
    newXP: totalXP - cost,
    newFreezes: freezesAvailable - 1,
    cost,
  };
}

/**
 * Check if streak freeze should be offered
 */
export function shouldOfferStreakFreeze(
  currentStreak: number,
  hoursUntilBreak: number,
  minimumStreak: number = 3,
  warningThreshold: number = 4
): boolean {
  // Only offer if streak is meaningful
  if (currentStreak < minimumStreak) {
    return false;
  }

  // Only offer within warning window
  if (hoursUntilBreak > warningThreshold) {
    return false;
  }

  return true;
}

/**
 * Get streak milestone messages
 */
export function getStreakMilestone(streakDays: number): string | null {
  const milestones: Record<number, string> = {
    3: "First milestone reached! 🔥",
    7: "One week! You're on fire! ⚡",
    14: "Two weeks! Consistency is key! 🌟",
    30: "One month! You're unstoppable! 🏆",
    60: "Two months! Incredible dedication! 🎯",
    90: "Three months! You're legendary! 👑",
    180: "Six months! Half a year of productivity! 💪",
    365: "One year! You're a true master! 🌟",
  };

  return milestones[streakDays] || null;
}

/**
 * Check if streak day is a milestone
 */
export function isStreakMilestone(streakDays: number): boolean {
  const milestoneDays = [3, 7, 14, 30, 60, 90, 180, 365];
  return milestoneDays.includes(streakDays);
}

/**
 * Calculate active days in a period
 */
export function calculateActiveDays(dailyScores: DailyScore[], startDate: Date, endDate: Date): number {
  return dailyScores.filter(score => {
    const scoreDate = new Date(score.date);
    return scoreDate >= startDate && scoreDate <= endDate && score.score > 0;
  }).length;
}

/**
 * Get week start date based on configuration
 */
export function getWeekStartDate(date: Date = new Date()): Date {
  const weekStart = EDGE_CASE_CONFIG.WEEK_START_DAY; // 0 = Sunday

  const dayOfWeek = date.getDay();
  const diff = (dayOfWeek - weekStart + 7) % 7;

  const weekStartDay = new Date(date);
  weekStartDay.setDate(date.getDate() - diff);
  weekStartDay.setHours(0, 0, 0, 0);

  return weekStartDay;
}

/**
 * Get week end date based on configuration
 */
export function getWeekEndDate(date: Date = new Date()): Date {
  const weekStart = getWeekStartDate(date);
  const weekEndDay = new Date(weekStart);
  weekEndDay.setDate(weekStart.getDate() + 6);
  weekEndDay.setHours(23, 59, 59, 999);

  return weekEndDay;
}

/**
 * Get active days in current week
 */
export function getActiveDaysInCurrentWeek(dailyScores: DailyScore[]): number {
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();

  return calculateActiveDays(dailyScores, weekStart, weekEnd);
}

/**
 * Check if streak should be calculated based on timezone
 */
export function shouldUpdateStreak(
  lastStreakUpdate: Date,
  userTimezone: string = EDGE_CASE_CONFIG.DEFAULT_TIMEZONE
): boolean {
  const now = new Date();
  const lastUpdateInTimezone = new Date(lastStreakUpdate.toLocaleString('en-US', { timeZone: userTimezone }));

  // Update if it's been more than 1 hour since last update
  const diffHours = (now.getTime() - lastUpdateInTimezone.getTime()) / (1000 * 60 * 60);

  return diffHours >= 1;
}

/**
 * Format streak for display
 */
export function formatStreak(streakDays: number): string {
  if (streakDays === 0) {
    return 'No streak';
  }

  if (streakDays === 1) {
    return '1 day';
  }

  if (streakDays < 7) {
    return `${streakDays} days`;
  }

  if (streakDays < 30) {
    const weeks = Math.floor(streakDays / 7);
    const remainingDays = streakDays % 7;
    return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks} weeks`;
  }

  if (streakDays < 365) {
    const months = Math.floor(streakDays / 30);
    const remainingDays = streakDays % 30;
    return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months} months`;
  }

  const years = Math.floor(streakDays / 365);
  const remainingDays = streakDays % 365;
  return remainingDays > 0 ? `${years}y ${remainingDays}d` : `${years} years`;
}

/**
 * Get streak progress percentage towards next milestone
 */
export function getStreakProgressToNextMilestone(currentStreak: number): number {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];

  // Find current and next milestone
  let currentMilestone = 0;
  let nextMilestone = milestones[0];

  for (let i = 0; i < milestones.length; i++) {
    if (currentStreak >= milestones[i]) {
      currentMilestone = milestones[i];
      nextMilestone = milestones[i + 1] || milestones[i];
    } else {
      nextMilestone = milestones[i];
      break;
    }
  }

  if (currentStreak >= 365) {
    return 100; // Max milestone reached
  }

  const progress = ((currentStreak - currentMilestone) / (nextMilestone - currentMilestone)) * 100;

  return Math.round(progress);
}

/**
 * Get streak intensity level (for UI styling)
 */
export function getStreakIntensityLevel(streakDays: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (streakDays < 7) {
    return 'low';
  } else if (streakDays < 30) {
    return 'medium';
  } else if (streakDays < 90) {
    return 'high';
  } else {
    return 'extreme';
  }
}

/**
 * Get streak color based on intensity
 */
export function getStreakColor(streakDays: number): string {
  const intensity = getStreakIntensityLevel(streakDays);

  const colors = {
    low: '#f59e0b', // Amber
    medium: '#f97316', // Orange
    high: '#ef4444', // Red
    extreme: '#dc2626', // Dark red
  };

  return colors[intensity];
}

/**
 * Validate streak days
 */
export function validateStreakDays(streakDays: number): number {
  const { STREAK } = require('../constants');

  return Math.max(
    STREAK.MIN_STREAK,
    Math.min(STREAK.MAX_STREAK, streakDays)
  );
}
