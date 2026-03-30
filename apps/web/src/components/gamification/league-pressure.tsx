'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ChevronUp, ChevronDown, Shield, Bell, X } from 'lucide-react'
import { useLeagueNotifications } from '@/hooks/gamification/use-league'
import type { LeaguePressure } from '@/types/gamification'

interface LeaguePressureProps {
  leaguePressure: LeaguePressure | null
  className?: string
  showNotification?: boolean
  onDismiss?: () => void
  compact?: boolean
}

export function LeaguePressure({
  leaguePressure,
  className = '',
  showNotification = true,
  onDismiss,
  compact = false
}: LeaguePressureProps) {
  const {
    checkPromotionAlert,
    checkRelegationAlert,
    dismissAlert,
  } = useLeagueNotifications()

  const [dismissedPromotion, setDismissedPromotion] = useState(false)
  const [dismissedRelegation, setDismissedRelegation] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  // Check alerts on mount
  useEffect(() => {
    if (leaguePressure) {
      const shouldShowPromotion = checkPromotionAlert(leaguePressure)
      const shouldShowRelegation = checkRelegationAlert(leaguePressure)

      setShowAlert(shouldShowPromotion || shouldShowRelegation)

      // Auto-dismiss after 8 seconds
      if (shouldShowPromotion || shouldShowRelegation) {
        const timer = setTimeout(() => {
          setShowAlert(false)
        }, 8000)
        return () => clearTimeout(timer)
      }
    }
  }, [leaguePressure, checkPromotionAlert, checkRelegationAlert])

  const handleDismiss = () => {
    setShowAlert(false)
    onDismiss?.()
  }

  const handleDismissPromotion = () => {
    setDismissedPromotion(true)
  }

  const handleDismissRelegation = () => {
    setDismissedRelegation(true)
  }

  if (!leaguePressure) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading league status...</span>
        </div>
      </div>
    )
  }

  const isInDanger = leaguePressure.in_relegation_zone || leaguePressure.to_relegation <= 20
  const isCloseToPromotion = leaguePressure.in_promotion_zone || leaguePressure.to_promotion <= 20

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Urgent Alert */}
      <AnimatePresence>
        {showAlert && showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-xl p-4 ${
              isInDanger
                ? 'bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-400'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-yellow-400'
            }`}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isInDanger ? 'bg-red-400/30' : 'bg-yellow-400/30'
              }`}>
                <Bell className={`w-5 h-5 ${
                  isInDanger ? 'text-red-400' : 'text-yellow-400'
                } animate-pulse`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 ${
                  isInDanger ? 'text-red-100' : 'text-yellow-100'
                }`}>
                  {isInDanger ? '⚠️ Relegation Warning' : '🎉 Promotion Opportunity'}
                </h3>
                <p className={`text-sm ${
                  isInDanger ? 'text-red-200' : 'text-yellow-200'
                }`}>
                  {isInDanger
                    ? `You're ${leaguePressure.to_relegation} XP from relegation zone! Earn more XP to stay safe.`
                    : `You're only ${leaguePressure.to_promotion} XP away from promotion! Keep pushing!`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* League Pressure Indicators */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Promotion Progress */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`relative rounded-xl p-4 ${
              isCloseToPromotion
                ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-400/50'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ChevronUp className={`w-5 h-5 ${
                isCloseToPromotion ? 'text-green-400' : 'text-slate-400'
              }`} />
              <span className={`font-semibold ${
                isCloseToPromotion ? 'text-green-400' : 'text-slate-300'
              }`}>
                To Promotion
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leaguePressure.to_promotion} XP
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isCloseToPromotion ? 'So close!' : 'Keep working!'}
              </p>
            </div>

            {isCloseToPromotion && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
              >
                HOT
              </motion.div>
            )}
          </motion.div>

          {/* Relegation Danger */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`relative rounded-xl p-4 ${
              isInDanger
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400/50'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ChevronDown className={`w-5 h-5 ${
                isInDanger ? 'text-red-400' : 'text-slate-400'
              }`} />
              <span className={`font-semibold ${
                isInDanger ? 'text-red-400' : 'text-slate-300'
              }`}>
                Before Relegation
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leaguePressure.to_relegation} XP
              </div>
              <p className={`text-xs mt-1 ${
                isInDanger ? 'text-red-300' : 'text-slate-400'
              }`}>
                {isInDanger ? '⚠️ Danger zone!' : 'Safe for now'}
              </p>
            </div>

            {isInDanger && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
              >
                ALERT
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* League Status Message */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`rounded-xl p-4 text-center ${
            leaguePressure.safe_zone
              ? 'bg-blue-500/20 border border-blue-400/30'
              : leaguePressure.in_promotion_zone
              ? 'bg-green-500/20 border border-green-400/30'
              : 'bg-slate-800/50 border border-slate-700'
          }`}
        >
          <div className={`text-lg font-semibold ${
            leaguePressure.safe_zone
              ? 'text-blue-300'
              : leaguePressure.in_promotion_zone
              ? 'text-green-300'
              : 'text-slate-300'
          }`}>
            {leaguePressure.safe_zone && "✅ You're in a safe zone. Good work!"}
            {leaguePressure.in_promotion_zone && "🎉 You're in the promotion zone!"}
            {!leaguePressure.safe_zone && !leaguePressure.in_promotion_zone && "⚡ Keep pushing for that promotion!"}
          </div>
        </motion.div>
      )}

      {/* Compact version */}
      {compact && (
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center justify-between rounded-lg p-3 ${
              isCloseToPromotion
                ? 'bg-green-500/20 border border-green-400/30'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChevronUp className={`w-4 h-4 ${
                isCloseToPromotion ? 'text-green-400' : 'text-slate-400'
              }`} />
              <span className="text-sm text-slate-300">To Promotion</span>
            </div>
            <span className={`font-bold ${
              isCloseToPromotion ? 'text-green-400' : 'text-slate-400'
            }`}>
              {leaguePressure.to_promotion} XP
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`flex items-center justify-between rounded-lg p-3 ${
              isInDanger
                ? 'bg-red-500/20 border border-red-400/30'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 ${
                isInDanger ? 'text-red-400' : 'text-slate-400'
              }`} />
              <span className="text-sm text-slate-300">Before Relegation</span>
            </div>
            <span className={`font-bold ${
              isInDanger ? 'text-red-400' : 'text-slate-400'
            }`}>
              {leaguePressure.to_relegation} XP
            </span>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Widget version for dashboard
export function LeaguePressureWidget({
  leaguePressure,
  onDismiss
}: {
  leaguePressure: LeaguePressure | null
  onDismiss?: () => void
}) {
  return (
    <LeaguePressure
      leaguePressure={leaguePressure}
      onDismiss={onDismiss}
      compact
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl"
    />
  )
}

// Alert banner version
export function LeaguePressureAlert({
  leaguePressure,
  onDismiss
}: {
  leaguePressure: LeaguePressure | null
  onDismiss?: () => void
}) {
  const isInDanger = leaguePressure?.in_relegation_zone || false

  if (!isInDanger) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 right-4 z-50"
    >
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 shadow-2xl flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <h3 className="font-bold mb-1">⚠️ Relegation Warning</h3>
          <p className="text-sm text-red-100">
            You're {leaguePressure.to_relegation} XP from the relegation zone!
            Complete more tasks to stay safe.
          </p>
          <button
            onClick={onDismiss}
            className="mt-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Minimal indicator for small spaces
export function MinimalLeaguePressure({
  leaguePressure
}: {
  leaguePressure: LeaguePressure | null
}) {
  if (!leaguePressure) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Shield className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    )
  }

  const isCloseToPromotion = leaguePressure.to_promotion <= 20
  const isInDanger = leaguePressure.to_relegation <= 20

  return (
    <div className="flex items-center gap-3">
      {isCloseToPromotion && (
        <div className="flex items-center gap-1 text-green-400 text-sm">
          <ChevronUp className="w-3 h-3" />
          <span>+{leaguePressure.to_promotion} XP</span>
        </div>
      )}
      {isInDanger && (
        <div className="flex items-center gap-1 text-red-400 text-sm">
          <AlertTriangle className="w-3 h-3" />
          <span>-{leaguePressure.to_relegation} XP</span>
        </div>
      )}
      {!isCloseToPromotion && !isInDanger && (
        <div className="text-slate-400 text-sm">Safe zone</div>
      )}
    </div>
  )
}
