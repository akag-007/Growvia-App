'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Snowflake, Shield, AlertCircle, CheckCircle, X, Clock, Zap } from 'lucide-react'
import { useStreak } from '@/hooks/gamification/use-streak'
import { useStreakFreeze } from '@/actions/gamification'
import { toast } from 'sonner'
import type { StreakFreezeResult } from '@/types/gamification'

interface StreakFreezeProps {
  currentStreak: number
  streakFreezes: number
  totalXP: number
  onFreezeUsed?: (result: StreakFreezeResult) => void
  compact?: boolean
  showWhenInDanger?: boolean
  className?: string
}

export function StreakFreeze({
  currentStreak,
  streakFreezes,
  totalXP,
  onFreezeUsed,
  compact = false,
  showWhenInDanger = true,
  className = ''
}: StreakFreezeProps) {
  const [showOffer, setShowOffer] = useState(false)
  const [isUsingFreeze, setIsUsingFreeze] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const { canUseFreeze, freezeCost } = useStreak([], totalXP, streakFreezes)

  // Calculate freeze cost
  const cost = 50 + (currentStreak * 10)

  // Check if streak freeze should be offered
  useEffect(() => {
    const checkOffer = () => {
      const hoursUntilBreak = calculateHoursUntilBreak()

      if (showWhenInDanger) {
        // Show offer only if in danger
        setShowOffer(hoursUntilBreak <= 4 && hoursUntilBreak !== Infinity)
      } else {
        // Always show offer if user has freezes
        setShowOffer(streakFreezes > 0 && canUseFreeze)
      }
    }

    checkOffer()

    // Start countdown if offer is shown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(countdownInterval)
          setShowOffer(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [streakFreezes, canUseFreeze, showWhenInDanger])

  const handleUseFreeze = async () => {
    if (!canUseFreeze || streakFreezes <= 0) {
      return
    }

    setIsUsingFreeze(true)

    try {
      const result = await useStreakFreeze()

      if (result.success) {
        toast.success(result.message || 'Streak saved!', {
          icon: <Snowflake className="w-5 h-5 text-blue-400" />,
        })

        onFreezeUsed?.(result)
        setShowOffer(false)
      } else {
        toast.error(result.message || 'Failed to use streak freeze', {
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        })
      }
    } catch (error) {
      console.error('Streak freeze error:', error)
      toast.error('Failed to use streak freeze. Please try again.', {
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      })
    } finally {
      setIsUsingFreeze(false)
    }
  }

  const handleDismiss = () => {
    setShowOffer(false)
  }

  const calculateHoursUntilBreak = (): number => {
    // This would be calculated from actual streak data
    // For now, assume 2 hours until break
    return 2
  }

  const isHighCost = cost > 100
  const isVeryHighCost = cost > 200

  return (
    <AnimatePresence>
      {showOffer && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`relative ${compact ? '' : 'fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm'}`}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`${
              compact
                ? 'w-full max-w-md'
                : 'w-full max-w-lg mx-auto'
            } bg-slate-900 border-2 ${
              isVeryHighCost
                ? 'border-orange-400'
                : isHighCost
                ? 'border-yellow-400'
                : 'border-blue-400'
            } rounded-2xl p-6 shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isVeryHighCost
                      ? 'bg-orange-500/30'
                      : isHighCost
                      ? 'bg-yellow-500/30'
                      : 'bg-blue-500/30'
                  }`}
                >
                  <Snowflake className={`w-6 h-6 ${
                    isVeryHighCost
                      ? 'text-orange-400'
                      : isHighCost
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`} />
                </motion.div>
                <div>
                  <h2 className={`text-xl font-bold ${
                    isVeryHighCost
                      ? 'text-orange-400'
                      : isHighCost
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`}>
                    Streak Freeze
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Protect your {currentStreak}-day streak!
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cost warning */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl p-4 mb-4 ${
                isVeryHighCost
                  ? 'bg-orange-500/20 border border-orange-400/30'
                  : isHighCost
                  ? 'bg-yellow-500/20 border border-yellow-400/30'
                  : 'bg-blue-500/20 border border-blue-400/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${
                    isVeryHighCost
                      ? 'text-orange-400'
                      : isHighCost
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`} />
                  <span className={`font-semibold ${
                    isVeryHighCost
                      ? 'text-orange-400'
                      : isHighCost
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`}>
                    XP Cost: {cost}
                  </span>
                </div>
                {isVeryHighCost && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    HIGH
                  </motion.div>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Base cost (50) + streak multiplier ({currentStreak} × 10)
              </p>
            </motion.div>

            {/* User info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Current Streak</div>
                <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Freezes Available</div>
                <div className="text-2xl font-bold text-blue-400">{streakFreezes}</div>
              </div>
            </div>

            {/* Balance check */}
            {!canUseFreeze && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-4"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Not enough XP!</span>
                </div>
                <p className="text-red-300 text-sm mt-1">
                  You need {cost} XP to use streak freeze. Your current XP: {totalXP}
                </p>
              </motion.div>
            )}

            {/* Countdown */}
            {countdown > 0 && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="bg-slate-800/50 rounded-xl p-3 mb-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-sm">Offer expires in {countdown}s</span>
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleUseFreeze}
                disabled={!canUseFreeze || isUsingFreeze}
                whileHover={{ scale: canUseFreeze ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 ${
                  canUseFreeze
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
                    : 'bg-slate-700'
                } text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isUsingFreeze ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Using...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Use Streak Freeze</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Maybe Later
              </motion.button>
            </div>

            {/* Info text */}
            <p className="text-slate-400 text-xs text-center mt-3">
              Streak freeze protects your current streak from breaking.
              You'll lose {cost} XP but keep your momentum!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Widget version for dashboard
export function StreakFreezeWidget({
  currentStreak,
  streakFreezes,
  totalXP,
  onFreezeUsed
}: {
  currentStreak: number
  streakFreezes: number
  totalXP: number
  onFreezeUsed?: (result: StreakFreezeResult) => void
}) {
  return (
    <StreakFreeze
      currentStreak={currentStreak}
      streakFreezes={streakFreezes}
      totalXP={totalXP}
      onFreezeUsed={onFreezeUsed}
      compact
      showWhenInDanger={false}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl"
    />
  )
}

// Minimal indicator
export function MinimalStreakFreeze({
  streakFreezes,
  canUseFreeze,
  freezeCost,
  onUseFreeze
}: {
  streakFreezes: number
  canUseFreeze: boolean
  freezeCost: number
  onUseFreeze?: () => void
}) {
  return (
    <button
      onClick={onUseFreeze}
      disabled={!canUseFreeze || streakFreezes <= 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        canUseFreeze
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white'
          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
      } disabled:opacity-50`}
    >
      <Snowflake className="w-4 h-4" />
      <span className="text-sm font-medium">
        {streakFreezes} Freeze
      </span>
    </button>
  )
}

// Alert banner for streak danger
export function StreakFreezeAlert({
  hoursUntilBreak,
  onUseFreeze
}: {
  hoursUntilBreak: number
  onUseFreeze?: () => void
}) {
  const isCritical = hoursUntilBreak <= 2

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 right-4 z-50"
    >
      <div className={`bg-gradient-to-r ${
        isCritical
          ? 'from-red-500 to-red-600'
          : 'from-orange-500 to-orange-600'
      } text-white rounded-xl p-4 shadow-2xl flex items-start gap-3`}>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCritical ? 'bg-red-400/30' : 'bg-orange-400/30'
          }`}
        >
          <Clock className={`w-5 h-5 ${isCritical ? 'text-red-400' : 'text-orange-400'} animate-pulse`} />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">
            {isCritical ? '🚨 Critical! Streak ending soon!' : '⚠️ Warning: Your streak is at risk'}
          </h3>
          <p className={`text-sm ${isCritical ? 'text-red-100' : 'text-orange-100'}`}>
            Your streak will break in {hoursUntilBreak} hour{hoursUntilBreak !== 1 ? 's' : ''}!
            Use a streak freeze to protect your progress.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUseFreeze}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Use Streak Freeze
            </button>
            <button
              onClick={() => {
                // Dismiss the alert
                const alert = document.querySelector('[data-streak-alert]')
                if (alert) {
                  (alert as HTMLElement).style.display = 'none'
                }
              }}
              className="text-white/70 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
