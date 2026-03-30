'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Zap,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Timer,
  Star,
  ChevronUp,
  ChevronDown,
  Minus,
  Crown,
  Medal,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { useXP } from '@/hooks/gamification/use-xp'
import { useLeague } from '@/hooks/gamification/use-league'
import { useLeaderboard } from '@/hooks/gamification/use-leaderboard'
import { useBadges } from '@/hooks/gamification/use-badges'
import { useStreak } from '@/hooks/gamification/use-streak'
import { getUserGamificationProfile, performDailyCheckIn } from '@/actions/gamification'
import { LEAGUE_CONFIG } from '@/lib/gamification/constants'
import type { Badge as BadgeType } from '@/types/gamification'

export default function GamificationPageClient() {
  // Fetch user data on mount
  useEffect(() => {
    getUserGamificationProfile().then(profile => {
      if (profile) {
        xpHook.updateFromServer({
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          level_title: 'Amateur I',
          xp_to_next_level: 25,
          xp_progress: 0,
        })
        streakHook.updateFreezes(profile.streak_freezes_available)
      }
    })
  }, [])

  const xpHook = useXP()
  const leagueHook = useLeague()
  const leaderboard = useLeaderboard('league')
  const badgesHook = useBadges()
  const streakHook = useStreak([], xpHook.totalXP)

  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [xpGainAnimation, setXPGainAnimation] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false })

  // Handle daily check-in
  const handleDailyCheckIn = async () => {
    const result = await performDailyCheckIn()
    if (result.success) {
      setXPGainAnimation({ amount: result.xp_awarded, visible: true })
      setTimeout(() => setXPGainAnimation(prev => ({ ...prev, visible: false })), 2000)
    }
  }

  // XP Gain Animation Component
  const XPGainAnimation = () => (
    <AnimatePresence>
      {xpGainAnimation.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.5 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-2xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
            <Zap className="w-6 h-6" />
            <span>+{xpGainAnimation.amount} XP</span>
            <span className="text-yellow-100 text-sm">Daily Check-in!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      <XPGainAnimation />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Level Badge */}
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl md:text-4xl font-bold shadow-2xl"
              >
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Level {xpHook.currentLevel}
                </h1>
                <p className="text-slate-400 text-sm">{xpHook.levelTitle}</p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="flex-1 w-full md:w-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total XP</span>
                <motion.span
                  key={xpHook.totalXP}
                  initial={{ scale: 1.2, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl md:text-3xl font-bold"
                >
                  {xpHook.totalXP.toLocaleString()} XP
                </motion.span>
              </div>
              <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpHook.xpProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">{xpHook.xpProgress}% to Level {xpHook.currentLevel + 1}</span>
                <span className="text-xs text-slate-500">{xpHook.xpToNextLevel} XP needed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* League Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Current League */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl shadow-xl"
                  style={{ backgroundColor: leagueHook.leagueColor }}
                >
                  <span>{leagueHook.leagueIcon}</span>
                </motion.div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold" style={{ color: leagueHook.leagueColor }}>
                    {leagueHook.leagueInfo?.name}
                  </h2>
                  <p className="text-slate-400 text-sm">Weekly Competition</p>
                </div>
              </div>

              {/* League Pressure */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm">To Promotion</span>
                  </div>
                  <span className="font-bold text-green-400">{leagueHook.xpForPromotion} XP</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm">Before Relegation</span>
                  </div>
                  <span className="font-bold text-red-400">{leagueHook.xpBeforeRelegation} XP</span>
                </div>
              </div>
            </div>

            {/* League Stats */}
            <div className="flex-1 bg-slate-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Your Rank</span>
                <span className="text-xl font-bold text-white">
                  #{leagueHook.leagueRank}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Weekly XP</span>
                <span className="text-xl font-bold text-white">
                  {leagueHook.weeklyXP}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Active Days</span>
                <span className="text-xl font-bold text-white">
                  {leagueHook.activeDays}/7
                </span>
              </div>
              <div className="pt-2 border-t border-slate-600">
                <p className="text-sm text-center text-slate-300">
                  {leagueHook.leagueStatusMessage}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Check-in & Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Check-in */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={handleDailyCheckIn}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Daily Check-in</h3>
                  <p className="text-white/80 text-sm">+5 XP</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">
                Come back daily to maintain your streak and earn bonus XP!
              </p>
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Flame className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold">
                    {streakHook.displayText}
                  </h3>
                  <p className="text-white/80 text-sm">Current Streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs">Max Streak</p>
                <p className="text-2xl font-bold">{streakHook.maxStreak}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Status</span>
                <span className={`font-medium ${
                  streakHook.isInDanger
                    ? 'text-red-300'
                    : 'text-green-300'
                }`}>
                  {streakHook.isInDanger ? 'In Danger!' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Streak Freezes</span>
                <span className="font-medium">{streakHook.streakFreezes}</span>
              </div>
              {streakHook.dangerLevel === 'critical' && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="bg-red-500/30 border border-red-500/50 rounded-lg p-3 text-center"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-red-300 text-sm font-medium">
                    Streak breaks in {streakHook.hoursUntilBreak} hours!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              League Leaderboard
            </h2>
            <button
              onClick={leaderboard.refresh}
              disabled={leaderboard.isLoading}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <Timer className="w-5 h-5" />
            </button>
          </div>

          {leaderboard.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          ) : leaderboard.leaderboard?.entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No leaderboard data available yet. Complete tasks to earn XP!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.leaderboard?.entries.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.is_current_user
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-400/50'
                      : 'bg-slate-700/50 hover:bg-slate-700/70'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`text-lg font-bold w-8 ${
                      entry.is_current_user ? 'text-blue-400' : 'text-slate-300'
                    }`}>
                      {entry.rank}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Player {entry.rank}</span>
                        <span className="text-slate-400 text-sm">Lvl {entry.current_level}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-400 font-bold">{entry.effective_xp} XP</span>
                        {entry.movement_amount > 0 && (
                          <div className={`flex items-center gap-1 text-xs ${
                            entry.movement === 'up' ? 'text-green-400' :
                            entry.movement === 'down' ? 'text-red-400' :
                            'text-slate-400'
                          }`}>
                            {entry.movement === 'up' && <ChevronUp className="w-4 h-4" />}
                            {entry.movement === 'down' && <ChevronDown className="w-4 h-4" />}
                            {entry.movement === 'same' && <Minus className="w-4 h-4" />}
                            <span>{entry.movement_amount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">{entry.current_streak}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-400" />
              Achievements
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">{badgesHook.unlockedCount} Unlocked</span>
              <span className="text-slate-400">/ {badgesHook.totalBadges} Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badgesHook.allBadges.slice(0, 8).map((badge, index) => {
              const isUnlocked = badgesHook.unlockedBadges.some(ub => ub.badge_id === badge.id)
              const rarityColor = getBadgeRarityColor(badge.rarity)

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative rounded-xl p-4 text-center ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 cursor-pointer hover:border-purple-400/80'
                      : 'bg-slate-700/50 border border-slate-600'
                  } transition-all`}
                  title={badge.description}
                >
                  <div className={`text-4xl md:text-5xl mb-2 ${
                    isUnlocked ? '' : 'grayscale opacity-50'
                  }`}>
                    {badge.icon}
                  </div>
                  <p className={`font-medium text-sm mb-1 ${
                    isUnlocked ? 'text-white' : 'text-slate-400'
                  }`}>
                    {badge.name}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Star
                      className={`w-4 h-4 ${
                        isUnlocked ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                      }`}
                      fill={isUnlocked ? 'currentColor' : 'none'}
                    />
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      isUnlocked ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-600 text-slate-400'
                    }`}>
                      {badge.rarity}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Target, label: 'Total Tasks', value: '0', color: 'blue' },
            { icon: Zap, label: 'Total XP', value: xpHook.totalXP.toLocaleString(), color: 'yellow' },
            { icon: Flame, label: 'Max Streak', value: streakHook.maxStreak.toString(), color: 'orange' },
            { icon: Shield, label: 'Badges', value: `${badgesHook.unlockedCount}/${badgesHook.totalBadges}`, color: 'purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-center`}
            >
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-500/20' :
                stat.color === 'yellow' ? 'bg-yellow-500/20' :
                stat.color === 'orange' ? 'bg-orange-500/20' :
                'bg-purple-500/20'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'yellow' ? 'text-yellow-400' :
                  stat.color === 'orange' ? 'text-orange-400' :
                  'text-purple-400'
                }`} />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating XP Particles */}
      {xpGainAnimation.visible && (
        <>
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                y: -100 - Math.random() * 50,
                scale: 0,
                x: (Math.random() - 0.5) * 200,
              }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
              className="fixed top-1/2 left-1/2 w-2 h-2 rounded-full bg-yellow-400 z-40 pointer-events-none"
            />
          ))}
        </>
      )}
    </div>
  )
}

// Helper function
function getBadgeRarityColor(rarity: BadgeType['rarity']) {
  const colors = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  }
  return colors[rarity]
}
