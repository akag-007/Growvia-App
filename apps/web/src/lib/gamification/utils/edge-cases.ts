// ==========================================
// EDGE CASE HANDLING UTILITIES
// ==========================================

import { EDGE_CASE_CONFIG } from '../constants'
import type { XPLog, DailyScore } from '@/types/gamification'

// ==========================================
// OFFLINE XP SYNC
// ==========================================

interface QueuedXPEvent {
  id: string
  amount: number
  source: string
  sourceId?: string
  sourceMetadata?: Record<string, any>
  timestamp: number
  retryCount: number
}

class OfflineXPQueue {
  private queue: QueuedXPEvent[] = []
  private storageKey = 'offline_xp_queue'
  private isProcessing: boolean = false

  constructor() {
    this.loadQueue()
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load offline XP queue:', error)
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save offline XP queue:', error)
    }
  }

  /**
   * Add XP event to queue
   */
  public enqueue(event: Omit<QueuedXPEvent, 'id' | 'timestamp' | 'retryCount'>): string {
    if (this.queue.length >= EDGE_CASE_CONFIG.OFFLINE_QUEUE_MAX_SIZE) {
      console.warn('Offline XP queue is full, dropping oldest event')
      this.queue.shift()
    }

    const queuedEvent: QueuedXPEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      ...event,
    }

    this.queue.push(queuedEvent)
    this.saveQueue()

    return queuedEvent.id
  }

  /**
   * Process queued events
   */
  public async process(awardXP: (event: QueuedXPEvent) => Promise<boolean>): Promise<number> {
    if (this.isProcessing || this.queue.length === 0) {
      return 0
    }

    this.isProcessing = true
    let processedCount = 0

    try {
      // Process events in batches
      const batchSize = 5
      for (let i = 0; i < this.queue.length && processedCount < batchSize; i++) {
        const event = this.queue[i]

        try {
          const success = await awardXP(event)

          if (success) {
            this.queue.splice(i, 1)
            processedCount++
            i-- // Adjust index after removal
          } else {
            event.retryCount++

            // Remove events that have exceeded max retries
            if (event.retryCount >= EDGE_CASE_CONFIG.OFFLINE_SYNC_MAX_RETRIES) {
              this.queue.splice(i, 1)
              processedCount++
              i--
            }
          }
        } catch (error) {
          console.error(`Failed to process queued XP event ${event.id}:`, error)
          event.retryCount++

          if (event.retryCount >= EDGE_CASE_CONFIG.OFFLINE_SYNC_MAX_RETRIES) {
            this.queue.splice(i, 1)
            processedCount++
            i--
          }
        }
      }

      this.saveQueue()
    } finally {
      this.isProcessing = false
    }

    return processedCount
  }

  /**
   * Clear queue
   */
  public clear(): void {
    this.queue = []
    this.saveQueue()
  }

  /**
   * Get queue size
   */
  public size(): number {
    return this.queue.length
  }

  /**
   * Get queue status
   */
  public status(): { size: number; isProcessing: boolean } {
    return {
      size: this.queue.length,
      isProcessing: this.isProcessing,
    }
  }
}

// Singleton instance
export const offlineXPQueue = new OfflineXPQueue()

// ==========================================
// DUPLICATE XP PREVENTION
// ==========================================

/**
 * Generate idempotency key for XP events
 */
export function generateIdempotencyKey(
  source: string,
  sourceId?: string,
  userId?: string
): string {
  const timestamp = Date.now()
  const hash = btoa(`${source}-${sourceId || 'none'}-${timestamp}-${userId || 'anonymous'}`)
  return `${hash}-${timestamp}`
}

/**
 * Check for duplicate XP event
 */
export function checkDuplicateXP(
  recentLogs: XPLog[],
  source: string,
  sourceId?: string,
  timeWindowMs: number = EDGE_CASE_CONFIG.DUPLICATE_CHECK_WINDOW
): boolean {
  const now = Date.now()
  const cutoffTime = now - timeWindowMs

  return recentLogs.some(log =>
    log.source === source &&
    log.source_id === sourceId &&
    new Date(log.created_at).getTime() >= cutoffTime
  )
}

/**
 * Store processed XP event idempotency key
 */
export function storeProcessedEvent(key: string): void {
  try {
    const processed = getProcessedEvents()
    processed.add(key)
    localStorage.setItem('processed_xp_events', JSON.stringify(Array.from(processed)))
  } catch (error) {
    console.error('Failed to store processed XP event:', error)
  }
}

/**
 * Get processed events
 */
export function getProcessedEvents(): Set<string> {
  try {
    const stored = localStorage.getItem('processed_xp_events')
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch (error) {
    console.error('Failed to get processed XP events:', error)
    return new Set()
  }
}

/**
 * Clean up old processed events
 */
export function cleanupProcessedEvents(olderThanMs: number = EDGE_CASE_CONFIG.IDEMPOTENCY_KEY_EXPIRY): void {
  const processed = getProcessedEvents()
  const now = Date.now()
  const cutoffTime = now - olderThanMs

  const keysToKeep: string[] = []
  const keysToRemove: string[] = []

  processed.forEach(key => {
    const timestamp = parseInt(key.split('-')[1] || '0')
    if (now - timestamp < olderThanMs) {
      keysToKeep.push(key)
    } else {
      keysToRemove.push(key)
    }
  })

  // Update storage with only recent events
  if (keysToRemove.length > 0) {
    try {
      const newProcessed = new Set([...keysToKeep])
      localStorage.setItem('processed_xp_events', JSON.stringify(Array.from(newProcessed)))
    } catch (error) {
      console.error('Failed to cleanup processed XP events:', error)
    }
  }
}

/**
 * Check if event has been processed
 */
export function isEventProcessed(key: string): boolean {
  const processed = getProcessedEvents()
  return processed.has(key)
}

// ==========================================
// TIMEZONE HANDLING
// ==========================================

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || EDGE_CASE_CONFIG.DEFAULT_TIMEZONE
  } catch (error) {
    console.error('Failed to detect timezone:', error)
    return EDGE_CASE_CONFIG.DEFAULT_TIMEZONE
  }
}

/**
 * Convert UTC date to user's timezone
 */
export function toUserTimezone(utcDate: Date | string): Date {
  const userTimezone = getUserTimezone()
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  return new Date(
    date.toLocaleString('en-US', { timeZone: userTimezone })
  )
}

/**
 * Get week start date in user's timezone
 */
export function getWeekStartInUserTimezone(date: Date = new Date()): Date {
  const userTimezone = getUserTimezone()
  const weekStartDay = EDGE_CASE_CONFIG.WEEK_START_DAY // 0 = Sunday

  const dateInTimezone = new Date(
    date.toLocaleString('en-US', { timeZone: userTimezone })
  )

  const dayOfWeek = dateInTimezone.getDay()
  const diff = (dayOfWeek - weekStartDay + 7) % 7

  const weekStart = new Date(dateInTimezone)
  weekStart.setDate(dateInTimezone.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)

  return weekStart
}

/**
 * Get week end date in user's timezone
 */
export function getWeekEndInUserTimezone(date: Date = new Date()): Date {
  const weekStart = getWeekStartInUserTimezone(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return weekEnd
}

/**
 * Format date in user's timezone
 */
export function formatDateInUserTimezone(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const userTimezone = getUserTimezone()

  const formats = {
    short: { weekday: 'short', month: 'short', day: 'numeric' },
    medium: { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  } as const

  return new Date(date.toLocaleString('en-US', {
    timeZone: userTimezone,
    ...formats[format],
  })).toLocaleDateString('en-US', {
    timeZone: userTimezone,
    ...formats[format],
  })
}

// ==========================================
// WEEK BOUNDARY HANDLING
// ==========================================

/**
 * Check if date is within week boundary buffer
 */
export function isWithinWeekBoundaryBuffer(date: Date, bufferMs: number = EDGE_CASE_CONFIG.WEEK_BOUNDARY_BUFFER): boolean {
  const weekStart = getWeekStartInUserTimezone(date)
  const weekEnd = getWeekEndInUserTimezone(date)
  const bufferStart = new Date(weekStart.getTime() - bufferMs)
  const bufferEnd = new Date(weekEnd.getTime() + bufferMs)

  const checkDate = date.getTime()
  return checkDate >= bufferStart.getTime() && checkDate <= bufferEnd.getTime()
}

/**
 * Get week number with user timezone consideration
 */
export function getWeekNumberInUserTimezone(date: Date = new Date()): number {
  const userDate = toUserTimezone(date)
  const year = userDate.getFullYear()
  const firstDayOfYear = new Date(year, 0, 1)
  const pastDaysOfYear = (userDate.getTime() - firstDayOfYear.getTime()) / 86400000

  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * Check if weekly reset should occur
 */
export function shouldProcessWeeklyReset(lastResetTime: Date | null): boolean {
  if (!lastResetTime) {
    return true // First reset
  }

  const weekEnd = getWeekEndInUserTimezone()
  const bufferTime = new Date(weekEnd.getTime() + EDGE_CASE_CONFIG.WEEK_BOUNDARY_BUFFER)

  return new Date() >= bufferTime
}

/**
 * Calculate next weekly reset time
 */
export function getNextWeeklyResetTime(): Date {
  const weekEnd = getWeekEndInUserTimezone()
  return new Date(weekEnd.getTime() + EDGE_CASE_CONFIG.WEEK_BOUNDARY_BUFFER)
}

// ==========================================
// STREAK CALCULATION ERROR HANDLING
// ==========================================

/**
 * Validate daily score data
 */
export function validateDailyScores(scores: DailyScore[]): DailyScore[] {
  return scores.filter(score => {
    // Validate date
    if (!score.date || isNaN(new Date(score.date).getTime())) {
      return false
    }

    // Validate score is non-negative
    if (score.score < 0) {
      return false
    }

    // Validate xp_earned is non-negative
    if (score.xp_earned < 0) {
      return false
    }

    // Validate hours_logged is non-negative
    if (score.hours_logged < 0) {
      return false
    }

    return true
  })
}

/**
 * Recalculate streak from scratch
 */
export function recalculateStreak(dailyScores: DailyScore[]): {
  currentStreak: number
  maxStreak: number
  errors: string[]
} {
  const errors: string[] = []
  const validatedScores = validateDailyScores(dailyScores)

  if (validatedScores.length !== dailyScores.length) {
    errors.push(`${dailyScores.length - validatedScores.length} invalid daily scores removed`)
  }

  // Sort by date ascending
  const sortedScores = [...validatedScores].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate streaks
  let currentStreak = 0
  let maxStreak = 0
  let currentConsecutiveStreak = 0
  let maxConsecutiveStreak = 0

  const today = new Date()
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  for (let i = sortedScores.length - 1; i >= 0; i--) {
    const score = sortedScores[i]
    const scoreDate = new Date(score.date)
    const scoreDateOnly = new Date(scoreDate.getFullYear(), scoreDate.getMonth(), scoreDate.getDate())

    if (scoreDateOnly.getTime() === todayDateOnly.getTime()) {
      currentConsecutiveStreak++
    } else {
      // Check if consecutive with previous day
      if (i > 0) {
        const prevScore = sortedScores[i - 1]
        const prevDate = new Date(prevScore.date)
        const prevDateOnly = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate())

        const diffDays = Math.abs((scoreDateOnly.getTime() - prevDateOnly.getTime()) / 86400000)

        if (diffDays <= 1) {
          currentConsecutiveStreak++
        } else {
          maxConsecutiveStreak = Math.max(maxConsecutiveStreak, currentConsecutiveStreak)
          currentConsecutiveStreak = 1
        }
      } else {
        currentConsecutiveStreak = 1
      }
    }

    currentStreak = Math.max(currentStreak, currentConsecutiveStreak)
    maxStreak = Math.max(maxStreak, maxConsecutiveStreak)
  }

  return {
    currentStreak,
    maxStreak,
    errors,
  }
}

// ==========================================
// LEADERBOARD TIES HANDLING
// ==========================================

/**
 * Break leaderboard tie using timestamp
 */
export function breakLeaderboardTie(users: Array<{ effective_xp: number; created_at: Date | string }>): number {
  if (users.length === 0) return -1

  // Sort by effective_xp (descending), then by created_at (ascending - earlier timestamp wins)
  const sorted = [...users].sort((a, b) => {
    if (b.effective_xp !== a.effective_xp) {
      return b.effective_xp - a.effective_xp
    }

    // Tie: earlier timestamp wins
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return timeA - timeB
  })

  // Find first occurrence of the tied effective_xp
  const firstEffectiveXP = sorted[0].effective_xp
  const tiedUsers = sorted.filter(u => u.effective_xp === firstEffectiveXP)

  return tiedUsers.length
}

/**
 * Add tie indicator to leaderboard
 */
export function addTieIndicator(rank: number, effectiveXP: number, allScores: number[]): boolean {
  const count = allScores.filter(score => score === effectiveXP).length
  return count > 1
}

// ==========================================
// ERROR RECOVERY
// ==========================================

/**
 * Retry failed XP operation
 */
export async function retryFailedXPOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = EDGE_CASE_CONFIG.OFFLINE_SYNC_RETRY_INTERVAL
): Promise<{ success: boolean; result: T | null; error: string | null }> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return { success: true, result, error: null }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  return {
    success: false,
    result: null,
    error: lastError?.message || 'Operation failed after retries',
  }
}

/**
 * Handle XP operation with fallback
 */
export async function handleXPOperation<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>,
  fallbackMessage?: string
): Promise<{ success: boolean; result: T | null; usedFallback: boolean; error: string | null }> {
  try {
    const result = await primaryOperation()
    return { success: true, result, usedFallback: false, error: null }
  } catch (error) {
    console.error('Primary XP operation failed:', error)

    if (fallbackOperation) {
      try {
        const fallbackResult = await fallbackOperation()
        console.log('Fallback operation succeeded:', fallbackMessage)
        return { success: true, result: fallbackResult, usedFallback: true, error: null }
      } catch (fallbackError) {
        console.error('Fallback operation also failed:', fallbackError)
        return {
          success: false,
          result: null,
          usedFallback: true,
          error: `Primary and fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        }
      }
    }

    return {
      success: false,
      result: null,
      usedFallback: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ==========================================
// DATA CONSISTENCY CHECKS
// ==========================================

/**
 * Check XP consistency across tables
 */
export function checkXPConsistency(
  userProfileXP: number,
  xpLogsSum: number,
  dailyScoresSum: number
): { consistent: boolean; discrepancies: Array<{ source: string; expected: number; actual: number }> } {
  const discrepancies = []

  // Check user profile vs XP logs sum
  if (userProfileXP !== xpLogsSum) {
    discrepancies.push({
      source: 'user_profile_vs_xp_logs',
      expected: userProfileXP,
      actual: xpLogsSum,
    })
  }

  // Check user profile vs daily scores sum
  if (userProfileXP !== dailyScoresSum) {
    discrepancies.push({
      source: 'user_profile_vs_daily_scores',
      expected: userProfileXP,
      actual: dailyScoresSum,
    })
  }

  // Check XP logs vs daily scores sum
  if (xpLogsSum !== dailyScoresSum) {
    discrepancies.push({
      source: 'xp_logs_vs_daily_scores',
      expected: xpLogsSum,
      actual: dailyScoresSum,
    })
  }

  return {
    consistent: discrepancies.length === 0,
    discrepancies,
  }
}

/**
 * Auto-fix XP inconsistencies
 */
export function fixXPInconsistencies(
  userProfileXP: number,
  xpLogsSum: number
): number {
  // Trust the higher value (most recent activity)
  return Math.max(userProfileXP, xpLogsSum)
}

// ==========================================
// EXPORTS
// ==========================================

export {
  offlineXPQueue,
  generateIdempotencyKey,
  checkDuplicateXP,
  storeProcessedEvent,
  isEventProcessed,
  cleanupProcessedEvents,
  getUserTimezone,
  toUserTimezone,
  getWeekStartInUserTimezone,
  getWeekEndInUserTimezone,
  formatDateInUserTimezone,
  isWithinWeekBoundaryBuffer,
  shouldProcessWeeklyReset,
  getNextWeeklyResetTime,
  validateDailyScores,
  recalculateStreak,
  breakLeaderboardTie,
  addTieIndicator,
  retryFailedXPOperation,
  handleXPOperation,
  checkXPConsistency,
  fixXPInconsistencies,
}
