// ==========================================
// LEADERBOARD HOOK
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import { getLeaderboard } from '@/actions/gamification'
import type { LeaderboardData, LeaderboardType } from '@/types/gamification'

/**
 * Hook for managing leaderboard data
 */
export function useLeaderboard(type: LeaderboardType = 'global', autoRefresh: boolean = true) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  /**
   * Fetch leaderboard data
   */
  const fetchLeaderboard = useCallback(async (limit: number = 20) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getLeaderboard(type, limit)
      setLeaderboard(data)
      setLastRefresh(new Date())
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [type])

  /**
   * Refresh leaderboard
   */
  const refresh = useCallback(async () => {
    return await fetchLeaderboard()
  }, [fetchLeaderboard])

  /**
   * Get current user's entry
   */
  const getCurrentUserEntry = useCallback(() => {
    if (!leaderboard) return null
    return leaderboard.entries.find(entry => entry.is_current_user) || null
  }, [leaderboard])

  /**
   * Get top N entries
   */
  const getTopEntries = useCallback((count: number) => {
    if (!leaderboard) return []
    return leaderboard.entries.slice(0, count)
  }, [leaderboard])

  /**
   * Get entries around current user
   */
  const getEntriesAroundUser = useCallback((before: number = 2, after: number = 2) => {
    if (!leaderboard) return []
    const userIndex = leaderboard.entries.findIndex(entry => entry.is_current_user)

    if (userIndex === -1) return []

    const startIndex = Math.max(0, userIndex - before)
    const endIndex = Math.min(leaderboard.entries.length - 1, userIndex + after)

    return leaderboard.entries.slice(startIndex, endIndex + 1)
  }, [leaderboard])

  /**
   * Get movement indicator for an entry
   */
  const getMovementIndicator = useCallback((entry: LeaderboardData['entries'][0]) => {
    if (entry.movement === 'same') {
      return null
    }

    const icon = entry.movement === 'up' ? '↑' : '↓'
    const color = entry.movement === 'up' ? 'text-green-500' : 'text-red-500'

    return {
      icon,
      color,
      amount: entry.movement_amount,
    }
  }, [])

  /**
   * Get rank change text
   */
  const getRankChangeText = useCallback((entry: LeaderboardData['entries'][0]) => {
    if (entry.movement === 'same' || entry.movement_amount === 0) {
      return 'No change'
    }

    const direction = entry.movement === 'up' ? 'up' : 'down'
    return `${entry.movement_amount} positions ${direction}`
  }, [])

  /**
   * Check if current user is in top N
   */
  const isInTop = useCallback((n: number) => {
    if (!leaderboard) return false
    const currentUserEntry = getCurrentUserEntry()
    if (!currentUserEntry) return false

    return currentUserEntry.rank <= n
  }, [leaderboard, getCurrentUserEntry])

  /**
   * Get leaderboard statistics
   */
  const getStatistics = useCallback(() => {
    if (!leaderboard) return null

    const entries = leaderboard.entries
    const totalXP = entries.reduce((sum, entry) => sum + entry.effective_xp, 0)
    const averageXP = Math.round(totalXP / entries.length)
    const topXP = entries[0]?.effective_xp || 0
    const bottomXP = entries[entries.length - 1]?.effective_xp || 0

    return {
      totalUsers: leaderboard.total_users,
      averageXP,
      topXP,
      bottomXP,
      currentUserRank: leaderboard.current_user_rank,
    }
  }, [leaderboard])

  /**
   * Auto-refresh on mount and interval
   */
  useEffect(() => {
    if (!autoRefresh) return

    fetchLeaderboard()

    const intervalId = setInterval(() => {
      fetchLeaderboard()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [fetchLeaderboard, autoRefresh])

  return {
    // State
    leaderboard,
    isLoading,
    error,
    lastRefresh,

    // Computed
    currentUserEntry: getCurrentUserEntry(),
    statistics: getStatistics(),

    // Actions
    fetchLeaderboard,
    refresh,
    getCurrentUserEntry,
    getTopEntries,
    getEntriesAroundUser,
    getMovementIndicator,
    getRankChangeText,
    isInTop,
    getStatistics,
  }
}

/**
 * Hook for leaderboard filtering and sorting
 */
export function useLeaderboardFilters(leaderboard: LeaderboardData | null) {
  const [filters, setFilters] = useState({
    searchQuery: '',
    showOnlyCurrentLeague: false,
    minXP: 0,
    maxXP: Infinity,
  })

  /**
   * Filter entries based on current filters
   */
  const filteredEntries = (() => {
    if (!leaderboard) return []

    return leaderboard.entries.filter(entry => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        // This would require username to be available
        // For now, we'll skip search filter
      }

      // XP range filter
      if (entry.effective_xp < filters.minXP || entry.effective_xp > filters.maxXP) {
        return false
      }

      return true
    })
  })()

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      showOnlyCurrentLeague: false,
      minXP: 0,
      maxXP: Infinity,
    })
  }, [])

  return {
    filters,
    filteredEntries,
    updateFilters,
    resetFilters,
  }
}

/**
 * Hook for leaderboard pagination
 */
export function useLeaderboardPagination(leaderboard: LeaderboardData | null, pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = leaderboard
    ? Math.ceil(leaderboard.entries.length / pageSize)
    : 0

  const paginatedEntries = (() => {
    if (!leaderboard) return []

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize

    return leaderboard.entries.slice(startIndex, endIndex)
  })()

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }, [totalPages])

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  /**
   * Go to first page
   */
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  /**
   * Go to last page
   */
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [totalPages])

  /**
   * Reset to first page
   */
  const reset = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    totalPages,
    paginatedEntries,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    reset,
  }
}
