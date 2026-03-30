// ==========================================
// LEAGUE HOOK
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import { getLeaderboard, getUserWeeklyStats } from '@/actions/gamification'
import { LEAGUE_CONFIG } from '@/lib/gamification/constants'
import {
  calculateLeaguePressure,
  determineLeagueFromWeeklyXP,
  calculateLeagueMovement,
  getProjectedLeague,
} from '@/lib/gamification/leagues/league-system'
import type { LeagueId, League, LeaguePressure, WeeklyScore } from '@/types/gamification'

/**
 * Hook for managing league-related operations
 */
export function useLeague() {
  const [currentLeague, setCurrentLeague] = useState<LeagueId>('bronze')
  const [leagueInfo, setLeagueInfo] = useState<League | null>(null)
  const [leagueRank, setLeagueRank] = useState<number>(0)
  const [leaguePressure, setLeaguePressure] = useState<LeaguePressure | null>(null)
  const [weeklyXP, setWeeklyXP] = useState<number>(0)
  const [activeDays, setActiveDays] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch league data
   */
  const fetchLeagueData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [leaderboardData, weeklyStats] = await Promise.all([
        getLeaderboard('league', 100),
        getUserWeeklyStats(),
      ])

      if (!leaderboardData) {
        throw new Error('Failed to fetch leaderboard data')
      }

      // Get current user's league info
      const currentUserEntry = leaderboardData.entries.find(e => e.is_current_user)

      if (currentUserEntry) {
        setCurrentLeague(currentUserEntry.league_id)
        setLeagueInfo(LEAGUE_CONFIG[currentUserEntry.league_id])
        setLeagueRank(currentUserEntry.rank)
      }

      // Get weekly XP and active days
      if (weeklyStats?.weeklyScore) {
        setWeeklyXP(weeklyStats.weeklyScore.effective_xp)
        setActiveDays(weeklyStats.activeDays)
      }

      // Calculate league pressure
      if (currentUserEntry && leaderboardData.entries.length > 0) {
        const pressure = calculateLeaguePressure(
          currentUserEntry.league_id,
          currentUserEntry.rank,
          currentUserEntry.effective_xp,
          leaderboardData.entries.map(e => ({
            user_id: e.user_id,
            league_id: e.league_id,
            effective_xp: e.effective_xp,
          })) as WeeklyScore[]
        )
        setLeaguePressure(pressure)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch league data'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get adjacent leagues
   */
  const getAdjacentLeagues = useCallback(() => {
    if (!currentLeague) {
      return { previousLeague: null, nextLeague: null }
    }

    const leagues = Object.values(LEAGUE_CONFIG)
    const currentIndex = leagues.findIndex(l => l.id === currentLeague)

    return {
      previousLeague: currentIndex > 0 ? leagues[currentIndex - 1] : null,
      nextLeague: currentIndex < leagues.length - 1 ? leagues[currentIndex + 1] : null,
    }
  }, [currentLeague])

  /**
   * Check if user can be promoted
   */
  const canPromote = useCallback(() => {
    if (!leaguePressure || !leagueInfo) return false

    const { previousLeague } = getAdjacentLeagues()
    return leaguePressure.in_promotion_zone && previousLeague !== null
  }, [leaguePressure, leagueInfo, getAdjacentLeagues])

  /**
   * Check if user is in danger of relegation
   */
  const isInRelegationDanger = useCallback(() => {
    if (!leaguePressure) return false
    return leaguePressure.in_relegation_zone
  }, [leaguePressure])

  /**
   * Get XP needed for promotion
   */
  const getXPForPromotion = useCallback(() => {
    if (!leaguePressure) return 0
    return leaguePressure.to_promotion
  }, [leaguePressure])

  /**
   * Get XP before relegation
   */
  const getXPBeforeRelegation = useCallback(() => {
    if (!leaguePressure) return 0
    return leaguePressure.to_relegation
  }, [leaguePressure])

  /**
   * Get league status message
   */
  const getLeagueStatusMessage = useCallback(() => {
    if (!leaguePressure) return 'Loading league status...'

    if (leaguePressure.in_promotion_zone) {
      return "🎉 You're in the promotion zone! Keep it up!"
    }

    if (leaguePressure.in_relegation_zone) {
      return "⚠️ Warning: You're in the relegation zone!"
    }

    if (leaguePressure.to_promotion <= 20) {
      return `🔥 So close! Earn ${leaguePressure.to_promotion} more XP to promote!`
    }

    if (leaguePressure.to_relegation <= 20) {
      return `😬 Careful! You're ${leaguePressure.to_relegation} XP from relegation.`
    }

    if (leaguePressure.safe_zone) {
      return "✅ You're in a safe zone. Good work!"
    }

    return "Keep pushing for that promotion!"
  }, [leaguePressure])

  /**
   * Get league color for styling
   */
  const getLeagueColor = useCallback(() => {
    return leagueInfo?.color || LEAGUE_CONFIG.bronze.color
  }, [leagueInfo])

  /**
   * Get league icon for display
   */
  const getLeagueIcon = useCallback(() => {
    return leagueInfo?.icon || LEAGUE_CONFIG.bronze.icon
  }, [leagueInfo])

  /**
   * Check if user will promote at end of week
   */
  const willPromoteAtWeekEnd = useCallback(() => {
    const projectedLeague = getProjectedLeague(weeklyXP)
    if (!currentLeague || !projectedLeague) return false

    const movement = calculateLeagueMovement(currentLeague, projectedLeague)
    return movement === 'promoted'
  }, [currentLeague, weeklyXP])

  /**
   * Check if user will relegate at end of week
   */
  const willRelegateAtWeekEnd = useCallback(() => {
    const projectedLeague = getProjectedLeague(weeklyXP)
    if (!currentLeague || !projectedLeague) return false

    const movement = calculateLeagueMovement(currentLeague, projectedLeague)
    return movement === 'relegated'
  }, [currentLeague, weeklyXP])

  /**
   * Get league movement prediction
   */
  const getLeagueMovementPrediction = useCallback(() => {
    const projectedLeague = getProjectedLeague(weeklyXP)
    if (!currentLeague || !projectedLeague) {
      return { type: 'stayed' as const, label: 'Stayed' }
    }

    const movement = calculateLeagueMovement(currentLeague, projectedLeague)

    const labels = {
      promoted: '📈 Promoted',
      stayed: '➡️ Stayed',
      relegated: '📉 Relegated',
    }

    return {
      type: movement,
      label: labels[movement],
    }
  }, [currentLeague, weeklyXP])

  /**
   * Get league progress percentage
   */
  const getLeagueProgress = useCallback(() => {
    if (!leagueInfo || leagueInfo.max_xp_weekly === null) {
      return 100 // Diamond league
    }

    const range = leagueInfo.max_xp_weekly - leagueInfo.min_xp_weekly
    const progress = ((weeklyXP - leagueInfo.min_xp_weekly) / range) * 100

    return Math.max(0, Math.min(100, progress))
  }, [leagueInfo, weeklyXP])

  /**
   * Get XP range for current league
   */
  const getLeagueXPRange = useCallback(() => {
    if (!leagueInfo) {
      return { min: 0, max: 100 }
    }

    return {
      min: leagueInfo.min_xp_weekly,
      max: leagueInfo.max_xp_weekly || '∞',
    }
  }, [leagueInfo])

  /**
   * Refresh league data
   */
  const refresh = useCallback(() => {
    return fetchLeagueData()
  }, [fetchLeagueData])

  // Auto-refresh on mount
  useEffect(() => {
    fetchLeagueData()

    const intervalId = setInterval(() => {
      fetchLeagueData()
    }, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [fetchLeagueData])

  return {
    // State
    currentLeague,
    leagueInfo,
    leagueRank,
    leaguePressure,
    weeklyXP,
    activeDays,
    isLoading,
    error,

    // Computed
    adjacentLeagues: getAdjacentLeagues(),
    canPromote: canPromote(),
    isInRelegationDanger: isInRelegationDanger(),
    xpForPromotion: getXPForPromotion(),
    xpBeforeRelegation: getXPBeforeRelegation(),
    leagueStatusMessage: getLeagueStatusMessage(),
    leagueColor: getLeagueColor(),
    leagueIcon: getLeagueIcon(),
    projectedLeague: getProjectedLeague(weeklyXP),
    willPromoteAtWeekEnd: willPromoteAtWeekEnd(),
    willRelegateAtWeekEnd: willRelegateAtWeekEnd(),
    leagueMovementPrediction: getLeagueMovementPrediction(),
    leagueProgress: getLeagueProgress(),
    leagueXPRange: getLeagueXPRange(),

    // Actions
    refresh,
    fetchLeagueData,
  }
}

/**
 * Hook for league notifications and alerts
 */
export function useLeagueNotifications() {
  const [shouldShowPromotionAlert, setShouldShowPromotionAlert] = useState<boolean>(false)
  const [shouldShowRelegationAlert, setShouldShowRelegationAlert] = useState<boolean>(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  /**
   * Check if promotion alert should be shown
   */
  const checkPromotionAlert = useCallback((
    leaguePressure: LeaguePressure | null,
    daysRemaining: number = 3
  ) => {
    if (!leaguePressure) return false

    const alertKey = `promotion-${daysRemaining}`

    if (dismissedAlerts.has(alertKey)) {
      return false
    }

    // Show alert if close to promotion and week is ending
    return (
      leaguePressure.to_promotion <= 50 &&
      daysRemaining <= 3 &&
      !leaguePressure.in_promotion_zone
    )
  }, [dismissedAlerts])

  /**
   * Check if relegation alert should be shown
   */
  const checkRelegationAlert = useCallback((
    leaguePressure: LeaguePressure | null,
    daysRemaining: number = 3
  ) => {
    if (!leaguePressure) return false

    const alertKey = `relegation-${daysRemaining}`

    if (dismissedAlerts.has(alertKey)) {
      return false
    }

    // Show alert if in danger of relegation and week is ending
    return (
      leaguePressure.in_relegation_zone ||
      (leaguePressure.to_relegation <= 20 && daysRemaining <= 3)
    )
  }, [dismissedAlerts])

  /**
   * Dismiss an alert
   */
  const dismissAlert = useCallback((alertKey: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertKey))
  }, [])

  /**
   * Reset dismissed alerts
   */
  const resetDismissedAlerts = useCallback(() => {
    setDismissedAlerts(new Set())
  }, [])

  return {
    shouldShowPromotionAlert,
    shouldShowRelegationAlert,
    checkPromotionAlert,
    checkRelegationAlert,
    dismissAlert,
    resetDismissedAlerts,
    dismissedAlerts,
  }
}

/**
 * Hook for league history
 */
export function useLeagueHistory() {
  const [history, setHistory] = useState<Array<{
    weekNumber: number
    year: number
    league: LeagueId
    rank: number
    result: 'promoted' | 'stayed' | 'relegated'
  }>>([])

  /**
   * Load league history
   */
  const loadHistory = useCallback(async () => {
    // This would fetch from weekly_reset_history table
    // For now, return empty array
    setHistory([])
  }, [])

  /**
   * Get league movement trend
   */
  const getMovementTrend = useCallback(() => {
    if (history.length < 2) {
      return { trend: 'stable' as const, promotions: 0, relegations: 0 }
    }

    const promotions = history.filter(h => h.result === 'promoted').length
    const relegations = history.filter(h => h.result === 'relegated').length

    if (promotions > relegations) {
      return { trend: 'improving' as const, promotions, relegations }
    } else if (relegations > promotions) {
      return { trend: 'declining' as const, promotions, relegations }
    } else {
      return { trend: 'stable' as const, promotions, relegations }
    }
  }, [history])

  /**
   * Get best league reached
   */
  const getBestLeague = useCallback(() => {
    if (history.length === 0) {
      return 'bronze' as const
    }

    const leagueOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const

    return history.reduce((best, h) => {
      const bestIndex = leagueOrder.indexOf(best)
      const currentLeagueIndex = leagueOrder.indexOf(h.league)

      return currentLeagueIndex > bestIndex ? h.league : best
    }, 'bronze' as const)
  }, [history])

  return {
    history,
    loadHistory,
    getMovementTrend,
    getBestLeague,
  }
}
