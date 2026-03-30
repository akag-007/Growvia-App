// ==========================================
// GAMIFICATION SERVER ACTIONS
// ==========================================

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  UserProfile,
  XPLog,
  LevelInfo,
  WeeklyScore,
  Badge,
  UserBadge,
  DailyScore,
  LeaderboardData,
  XPSource,
  LeagueId,
  DailyCheckInResult,
  StreakFreezeResult,
  XPAwardResult,
} from '@/types/gamification'

// ==========================================
// USER PROFILE
// ==========================================

/**
 * Get or create user gamification profile
 */
export async function getUserGamificationProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Try to get existing profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist, create it
    return await createInitialUserProfile(user.id)
  }

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

/**
 * Create initial user profile
 */
async function createInitialUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  // Create default settings
  await createDefaultGamificationSettings(userId)

  return profile
}

/**
 * Create default gamification settings
 */
async function createDefaultGamificationSettings(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gamification_settings')
    .insert({
      user_id: userId,
    })

  if (error) {
    console.error('Error creating default settings:', error)
  }
}

// ==========================================
// XP SYSTEM
// ==========================================

/**
 * Award XP to user
 */
export async function awardXP(
  amount: number,
  source: XPSource,
  sourceId?: string,
  sourceMetadata?: Record<string, any>
): Promise<XPAwardResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, new_total_xp: 0, level_upped: false, new_level: 1, message: 'Unauthorized' }
  }

  // Get current week info
  const weekNumber = getWeekNumber(new Date())
  const year = new Date().getFullYear()

  // Check for duplicate XP event
  const { data: existingLog } = await supabase
    .from('xp_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('source', source)
    .eq('source_id', sourceId)
    .gte('created_at', new Date(Date.now() - 60000)) // Last minute
    .limit(1)

  if (existingLog && existingLog.length > 0) {
    return { success: false, new_total_xp: 0, level_upped: false, new_level: 1, message: 'Duplicate XP event' }
  }

  // Get current profile
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!currentProfile) {
    return { success: false, new_total_xp: 0, level_upped: false, new_level: 1, message: 'Profile not found' }
  }

  // Insert XP log
  const { error: logError } = await supabase
    .from('xp_logs')
    .insert({
      user_id: user.id,
      xp_amount: amount,
      source,
      source_id: sourceId || null,
      source_metadata: sourceMetadata || null,
      week_number: weekNumber,
      year: year,
    })

  if (logError) {
    console.error('Error logging XP:', logError)
    return { success: false, new_total_xp: 0, level_upped: false, new_level: 1, message: 'Failed to log XP' }
  }

  // Calculate new total XP
  const newTotalXP = currentProfile.total_xp + amount

  // Get level info before update
  const oldLevelInfo = await getLevelInfo(currentProfile.total_xp)

  // Update profile with new XP
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      total_xp: newTotalXP,
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    return { success: false, new_total_xp: 0, level_upped: false, new_level: 1, message: 'Failed to update profile' }
  }

  // Get level info after update
  const newLevelInfo = await getLevelInfo(newTotalXP)

  // Check for level up
  const levelUpped = newLevelInfo.level > oldLevelInfo.level

  if (levelUpped) {
    // Award level bonus XP
    await awardLevelBonusXP(user.id, newLevelInfo.level, weekNumber, year)

    // Update current level in profile
    await supabase
      .from('user_profiles')
      .update({
        current_level: newLevelInfo.level,
      })
      .eq('user_id', user.id)

    revalidatePath('/dashboard/gamification')
  }

  // Update daily score if applicable
  await updateDailyScore(user.id, amount, 0, 0)

  return {
    success: true,
    new_total_xp: newTotalXP,
    level_upped: levelUpped,
    new_level: newLevelInfo.level,
    message: levelUpped ? `Level up! You are now ${newLevelInfo.title}` : `+${amount} XP`,
  }
}

/**
 * Award level bonus XP
 */
async function awardLevelBonusXP(
  userId: string,
  level: number,
  weekNumber: number,
  year: number
): Promise<void> {
  const supabase = await createClient()

  // Get level bonus from levels table
  const { data: levelData } = await supabase
    .from('levels')
    .select('bonus_xp')
    .eq('level', level)
    .single()

  if (!levelData) return

  // Insert level bonus XP log
  await supabase
    .from('xp_logs')
    .insert({
      user_id: userId,
      xp_amount: levelData.bonus_xp,
      source: 'level_bonus',
      week_number: weekNumber,
      year: year,
    })

  // Update user profile
  await supabase
    .from('user_profiles')
    .update({
      total_xp: (await supabase.from('user_profiles').select('total_xp').eq('user_id', userId).single())
        .data?.total_xp || 0 + levelData.bonus_xp,
    })
    .eq('user_id', userId)
}

/**
 * Get level info for a given XP amount
 */
async function getLevelInfo(totalXP: number): Promise<LevelInfo> {
  const supabase = await createClient()

  const { data: level } = await supabase
    .from('levels')
    .select('*')
    .lte('xp_threshold', totalXP)
    .order('xp_threshold', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (!level) {
    return {
      level: 1,
      title: 'Amateur I',
      xp_threshold: 0,
      bonus_xp: 0,
      required_league: null,
      xp_to_next: 25,
      xp_progress: 0,
    }
  }

  // Get next level
  const { data: nextLevel } = await supabase
    .from('levels')
    .select('*')
    .eq('level', level.level + 1)
    .single()

  const xpToNext = nextLevel ? nextLevel.xp_threshold - totalXP : 0
  const xpProgress = calculateLevelProgress(totalXP, level.xp_threshold, nextLevel?.xp_threshold)

  return {
    ...level,
    xp_to_next: xpToNext,
    xp_progress: xpProgress,
  }
}

/**
 * Calculate level progress percentage
 */
function calculateLevelProgress(
  currentXP: number,
  currentLevelThreshold: number,
  nextLevelThreshold?: number
): number {
  if (!nextLevelThreshold) {
    return 100
  }

  const totalXPForLevel = nextLevelThreshold - currentLevelThreshold
  const xpEarnedInLevel = currentXP - currentLevelThreshold

  return Math.round((xpEarnedInLevel / totalXPForLevel) * 100)
}

/**
 * Get week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// ==========================================
// DAILY CHECK-IN
// ==========================================

/**
 * Perform daily check-in
 */
export async function performDailyCheckIn(): Promise<DailyCheckInResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, xp_awarded: 0, already_checked_in: false }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { success: false, xp_awarded: 0, already_checked_in: false }
  }

  // Check if already checked in today
  if (profile.last_check_in) {
    const lastCheckInDate = new Date(profile.last_check_in)
    lastCheckInDate.setHours(0, 0, 0, 0)

    if (lastCheckInDate.getTime() === today.getTime()) {
      return { success: false, xp_awarded: 0, already_checked_in: true }
    }
  }

  // Award XP
  const xpAwarded = 5 // Fixed amount for daily check-in
  const awardResult = await awardXP(xpAwarded, 'daily_check_in')

  if (!awardResult.success) {
    return { success: false, xp_awarded: 0, already_checked_in: false }
  }

  // Update last check-in
  await supabase
    .from('user_profiles')
    .update({
      last_check_in: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  // Update daily score
  await updateDailyScore(user.id, xpAwarded, 0, 0)

  revalidatePath('/dashboard/gamification')

  return {
    success: true,
    xp_awarded,
    already_checked_in: false,
  }
}

/**
 * Check if user can check in today
 */
export async function canCheckInToday(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('last_check_in')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile.last_check_in) {
    return true // Never checked in before
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastCheckInDate = new Date(profile.last_check_in)
  lastCheckInDate.setHours(0, 0, 0, 0)

  return lastCheckInDate.getTime() !== today.getTime()
}

// ==========================================
// LEADERBOARD
// ==========================================

/**
 * Get leaderboard data
 */
export async function getLeaderboard(
  type: 'global' | 'league' = 'global',
  limit: number = 20
): Promise<LeaderboardData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const currentWeekNumber = getWeekNumber(new Date())
  const currentYear = new Date().getFullYear()

  // Get current user's league
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('current_league')
    .eq('user_id', user.id)
    .single()

  if (!userProfile) return null

  let query = supabase
    .from('weekly_scores')
    .select('*')
    .eq('week_number', currentWeekNumber)
    .eq('year', currentYear)

  if (type === 'league') {
    query = query.eq('league_id', userProfile.current_league)
  }

  const { data: weeklyScores, error } = await query

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return null
  }

  // Get user profiles for leaderboard entries
  const userIds = weeklyScores?.map(score => score.user_id) || []
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, total_xp, current_level, current_streak')
    .in('user_id', userIds)

  const profileMap = new Map(
    userProfiles?.map(p => [p.user_id, p]) || []
  )

  const entries = (weeklyScores || [])
    .sort((a, b) => b.effective_xp - a.effective_xp)
    .slice(0, limit)
    .map((score, index) => {
      const profile = profileMap.get(score.user_id)
      return {
        rank: index + 1,
        user_id: score.user_id,
        effective_xp: score.effective_xp,
        base_xp: score.base_xp,
        consistency_multiplier: score.consistency_multiplier,
        league_id: score.league_id,
        current_level: profile?.current_level || 1,
        current_streak: profile?.current_streak || 0,
        movement: score.previous_rank
          ? (index + 1 < score.previous_rank ? 'up' : index + 1 > score.previous_rank ? 'down' : 'same')
          : 'same',
        movement_amount: score.previous_rank ? Math.abs((index + 1) - score.previous_rank) : 0,
        is_current_user: score.user_id === user.id,
      }
    })

  const currentUserRank = entries.find(e => e.is_current_user)?.rank || 0

  return {
    entries,
    current_user_rank: currentUserRank,
    total_users: weeklyScores?.length || 0,
    week_number: currentWeekNumber,
    year: currentYear,
  }
}

// ==========================================
// BADGES
// ==========================================

/**
 * Get all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient()

  const { data: badges, error } = await supabase
    .from('badges')
    .select('*')

  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }

  return badges || []
}

/**
 * Get user's unlocked badges
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: userBadges, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user badges:', error)
    return []
  }

  return userBadges?.map(ub => ({
    ...ub,
    badge: ub.badges as Badge,
    is_unlocked: true,
    progress_percentage: 100,
  })) || []
}

/**
 * Check and unlock eligible badges
 */
export async function checkAndUnlockBadges(): Promise<Badge[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get user profile stats
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) return []

  // Get all badges and user's unlocked badges
  const allBadges = await getAllBadges()
  const userBadges = await getUserBadges()
  const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

  // Check which badges are now eligible
  const newlyUnlockedBadges: Badge[] = []

  for (const badge of allBadges) {
    if (unlockedBadgeIds.has(badge.id)) continue

    const meetsRequirement = await checkBadgeRequirement(badge, profile)

    if (meetsRequirement) {
      // Unlock badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badge.id,
          current_progress: badge.requirement_value,
        })

      if (!error) {
        newlyUnlockedBadges.push(badge)
        unlockedBadgeIds.add(badge.id)
      }
    }
  }

  if (newlyUnlockedBadges.length > 0) {
    revalidatePath('/dashboard/gamification')
  }

  return newlyUnlockedBadges
}

/**
 * Check if user meets badge requirement
 */
async function checkBadgeRequirement(badge: Badge, profile: any): Promise<boolean> {
  const { requirement_type, requirement_value } = badge

  switch (requirement_type) {
    case 'streak_days':
      return profile.max_streak >= requirement_value

    case 'tasks_completed':
      return profile.total_tasks_completed >= requirement_value

    case 'xp_total':
      return profile.total_xp >= requirement_value

    case 'hours_total':
      return profile.total_hours_completed >= requirement_value

    case 'custom':
      return false

    default:
      return false
  }
}

// ==========================================
// DAILY SCORES
// ==========================================

/**
 * Update daily score
 */
async function updateDailyScore(
  userId: string,
  xpEarned: number,
  tasksCompleted: number,
  hoursLogged: number
): Promise<void> {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if daily score exists for today
  const { data: existingScore } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today.toISOString())
    .single()

  if (existingScore) {
    // Update existing score
    await supabase
      .from('daily_scores')
      .update({
        score: existingScore.score + xpEarned,
        tasks_completed: existingScore.tasks_completed + tasksCompleted,
        hours_logged: existingScore.hours_logged + hoursLogged,
        xp_earned: existingScore.xp_earned + xpEarned,
      })
      .eq('user_id', userId)
      .eq('date', today.toISOString())
  } else {
    // Create new daily score
    await supabase
      .from('daily_scores')
      .insert({
        user_id: userId,
        date: today.toISOString(),
        score: xpEarned,
        tasks_completed: tasksCompleted,
        hours_logged: hoursLogged,
        xp_earned: xpEarned,
      })
  }
}

/**
 * Get weekly XP data for graph
 */
export async function getWeeklyXPData(): Promise<Array<{ date: Date; xp: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)

  const { data: dailyScores } = await supabase
    .from('daily_scores')
    .select('date, xp_earned')
    .eq('user_id', user.id)
    .gte('date', weekStart.toISOString())
    .lte('date', today.toISOString())
    .order('date', { ascending: true })

  return dailyScores?.map(score => ({
    date: new Date(score.date),
    xp: score.xp_earned,
  })) || []
}

// ==========================================
// STREAK FREEZE
// ==========================================

/**
 * Use streak freeze
 */
export async function useStreakFreeze(): Promise<StreakFreezeResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, xp_cost: 0, streak_saved: false, new_freezes_available: 0, message: 'Unauthorized' }
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { success: false, xp_cost: 0, streak_saved: false, new_freezes_available: 0, message: 'Profile not found' }
  }

  // Check if user has streak freezes available
  if (profile.streak_freezes_available <= 0) {
    return { success: false, xp_cost: 0, streak_saved: false, new_freezes_available: 0, message: 'No streak freezes available' }
  }

  // Calculate cost
  const cost = 50 + (profile.current_streak * 10) // Base cost + streak multiplier

  // Check if user can afford
  if (profile.total_xp < cost) {
    return { success: false, xp_cost: cost, streak_saved: false, new_freezes_available: 0, message: 'Not enough XP' }
  }

  // Use streak freeze (deduct XP and freeze)
  await supabase
    .from('user_profiles')
    .update({
      total_xp: profile.total_xp - cost,
      streak_freezes_available: profile.streak_freezes_available - 1,
    })
    .eq('user_id', user.id)

  // Log XP deduction
  await supabase
    .from('xp_logs')
    .insert({
      user_id: user.id,
      xp_amount: -cost,
      source: 'streak_freeze_used',
      week_number: getWeekNumber(new Date()),
      year: new Date().getFullYear(),
    })

  revalidatePath('/dashboard/gamification')

  return {
    success: true,
    xp_cost: cost,
    streak_saved: true,
    new_freezes_available: profile.streak_freezes_available - 1,
    message: `Streak saved! ${cost} XP deducted`,
  }
}

// ==========================================
// WEEKLY STATS
// ==========================================

/**
 * Get user's weekly statistics
 */
export async function getUserWeeklyStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const currentWeekNumber = getWeekNumber(new Date())
  const currentYear = new Date().getFullYear()

  // Get user's weekly score
  const { data: weeklyScore } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_number', currentWeekNumber)
    .eq('year', currentYear)
    .single()

  // Get active days this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data: dailyScores } = await supabase
    .from('daily_scores')
    .select('date, score')
    .eq('user_id', user.id)
    .gte('date', weekStart.toISOString())

  const activeDays = dailyScores?.filter(d => d.score > 0).length || 0

  return {
    weeklyScore,
    activeDays,
  }
}

/**
 * Get user's gamification settings
 */
export async function getGamificationSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: settings } = await supabase
    .from('gamification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return settings
}

/**
 * Update gamification settings
 */
export async function updateGamificationSettings(settings: Record<string, any>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('gamification_settings')
    .update(settings)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/gamification')

  return { success: true }
}
