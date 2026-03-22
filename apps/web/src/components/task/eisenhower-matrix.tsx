'use client'

import { PRIORITY_META, PriorityValue } from '@app/shared'
import { glassBackdrop } from '@/lib/glass-tokens'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertCircle } from 'lucide-react'

const PRIORITY_ICONS: Record<PriorityValue, string> = {
    important_urgent: '🔴',
    important_not_urgent: '🟡',
    not_important_urgent: '🔵',
    not_important_not_urgent: '⚫',
}

const glassSurface = glassBackdrop

function MiniTaskCard({ task }: { task: any }) {
    const meta = task.priority ? PRIORITY_META[task.priority as PriorityValue] : null
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-3 py-2.5 mb-2 last:mb-0 ${task.is_completed ? 'opacity-[0.55]' : ''}`}
            style={{
                ...glassSurface,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow:
                    '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.06)',
            }}
        >
            <div className="flex items-start gap-2">
                <div
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full border-2"
                    style={{
                        borderColor: meta?.color ?? '#6b7280',
                        background: task.is_completed ? (meta?.color ?? '#6b7280') : 'transparent',
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-[13px] font-semibold leading-snug truncate ${task.is_completed ? 'line-through text-zinc-500' : 'text-zinc-50'}`}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
                    >
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.estimated_duration && (
                            <span className="flex items-center gap-0.5 text-zinc-300 text-[11px] font-medium">
                                <Clock size={10} className="opacity-90" />
                                {task.estimated_duration}m
                            </span>
                        )}
                        {task.categories && (
                            <span
                                className="text-[11px] font-medium truncate max-w-[10rem] rounded px-1.5 py-0.5"
                                style={{
                                    color: task.categories.color,
                                    background: 'rgba(0,0,0,0.22)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            >
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
            className="relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl p-4"
            style={{
                ...glassSurface,
                background: `linear-gradient(165deg, ${meta.bg} 0%, rgba(12, 12, 18, 0.36) 45%, rgba(12, 12, 18, 0.28) 100%)`,
                border: `1px solid rgba(255, 255, 255, 0.12)`,
                boxShadow:
                    '0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.04)',
            }}
        >
            {/* Category tint rim — keeps identity without going opaque */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                    background: `linear-gradient(135deg, ${meta.color}22 0%, transparent 42%, ${meta.color}0f 100%)`,
                    boxShadow: `inset 0 0 0 1px ${meta.color}33`,
                }}
            />

            {/* Header */}
            <div className="relative z-10 mb-3 flex items-center gap-2">
                <span className="text-lg drop-shadow-sm">{icon}</span>
                <div className="min-w-0 flex-1">
                    <p
                        className="text-sm font-bold leading-tight tracking-tight"
                        style={{ color: meta.color, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                        {meta.sublabel}
                    </p>
                    <p className="text-[11px] leading-snug text-zinc-300/95 mt-0.5 font-medium">
                        {meta.label}
                    </p>
                </div>
                <span
                    className="ml-auto shrink-0 rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-bold tabular-nums"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: meta.color,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Task cards */}
            <div className="relative z-10 flex-1 overflow-y-auto">
                <AnimatePresence>
                    {tasks.length === 0 ? (
                        <p className="mt-6 px-2 text-center text-xs font-medium text-zinc-200/90 drop-shadow-sm">
                            No tasks here
                        </p>
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
            <div
            className="flex items-center gap-4 rounded-xl px-4 py-3.5"
            style={{
                ...glassSurface,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(12,12,18,0.38) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow:
                    '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
        >
                <div className="text-center">
                    <p className="text-lg font-bold text-white drop-shadow-sm">{totalTasks}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Total</p>
                </div>
                <div className="h-8 w-px bg-white/15" />
                <div className="text-center">
                    <p className="text-lg font-bold drop-shadow-sm" style={{ color: '#86efac' }}>{totalDone}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Done</p>
                </div>
                <div className="h-8 w-px bg-white/15" />
                <div className="flex-1 min-w-0">
                    <div
                        className="h-1.5 overflow-hidden rounded-full border border-white/10"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e)' }}
                            initial={{ width: 0 }}
                            animate={{ width: totalTasks > 0 ? `${(totalDone / totalTasks) * 100}%` : '0%' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-[10px] font-medium text-zinc-400 mt-1">
                        {totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0}% complete
                    </p>
                </div>
            </div>

            {/* Axis labels */}
            <div className="relative">
                {/* Column headers */}
                <div className="grid grid-cols-2 gap-3 mb-1">
                    <p className="text-center text-xs font-bold text-zinc-200 tracking-wide drop-shadow-sm">🔥 Urgent</p>
                    <p className="text-center text-xs font-bold text-zinc-200 tracking-wide drop-shadow-sm">📅 Not Urgent</p>
                </div>

                {/* 2×2 Grid — arranged as:
                    [important_urgent]         [important_not_urgent]
                    [not_important_urgent]     [not_important_not_urgent]      */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Row label wrapper + first row */}
                    <div className="contents">
                        <div className="relative">
                            {/* Important row label on left */}
                            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-zinc-300 whitespace-nowrap origin-center hidden lg:block">
                                Important
                            </div>
                            <Quadrant priorityKey="important_urgent" tasks={byPriority('important_urgent')} />
                        </div>
                        <Quadrant priorityKey="important_not_urgent" tasks={byPriority('important_not_urgent')} />
                    </div>
                    <div className="contents">
                        <div className="relative">
                            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-zinc-300 whitespace-nowrap origin-center hidden lg:block">
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
                <div
                    className="rounded-2xl p-4"
                    style={{
                        ...glassSurface,
                        background:
                            'linear-gradient(165deg, rgba(251,191,36,0.08) 0%, rgba(12,12,18,0.34) 45%, rgba(12,12,18,0.28) 100%)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow:
                            '0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={14} className="text-amber-300/90" />
                        <p className="text-sm font-bold text-zinc-100">
                            Unsorted <span className="ml-1 tabular-nums text-zinc-300">{unsorted.length}</span>
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
