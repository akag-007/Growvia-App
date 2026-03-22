'use client'

import { useState } from 'react'
import { updateTask, deleteTask } from '@/actions/task'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Clock, Trash2, Play } from 'lucide-react'
import { useTimerStore } from '@/stores/timer'
import { PRIORITY_META, PriorityValue } from '@app/shared'

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
                className={`glass-card group relative overflow-hidden p-4 transition-all cursor-pointer ${isExpanded ? 'ring-1 ring-indigo-500/30' : ''
                    }`}
            >
                <div className="flex items-start gap-4">
                    <div className="pt-1">
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={toggleComplete}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                            style={{ accentColor: '#6366f1' }}
                        />
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h3
                                className={`font-medium ${isCompleted ? 'line-through' : ''}`}
                                style={{ color: isCompleted ? 'var(--text-disabled)' : 'var(--text-primary)' }}
                            >
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {task.priority && PRIORITY_META[task.priority as PriorityValue] && (
                                    <span
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                                        style={{
                                            backgroundColor: PRIORITY_META[task.priority as PriorityValue].bg,
                                            color: PRIORITY_META[task.priority as PriorityValue].color,
                                        }}
                                    >
                                        {PRIORITY_META[task.priority as PriorityValue].sublabel}
                                    </span>
                                )}
                                {task.categories && (
                                    <span
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                        style={{
                                            backgroundColor: `${task.categories.color}22`,
                                            color: task.categories.color
                                        }}
                                    >
                                        {task.categories.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!isExpanded && task.estimated_duration && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <Clock size={12} />
                                <span>{task.estimated_duration}m</span>
                                {task.actual_duration > 0 && (
                                    <span className="text-indigo-400 ml-2">
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
                            className="rounded-full p-2 transition-all"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)'
                                ;(e.currentTarget as HTMLElement).style.color = '#818cf8'
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent'
                                ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                            }}
                            title="Start Focus Session"
                        >
                            <Play size={20} />
                        </button>
                        <div style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                            className="mt-4 border-t pt-4"
                            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                        >
                            {task.description && (
                                <p
                                    className="text-sm mb-4 whitespace-pre-wrap"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {task.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
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
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
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
