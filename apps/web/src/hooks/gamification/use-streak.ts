// ==========================================
// STREAK HOOK
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import { useStreakFreeze } from '@/actions/gamification'
import {
  calculateCurrentStreak,
  calculateMaxStreak,
  willStreakBreakToday,
  getHoursUntilStreakBreak,
  getStreakStatusMessage,
  calculateStreakFreezeCost,
  canAffordStreakFreeze,
  shouldOfferStreakFreeze,
  getStreakMilestone,
  isStreakMilestone,
  getActiveDaysInCurrentWeek,
  formatStreak,
  getStreakProgressToNextMilestone,
  getStreakIntensityLevel,
  getStreakColor,
} from '@/lib/gamification/streak/streak-system'
import type { DailyScore, StreakFreezeResult } from '@/types/gamification'

/**
 * Hook for managing streak-related operations
 */
export function useStreak(
  dailyScores: DailyScore[] = [],
  totalXP: number = 0,
  streakFreezesAvailable: number = 0
) {
  const [currentStreak, setCurrentStreak] = useState<number>(0)
  const [maxStreak, setMaxStreak] = useState<number>(0)
  const [streakFreezes, setStreakFreezes] = useState<number>(streakFreezesAvailable)
  const [isUsingFreeze, setIsUsingFreeze] = useState<boolean>(false)
  const [lastStreakUpdate, setLastStreakUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Update streak calculations
   */
  const updateStreak = useCallback(() => {
    const streak = calculateCurrentStreak(dailyScores)
    const max = calculateMaxStreak(dailyScores)

    setCurrentStreak(streak)
    setMaxStreak(max)
    setLastStreakUpdate(new Date())
  }, [dailyScores])

  /**
   * Check if streak will break today
   */
  const willBreakToday = useCallback((): boolean => {
    if (dailyScores.length === 0) return false

    const lastScore = dailyScores[0] // Assuming sorted by date descending
    return willStreakBreakToday(new Date(lastScore.date))
  }, [dailyScores])

  /**
   * Get hours until streak breaks
   */
  const hoursUntilBreak = useCallback((): number => {
    if (dailyScores.length === 0) return Infinity

    const lastScore = dailyScores[0]
    return getHoursUntilStreakBreak(new Date(lastScore.date))
  }, [dailyScores])

  /**
   * Get streak status message
   */
  const getStatusMessage = useCallback((): string => {
    if (dailyScores.length === 0) return 'Start your streak today!'

    const lastScore = dailyScores[0]
    return getStreakStatusMessage(currentStreak, maxStreak, new Date(lastScore.date))
  }, [currentStreak, maxStreak, dailyScores])

  /**
   * Get streak milestone message
   */
  const getMilestoneMessage = useCallback((): string | null => {
    return getStreakMilestone(currentStreak)
  }, [currentStreak])

  /**
   * Check if current streak is a milestone
   */
  const isCurrentStreakMilestone = useCallback((): boolean => {
    return isStreakMilestone(currentStreak)
  }, [currentStreak])

  /**
   * Use streak freeze
   */
  const useFreeze = useCallback(async (): Promise<StreakFreezeResult> => {
    setIsUsingFreeze(true)
    setError(null)

    try {
      const result = await useStreakFreeze()

      if (result.success) {
        setStreakFreezes(result.new_freezes_available)

        // Trigger freeze animation
        const event = new CustomEvent('gamification:streak-freeze', {
          detail: { streakSaved: result.streak_saved }
        })
        window.dispatchEvent(event)
      } else {
        setError(result.message || 'Failed to use streak freeze')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return {
        success: false,
        xp_cost: 0,
        streak_saved: false,
        new_freezes_available: streakFreezes,
        message: errorMessage,
      }
    } finally {
      setIsUsingFreeze(false)
    }
  }, [streakFreezes])

  /**
   * Check if user can use streak freeze
   */
  const canUseFreeze = useCallback((): boolean => {
    const cost = calculateStreakFreezeCost(currentStreak)
    return canAffordStreakFreeze(totalXP, currentStreak, streakFreezes)
  }, [totalXP, currentStreak, streakFreezes])

  /**
   * Get streak freeze cost
   */
  const getFreezeCost = useCallback((): number => {
    return calculateStreakFreezeCost(currentStreak)
  }, [currentStreak])

  /**
   * Check if streak freeze should be offered
   */
  const shouldOfferFreeze = useCallback((warningHours: number = 4): boolean => {
    const hours = hoursUntilBreak()
    return shouldOfferStreakFreeze(currentStreak, hours, 3, warningHours)
  }, [currentStreak, hoursUntilBreak])

  /**
   * Get streak display text
   */
  const getDisplayText = useCallback((): string => {
    return formatStreak(currentStreak)
  }, [currentStreak])

  /**
   * Get streak progress to next milestone
   */
  const getProgressToNextMilestone = useCallback((): number => {
    return getStreakProgressToNextMilestone(currentStreak)
  }, [currentStreak])

  /**
   * Get streak intensity level
   */
  const getIntensity = useCallback((): 'low' | 'medium' | 'high' | 'extreme' => {
    return getStreakIntensityLevel(currentStreak)
  }, [currentStreak])

  /**
   * Get streak color
   */
  const getColor = useCallback((): string => {
    return getStreakColor(currentStreak)
  }, [currentStreak])

  /**
   * Get active days in current week
   */
  const getActiveDaysThisWeek = useCallback((): number => {
    return getActiveDaysInCurrentWeek(dailyScores)
  }, [dailyScores])

  /**
   * Check if streak is in danger
   */
  const isInDanger = useCallback((): boolean => {
    const hours = hoursUntilBreak()
    return hours <= 6 && hours !== Infinity
  }, [hoursUntilBreak])

  /**
   * Get danger level
   */
  const getDangerLevel = useCallback((): 'critical' | 'warning' | 'safe' => {
    const hours = hoursUntilBreak()

    if (hours <= 2) return 'critical'
    if (hours <= 6) return 'warning'
    return 'safe'
  }, [hoursUntilBreak])

  /**
   * Reset streak state
   */
  const reset = useCallback(() => {
    setCurrentStreak(0)
    setMaxStreak(0)
    setStreakFreezes(streakFreezesAvailable)
    setLastStreakUpdate(null)
    setError(null)
  }, [streakFreezesAvailable])

  /**
   * Update streak freezes from server
   */
  const updateFreezes = useCallback((newFreezes: number) => {
    setStreakFreezes(newFreezes)
  }, [])

  // Update streak calculations when daily scores change
  useEffect(() => {
    updateStreak()
  }, [dailyScores, updateStreak])

  return {
    // State
    currentStreak,
    maxStreak,
    streakFreezes,
    isUsingFreeze,
    lastStreakUpdate,
    error,

    // Computed
    willBreakToday: willBreakToday(),
    hoursUntilBreak: hoursUntilBreak(),
    statusMessage: getStatusMessage(),
    milestoneMessage: getMilestoneMessage(),
    isMilestone: isCurrentStreakMilestone(),
    canUseFreeze: canUseFreeze(),
    freezeCost: getFreezeCost(),
    shouldOfferFreeze: shouldOfferFreeze(),
    displayText: getDisplayText(),
    progressToNextMilestone: getProgressToNextMilestone(),
    intensity: getIntensity(),
    color: getColor(),
    activeDaysThisWeek: getActiveDaysThisWeek(),
    isInDanger: isInDanger(),
    dangerLevel: getDangerLevel(),

    // Actions
    useFreeze,
    updateStreak,
    reset,
    updateFreezes,
  }
}

/**
 * Hook for streak notifications
 */
export function useStreakNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'milestone' | 'warning' | 'danger'
    message: string
    timestamp: number
  }>>([])
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  /**
   * Show streak milestone notification
   */
  const showMilestoneNotification = useCallback((streakDays: number) => {
    const milestone = getStreakMilestone(streakDays)

    if (!milestone) return

    const notificationId = `milestone-${streakDays}`

    if (dismissedNotifications.has(notificationId)) {
      return
    }

    setNotifications(prev => [
      {
        id: notificationId,
        type: 'milestone',
        message: milestone,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4), // Keep only last 5 notifications
    ])
  }, [dismissedNotifications])

  /**
   * Show streak warning notification
   */
  const showWarningNotification = useCallback((hoursUntilBreak: number) => {
    const notificationId = `warning-${hoursUntilBreak}`

    if (dismissedNotifications.has(notificationId)) {
      return
    }

    let message = ''

    if (hoursUntilBreak <= 2) {
      message = '🚨 Critical! Your streak will break in less than 2 hours!'
    } else if (hoursUntilBreak <= 6) {
      message = '⚠️ Warning: Your streak will break soon!'
    } else {
      message = '💡 Don\'t forget to keep your streak going!'
    }

    setNotifications(prev => [
      {
        id: notificationId,
        type: hoursUntilBreak <= 2 ? 'danger' : 'warning',
        message,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])
  }, [dismissedNotifications])

  /**
   * Dismiss notification
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setDismissedNotifications(prev => new Set(prev).add(id))
  }, [])

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  /**
   * Reset dismissed notifications
   */
  const resetDismissed = useCallback(() => {
    setDismissedNotifications(new Set())
  }, [])

  return {
    notifications,
    showMilestoneNotification,
    showWarningNotification,
    dismissNotification,
    clearAllNotifications,
    resetDismissed,
  }
}

/**
 * Hook for streak animations
 */
export function useStreakAnimations() {
  const [isAnimating, setIsAnimating] = useState<boolean>(false)
  const [animationType, setAnimationType] = useState<'milestone' | 'freeze' | 'break'>('milestone')

  useEffect(() => {
    const handleStreakMilestone = (event: CustomEvent) => {
      setAnimationType('milestone')
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1800) // 1.8 seconds
    }

    const handleStreakFreeze = (event: CustomEvent) => {
      setAnimationType('freeze')
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 2000) // 2 seconds
    }

    const handleStreakBreak = (event: CustomEvent) => {
      setAnimationType('break')
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1500) // 1.5 seconds
    }

    window.addEventListener('gamification:streak-milestone', handleStreakMilestone as EventListener)
    window.addEventListener('gamification:streak-freeze', handleStreakFreeze as EventListener)
    window.addEventListener('gamification:streak-break', handleStreakBreak as EventListener)

    return () => {
      window.removeEventListener('gamification:streak-milestone', handleStreakMilestone as EventListener)
      window.removeEventListener('gamification:streak-freeze', handleStreakFreeze as EventListener)
      window.removeEventListener('gamification:streak-break', handleStreakBreak as EventListener)
    }
  }, [])

  /**
   * Trigger milestone animation
   */
  const triggerMilestoneAnimation = useCallback(() => {
    const event = new CustomEvent('gamification:streak-milestone')
    window.dispatchEvent(event)
  }, [])

  /**
   * Trigger freeze animation
   */
  const triggerFreezeAnimation = useCallback(() => {
    const event = new CustomEvent('gamification:streak-freeze')
    window.dispatchEvent(event)
  }, [])

  /**
   * Trigger break animation
   */
  const triggerBreakAnimation = useCallback(() => {
    const event = new CustomEvent('gamification:streak-break')
    window.dispatchEvent(event)
  }, [])

  return {
    isAnimating,
    animationType,
    triggerMilestoneAnimation,
    triggerFreezeAnimation,
    triggerBreakAnimation,
  }
}
