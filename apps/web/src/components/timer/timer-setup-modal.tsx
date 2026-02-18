'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Play, Clock, Watch } from 'lucide-react'
import { useTimerStore } from '@/stores/timer'

interface TimerSetupModalProps {
    taskId: string
    taskTitle: string
    initialElapsed: number
    onClose: () => void
}

export function TimerSetupModal({ taskId, taskTitle, initialElapsed, onClose }: TimerSetupModalProps) {
    const [mode, setMode] = useState<'stopwatch' | 'timer'>('timer')
    const [timerDuration, setTimerDuration] = useState(25) // minutes
    const startNewSession = useTimerStore(state => state.startNewSession)

    const handleStart = () => {
        if (mode === 'stopwatch') {
            startNewSession(taskId, taskTitle, 'stopwatch', initialElapsed)
        } else {
            startNewSession(taskId, taskTitle, 'timer', initialElapsed, timerDuration * 60)
        }
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
            >
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Start Session</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Mode Selection */}
                    <div className="flex gap-2 mb-6 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                        <button
                            onClick={() => setMode('timer')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${mode === 'timer'
                                ? 'bg-white shadow text-indigo-600 dark:bg-zinc-700 dark:text-white'
                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                }`}
                        >
                            <Clock size={16} />
                            Timer
                        </button>
                        <button
                            onClick={() => setMode('stopwatch')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${mode === 'stopwatch'
                                ? 'bg-white shadow text-indigo-600 dark:bg-zinc-700 dark:text-white'
                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                }`}
                        >
                            <Watch size={16} />
                            Stopwatch
                        </button>
                    </div>

                    {/* Timer Options */}
                    {mode === 'timer' && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-4xl font-mono font-bold text-zinc-900 dark:text-white mb-2">
                                    {timerDuration}:00
                                </div>
                                <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Minutes</p>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[15, 25, 45, 60].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => setTimerDuration(mins)}
                                        className={`py-2 rounded-md text-sm font-medium border transition-colors ${timerDuration === mins
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-500'
                                            : 'border-zinc-200 hover:border-indigo-300 dark:border-zinc-700 dark:hover:border-indigo-700'
                                            }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Custom Duration (mins)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="180"
                                    value={timerDuration}
                                    onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Stopwatch Info */}
                    {mode === 'stopwatch' && (
                        <div className="text-center py-8">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                                <Watch size={32} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-zinc-900 font-medium dark:text-white">Open Ended Session</h3>
                            <p className="text-zinc-500 text-sm mt-1">Track time as you go. No limits.</p>
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                    >
                        <Play size={18} fill="currentColor" />
                        Start {mode === 'timer' ? 'Focus Session' : 'Tracking'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}
