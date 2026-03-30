'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react'
import { getWeeklyXPData } from '@/actions/gamification'
import type { WeeklyXPData } from '@/types/gamification'

interface WeeklyXPGraphProps {
  className?: string
  showPeaks?: boolean
  animated?: boolean
  daysToShow?: number
}

export function WeeklyXPGraph({
  className = '',
  showPeaks = true,
  animated = true,
  daysToShow = 7
}: WeeklyXPGraphProps) {
  const [xpData, setXPData] = useState<WeeklyXPData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<WeeklyXPData | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await getWeeklyXPData()

        // Fill in missing days
        const fullWeekData = fillMissingDays(data, daysToShow)
        setXPData(fullWeekData)
      } catch (error) {
        console.error('Error loading weekly XP data:', error)
        setXPData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [daysToShow])

  // Calculate graph statistics
  const peakDay = xpData.length > 0 ? xpData.reduce((max, day) => (day.xp > max.xp ? day : max), xpData[0]) : null
  const totalXP = xpData.reduce((sum, day) => sum + day.xp, 0)
  const averageXP = xpData.length > 0 ? Math.round(totalXP / xpData.length) : 0

  // Determine trend
  const trend = xpData.length >= 2
    ? (xpData[xpData.length - 1].xp > xpData[0].xp ? 'increasing' : 'decreasing')
    : 'stable'

  // Calculate path for SVG line
  const graphPath = createGraphPath(xpData)

  // Calculate bar heights (normalized to 0-100%)
  const maxXP = Math.max(...xpData.map(d => d.xp), 1)
  const barHeights = xpData.map(d => (d.xp / maxXP) * 100)

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Weekly XP Progress
        </h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
            Loading...
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              {trend === 'increasing' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : trend === 'decreasing' ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-slate-400">
                {trend === 'increasing' ? 'Up' : trend === 'decreasing' ? 'Down' : 'Stable'}
              </span>
            </div>
            <div className="text-slate-400">
              Total: <span className="text-white font-semibold">{totalXP} XP</span>
            </div>
            <div className="text-slate-400">
              Avg: <span className="text-white font-semibold">{averageXP} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* Graph Container */}
      <div className="relative">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
          </div>
        ) : xpData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <p>No XP data for this week yet</p>
          </div>
        ) : (
          <>
            {/* SVG Line Graph */}
            <svg
              className="w-full h-64"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[...Array(5)].map((_, i) => {
                const y = (i / 4) * 200
                return (
                  <line
                    key={i}
                    x1="0"
                    y1={y}
                    x2="400"
                    y2={y}
                    stroke="#475569"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                )
              })}

              {/* Average line */}
              <line
                x1="0"
                y1={(1 - averageXP / maxXP) * 200}
                x2="400"
                y2={(1 - averageXP / maxXP) * 200}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />

              {/* XP line with animation */}
              {animated && (
                <motion.path
                  d={graphPath}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              )}

              {!animated && (
                <path
                  d={graphPath}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Peak indicator */}
              {showPeaks && peakDay && (
                <motion.g
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <circle
                    cx={peakDay.xp > 0 ? (peakDay.xp / maxXP) * 400 : 0}
                    cy={peakDay.xp > 0 ? (1 - peakDay.xp / maxXP) * 200 : 200}
                    r="8"
                    fill="#fbbf24"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                  <text
                    x={peakDay.xp > 0 ? (peakDay.xp / maxXP) * 400 : 0}
                    y={(peakDay.xp > 0 ? (1 - peakDay.xp / maxXP) * 200 : 200) - 15}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    Peak: {peakDay.xp} XP
                  </text>
                </motion.g>
              )}

              {/* Data points */}
              {xpData.map((day, index) => {
                const x = (index / (xpData.length - 1)) * 400
                const y = (1 - (day.xp / maxXP)) * 200

                return (
                  <motion.g
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={day.xp === peakDay?.xp ? "#fbbf24" : "#6366f1"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  </motion.g>
                )
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-2">
              {xpData.map((day, index) => (
                <div
                  key={index}
                  className={`text-center text-xs ${
                    hoveredDay?.date.getTime() === day.date.getTime() ? 'text-yellow-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {day.day_name}
                </div>
              ))}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredDay && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-10"
                  style={{
                    left: `${(xpData.indexOf(hoveredDay) / (xpData.length - 1)) * 100}%`
                  }}
                >
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
                    <div className="font-semibold">{hoveredDay.day_name}</div>
                    <div className="text-yellow-400 font-bold">{hoveredDay.xp} XP</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {hoveredDay.tasks} tasks • {hoveredDay.hours}h
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Footer statistics */}
      {xpData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{totalXP}</div>
            <div className="text-slate-400 text-xs">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{averageXP}</div>
            <div className="text-slate-400 text-xs">Average XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{peakDay?.xp || 0}</div>
            <div className="text-slate-400 text-xs">Peak Day</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to fill missing days
function fillMissingDays(data: WeeklyXPData[], daysToShow: number): WeeklyXPData[] {
  const today = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Create array for last N days
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (daysToShow - 1 - i))

    const dayData = data.find(d =>
      d.date.toDateString() === date.toDateString()
    )

    if (dayData) {
      return dayData
    }

    return {
      date,
      xp: 0,
      tasks: 0,
      hours: 0,
      day_of_week: date.getDay(),
      day_name: dayNames[date.getDay()],
    }
  })

  return days
}

// Helper function to create SVG path
function createGraphPath(data: WeeklyXPData[]): string {
  if (data.length === 0) return ''

  const maxXP = Math.max(...data.map(d => d.xp), 1)

  const points = data.map((day, index) => {
    const x = (index / (data.length - 1)) * 400
    const y = (1 - (day.xp / maxXP)) * 200
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return points
}

// Compact version for dashboard widgets
export function CompactWeeklyXPGraph({ className = '' }: { className?: string }) {
  return (
    <WeeklyXPGraph
      className={`!p-4 ${className}`}
      showPeaks={false}
      daysToShow={7}
    />
  )
}
