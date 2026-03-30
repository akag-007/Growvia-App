// ==========================================
// BADGES HOOK
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import { getAllBadges, getUserBadges, checkAndUnlockBadges } from '@/actions/gamification'
import {
  getAllBadgeProgress,
  getBadgesByCategory,
  sortBadgesByRarity,
  sortBadgesByProgress,
  groupBadgesByCategory,
  groupBadgeProgressByCategory,
  getBadgeRarityColor,
  getBadgeRarityGlow,
  getBadgeCategoryColor,
  formatBadgeRequirement,
  getBadgeRarityLabel,
  getBadgeCategoryLabel,
  isLegendaryBadge,
  isEpicOrHigher,
  isCloseToUnlockingBadge,
  getBadgesCloseToUnlock,
  countBadgesByRarity,
  calculateBadgeCompletionPercentage,
  getBadgeCompletionStatus,
} from '@/lib/gamification/badges/badge-system'
import type { Badge, UserBadge, BadgeProgress, BadgeCategory, BadgeRarity } from '@/types/gamification'

/**
 * Hook for managing badges
 */
export function useBadges() {
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [unlockedBadges, setUnlockedBadges] = useState<UserBadge[]>([])
  const [lockedBadges, setLockedBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Badge[]>([])
  const [checkingProgress, setCheckingProgress] = useState<boolean>(false)

  /**
   * Fetch all badge data
   */
  const fetchBadges = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [allBadgesData, userBadgesData] = await Promise.all([
        getAllBadges(),
        getUserBadges(),
      ])

      setAllBadges(allBadgesData)
      setUnlockedBadges(userBadgesData)

      // Separate locked badges
      const unlockedBadgeIds = new Set(userBadgesData.map(ub => ub.badge_id))
      const lockedBadgesData = allBadgesData.filter(badge => !unlockedBadgeIds.has(badge.id))
      setLockedBadges(lockedBadgesData)

      return { allBadges: allBadgesData, unlockedBadges: userBadgesData, lockedBadges: lockedBadgesData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges'
      setError(errorMessage)
      return { allBadges: [], unlockedBadges: [], lockedBadges: [] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Check and unlock new badges
   */
  const checkForUnlocks = useCallback(async () => {
    setCheckingProgress(true)

    try {
      const newlyUnlockedBadges = await checkAndUnlockBadges()

      if (newlyUnlockedBadges.length > 0) {
        setRecentlyUnlocked(prev => [...newlyUnlockedBadges, ...prev])

        // Refresh badges after unlock
        await fetchBadges()

        // Trigger badge unlock animations
        newlyUnlockedBadges.forEach(badge => {
          const event = new CustomEvent('gamification:badge-unlock', {
            detail: { badge }
          })
          window.dispatchEvent(event)
        })
      }

      return newlyUnlockedBadges
    } catch (err) {
      console.error('Error checking badge unlocks:', err)
      return []
    } finally {
      setCheckingProgress(false)
    }
  }, [fetchBadges])

  /**
   * Get badge progress for all badges
   */
  const getBadgeProgress = useCallback((userStats?: {
    current_streak: number
    max_streak: number
    total_tasks_completed: number
    total_xp: number
    total_hours_completed: number
  }) => {
    if (!userStats) return []

    return getAllBadgeProgress(allBadges, unlockedBadges, userStats)
  }, [allBadges, unlockedBadges])

  /**
   * Get badges by category
   */
  const getByCategory = useCallback((category: BadgeCategory) => {
    return getBadgesByCategory(allBadges, category)
  }, [allBadges])

  /**
   * Get unlocked badges by category
   */
  const getUnlockedByCategory = useCallback((category: BadgeCategory) => {
    return getBadgesByCategory(allBadges, category).filter(badge =>
      unlockedBadges.some(ub => ub.badge_id === badge.id)
    )
  }, [allBadges, unlockedBadges])

  /**
   * Get locked badges by category
   */
  const getLockedByCategory = useCallback((category: BadgeCategory) => {
    return getBadgesByCategory(allBadges, category).filter(badge =>
      !unlockedBadges.some(ub => ub.badge_id === badge.id)
    )
  }, [allBadges, unlockedBadges])

  /**
   * Sort badges by rarity
   */
  const sortByRarity = useCallback((badges: Badge[]) => {
    return sortBadgesByRarity(badges)
  }, [])

  /**
   * Sort badge progress by completion
   */
  const sortByProgress = useCallback((badgeProgresses: BadgeProgress[]) => {
    return sortBadgesByProgress(badgeProgresses)
  }, [])

  /**
   * Group badges by category
   */
  const groupByCategory = useCallback((badges?: Badge[]) => {
    return groupBadgesByCategory(badges || allBadges)
  }, [allBadges])

  /**
   * Group badge progress by category
   */
  const groupProgressByCategory = useCallback((badgeProgresses: BadgeProgress[]) => {
    return groupBadgeProgressByCategory(badgeProgresses)
  }, [])

  /**
   * Get badge color
   */
  const getBadgeColor = useCallback((badge: Badge) => {
    return badge.color || getBadgeRarityColor(badge.rarity)
  }, [])

  /**
   * Get badge glow effect
   */
  const getBadgeGlow = useCallback((badge: Badge) => {
    return getBadgeRarityGlow(badge.rarity)
  }, [])

  /**
   * Get category color
   */
  const getCategoryColor = useCallback((category: BadgeCategory) => {
    return getBadgeCategoryColor(category)
  }, [])

  /**
   * Format badge requirement for display
   */
  const formatRequirement = useCallback((badge: Badge) => {
    return formatBadgeRequirement(badge)
  }, [])

  /**
   * Get rarity label
   */
  const getRarityLabel = useCallback((rarity: BadgeRarity) => {
    return getBadgeRarityLabel(rarity)
  }, [])

  /**
   * Get category label
   */
  const getCategoryLabel = useCallback((category: BadgeCategory) => {
    return getBadgeCategoryLabel(category)
  }, [])

  /**
   * Check if badge is legendary
   */
  const checkLegendary = useCallback((badge: Badge) => {
    return isLegendaryBadge(badge)
  }, [])

  /**
   * Check if badge is epic or higher
   */
  const checkEpicOrHigher = useCallback((badge: Badge) => {
    return isEpicOrHigher(badge)
  }, [])

  /**
   * Check if badge is close to unlocking
   */
  const isCloseToUnlock = useCallback((
    badgeProgress: BadgeProgress,
    threshold: number = 80
  ) => {
    return isCloseToUnlockingBadge(badgeProgress, threshold)
  }, [])

  /**
   * Get badges close to unlocking
   */
  const getCloseToUnlock = useCallback((
    userStats: {
      current_streak: number
      max_streak: number
      total_tasks_completed: number
      total_xp: number
      total_hours_completed: number
    },
    threshold: number = 80
  ) => {
    const progress = getAllBadgeProgress(allBadges, unlockedBadges, userStats)
    return getBadgesCloseToUnlock(progress, threshold)
  }, [allBadges, unlockedBadges])

  /**
   * Count badges by rarity
   */
  const countByRarity = useCallback(() => {
    return countBadgesByRarity(unlockedBadges)
  }, [unlockedBadges])

  /**
   * Get completion percentage
   */
  const getCompletion = useCallback(() => {
    return calculateBadgeCompletionPercentage(unlockedBadges.length, allBadges.length)
  }, [unlockedBadges.length, allBadges.length])

  /**
   * Get completion status
   */
  const getCompletionStatus = useCallback(() => {
    const percentage = getCompletion()
    return getBadgeCompletionStatus(percentage)
  }, [getCompletion])

  /**
   * Clear recently unlocked badges
   */
  const clearRecentlyUnlocked = useCallback(() => {
    setRecentlyUnlocked([])
  }, [])

  /**
   * Refresh badge data
   */
  const refresh = useCallback(async () => {
    return await fetchBadges()
  }, [fetchBadges])

  // Load badges on mount
  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  return {
    // State
    allBadges,
    unlockedBadges,
    lockedBadges,
    isLoading,
    error,
    recentlyUnlocked,
    checkingProgress,

    // Stats
    totalBadges: allBadges.length,
    unlockedCount: unlockedBadges.length,
    lockedCount: lockedBadges.length,
    completionPercentage: getCompletion(),
    completionStatus: getCompletionStatus(),
    rarityStats: countByRarity(),

    // Actions
    fetchBadges,
    checkForUnlocks,
    refresh,
    clearRecentlyUnlocked,

    // Helpers
    getBadgeProgress,
    getByCategory,
    getUnlockedByCategory,
    getLockedByCategory,
    sortByRarity,
    sortByProgress,
    groupByCategory,
    groupProgressByCategory,
    getBadgeColor,
    getBadgeGlow,
    getCategoryColor,
    formatRequirement,
    getRarityLabel,
    getCategoryLabel,
    checkLegendary,
    checkEpicOrHigher,
    isCloseToUnlock,
    getCloseToUnlock,
    getCompletion,
    getCompletionStatus,
  }
}

/**
 * Hook for badge unlock animations
 */
export function useBadgeAnimations() {
  const [animatedBadges, setAnimatedBadges] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleBadgeUnlock = (event: CustomEvent) => {
      const { badge } = event.detail
      setAnimatedBadges(prev => new Set(prev).add(badge.id))

      // Remove from animated set after animation completes
      setTimeout(() => {
        setAnimatedBadges(prev => {
          const newSet = new Set(prev)
          newSet.delete(badge.id)
          return newSet
        })
      }, 2000) // 2 seconds animation duration
    }

    window.addEventListener('gamification:badge-unlock', handleBadgeUnlock as EventListener)

    return () => {
      window.removeEventListener('gamification:badge-unlock', handleBadgeUnlock as EventListener)
    }
  }, [])

  /**
   * Check if badge is being animated
   */
  const isAnimating = useCallback((badgeId: string) => {
    return animatedBadges.has(badgeId)
  }, [animatedBadges])

  /**
   * Trigger manual animation
   */
  const triggerAnimation = useCallback((badge: Badge) => {
    const event = new CustomEvent('gamification:badge-unlock', {
      detail: { badge }
    })
    window.dispatchEvent(event)
  }, [])

  return {
    animatedBadges,
    isAnimating,
    triggerAnimation,
  }
}

/**
 * Hook for badge filtering
 */
export function useBadgeFilters(badges: Badge[]) {
  const [filters, setFilters] = useState({
    category: null as BadgeCategory | null,
    rarity: null as BadgeRarity | null,
    unlocked: null as boolean | null,
    searchQuery: '',
  })

  /**
   * Filter badges based on current filters
   */
  const filteredBadges = (() => {
    return badges.filter(badge => {
      // Category filter
      if (filters.category && badge.category !== filters.category) {
        return false
      }

      // Rarity filter
      if (filters.rarity && badge.rarity !== filters.rarity) {
        return false
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesName = badge.name.toLowerCase().includes(query)
        const matchesDescription = badge.description.toLowerCase().includes(query)

        if (!matchesName && !matchesDescription) {
          return false
        }
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
      category: null,
      rarity: null,
      unlocked: null,
      searchQuery: '',
    })
  }, [])

  /**
   * Set category filter
   */
  const setCategory = useCallback((category: BadgeCategory | null) => {
    setFilters(prev => ({ ...prev, category }))
  }, [])

  /**
   * Set rarity filter
   */
  const setRarity = useCallback((rarity: BadgeRarity | null) => {
    setFilters(prev => ({ ...prev, rarity }))
  }, [])

  /**
   * Set unlocked filter
   */
  const setUnlocked = useCallback((unlocked: boolean | null) => {
    setFilters(prev => ({ ...prev, unlocked }))
  }, [])

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, [])

  return {
    filters,
    filteredBadges,
    updateFilters,
    resetFilters,
    setCategory,
    setRarity,
    setUnlocked,
    setSearchQuery,
  }
}
