'use client'

import { PRIORITY_META, PRIORITY_VALUES, PriorityValue } from '@app/shared'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertCircle } from 'lucide-react'

const PRIORITY_ICONS: Record<PriorityValue, string> = {
    important_urgent: '🔴',
    important_not_urgent: '🟡',
    not_important_urgent: '🔵',
    not_important_not_urgent: '⚫',
}

const QUADRANT_LAYOUT: {
    key: PriorityValue
    axisTip: string
}[] = [
        { key: 'important_urgent', axisTip: 'Urgent' },
        { key: 'not_important_urgent', axisTip: 'Urgent' },
        { key: 'important_not_urgent', axisTip: 'Not Urgent' },
        { key: 'not_important_not_urgent', axisTip: 'Not Urgent' },
    ]

function MiniTaskCard({ task }: { task: any }) {
    const meta = task.priority ? PRIORITY_META[task.priority as PriorityValue] : null
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg px-3 py-2 mb-2 last:mb-0 ${task.is_completed ? 'opacity-50' : ''}`}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
            <div className="flex items-start gap-2">
                <div
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full border"
                    style={{
                        borderColor: meta?.color ?? '#6b7280',
                        background: task.is_completed ? (meta?.color ?? '#6b7280') : 'transparent',
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-tight truncate ${task.is_completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {task.estimated_duration && (
                            <span className="flex items-center gap-0.5 text-zinc-500 text-[10px]">
                                <Clock size={9} />
                                {task.estimated_duration}m
                            </span>
                        )}
                        {task.categories && (
                            <span className="text-[10px] truncate"
                                style={{ color: task.categories.color }}>
                                {task.categories.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function Quadrant({ priorityKey, tasks }: { priorityKey: PriorityValue; tasks: any[] }) {
    const meta = PRIORITY_META[priorityKey]
    const icon = PRIORITY_ICONS[priorityKey]

    return (
        <div
            className="rounded-2xl p-4 flex flex-col min-h-[180px]"
            style={{
                background: `linear-gradient(145deg, ${meta.bg} 0%, rgba(0,0,0,0.2) 100%)`,
                border: `1px solid ${meta.color}25`,
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <div>
                    <p className="text-xs font-bold leading-tight" style={{ color: meta.color }}>
                        {meta.sublabel}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight">{meta.label}</p>
                </div>
                <span
                    className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
                    style={{ background: `${meta.color}20`, color: meta.color }}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Task cards */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                    {tasks.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center mt-4">No tasks here</p>
                    ) : (
                        tasks.map((task) => (
                            <MiniTaskCard key={task.id} task={task} />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export function EisenhowerMatrix({ tasks }: { tasks: any[] }) {
    const byPriority = (key: PriorityValue) =>
        tasks.filter((t) => t.priority === key)

    const unsorted = tasks.filter((t) => !t.priority)

    const totalTasks = tasks.length
    const totalDone = tasks.filter(t => t.is_completed).length

    return (
        <div className="space-y-6">
            {/* Stats strip */}
            <div className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-center">
                    <p className="text-lg font-bold text-white">{totalTasks}</p>
                    <p className="text-[10px] text-zinc-500">Total</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: '#4ade80' }}>{totalDone}</p>
                    <p className="text-[10px] text-zinc-500">Done</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e)' }}
                            initial={{ width: 0 }}
                            animate={{ width: totalTasks > 0 ? `${(totalDone / totalTasks) * 100}%` : '0%' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                        {totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0}% complete
                    </p>
                </div>
            </div>

            {/* Axis labels */}
            <div className="relative">
                {/* Column headers */}
                <div className="grid grid-cols-2 gap-3 mb-1">
                    <p className="text-center text-xs font-semibold text-zinc-400">🔥 Urgent</p>
                    <p className="text-center text-xs font-semibold text-zinc-400">📅 Not Urgent</p>
                </div>

                {/* 2×2 Grid — arranged as:
                    [important_urgent]         [important_not_urgent]
                    [not_important_urgent]     [not_important_not_urgent]      */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Row label wrapper + first row */}
                    <div className="contents">
                        <div className="relative">
                            {/* Important row label on left */}
                            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-zinc-500 whitespace-nowrap origin-center hidden lg:block">
                                Important
                            </div>
                            <Quadrant priorityKey="important_urgent" tasks={byPriority('important_urgent')} />
                        </div>
                        <Quadrant priorityKey="important_not_urgent" tasks={byPriority('important_not_urgent')} />
                    </div>
                    <div className="contents">
                        <div className="relative">
                            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-zinc-500 whitespace-nowrap origin-center hidden lg:block">
                                Not Important
                            </div>
                            <Quadrant priorityKey="not_important_urgent" tasks={byPriority('not_important_urgent')} />
                        </div>
                        <Quadrant priorityKey="not_important_not_urgent" tasks={byPriority('not_important_not_urgent')} />
                    </div>
                </div>
            </div>

            {/* Unsorted tasks */}
            {unsorted.length > 0 && (
                <div className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={14} className="text-zinc-500" />
                        <p className="text-xs font-bold text-zinc-500">
                            Unsorted <span className="ml-1">{unsorted.length}</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {unsorted.map(task => (
                            <MiniTaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
