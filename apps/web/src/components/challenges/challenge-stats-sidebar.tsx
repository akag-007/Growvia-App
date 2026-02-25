'use client'

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, TrendingUp, TrendingDown, Calendar,
    Target, Zap, Clock, Info, Loader2, Sparkles, BarChart3
} from 'lucide-react'
import { Challenge } from '@/stores/challenges'
import {
    format, parseISO, startOfMonth, endOfMonth,
    subMonths, isWithinInterval, getDate, getDaysInMonth,
    differenceInDays, differenceInWeeks, addDays
} from 'date-fns'
import { cn } from '@/lib/utils'
import NumberFlow from '@number-flow/react'

interface Props {
    challenge: Challenge
    isOpen: boolean
    onToggle: () => void
}

export function ChallengeStatsSidebar({ challenge, isOpen, onToggle }: Props) {
    const stats = useMemo(() => {
        const today = new Date()
        const completedCells = challenge.gridCells.filter(c => c.status === 'completed')

        // Month calculations
        const thisMonthStart = startOfMonth(today)
        const thisMonthEnd = endOfMonth(today)
        const prevMonthStart = startOfMonth(subMonths(today, 1))
        const prevMonthEnd = endOfMonth(subMonths(today, 1))

        const thisMonthCells = completedCells.filter(c =>
            c.completedAt && isWithinInterval(parseISO(c.completedAt), { start: thisMonthStart, end: thisMonthEnd })
        )
        const prevMonthCells = completedCells.filter(c =>
            c.completedAt && isWithinInterval(parseISO(c.completedAt), { start: prevMonthStart, end: prevMonthEnd })
        )

        const thisMonthCount = thisMonthCells.length
        const prevMonthCount = prevMonthCells.length

        // 1. Daily Average (This Month)
        const currentDayOfMonth = getDate(today)
        const dailyAvg = thisMonthCount / currentDayOfMonth

        // 2. Projected Monthly Total
        const daysInMonth = getDaysInMonth(today)
        const projectedMonthly = dailyAvg * daysInMonth

        // 3. MoM Growth
        const momGrowth = prevMonthCount === 0
            ? (thisMonthCount > 0 ? 100 : 0)
            : ((thisMonthCount - prevMonthCount) / prevMonthCount) * 100

        // 4. Countdown
        const endDate = addDays(parseISO(challenge.startDate), challenge.durationDays - 1)
        const daysLeft = Math.max(0, differenceInDays(endDate, today) + 1) // +1 to include today if it's the target
        const weeksLeft = Math.max(0, Math.ceil(daysLeft / 7))

        // Progress Ring
        const totalHours = challenge.totalCells
        const completedCount = completedCells.length
        const overallPct = totalHours > 0 ? (completedCount / totalHours) * 100 : 0
        const radius = 45
        const circumference = 2 * Math.PI * radius
        const offset = circumference - (overallPct / 100) * circumference

        return {
            dailyAvg,
            projectedMonthly,
            momGrowth,
            daysLeft,
            weeksLeft,
            completedCount,
            totalHours,
            overallPct,
            circumference,
            offset,
            unit: challenge.trackingUnit === 'hours' ? 'hrs' : challenge.trackingUnit === 'weeks' ? 'wks' : 'days'
        }
    }, [challenge])

    const tips = [
        "Small steps every day lead to big results. Keep going!",
        "Consistency is more important than intensity.",
        "You're doing great! Every cell marked is a win.",
        "Visualize your end goal when it feels tough.",
        "Take a moment to celebrate how far you've come."
    ]
    const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [isOpen])

    return (
        <>
            {/* Sidebar Toggle Handle (Fixed to right edge) */}
            <motion.button
                onClick={() => onToggle()}
                initial={false}
                animate={{
                    x: isOpen ? -340 : 0,
                    opacity: 1
                }}
                className={cn(
                    "fixed right-0 top-1/2 -translate-y-1/2 z-[110] px-2 py-8 rounded-l-2xl border-l border-y border-zinc-800 transition-all group flex flex-col items-center gap-4",
                    isOpen
                        ? "bg-zinc-900 text-zinc-400 hover:text-white"
                        : "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
                )}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <BarChart3 size={20} />
                </motion.div>
                <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-[0.2em] rotate-180">
                    {isOpen ? 'Hide Stats' : 'Show Stats'}
                </span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onToggle}
                            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-[340px] bg-[#09090b] border-l border-zinc-800/50 shadow-2xl z-[101] overflow-y-auto scrollbar-none"
                        >
                            {/* Header (Non-sticky to prevent clashing) */}
                            <div className="p-6 border-b border-zinc-900/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <BarChart3 className="text-emerald-400" size={18} />
                                        </div>
                                        Analytics
                                    </h2>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Performance Insights</p>
                                </div>
                                <button
                                    onClick={onToggle}
                                    className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white transition-all hover:bg-zinc-800 active:scale-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Stats Grid (Now at the top) */}
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Daily Average card */}
                                    <StatCard
                                        icon={<Clock size={14} />}
                                        label="Daily Average"
                                        value={stats.dailyAvg.toFixed(1)}
                                        unit={`${stats.unit}/day`}
                                        color="violet"
                                    />

                                    {/* Projected Month card */}
                                    <StatCard
                                        icon={<Zap size={14} />}
                                        label="Projected Month"
                                        value={stats.projectedMonthly.toFixed(0)}
                                        unit={stats.unit}
                                        color="blue"
                                    />

                                    {/* MoM Growth card */}
                                    <StatCard
                                        icon={stats.momGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        label="MoM Growth"
                                        value={`${stats.momGrowth >= 0 ? '+' : ''}${stats.momGrowth.toFixed(1)}%`}
                                        unit="Progress"
                                        color={stats.momGrowth >= 0 ? 'emerald' : 'red'}
                                        isTrend
                                    />
                                </div>

                                {/* Overall Progress Card (Now below grid) */}
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="relative flex flex-col items-center justify-center p-6 bg-zinc-900/30 rounded-[32px] border border-emerald-500/10 overflow-hidden group"
                                >
                                    {/* Animated Background Blur */}
                                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.1, 0.2, 0.1]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-[50px]"
                                    />

                                    <div className="relative w-36 h-36">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                                            {/* Track */}
                                            <circle
                                                cx="80" cy="80" r="72"
                                                className="fill-none stroke-zinc-800/50"
                                                strokeWidth="10"
                                            />
                                            {/* Progress */}
                                            <motion.circle
                                                cx="80" cy="80" r="72"
                                                className="fill-none stroke-emerald-500"
                                                strokeWidth="10"
                                                strokeDasharray={452}
                                                initial={{ strokeDashoffset: 452 }}
                                                animate={{ strokeDashoffset: 452 - (452 * (stats.overallPct / 100)) }}
                                                transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                                                strokeLinecap="round"
                                                style={{ filter: "drop-shadow(0 0 12px #10b981)" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <div className="flex items-baseline">
                                                <NumberFlow
                                                    value={stats.completedCount}
                                                    className="text-4xl font-black text-white"
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] mt-0.5 uppercase">
                                                OF {stats.totalHours}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Global Momentum</p>
                                </motion.div>

                                {/* Countdown Section */}
                                <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-[28px] space-y-3 relative overflow-hidden group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                            <Calendar size={12} className="text-orange-400" />
                                        </div>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Time Remaining</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center group-hover:border-zinc-700 transition-colors">
                                            <span className="text-xl font-black text-white">{stats.daysLeft}</span>
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Days</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center group-hover:border-zinc-700 transition-colors">
                                            <span className="text-xl font-black text-white">{stats.weeksLeft}</span>
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Weeks</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tip card */}
                                <motion.div
                                    whileHover={{ scale: 0.98 }}
                                    className="bg-zinc-900/20 border border-zinc-800/30 rounded-2xl p-4 relative overflow-hidden group cursor-default"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent group-hover:from-violet-600/10 transition-colors" />
                                    <Sparkles className="absolute top-2 right-2 text-violet-400/20 group-hover:text-violet-400/40 transition-colors" size={24} />
                                    <div className="flex items-center gap-2 mb-1 relative z-10">
                                        <Info size={10} className="text-violet-400" />
                                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Growth Mindset</span>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 leading-relaxed italic relative z-10 group-hover:text-zinc-400 transition-colors">
                                        "{randomTip}"
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

function StatCard({ icon, label, value, unit, color, isTrend }: {
    icon: React.ReactNode,
    label: string,
    value: string | number,
    unit: string,
    color: string,
    isTrend?: boolean
}) {
    const colors: Record<string, { bg: string, border: string, text: string, glow: string }> = {
        emerald: { bg: "from-emerald-600/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "rgba(16,185,129,0.2)" },
        violet: { bg: "from-violet-600/10", border: "border-violet-500/20", text: "text-violet-400", glow: "rgba(139,92,246,0.2)" },
        blue: { bg: "from-blue-600/10", border: "border-blue-500/20", text: "text-blue-400", glow: "rgba(59,130,246,0.2)" },
        red: { bg: "from-red-600/10", border: "border-red-500/20", text: "text-red-400", glow: "rgba(239,68,68,0.2)" },
    }

    const c = colors[color]

    return (
        <motion.div
            whileHover={{ x: 4, y: -1 }}
            className={cn(
                "group relative p-3 rounded-2xl border transition-all duration-500 overflow-hidden cursor-default",
                c.border,
                "bg-zinc-950/50 hover:bg-zinc-950/80"
            )}
        >
            {/* Dynamic Background Hue/Shade */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                c.bg
            )} />

            {/* Animated Glow on Hover */}
            <motion.div
                animate={{
                    opacity: [0, 0.8, 0],
                    scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-8 -left-8 w-24 h-24 rounded-full blur-[30px] pointer-events-none"
                style={{ backgroundColor: c.glow }}
            />

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                        "bg-zinc-950/80",
                        c.border,
                        `group-hover:border-${color}-500/40`
                    )}>
                        <div className={c.text}>{icon}</div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-0 group-hover:text-zinc-400 transition-colors">
                            {label}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-white">
                                {value}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                {unit}
                            </span>
                        </div>
                    </div>
                </div>
                {isTrend && (
                    <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(c.text, "opacity-60")}
                    >
                        {icon}
                    </motion.div>
                )}
            </div>

            {/* Animated Border Line (Pseudo-border) */}
            <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ color: c.glow.replace('0.2', '0.5') }} />
        </motion.div>
    )
}
