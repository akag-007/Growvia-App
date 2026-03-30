// ==========================================
// LEAGUE SYSTEM LOGIC
// ==========================================

import { LEAGUE_CONFIG, CONSISTENCY_CONFIG } from '../constants';
import type {
  League,
  LeagueId,
  WeeklyScore,
  LeaguePressure,
  LeaderboardEntry,
  LeaderboardType,
} from '@/types/gamification';

/**
 * Get league configuration by ID
 */
export function getLeagueConfig(leagueId: LeagueId): League {
  return LEAGUE_CONFIG[leagueId];
}

/**
 * Get all league configurations
 */
export function getAllLeagues(): League[] {
  return Object.values(LEAGUE_CONFIG);
}

/**
 * Determine which league a user should be in based on weekly XP
 */
export function determineLeagueFromWeeklyXP(weeklyXP: number): LeagueId {
  const leagues = getAllLeagues().sort((a, b) => b.min_xp_weekly - a.min_xp_weekly);

  for (const league of leagues) {
    if (weeklyXP >= league.min_xp_weekly) {
      if (league.max_xp_weekly === null || weeklyXP <= league.max_xp_weekly) {
        return league.id;
      }
    }
  }

  return 'bronze'; // Default to bronze if no match
}

/**
 * Calculate league pressure (how close user is to promotion/relegation)
 */
export function calculateLeaguePressure(
  currentLeagueId: LeagueId,
  currentRank: number,
  effectiveXP: number,
  leagueScores: WeeklyScore[]
): LeaguePressure {
  const currentLeague = getLeagueConfig(currentLeagueId);
  const usersInLeague = leagueScores.filter(score => score.league_id === currentLeagueId);
  usersInLeague.sort((a, b) => b.effective_xp - a.effective_xp);

  const promotionCount = currentLeague.promotion_count;
  const relegationCount = currentLeague.relegation_count;
  const totalUsers = usersInLeague.length;

  // Determine promotion zone (top X users)
  const promotionZone = totalUsers > 0 ? usersInLeague.slice(0, promotionCount) : [];
  const promotionZoneXP = promotionZone.length > 0 ? promotionZone[promotionZone.length - 1].effective_xp : 0;

  // Determine relegation zone (bottom X users)
  const relegationZone = totalUsers > 0 ? usersInLeague.slice(-relegationCount) : [];
  const relegationZoneXP = relegationZone.length > 0 ? relegationZone[0].effective_xp : Infinity;

  // Calculate XP needed/danger zones
  const toPromotion = Math.max(0, promotionZoneXP - effectiveXP + 1);
  const toRelegation = Math.max(0, effectiveXP - relegationZoneXP + 1);

  // Determine zones
  const inPromotionZone = currentRank <= promotionCount;
  const inRelegationZone = currentRank > totalUsers - relegationCount;
  const safeZone = !inPromotionZone && !inRelegationZone;

  return {
    to_promotion: toPromotion,
    to_relegation: toRelegation,
    in_promotion_zone: inPromotionZone,
    in_relegation_zone: inRelegationZone,
    safe_zone: safeZone,
  };
}

/**
 * Calculate league movement for weekly reset
 */
export function calculateLeagueMovement(
  currentLeagueId: LeagueId,
  newLeagueId: LeagueId
): 'promoted' | 'stayed' | 'relegated' {
  const currentLeagueIndex = getAllLeagues().findIndex(l => l.id === currentLeagueId);
  const newLeagueIndex = getAllLeagues().findIndex(l => l.id === newLeagueId);

  if (newLeagueIndex < currentLeagueIndex) {
    return 'promoted';
  } else if (newLeagueIndex > currentLeagueIndex) {
    return 'relegated';
  } else {
    return 'stayed';
  }
}

/**
 * Process weekly league reset and calculate promotions/relegations
 */
export function processWeeklyLeagueReset(weeklyScores: WeeklyScore[]): WeeklyScore[] {
  // Group scores by league
  const leagueScores = new Map<LeagueId, WeeklyScore[]>();
  weeklyScores.forEach(score => {
    if (!leagueScores.has(score.league_id)) {
      leagueScores.set(score.league_id, []);
    }
    leagueScores.get(score.league_id)!.push(score);
  });

  const processedScores: WeeklyScore[] = [];

  // Process each league
  leagueScores.forEach((scores, leagueId) => {
    const league = getLeagueConfig(leagueId);

    // Sort by effective XP (descending)
    scores.sort((a, b) => b.effective_xp - a.effective_xp);

    // Assign ranks
    scores.forEach((score, index) => {
      const rank = index + 1;
      const leagueIndex = getAllLeagues().findIndex(l => l.id === leagueId);

      score.rank = rank;
      score.promoted = rank <= league.promotion_count;
      score.relegated = rank > scores.length - league.relegation_count;
    });

    // Handle promotions
    const promotedScores = scores.filter(score => score.promoted);
    promotedScores.forEach(score => {
      const newLeagueIndex = leagueIndex - 1;
      if (newLeagueIndex >= 0) {
        score.new_league = getAllLeagues()[newLeagueIndex].id;
      }
    });

    // Handle relegations
    const relegatedScores = scores.filter(score => score.relegated);
    relegatedScores.forEach(score => {
      const newLeagueIndex = leagueIndex + 1;
      if (newLeagueIndex < getAllLeagues().length) {
        score.new_league = getAllLeagues()[newLeagueIndex].id;
      }
    });

    processedScores.push(...scores);
  });

  return processedScores;
}

/**
 * Calculate consistency multiplier for weekly scoring
 */
export function calculateConsistencyMultiplier(
  activeDays: number,
  totalDays: number = CONSISTENCY_CONFIG.DAYS_IN_WEEK
): number {
  const multiplier = activeDays / totalDays;

  // Clamp between min and max
  const clampedMultiplier = Math.max(
    CONSISTENCY_CONFIG.MIN_MULTIPLIER,
    Math.min(CONSISTENCY_CONFIG.MAX_MULTIPLIER, multiplier)
  );

  return Math.round(clampedMultiplier * 10000) / 10000; // Round to 4 decimal places
}

/**
 * Calculate effective weekly XP
 */
export function calculateEffectiveWeeklyXP(
  baseXP: number,
  activeDays: number,
  totalDays: number = CONSISTENCY_CONFIG.DAYS_IN_WEEK
): number {
  const consistencyMultiplier = calculateConsistencyMultiplier(activeDays, totalDays);
  const effectiveXP = Math.round(baseXP * consistencyMultiplier);

  return effectiveXP;
}

/**
 * Get leaderboard for a specific league
 */
export function getLeagueLeaderboard(
  leagueId: LeagueId,
  weeklyScores: WeeklyScore[],
  includeUserRank?: number
): LeaderboardEntry[] {
  const leagueScores = weeklyScores
    .filter(score => score.league_id === leagueId)
    .sort((a, b) => b.effective_xp - a.effective_xp);

  return leagueScores.map((score, index) => ({
    rank: index + 1,
    user_id: score.user_id,
    effective_xp: score.effective_xp,
    base_xp: score.base_xp,
    consistency_multiplier: score.consistency_multiplier,
    league_id: score.league_id,
    current_level: 0, // Will be filled from user profile
    current_streak: 0, // Will be filled from user profile
    movement: score.previous_rank
      ? (index + 1 < score.previous_rank ? 'up' : index + 1 > score.previous_rank ? 'down' : 'same')
      : 'same',
    movement_amount: score.previous_rank ? Math.abs((index + 1) - score.previous_rank) : 0,
    is_current_user: includeUserRank === index + 1,
  }));
}

/**
 * Get global leaderboard (top users across all leagues)
 */
export function getGlobalLeaderboard(
  weeklyScores: WeeklyScore[],
  limit: number = 20
): LeaderboardEntry[] {
  const sortedScores = [...weeklyScores].sort((a, b) => b.effective_xp - a.effective_xp);

  return sortedScores.slice(0, limit).map((score, index) => ({
    rank: index + 1,
    user_id: score.user_id,
    effective_xp: score.effective_xp,
    base_xp: score.base_xp,
    consistency_multiplier: score.consistency_multiplier,
    league_id: score.league_id,
    current_level: 0, // Will be filled from user profile
    current_streak: 0, // Will be filled from user profile
    movement: score.previous_rank
      ? (index + 1 < score.previous_rank ? 'up' : index + 1 > score.previous_rank ? 'down' : 'same')
      : 'same',
    movement_amount: score.previous_rank ? Math.abs((index + 1) - score.previous_rank) : 0,
    is_current_user: false, // Will be updated dynamically
  }));
}

/**
 * Get nearby competitors for a user
 */
export function getNearbyCompetitors(
  userId: string,
  leagueScores: WeeklyScore[],
  count: number = 3
): WeeklyScore[] {
  const userIndex = leagueScores.findIndex(score => score.user_id === userId);

  if (userIndex === -1) {
    return [];
  }

  const startIndex = Math.max(0, userIndex - count);
  const endIndex = Math.min(leagueScores.length - 1, userIndex + count);

  return leagueScores.slice(startIndex, endIndex + 1);
}

/**
 * Calculate league statistics
 */
export function calculateLeagueStatistics(leagueScores: WeeklyScore[]) {
  if (leagueScores.length === 0) {
    return {
      total_users: 0,
      average_xp: 0,
      top_xp: 0,
      bottom_xp: 0,
      promotions: 0,
      relegations: 0,
    };
  }

  const sortedScores = [...leagueScores].sort((a, b) => b.effective_xp - a.effective_xp);

  return {
    total_users: leagueScores.length,
    average_xp: Math.round(
      leagueScores.reduce((sum, score) => sum + score.effective_xp, 0) / leagueScores.length
    ),
    top_xp: sortedScores[0].effective_xp,
    bottom_xp: sortedScores[sortedScores.length - 1].effective_xp,
    promotions: leagueScores.filter(score => score.promoted).length,
    relegations: leagueScores.filter(score => score.relegated).length,
  };
}

/**
 * Get next and previous league
 */
export function getAdjacentLeagues(currentLeagueId: LeagueId): {
  previousLeague: League | null;
  nextLeague: League | null;
} {
  const leagues = getAllLeagues();
  const currentIndex = leagues.findIndex(l => l.id === currentLeagueId);

  return {
    previousLeague: currentIndex > 0 ? leagues[currentIndex - 1] : null,
    nextLeague: currentIndex < leagues.length - 1 ? leagues[currentIndex + 1] : null,
  };
}

/**
 * Check if user is in danger of relegation
 */
export function isInDangerOfRelegation(leaguePressure: LeaguePressure): boolean {
  return (
    leaguePressure.in_relegation_zone ||
    leaguePressure.to_relegation <= 20 // Within 20 XP of relegation
  );
}

/**
 * Check if user is close to promotion
 */
export function isCloseToPromotion(leaguePressure: LeaguePressure, threshold: number = 50): boolean {
  return (
    leaguePressure.in_promotion_zone ||
    leaguePressure.to_promotion <= threshold
  );
}

/**
 * Get league promotion/relegation message
 */
export function getLeagueStatusMessage(leaguePressure: LeaguePressure): string {
  if (leaguePressure.in_promotion_zone) {
    return "You're in the promotion zone! Keep it up!";
  }

  if (leaguePressure.in_relegation_zone) {
    return "Warning: You're in the relegation zone!";
  }

  if (leaguePressure.to_promotion <= 20) {
    return `So close! Earn ${leaguePressure.to_promotion} more XP to promote!`;
  }

  if (leaguePressure.to_relegation <= 20) {
    return `Careful! You're ${leaguePressure.to_relegation} XP from relegation.`;
  }

  if (leaguePressure.safe_zone) {
    return "You're in a safe zone. Good work!";
  }

  return "Keep pushing for that promotion!";
}

/**
 * Calculate league rank movement indicator
 */
export function getRankMovementIndicator(
  currentRank: number,
  previousRank: number | null
): { type: 'up' | 'down' | 'same' | 'new'; amount: number } {
  if (previousRank === null) {
    return { type: 'new', amount: 0 };
  }

  if (currentRank < previousRank) {
    return { type: 'up', amount: previousRank - currentRank };
  } else if (currentRank > previousRank) {
    return { type: 'down', amount: currentRank - previousRank };
  } else {
    return { type: 'same', amount: 0 };
  }
}

/**
 * Format league rank for display
 */
export function formatLeagueRank(rank: number, total: number): string {
  const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th'];
  const suffix = suffixes[(rank - 1) % 10];
  return `${rank}${suffix} of ${total}`;
}

/**
 * Get league color for styling
 */
export function getLeagueColor(leagueId: LeagueId): string {
  return getLeagueConfig(leagueId).color;
}

/**
 * Get league icon for display
 */
export function getLeagueIcon(leagueId: LeagueId): string {
  return getLeagueConfig(leagueId).icon || '🏆';
}

/**
 * Get projected league based on current weekly XP
 * This is used to predict what league the user will be in at week end
 */
export function getProjectedLeague(weeklyXP: number): LeagueId {
  return determineLeagueFromWeeklyXP(weeklyXP);
}
