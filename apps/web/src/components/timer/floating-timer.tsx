'use client'

import { useEffect, useState } from 'react'
import { useTimerStore } from '@/stores/timer'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Square, X } from 'lucide-react'

export function FloatingTimer() {
    const {
        activeTaskId,
        activeTaskTitle,
        isRunning,
        startTime,
        sessionElapsed,
        mode,
        targetDuration,
        pauseSession,
        resumeSession,
        stopSession
    } = useTimerStore()

    const [displayTime, setDisplayTime] = useState(0)

    // We need to fetch the CURRENT DB duration to pass to stopSession
    // But FloatingTimer doesn't have access to the task object directly.
    // Ideally, the store should handle this or we pass it in.
    // HOWEVER, simplified approach: We can just send an "increment" to the server action instead of absolute value?
    // OR we rely on the component that started it.
    // Actually, 'updateTask' takes an object. We can change updateTask to accept an increment? 
    // Standard SQL: `actual_duration = actual_duration + X`.
    // Supabase/Postgres RPC can do this, but standard update overrides.

    // FIX: The `FloatingTimer` is persistent. It might not know the `currentDbDuration`.
    // ONE SOLUTION: When we START a session, we pass the `currentDbDuration` to the store and keep it there?
    // User said: "previous session timings should be stored in the task as it is... At the end, cumulative time..."
    // So yes, let's store `initialDbDuration` in the store when we start the task, just for the final Save math.

    // FOR NOW: I'll assume we pass 0 to stopSession and fix the store to require `initialDbDuration`. 
    // ACTUALLY, I'll update the store right now to accept `initialDbDuration` in `startNewSession` so we have it.

    // Let's modify the store in-place in the next step or re-write it.
    // I will assume I'll fix the store.

    useEffect(() => {
        const calculateDisplay = () => {
            const currentSegment = (isRunning && startTime) ? Math.floor((Date.now() - startTime) / 1000) : 0
            const totalSession = sessionElapsed + currentSegment

            if (mode === 'timer' && targetDuration) {
                // Countdown: Target - totalSession
                return Math.max(0, targetDuration - totalSession)
            } else {
                // Stopwatch: totalSession (starts at 0)
                return totalSession
            }
        }

        setDisplayTime(calculateDisplay())

        let interval: NodeJS.Timeout
        if (isRunning) {
            interval = setInterval(() => {
                setDisplayTime(calculateDisplay())
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isRunning, startTime, sessionElapsed, mode, targetDuration])

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    if (!activeTaskId) return null

    // We need to get the actual duration to save. 
    // Since I can't easily change the store *inside* this file content generation without another tool call,
    // I will use a hack: pass 0 to stopSession for now, and I will strictly update the store immediately after.

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
            >
                <div className="flex items-center gap-4 rounded-full border border-zinc-200 bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {mode === 'timer' ? 'Focusing' : 'Tracking'}
                        </span>
                        <span className="max-w-[150px] truncate text-sm font-medium text-zinc-900 dark:text-white">
                            {activeTaskTitle}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                        <div className={`font-mono text-xl font-bold tabular-nums ${isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>
                            {formatTime(displayTime)}
                        </div>

                        <div className="flex items-center gap-1">
                            {isRunning ? (
                                <button
                                    onClick={() => pauseSession()}
                                    className="rounded-full bg-zinc-100 p-2 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                                >
                                    <Pause size={16} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => resumeSession()}
                                    className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                                >
                                    <Play size={16} fill="currentColor" />
                                </button>
                            )}

                            <button
                                onClick={() => stopSession()}
                                className="rounded-full bg-red-50 p-2 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                            >
                                <Square size={16} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
