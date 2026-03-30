// ==========================================
// BADGE SYSTEM LOGIC
// ==========================================

import { BADGE_RARITY, BADGE_CATEGORY_COLORS } from '../constants';
import type {
  Badge,
  BadgeCategory,
  BadgeRequirementType,
  BadgeRarity,
  BadgeProgress,
  UserBadge,
} from '@/types/gamification';

/**
 * Check if user meets badge requirement
 */
export function checkBadgeRequirement(
  badge: Badge,
  userStats: {
    current_streak: number;
    max_streak: number;
    total_tasks_completed: number;
    total_xp: number;
    total_hours_completed: number;
  }
): boolean {
  const { requirement_type, requirement_value } = badge;

  switch (requirement_type) {
    case 'streak_days':
      return userStats.max_streak >= requirement_value;

    case 'tasks_completed':
      return userStats.total_tasks_completed >= requirement_value;

    case 'xp_total':
      return userStats.total_xp >= requirement_value;

    case 'hours_total':
      return userStats.total_hours_completed >= requirement_value;

    case 'custom':
      // Custom badges require manual implementation
      return false;

    default:
      return false;
  }
}

/**
 * Calculate badge progress percentage
 */
export function calculateBadgeProgress(
  badge: Badge,
  userStats: {
    current_streak: number;
    max_streak: number;
    total_tasks_completed: number;
    total_xp: number;
    total_hours_completed: number;
  }
): number {
  const { requirement_type, requirement_value } = badge;

  let currentValue = 0;

  switch (requirement_type) {
    case 'streak_days':
      currentValue = userStats.max_streak;
      break;
    case 'tasks_completed':
      currentValue = userStats.total_tasks_completed;
      break;
    case 'xp_total':
      currentValue = userStats.total_xp;
      break;
    case 'hours_total':
      currentValue = userStats.total_hours_completed;
      break;
    case 'custom':
      currentValue = 0;
      break;
  }

  const progress = Math.min(100, Math.round((currentValue / requirement_value) * 100));

  return progress;
}

/**
 * Get badges that can be unlocked by user
 */
export function getUnlockableBadges(
  badges: Badge[],
  userBadges: UserBadge[],
  userStats: {
    current_streak: number;
    max_streak: number;
    total_tasks_completed: number;
    total_xp: number;
    total_hours_completed: number;
  }
): Badge[] {
  const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  return badges.filter(badge => {
    // Skip already unlocked badges
    if (unlockedBadgeIds.has(badge.id)) {
      return false;
    }

    // Check if user meets requirement
    return checkBadgeRequirement(badge, userStats);
  });
}

/**
 * Get badge progress for all badges
 */
export function getAllBadgeProgress(
  badges: Badge[],
  userBadges: UserBadge[],
  userStats: {
    current_streak: number;
    max_streak: number;
    total_tasks_completed: number;
    total_xp: number;
    total_hours_completed: number;
  }
): BadgeProgress[] {
  const unlockedBadgeMap = new Map(
    userBadges.map(ub => [ub.badge_id, ub])
  );

  return badges.map(badge => {
    const userBadge = unlockedBadgeMap.get(badge.id);
    const isUnlocked = !!userBadge;

    // Get current value based on requirement type
    let currentValue = 0;
    const { requirement_type } = badge;

    switch (requirement_type) {
      case 'streak_days':
        currentValue = userStats.max_streak;
        break;
      case 'tasks_completed':
        currentValue = userStats.total_tasks_completed;
        break;
      case 'xp_total':
        currentValue = userStats.total_xp;
        break;
      case 'hours_total':
        currentValue = userStats.total_hours_completed;
        break;
      case 'custom':
        currentValue = 0;
        break;
    }

    const progressPercentage = Math.min(100, Math.round((currentValue / badge.requirement_value) * 100));

    // Find next tier badge
    const nextTierBadge = badges.find(b =>
      b.category === badge.category &&
      b.requirement_type === badge.requirement_type &&
      b.requirement_value > badge.requirement_value &&
      !unlockedBadgeMap.has(b.id)
    );

    return {
      badge,
      current_value: currentValue,
      target_value: badge.requirement_value,
      progress_percentage: progressPercentage,
      is_unlocked: isUnlocked,
      next_tier_badge: nextTierBadge,
    };
  });
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(badges: Badge[], category: BadgeCategory): Badge[] {
  return badges.filter(badge => badge.category === category);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(badges: Badge[], rarity: BadgeRarity): Badge[] {
  return badges.filter(badge => badge.rarity === rarity);
}

/**
 * Get progressive badge chain
 */
export function getBadgeChain(badge: Badge, allBadges: Badge[]): Badge[] {
  const chain: Badge[] = [badge];

  // Find parent badges
  let currentBadge = badge;
  while (currentBadge.parent_badge_id) {
    const parent = allBadges.find(b => b.id === currentBadge.parent_badge_id);
    if (parent) {
      chain.unshift(parent);
      currentBadge = parent;
    } else {
      break;
    }
  }

  // Find child badges
  currentBadge = badge;
  let childFound = true;
  while (childFound) {
    const child = allBadges.find(b => b.parent_badge_id === currentBadge.id);
    if (child) {
      chain.push(child);
      currentBadge = child;
    } else {
      childFound = false;
    }
  }

  return chain;
}

/**
 * Get badge rarity color
 */
export function getBadgeRarityColor(rarity: BadgeRarity): string {
  return BADGE_RARITY[rarity].color;
}

/**
 * Get badge rarity glow color
 */
export function getBadgeRarityGlow(rarity: BadgeRarity): string {
  return BADGE_RARITY[rarity].glow;
}

/**
 * Get badge category color
 */
export function getBadgeCategoryColor(category: BadgeCategory): string {
  return BADGE_CATEGORY_COLORS[category];
}

/**
 * Sort badges by rarity (legendary first, then epic, rare, common)
 */
export function sortBadgesByRarity(badges: Badge[]): Badge[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };

  return [...badges].sort((a, b) => {
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (rarityDiff !== 0) {
      return rarityDiff;
    }

    // Same rarity, sort by tier
    return a.tier - b.tier;
  });
}

/**
 * Sort badges by progress (most complete first)
 */
export function sortBadgesByProgress(badgeProgresses: BadgeProgress[]): BadgeProgress[] {
  return [...badgeProgresses].sort((a, b) => {
    const progressDiff = b.progress_percentage - a.progress_percentage;
    if (progressDiff !== 0) {
      return progressDiff;
    }

    // Same progress, unlocked first
    const unlockedDiff = Number(a.is_unlocked) - Number(b.is_unlocked);
    if (unlockedDiff !== 0) {
      return -unlockedDiff; // Reversed because we want unlocked first
    }

    // Same status, sort by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity];
  });
}

/**
 * Group badges by category
 */
export function groupBadgesByCategory(badges: Badge[]): Record<BadgeCategory, Badge[]> {
  const grouped: Record<BadgeCategory, Badge[]> = {
    streak: [],
    tasks: [],
    xp: [],
    time: [],
    special: [],
  };

  badges.forEach(badge => {
    grouped[badge.category].push(badge);
  });

  return grouped;
}

/**
 * Group badge progress by category
 */
export function groupBadgeProgressByCategory(badgeProgresses: BadgeProgress[]): Record<BadgeCategory, BadgeProgress[]> {
  const grouped: Record<BadgeCategory, BadgeProgress[]> = {
    streak: [],
    tasks: [],
    xp: [],
    time: [],
    special: [],
  };

  badgeProgresses.forEach(progress => {
    grouped[progress.badge.category].push(progress);
  });

  return grouped;
}

/**
 * Get badge rarity label
 */
export function getBadgeRarityLabel(rarity: BadgeRarity): string {
  const labels = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };

  return labels[rarity];
}

/**
 * Check if badge is legendary
 */
export function isLegendaryBadge(badge: Badge): boolean {
  return badge.rarity === 'legendary';
}

/**
 * Check if badge is epic or higher
 */
export function isEpicOrHigher(badge: Badge): boolean {
  return badge.rarity === 'epic' || badge.rarity === 'legendary';
}

/**
 * Get badge display size based on rarity
 */
export function getBadgeDisplaySize(rarity: BadgeRarity): 'sm' | 'md' | 'lg' | 'xl' {
  const sizes = {
    common: 'sm',
    rare: 'md',
    epic: 'lg',
    legendary: 'xl',
  };

  return sizes[rarity];
}

/**
 * Get badge animation duration based on rarity
 */
export function getBadgeAnimationDuration(rarity: BadgeRarity): number {
  const durations = {
    common: 500,
    rare: 800,
    epic: 1200,
    legendary: 2000,
  };

  return durations[rarity];
}

/**
 * Format badge requirement for display
 */
export function formatBadgeRequirement(badge: Badge): string {
  const { requirement_type, requirement_value } = badge;

  switch (requirement_type) {
    case 'streak_days':
      return `Achieve a ${requirement_value}-day streak`;

    case 'tasks_completed':
      return `Complete ${requirement_value} tasks`;

    case 'xp_total':
      return `Earn ${requirement_value} XP`;

    case 'hours_total':
      return `Complete ${requirement_value} hours of work`;

    case 'custom':
      return badge.description;

    default:
      return badge.description;
  }
}

/**
 * Get badge category label
 */
export function getBadgeCategoryLabel(category: BadgeCategory): string {
  const labels = {
    streak: 'Streak',
    tasks: 'Tasks',
    xp: 'XP',
    time: 'Time',
    special: 'Special',
  };

  return labels[category];
}

/**
 * Get badge category icon
 */
export function getBadgeCategoryIcon(category: BadgeCategory): string {
  const icons = {
    streak: '🔥',
    tasks: '✅',
    xp: '💎',
    time: '⏰',
    special: '⭐',
  };

  return icons[category];
}

/**
 * Check if badge progress has increased
 */
export function hasBadgeProgressIncreased(
  oldProgress: number,
  newProgress: number
): boolean {
  return newProgress > oldProgress;
}

/**
 * Check if user is close to unlocking badge
 */
export function isCloseToUnlockingBadge(
  badgeProgress: BadgeProgress,
  threshold: number = 80
): boolean {
  return badgeProgress.progress_percentage >= threshold && !badgeProgress.is_unlocked;
}

/**
 * Get badges that are close to being unlocked
 */
export function getBadgesCloseToUnlock(
  badgeProgresses: BadgeProgress[],
  threshold: number = 80
): BadgeProgress[] {
  return badgeProgresses.filter(progress =>
    isCloseToUnlockingBadge(progress, threshold)
  );
}

/**
 * Count badges by rarity
 */
export function countBadgesByRarity(userBadges: UserBadge[]): Record<BadgeRarity, number> {
  const counts: Record<BadgeRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  userBadges.forEach(userBadge => {
    counts[userBadge.badge.rarity]++;
  });

  return counts;
}

/**
 * Calculate badge completion percentage
 */
export function calculateBadgeCompletionPercentage(
  unlockedBadges: number,
  totalBadges: number
): number {
  if (totalBadges === 0) {
    return 0;
  }

  return Math.round((unlockedBadges / totalBadges) * 100);
}

/**
 * Get badge completion status
 */
export function getBadgeCompletionStatus(percentage: number): {
  status: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'master';
  label: string;
  color: string;
} {
  if (percentage === 0) {
    return { status: 'none', label: 'Just Started', color: '#9ca3af' };
  }

  if (percentage < 25) {
    return { status: 'beginner', label: 'Beginner', color: '#f59e0b' };
  }

  if (percentage < 50) {
    return { status: 'intermediate', label: 'Intermediate', color: '#3b82f6' };
  }

  if (percentage < 75) {
    return { status: 'advanced', label: 'Advanced', color: '#8b5cf6' };
  }

  return { status: 'master', label: 'Badge Master', color: '#f59e0b' };
}

/**
 * Check if badge is part of a chain
 */
export function isPartOfChain(badge: Badge, allBadges: Badge[]): boolean {
  return badge.parent_badge_id !== null ||
    allBadges.some(b => b.parent_badge_id === badge.id);
}

/**
 * Get chain position of badge
 */
export function getChainPosition(badge: Badge, allBadges: Badge[]): {
  position: number;
  total: number;
} | null {
  const chain = getBadgeChain(badge, allBadges);

  if (chain.length === 1) {
    return null; // Not part of a chain
  }

  const position = chain.findIndex(b => b.id === badge.id) + 1;

  return {
    position,
    total: chain.length,
  };
}

/**
 * Get badge rarity stats
 */
export function getBadgeRarityStats(userBadges: UserBadge[]): {
  total: number;
  byRarity: Record<BadgeRarity, number>;
  mostCommon: BadgeRarity;
} {
  const byRarity = countBadgesByRarity(userBadges);
  const total = userBadges.length;

  let mostCommon: BadgeRarity = 'common';
  let maxCount = 0;

  Object.entries(byRarity).forEach(([rarity, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = rarity as BadgeRarity;
    }
  });

  return {
    total,
    byRarity,
    mostCommon,
  };
}

/**
 * Sort badges by completion date (most recent first)
 */
export function sortBadgesByUnlockDate(userBadges: UserBadge[]): UserBadge[] {
  return [...userBadges].sort((a, b) =>
    new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
  );
}

/**
 * Get recently unlocked badges
 */
export function getRecentlyUnlockedBadges(
  userBadges: UserBadge[],
  days: number = 7
): UserBadge[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return userBadges.filter(ub =>
    new Date(ub.unlocked_at) >= cutoffDate
  );
}

/**
 * Get badge rarity CSS class
 */
export function getBadgeRarityClass(rarity: BadgeRarity): string {
  const classes = {
    common: 'badge-common',
    rare: 'badge-rare',
    epic: 'badge-epic',
    legendary: 'badge-legendary',
  };

  return classes[rarity];
}

/**
 * Validate badge requirement value
 */
export function validateBadgeRequirementValue(value: number): boolean {
  return value > 0 && Number.isInteger(value);
}

/**
 * Get badge tier label
 */
export function getBadgeTierLabel(tier: number): string {
  const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th'];
  const suffix = suffixes[(tier - 1) % 10];

  return `${tier}${suffix} tier`;
}
