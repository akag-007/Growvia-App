'use client'

import { useState } from 'react'
import { updateTask, deleteTask } from '@/actions/task'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Clock, Trash2, Play } from 'lucide-react'
import { useTimerStore } from '@/stores/timer'

import { TimerSetupModal } from '@/components/timer/timer-setup-modal'

export function TaskCard({ task }: { task: any }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isCompleted, setIsCompleted] = useState(task.is_completed)
    const [isTimerSetupOpen, setIsTimerSetupOpen] = useState(false)

    const toggleComplete = async () => {
        const newState = !isCompleted
        setIsCompleted(newState)
        await updateTask(task.id, { is_completed: newState })
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task.id)
        }
    }

    return (
        <>
            <motion.div
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className={`group relative overflow-hidden rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''
                    }`}
            >
                <div className="flex items-start gap-4">
                    <div className="pt-1">
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={toggleComplete}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h3 className={`font-medium text-zinc-900 dark:text-zinc-100 ${isCompleted ? 'line-through text-zinc-500' : ''
                                }`}>
                                {task.title}
                            </h3>
                            {task.categories && (
                                <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{
                                        backgroundColor: `${task.categories.color}20`,
                                        color: task.categories.color
                                    }}
                                >
                                    {task.categories.name}
                                </span>
                            )}
                        </div>

                        {!isExpanded && task.estimated_duration && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Clock size={12} />
                                <span>{task.estimated_duration}m</span>
                                {task.actual_duration > 0 && (
                                    <span className="text-indigo-600 dark:text-indigo-400 ml-2">
                                        (Logged: {Math.round(task.actual_duration / 60)}m)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsTimerSetupOpen(true);
                            }}
                            className="rounded-full p-2 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors"
                            title="Start Focus Session"
                        >
                            <Play size={20} />
                        </button>
                        <div className="text-zinc-400">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 border-t pt-4 dark:border-zinc-800"
                        >
                            {task.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <div className="flex gap-4">
                                    {task.estimated_duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Estimated: {task.estimated_duration} mins
                                        </span>
                                    )}
                                    <span>Created: {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                                </div>

                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {isTimerSetupOpen && (
                    <TimerSetupModal
                        taskId={task.id}
                        taskTitle={task.title}
                        initialElapsed={task.actual_duration || 0}
                        onClose={() => setIsTimerSetupOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
