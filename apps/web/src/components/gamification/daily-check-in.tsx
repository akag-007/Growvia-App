'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Sparkles, X } from 'lucide-react'
import { useXP } from '@/hooks/gamification/use-xp'
import { performDailyCheckIn, canCheckInToday } from '@/actions/gamification'
import { toast } from 'sonner'

interface DailyCheckInProps {
  onCheckInComplete?: (xpAwarded: number) => void
  disabled?: boolean
  className?: string
}

export function DailyCheckIn({ onCheckInComplete, disabled = false, className = '' }: DailyCheckInProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [particlePositions, setParticlePositions] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [canCheckIn, setCanCheckIn] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckInDate, setLastCheckInDate] = useState<Date | null>(null)

  const xpHook = useXP()

  // Check if user can check in today
  useEffect(() => {
    const checkAvailability = async () => {
      const canCheck = await canCheckInToday()
      setCanCheckIn(canCheck)
    }
    checkAvailability()
  }, [])

  const handleCheckIn = async () => {
    if (!canCheckIn || isChecking || disabled) {
      return
    }

    setIsChecking(true)

    try {
      const result = await performDailyCheckIn()

      if (result.success) {
        setShowAnimation(true)
        setLastCheckInDate(new Date())

        // Generate particle positions
        const particles = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
        }))
        setParticlePositions(particles)

        // Update XP hook
        await xpHook.dailyCheckIn()

        // Notify parent component
        onCheckInComplete?.(result.xp_awarded)

        // Show success toast
        toast.success(`+${result.xp_awarded} XP Daily Check-in!`, {
          icon: <Calendar className="w-5 h-5 text-yellow-400" />,
        })

        // Hide animation after 2.5 seconds
        setTimeout(() => {
          setShowAnimation(false)
          setParticlePositions([])
        }, 2500)
      } else if (result.already_checked_in) {
        toast.info('You\'ve already checked in today!', {
          icon: <Calendar className="w-5 h-5 text-blue-400" />,
        })
      } else {
        toast.error(result.message || 'Failed to check in', {
          icon: <X className="w-5 h-5 text-red-400" />,
        })
      }

      setCanCheckIn(false)
    } catch (error) {
      console.error('Daily check-in error:', error)
      toast.error('Failed to check in. Please try again.', {
        icon: <X className="w-5 h-5 text-red-400" />,
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleCheckIn}
        disabled={!canCheckIn || isChecking || disabled}
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`
          relative w-full
          bg-gradient-to-br from-purple-500 to-pink-500
          text-white font-semibold
          px-6 py-4
          rounded-xl
          overflow-hidden
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${canCheckIn ? 'hover:shadow-2xl' : ''}
        `}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bGx1zIHRpPSIgd2lkdGhvc3RyB3cmUuZyIgc3RyB3cm5vcmUzIgc3RyB3c6PSIgc3RyB3c6PSIgd2lkdGhvc3RyB3c')] opacity-5" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={canCheckIn ? { rotate: [0, 360] } : { rotate: 0 }}
              transition={{
                duration: 2,
                repeat: canCheckIn ? Infinity : 0,
                ease: "linear"
              }}
            >
              <Calendar className="w-5 h-5" />
            </motion.div>
            <div className="text-left">
              <div className="text-sm font-medium">Daily Check-in</div>
              <div className="text-xs opacity-80">
                {canCheckIn ? '+5 XP' : 'Already checked in'}
              </div>
            </div>
          </div>

          {!canCheckIn && lastCheckInDate && (
            <div className="text-right text-xs opacity-80">
              Last: {lastCheckInDate.toLocaleDateString()}
            </div>
          )}

          {isChecking && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5"
            >
              <Sparkles className="w-full h-full" />
            </motion.div>
          )}
        </div>

        {/* XP Gain Animation */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center z-20"
            >
              <div className="text-4xl font-bold text-white flex items-center gap-2">
                +5
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-sm"
                >
                  XP
                </motion.span>
              </div>

              {/* Particle effects */}
              {particlePositions.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: 0,
                    x: particle.x,
                    y: particle.y,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: particle.id * 0.05,
                  }}
                  className="absolute w-3 h-3 rounded-full bg-yellow-300"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow effect for available check-in */}
        {canCheckIn && !showAnimation && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 blur-xl"
          />
        )}
      </motion.button>

      {/* Countdown timer hint */}
      {!canCheckIn && lastCheckInDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-0 right-0 text-center"
        >
          <div className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full">
            Check back tomorrow for +5 XP!
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Standalone daily check-in card for dashboard widgets
export function DailyCheckInCard({ onCheckInComplete }: { onCheckInComplete?: (xpAwarded: number) => void }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
      <DailyCheckIn
        onCheckInComplete={onCheckInComplete}
        className="w-full"
      />
      <p className="text-slate-400 text-sm mt-3 text-center">
        Come back daily to maintain your streak and earn bonus XP!
      </p>
    </div>
  )
}

// Compact version for small widgets
export function CompactDailyCheckIn({ onCheckInComplete }: { onCheckInComplete?: (xpAwarded: number) => void }) {
  return (
    <DailyCheckIn
      onCheckInComplete={onCheckInComplete}
      disabled={false}
      className="!p-2 text-xs"
    >
      <Calendar className="w-4 h-4" />
      <span className="ml-1">+5 XP</span>
    </DailyCheckIn>
  )
}
