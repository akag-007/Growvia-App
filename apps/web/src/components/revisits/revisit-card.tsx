'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ExternalLink,
    CheckCircle2,
    Clock,
    MoreVertical,
    Trash2,
    Award,
    Calendar,
    Zap,
    RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Revisit } from '@/actions/revisits'
import { completeReview, deleteRevisit, markMastered, snoozeRevisit } from '@/actions/revisits'
import { useRevisitsStore } from '@/stores/revisits'
import { format, parseISO } from 'date-fns'

interface RevisitCardProps {
    revisit: Revisit
}

export function RevisitCard({ revisit }: RevisitCardProps) {
    const { updateRevisitLocal, removeRevisit } = useRevisitsStore()
    const [isFinishing, setIsFinishing] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleRating = async (rating: 'hard' | 'medium' | 'easy') => {
        // Optimistic update
        updateRevisitLocal(revisit.id, {
            review_count: revisit.review_count + 1,
            last_reviewed_at: new Date().toISOString()
        })

        setIsFinishing(false)
        await completeReview(revisit.id, rating)
    }

    const handleSnooze = async (days: number) => {
        setShowOptions(false)
        await snoozeRevisit(revisit.id, days)
    }

    const handleMastered = async () => {
        updateRevisitLocal(revisit.id, { status: 'done' })
        setShowOptions(false)
        await markMastered(revisit.id)
    }

    const handleDelete = async () => {
        removeRevisit(revisit.id)
        await deleteRevisit(revisit.id)
    }

    const typeColors = {
        tech: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        leetcode: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        math: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        college: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
        book: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        misc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400',
    }

    return (
        <motion.div
            layout
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
            {/* Type Tag */}
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    typeColors[revisit.type]
                )}>
                    {revisit.type}
                </span>

                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                        {showOptions && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowOptions(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1.5"
                                >
                                    <button
                                        onClick={() => handleSnooze(1)}
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                                    >
                                        <Clock size={14} /> Snooze Tomorrow
                                    </button>
                                    <button
                                        onClick={() => handleSnooze(7)}
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                                    >
                                        <Calendar size={14} /> Snooze 1 Week
                                    </button>
                                    <button
                                        onClick={handleMastered}
                                        className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                                    >
                                        <Award size={14} /> Mark Mastered
                                    </button>
                                    <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Content */}
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">
                {revisit.title}
            </h3>

            {revisit.reason_to_return && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
                        Reason to Return
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium italic">
                        "{revisit.reason_to_return}"
                    </p>
                </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {revisit.estimated_time_min}m
                </div>
                <div className="flex items-center gap-1.5">
                    <RotateCcw size={14} />
                    {revisit.review_count} reviews
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Next: {format(parseISO(revisit.next_review_at), 'MMM d')}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <AnimatePresence mode="wait">
                    {!isFinishing ? (
                        <>
                            {revisit.resource_url && (
                                <a
                                    href={revisit.resource_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Open
                                </a>
                            )}
                            <button
                                onClick={() => setIsFinishing(true)}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle2 size={16} />
                                Done
                            </button>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex gap-2"
                        >
                            <button
                                onClick={() => handleRating('hard')}
                                className="flex-1 flex flex-col items-center gap-1 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                <span className="text-lg">😫</span>
                                <span className="text-[10px] font-bold uppercase">Hard</span>
                            </button>
                            <button
                                onClick={() => handleRating('medium')}
                                className="flex-1 flex flex-col items-center gap-1 py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors"
                            >
                                <span className="text-lg">😐</span>
                                <span className="text-[10px] font-bold uppercase">Med</span>
                            </button>
                            <button
                                onClick={() => handleRating('easy')}
                                className="flex-1 flex flex-col items-center gap-1 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors"
                            >
                                <span className="text-lg">🤩</span>
                                <span className="text-[10px] font-bold uppercase">Easy</span>
                            </button>
                            <button
                                onClick={() => setIsFinishing(false)}
                                className="px-2 text-zinc-400 hover:text-zinc-600"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
