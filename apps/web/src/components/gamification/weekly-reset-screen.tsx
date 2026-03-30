'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, TrendingUp, TrendingDown, Minus, Star, Zap, Crown, ChevronRight, ArrowUp, ArrowDown, Share2, Calendar, Flame } from 'lucide-react'
import { useLeague } from '@/hooks/gamification/use-league'
import type { WeeklyResetResult } from '@/types/gamification'

interface WeeklyResetScreenProps {
  result: WeeklyResetResult
  weekNumber: number
  year: number
  previousLeague: string
  newLeague: string
  previousRank: number
  newRank: number
  summary: {
    total_xp_earned: number
    tasks_completed: number
    active_days: number
    consistency_multiplier: number
  }
  onDismiss?: () => void
  onViewed?: () => void
  autoDismiss?: boolean
}

export function WeeklyResetScreen({
  result,
  weekNumber,
  year,
  previousLeague,
  newLeague,
  previousRank,
  newRank,
  summary,
  onDismiss,
  onViewed,
  autoDismiss = true
}: WeeklyResetScreenProps) {
  const [showScreen, setShowScreen] = useState(true)
  const [phase, setPhase] = useState<'intro' | 'result' | 'summary'>('intro')
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 8000) // Auto-dismiss after 8 seconds
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onDismiss])

  useEffect(() => {
    // Phase transitions
    const introTimer = setTimeout(() => {
      setPhase('result')
      generateConfetti(result)
    }, 1500)

    const resultTimer = setTimeout(() => {
      setPhase('summary')
    }, 3500)

    return () => {
      clearTimeout(introTimer)
      clearTimeout(resultTimer)
    }
  }, [])

  useEffect(() => {
    // Progress bar animation
    if (phase === 'intro') {
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer)
            return 100
          }
          return prev + 2
        })
      }, 30)
      return () => clearInterval(progressTimer)
    }
  }, [phase])

  const generateConfetti = (resetResult: WeeklyResetResult) => {
    const colors = {
      promoted: ['#fbbf24', '#f97316', '#f59e0b'],
      stayed: ['#6366f1', '#8b5cf6', '#a855f7'],
      relegated: ['#ef4444', '#dc2626', '#b91c1c']
    }

    const selectedColors = colors[resetResult]
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 800 - 400,
      y: Math.random() * 600 - 300,
      color: selectedColors[Math.floor(Math.random() * selectedColors.length)],
    }))

    setConfettiPieces(pieces)
  }

  const handleDismiss = () => {
    setShowScreen(false)
    onDismiss?.()
    onViewed?.()
  }

  const getResultIcon = () => {
    switch (result) {
      case 'promoted':
        return <Trophy className="w-16 h-16" />
      case 'relegated':
        return <TrendingDown className="w-16 h-16" />
      default:
        return <Minus className="w-16 h-16" />
    }
  }

  const getResultTitle = () => {
    switch (result) {
      case 'promoted':
        return '🎉 Promoted!'
      case 'relegated':
        return '😬 Relegated'
      default:
        return '😐 Stayed'
    }
  }

  const getResultDescription = () => {
    switch (result) {
      case 'promoted':
        return 'Congratulations! You\'ve moved up to the next league!'
      case 'relegated':
        return 'Don\'t give up! You\'ll be back stronger next week.'
      default:
        return 'You maintained your position. Keep pushing!'
    }
  }

  const getResultColor = () => {
    switch (result) {
      case 'promoted':
        return 'from-yellow-400 to-orange-500'
      case 'relegated':
        return 'from-red-400 to-red-600'
      default:
        return 'from-blue-400 to-blue-600'
    }
  }

  const getResultBgColor = () => {
    switch (result) {
      case 'promoted':
        return 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20'
      case 'relegated':
        return 'bg-gradient-to-br from-red-400/20 to-red-600/20'
      default:
        return 'bg-gradient-to-br from-blue-400/20 to-blue-600/20'
    }
  }

  const getRankChange = () => {
    const change = newRank - previousRank
    if (change === 0) return { icon: null, text: 'No change', color: 'text-slate-400' }
    if (change < 0) return { icon: <ArrowUp className="w-5 h-5" />, text: `+${Math.abs(change)} positions`, color: 'text-green-400' }
    return { icon: <ArrowDown className="w-5 h-5" />, text: `${change} positions`, color: 'text-red-400' }
  }

  return (
    <AnimatePresence>
      {showScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-2xl mx-auto p-6"
          >
            {/* Main card */}
            <div className={`${getResultBgColor()} backdrop-blur-xl border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl`}>
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Phase 1: Intro with progress bar */}
              {phase === 'intro' && (
                <div className="p-8 text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">Week {weekNumber} Complete!</h2>
                  <div className="relative h-2 bg-white/20 rounded-full overflow-hidden mb-6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500"
                    />
                  </div>
                  <p className="text-white/80 text-lg">Calculating results...</p>
                </div>
              )}

              {/* Phase 2: Result reveal */}
              {phase === 'result' && (
                <div className="p-8 text-center relative">
                  {/* Confetti */}
                  <AnimatePresence>
                    {confettiPieces.map((piece) => (
                      <motion.div
                        key={piece.id}
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 1.5, delay: piece.id * 0.02 }}
                        className="absolute w-2 h-2 rounded-full pointer-events-none"
                        style={{
                          left: `calc(50% + ${piece.x}px)`,
                          top: `calc(50% + ${piece.y}px)`,
                          backgroundColor: piece.color,
                        }}
                      />
                    ))}
                  </AnimatePresence>

                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-6"
                  >
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                      result === 'promoted'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : result === 'relegated'
                        ? 'bg-gradient-to-br from-red-400 to-red-600'
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    } shadow-2xl`}>
                      <div className="text-white">
                        {getResultIcon()}
                      </div>
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                  >
                    {getResultTitle()}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-xl text-white/90 mb-6"
                  >
                    {getResultDescription()}
                  </motion.p>

                  {/* League change */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white/10 backdrop-blur rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/70 text-sm">League Change</span>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        result === 'promoted'
                          ? 'bg-green-500'
                          : result === 'relegated'
                          ? 'bg-red-500'
                          : 'bg-slate-600'
                      }`}>
                        <Crown className="w-4 h-4 text-white" />
                        <span className="text-white font-semibold">
                          {previousLeague} → {newLeague}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-white/70 text-xs mb-1">Previous Rank</div>
                        <div className="text-2xl font-bold text-white">{previousRank}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/70 text-xs mb-1">New Rank</div>
                        <div className={`text-2xl font-bold ${
                          result === 'promoted' ? 'text-green-400' :
                          result === 'relegated' ? 'text-red-400' :
                          'text-white'
                        }`}>
                          {newRank}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-3 text-white">
                      {getRankChange().icon}
                      <span className={`font-semibold ${getRankChange().color}`}>
                        {getRankChange().text}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Phase 3: Summary stats */}
              {phase === 'summary' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Week {weekNumber} Summary
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: <Star className="w-5 h-5" />, label: 'Total XP', value: summary.total_xp_earned, color: 'text-yellow-400' },
                      { icon: <Zap className="w-5 h-5" />, label: 'Tasks', value: summary.tasks_completed, color: 'text-blue-400' },
                      { icon: <Calendar className="w-5 h-5" />, label: 'Active Days', value: summary.active_days, color: 'text-green-400' },
                      { icon: <Flame className="w-5 h-5" />, label: 'Consistency', value: `${(summary.consistency_multiplier * 100).toFixed(0)}%`, color: 'text-orange-400' },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white/10 backdrop-blur rounded-xl p-4 text-center"
                      >
                        <div className={`mb-2 ${stat.color}`}>
                          <stat.icon className="w-8 h-8 mx-auto" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-white/70 text-sm">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDismiss}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className={`w-full ${getResultColor()} text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2`}
                  >
                    Continue to Gamification
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Compact version for in-app notifications
export function CompactWeeklyReset({
  result,
  previousLeague,
  newLeague,
  onViewed
}: {
  result: WeeklyResetResult
  previousLeague: string
  newLeague: string
  onViewed?: () => void
}) {
  const getResultIcon = () => {
    switch (result) {
      case 'promoted':
        return <Trophy className="w-6 h-6" />
      case 'relegated':
        return <TrendingDown className="w-6 h-6" />
      default:
        return <Minus className="w-6 h-6" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-slate-800/90 backdrop-blur-sm border rounded-xl p-4 ${
        result === 'promoted'
          ? 'border-yellow-400/50'
          : result === 'relegated'
          ? 'border-red-400/50'
          : 'border-blue-400/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          result === 'promoted'
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : result === 'relegated'
            ? 'bg-gradient-to-br from-red-400 to-red-600'
            : 'bg-gradient-to-br from-blue-400 to-blue-600'
        }`}>
          <div className="text-white">
            {getResultIcon()}
          </div>
        </div>
        <div className="flex-1">
          <div className={`font-bold text-lg mb-1 ${
            result === 'promoted'
              ? 'text-yellow-400'
              : result === 'relegated'
              ? 'text-red-400'
              : 'text-blue-400'
          }`}>
            {result === 'promoted' ? '🎉 Promoted' : result === 'relegated' ? '😬 Relegated' : '😐 Stayed'}
          </div>
          <div className="text-slate-400 text-sm">
            {previousLeague} → {newLeague}
          </div>
        </div>
        <button
          onClick={onViewed}
          className="text-slate-400 hover:text-white transition-colors ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

// Preview component for dashboard
export function WeeklyResetPreview({
  weekNumber,
  daysUntilReset
}: {
  weekNumber: number
  daysUntilReset: number
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">Week {weekNumber} Reset</h3>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>{daysUntilReset} days left</span>
        </div>
      </div>
      <div className="w-full bg-slate-700/50 rounded-lg h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((7 - daysUntilReset) / 7) * 100}%` }}
          transition={{ duration: 1 }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>
    </div>
  )
}
