// ==========================================
// XP HOOK
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import { awardXP, performDailyCheckIn, canCheckInToday } from '@/actions/gamification'
import type { XPAwardResult, DailyCheckInResult } from '@/types/gamification'

/**
 * Hook for managing XP-related operations
 */
export function useXP() {
  const [totalXP, setTotalXP] = useState<number>(0)
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [xpToNextLevel, setXPToNextLevel] = useState<number>(25)
  const [xpProgress, setXPProgress] = useState<number>(0)
  const [levelTitle, setLevelTitle] = useState<string>('Amateur I')
  const [isAwardingXP, setIsAwardingXP] = useState<boolean>(false)
  const [lastAwardResult, setLastAwardResult] = useState<XPAwardResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Award XP to user
   */
  const award = useCallback(async (
    amount: number,
    source: 'task_completion' | 'revisit_completion' | 'long_task' | 'daily_check_in' | 'streak_bonus' | 'level_bonus' | 'penalty',
    sourceId?: string,
    sourceMetadata?: Record<string, any>
  ): Promise<XPAwardResult> => {
    setIsAwardingXP(true)
    setError(null)

    try {
      const result = await awardXP(amount, source, sourceId, sourceMetadata)

      if (result.success) {
        setTotalXP(result.new_total_xp)
        setCurrentLevel(result.new_level)

        if (result.level_upped) {
          // Trigger level up animation
          triggerLevelUpAnimation()
        }
      } else {
        setError(result.message || 'Failed to award XP')
      }

      setLastAwardResult(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return {
        success: false,
        new_total_xp: totalXP,
        level_upped: false,
        new_level: currentLevel,
        message: errorMessage,
      }
    } finally {
      setIsAwardingXP(false)
    }
  }, [totalXP, currentLevel])

  /**
   * Perform daily check-in
   */
  const dailyCheckIn = useCallback(async (): Promise<DailyCheckInResult> => {
    setIsAwardingXP(true)
    setError(null)

    try {
      const result = await performDailyCheckIn()

      if (result.success) {
        setTotalXP(prev => prev + result.xp_awarded)
        triggerCheckInAnimation()
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return {
        success: false,
        xp_awarded: 0,
        already_checked_in: false,
      }
    } finally {
      setIsAwardingXP(false)
    }
  }, [])

  /**
   * Check if user can check in today
   */
  const canCheckIn = useCallback(async (): Promise<boolean> => {
    try {
      return await canCheckInToday()
    } catch (err) {
      return false
    }
  }, [])

  /**
   * Trigger level up animation
   */
  const triggerLevelUpAnimation = useCallback(() => {
    // Dispatch custom event for animation
    const event = new CustomEvent('gamification:level-up', {
      detail: { level: currentLevel + 1 }
    })
    window.dispatchEvent(event)
  }, [currentLevel])

  /**
   * Trigger check-in animation
   */
  const triggerCheckInAnimation = useCallback(() => {
    // Dispatch custom event for animation
    const event = new CustomEvent('gamification:check-in', {
      detail: { xp: 5 }
    })
    window.dispatchEvent(event)
  }, [])

  /**
   * Reset XP state
   */
  const reset = useCallback(() => {
    setTotalXP(0)
    setCurrentLevel(1)
    setXPToNextLevel(25)
    setXPProgress(0)
    setLevelTitle('Amateur I')
    setLastAwardResult(null)
    setError(null)
  }, [])

  /**
   * Update XP data from server response
   */
  const updateFromServer = useCallback((data: {
    total_xp: number
    current_level: number
    level_title: string
    xp_to_next_level: number
    xp_progress: number
  }) => {
    setTotalXP(data.total_xp)
    setCurrentLevel(data.current_level)
    setLevelTitle(data.level_title)
    setXPToNextLevel(data.xp_to_next_level)
    setXPProgress(data.xp_progress)
  }, [])

  return {
    // State
    totalXP,
    currentLevel,
    levelTitle,
    xpToNextLevel,
    xpProgress,
    isAwardingXP,
    lastAwardResult,
    error,

    // Actions
    award,
    dailyCheckIn,
    canCheckIn,
    reset,
    updateFromServer,
  }
}

/**
 * Hook for listening to XP gain events
 */
export function useXPEvents() {
  const [recentXPEvents, setRecentXPEvents] = useState<Array<{
    amount: number
    source: string
    timestamp: number
  }>>([])

  useEffect(() => {
    const handleXPGain = (event: CustomEvent) => {
      const { amount, source } = event.detail
      setRecentXPEvents(prev => [
        { amount, source, timestamp: Date.now() },
        ...prev.slice(0, 9), // Keep only last 10 events
      ])
    }

    window.addEventListener('gamification:xp-gain', handleXPGain as EventListener)

    return () => {
      window.removeEventListener('gamification:xp-gain', handleXPGain as EventListener)
    }
  }, [])

  /**
   * Clear recent XP events
   */
  const clearRecentEvents = useCallback(() => {
    setRecentXPEvents([])
  }, [])

  return {
    recentXPEvents,
    clearRecentEvents,
  }
}
