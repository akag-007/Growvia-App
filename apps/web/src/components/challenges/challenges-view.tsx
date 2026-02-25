'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Target, Plus, Trash2, Lock, Globe, Clock, Users,
    Flame, Zap, ArrowRight
} from 'lucide-react'
import { useChallengesStore, Challenge } from '@/stores/challenges'
import { CreateChallengeModal } from './create-challenge-modal'
import { ChallengeDetailView } from './challenge-detail-view'
import { deleteChallenge as deleteChallengeAction } from '@/actions/challenges'
import { cn } from '@/lib/utils'
import { format, addDays, parseISO } from 'date-fns'
import { MovingBorder } from '@/components/ui/moving-border'
import { Button } from '@/components/ui/button'

// ─── Circular Progress Component ─────────────────────────────────────────────

function CircularProgress({ percent, size = 60, strokeWidth = 5, color = '#8b5cf6' }: {
    percent: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-zinc-800"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{percent}%</span>
        </div>
    )
}

// ─── Community challenge templates ───────────────────────────────────────────

const COMMUNITY_CHALLENGES = [
    {
        id: 'c1',
        title: '100 Days of Code',
        description: 'Commit to coding for at least 1 hour every day for 100 days. Share your progress daily.',
        durationDays: 100,
        trackingUnit: 'days' as const,
        emoji: '💻',
        accent: '#3b82f6',
        participants: '142K',
    },
    {
        id: 'c2',
        title: '6-Month DSA Prep',
        description: 'Systematic DSA preparation covering arrays, trees, graphs, and dynamic programming.',
        durationDays: 180,
        trackingUnit: 'days' as const,
        emoji: '🧩',
        accent: '#8b5cf6',
        participants: '38K',
    },
    {
        id: 'c3',
        title: '30-Day Fitness',
        description: 'Daily workout challenge. Track each session and build an unbreakable fitness habit.',
        durationDays: 30,
        trackingUnit: 'days' as const,
        emoji: '🏋️',
        accent: '#ef4444',
        participants: '91K',
    },
    {
        id: 'c4',
        title: '2000 Hours Challenge',
        description: 'Log 2000 hours of deep work over 6 months. Quality, focused sessions only.',
        durationDays: 180,
        trackingUnit: 'hours' as const,
        emoji: '⏳',
        accent: '#f59e0b',
        participants: '12K',
    },
    {
        id: 'c5',
        title: 'Read 52 Books',
        description: 'Read one book per week for an entire year. Track your weekly reading progress.',
        durationDays: 365,
        trackingUnit: 'weeks' as const,
        emoji: '📚',
        accent: '#10b981',
        participants: '27K',
    },
    {
        id: 'c6',
        title: '365 Days of Journaling',
        description: 'Journal every single day for a year. Build self-reflection as a lifelong habit.',
        durationDays: 365,
        trackingUnit: 'days' as const,
        emoji: '✍️',
        accent: '#ec4899',
        participants: '19K',
    },
]

// ─── Challenge card ───────────────────────────────────────────────────────────

function ChallengeCard({ challenge, onView, onDelete }: {
    challenge: Challenge
    onView: () => void
    onDelete: () => void
}) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const completed = challenge.gridCells.filter((c) => c.status === 'completed').length
    const pct = Math.round((completed / challenge.totalCells) * 100)
    const endDate = addDays(parseISO(challenge.startDate), challenge.durationDays - 1)

    return (
        <div
            className="group relative overflow-hidden rounded-2xl cursor-pointer p-[1.5px] h-[180px]"
            onClick={onView}
        >
            {/* Moving shimmer border — dual tone, thin streak */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <MovingBorder duration={3500} rx="1.5rem" ry="1.5rem">
                    {/* Thin elongated dual-tone shimmer streak */}
                    <div
                        className="opacity-90"
                        style={{
                            width: '80px',
                            height: '5px',
                            background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
                            borderRadius: '9999px',
                            boxShadow: '0 0 12px 4px #8b5cf680, 0 0 24px 8px #38bdf840',
                        }}
                    />
                </MovingBorder>
            </div>

            {/* Card Content Container */}
            <div className={cn(
                "relative z-10 w-full h-full bg-zinc-950 rounded-[calc(1rem+0.5px)] p-6 overflow-hidden flex flex-col justify-between",
                "transition-all duration-300 ease-in-out",
                "border border-zinc-800/60 group-hover:border-transparent",
                /* subtle glow on hover via box-shadow */
                "group-hover:shadow-[0_0_30px_-4px_rgba(139,92,246,0.35),0_0_60px_-12px_rgba(56,189,248,0.2)]"
            )}>
                {/* 1. Header: Always Visible */}
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-xl font-bold text-white truncate group-hover:text-violet-100 transition-colors">
                            {challenge.title}
                        </h3>
                    </div>
                    <CircularProgress percent={pct} size={48} strokeWidth={4} color="#8b5cf6" />
                </div>

                {/* 2. Middle Content: Reveal on Hover */}
                <div className="relative flex-1 mt-2 mb-8 pointer-events-none">
                    {/* Default View: Just the Date at the bottom of the card initially */}
                    <p className="absolute bottom-0 left-0 text-xs text-zinc-500 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2">
                        Ends {format(endDate, 'MMM d, yyyy')}
                    </p>

                    {/* Hover View: badges only */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-900/30 text-violet-300 border border-violet-800/40 capitalize">
                            {challenge.trackingUnit}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {challenge.durationDays}d
                        </span>
                    </div>
                </div>

                {/* 3. Actions: Reveal on Hover */}
                <div className="absolute -bottom-12 left-0 right-0 p-6 pt-2 opacity-0 transition-all duration-500 group-hover:bottom-0 group-hover:opacity-100 flex items-center justify-between bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                alert("Edit functionality coming soon")
                            }}
                            className="h-8 text-[10px] font-bold uppercase tracking-wider border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                        >
                            Edit
                        </Button>
                        {confirmDelete ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={onDelete}
                                    className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-950/60 text-red-400 hover:bg-red-900 border border-red-800 transition-colors">
                                    Delete
                                </button>
                                <button onClick={() => setConfirmDelete(false)} className="text-zinc-600 hover:text-zinc-400 text-xs px-1">✕</button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                                className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <Button
                        size="sm"
                        className="h-8 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider"
                    >
                        Open <ArrowRight size={12} className="ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Community card ───────────────────────────────────────────────────────────

function CommunityCard({ c, onJoin }: { c: typeof COMMUNITY_CHALLENGES[0]; onJoin: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onJoin}
            className={cn(
                'relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 cursor-pointer',
                'transition-all duration-300 group',
                'hover:border-zinc-600 hover:shadow-xl hover:-translate-y-0.5',
                'active:scale-[0.99]',
            )}
        >
            {/* Accent top bar */}
            <div className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full" style={{ backgroundColor: c.accent }} />

            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: c.accent + '22', border: `1px solid ${c.accent}44` }}>
                    {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{c.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{c.description}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 capitalize">
                    {c.trackingUnit}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {c.durationDays}d
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                    <Users size={9} /> {c.participants}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                    <Flame size={11} style={{ color: c.accent }} /> Popular challenge
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold transition-colors group-hover:opacity-100 opacity-70"
                    style={{ color: c.accent }}>
                    Join <ArrowRight size={11} />
                </span>
            </div>
        </motion.div>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-violet-900/20 border border-violet-800/30 flex items-center justify-center mb-5">
                <Target size={36} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No challenges yet</h3>
            <p className="text-zinc-500 text-sm max-w-xs mb-6">
                Create your first challenge and start tracking your progress, day by day.
            </p>
            <button
                onClick={onNew}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-xl shadow-violet-600/30"
            >
                <Plus size={16} /> Create a Challenge
            </button>
        </div>
    )
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Tab = 'mine' | 'community'

import type { ChallengeRow } from '@/actions/challenges'

export function ChallengesView({ initialChallenges }: { initialChallenges: ChallengeRow[] }) {
    const { challenges, hydrate, removeChallengeOptimistic, addChallengeOptimistic, confirmChallenge, setActiveChallenge, activeChallengeId } = useChallengesStore()
    const [showCreate, setShowCreate] = useState(false)
    const [tab, setTab] = useState<Tab>('mine')

    // Hydrate store from server-fetched data on mount
    React.useEffect(() => { hydrate(initialChallenges) }, [])

    const handleDelete = (id: string) => {
        removeChallengeOptimistic(id)
        deleteChallengeAction(id) // fire-and-forget
    }

    const handleJoinCommunity = async (c: typeof COMMUNITY_CHALLENGES[0]) => {
        const { createChallenge } = await import('@/actions/challenges')
        const tempId = 'tmp-' + Date.now()
        const total = c.trackingUnit === 'hours' ? c.durationDays * 24 : c.trackingUnit === 'weeks' ? Math.ceil(c.durationDays / 7) : c.durationDays
        addChallengeOptimistic({
            id: tempId, title: c.title, description: c.description, type: 'community',
            isPrivate: false, startDate: new Date().toISOString().split('T')[0],
            durationDays: c.durationDays, trackingUnit: c.trackingUnit,
            totalCells: total, cellShape: 'square', cellSize: 14, gridColumns: 20,
            gridCells: Array.from({ length: total }, (_, i) => ({ index: i, status: 'empty' as const })),
            categories: [], createdAt: new Date().toISOString(),
        })
        setTab('mine')
        const result = await createChallenge({
            title: c.title, description: c.description, type: 'community',
            isPrivate: false, startDate: new Date().toISOString().split('T')[0],
            durationDays: c.durationDays, trackingUnit: c.trackingUnit,
            cellShape: 'square', cellSize: 14,
        })
        if (result.success && result.data) confirmChallenge(tempId, result.data)
    }

    // If a challenge is open, show detail view
    if (activeChallengeId) {
        return (
            <AnimatePresence mode="wait">
                <ChallengeDetailView
                    key={activeChallengeId}
                    challengeId={activeChallengeId}
                    onBack={() => setActiveChallenge(null)}
                />
            </AnimatePresence>
        )
    }

    return (
        <div className="pb-20">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-violet-600 rounded-lg shadow-lg shadow-violet-600/30">
                            <Zap size={16} className="text-white" fill="white" />
                        </div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Goal Tracking</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Challenges</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Build habits, track streaks, and crush your goals — one cell at a time.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-600/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={18} /> New Challenge
                </button>
            </div>

            {/* Tab selector */}
            <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 gap-1 mb-6">
                {([
                    { id: 'mine' as Tab, label: 'My Challenges', badge: challenges.length || null },
                    { id: 'community' as Tab, label: 'Community', badge: null },
                ]).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200',
                            tab === t.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                                : 'text-zinc-400 hover:text-white'
                        )}
                    >
                        {t.label}
                        {t.badge !== null && (
                            <span className={cn(
                                'text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                tab === t.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                            )}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* My challenges */}
            <AnimatePresence mode="wait">
                {tab === 'mine' && (
                    <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {challenges.length === 0 ? (
                            <EmptyState onNew={() => setShowCreate(true)} />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {challenges.map((ch) => (
                                        <ChallengeCard
                                            key={ch.id}
                                            challenge={ch}
                                            onView={() => setActiveChallenge(ch.id)}
                                            onDelete={() => handleDelete(ch.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'community' && (
                    <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="bg-violet-950/20 border border-violet-800/30 rounded-2xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-violet-300">
                            <Flame size={15} className="text-violet-400 flex-shrink-0" />
                            <span>Join a community challenge to clone it into your personal challenges and start tracking.</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {COMMUNITY_CHALLENGES.map((c) => (
                                <CommunityCard key={c.id} c={c} onJoin={() => handleJoinCommunity(c)} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create modal */}
            <AnimatePresence>
                {showCreate && <CreateChallengeModal onClose={() => setShowCreate(false)} />}
            </AnimatePresence>
        </div>
    )
}
