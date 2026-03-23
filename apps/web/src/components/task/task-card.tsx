'use client'

import { useEffect, useRef, useState } from 'react'
import { updateTask, deleteTask } from '@/actions/task'
import { format, isValid, parseISO } from 'date-fns'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
    ChevronRight,
    Clock,
    Trash2,
    Pencil,
    Calendar,
    Timer,
    CalendarClock,
    Link2,
    CheckSquare,
    Square,
    X,
} from 'lucide-react'
import { PRIORITY_META, PriorityValue } from '@app/shared'
import { glassBackdrop } from '@/lib/glass-tokens'
import Slider from '@/components/ui/slider-number-flow'

import { TimerSetupModal } from '@/components/timer/timer-setup-modal'
import { PushToLaterModal } from './push-to-later-modal'
import { EditTaskModal } from './edit-task-modal'
import { LinkProjectModal } from './link-project-modal'
import { unlinkTaskFromProject } from '@/actions/task'

function formatEstimatedMins(mins: number) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins} min`
}

function formatDueLabel(due: string | null | undefined) {
    if (!due) return null
    const d = parseISO(due)
    if (!isValid(d)) return null
    if (due.length <= 10) {
        return format(d, 'MMM d, yyyy')
    }
    return format(d, 'h:mm a')
}

function formatTimeSpent(seconds: number) {
    if (!seconds || seconds <= 0) return '0m'
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rm = m % 60
    return rm ? `${h}h ${rm}m` : `${h}h`
}

const iconBtn =
    'rounded-full p-2 transition-colors text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'

const expandTransition = {
    duration: 0.28,
    ease: [0.4, 0, 0.2, 1] as const,
}

/** Soft squircle — not a full pill — so labels aren’t clipped at the ends. Matches sheen + glass outline. */
const cardShape = '!rounded-2xl'

export function TaskCard({ task }: { task: any }) {
    const prefersReducedMotion = useReducedMotion()
    const cardRef = useRef<HTMLDivElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isTimerSetupOpen, setIsTimerSetupOpen] = useState(false)
    const [isPushToLaterOpen, setIsPushToLaterOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isLinkProjectOpen, setIsLinkProjectOpen] = useState(false)
    const [progress, setProgress] = useState(task.progress ?? 0)
    const [completed, setCompleted] = useState(!!task.is_completed)

    const project = task.projects ?? null

    const handleProgressChange = async (value: number) => {
        setProgress(value)
        await updateTask(task.id, { progress: value })
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task.id)
        }
    }

    const handleToggleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const next = !completed
        setCompleted(next)
        await updateTask(task.id, { is_completed: next })
    }

    const progressPercent = Math.round(progress)
    const dueLabel = formatDueLabel(task.due_date)
    const circumference = 2 * Math.PI * 18

    const estimatedLabel =
        task.estimated_duration != null && task.estimated_duration > 0
            ? formatEstimatedMins(task.estimated_duration)
            : null

    const priorityMeta =
        task.priority && PRIORITY_META[task.priority as PriorityValue]
            ? PRIORITY_META[task.priority as PriorityValue]
            : null

    const frostedCardBackground = priorityMeta
        ? `linear-gradient(165deg, ${priorityMeta.bg} 0%, rgba(12, 12, 18, 0.20) 45%, rgba(12, 12, 18, 0.15) 100%)`
        : `linear-gradient(165deg, rgba(99, 102, 241, 0.08) 0%, rgba(12, 12, 18, 0.15) 50%, rgba(12, 12, 18, 0.10) 100%)`

    // Collapse when clicking outside the card (list view); skip while a modal from this card is open
    useEffect(() => {
        if (
            !isExpanded ||
            isTimerSetupOpen ||
            isPushToLaterOpen ||
            isEditOpen ||
            isLinkProjectOpen
        ) {
            return
        }
        const handlePointerDown = (e: PointerEvent) => {
            const t = e.target as Node
            if (cardRef.current?.contains(t)) return
            setIsExpanded(false)
        }
        document.addEventListener('pointerdown', handlePointerDown, true)
        return () => document.removeEventListener('pointerdown', handlePointerDown, true)
    }, [isExpanded, isTimerSetupOpen, isPushToLaterOpen, isEditOpen, isLinkProjectOpen])

    return (
        <>
            <motion.div
                ref={cardRef}
                layout
                initial={false}
                className={`group relative z-0 overflow-hidden transition-opacity ${
                    completed ? 'opacity-75' : ''
                }`}
                style={{
                    ...glassBackdrop,
                    background: frostedCardBackground,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow:
                        '0 16px 48px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
                    borderRadius: '20px',
                }}
                transition={{
                    layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                }}
                whileHover={
                    prefersReducedMotion
                        ? undefined
                        : {
                              y: -5,
                              scale: 1.006,
                              zIndex: 10,
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              boxShadow:
                                  '0 20px 50px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(139, 92, 246, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
                              transition: {
                                  type: 'tween',
                                  duration: 0.22,
                                  ease: [0.4, 0, 0.2, 1],
                              },
                          }
                }
                whileTap={
                    prefersReducedMotion
                        ? undefined
                        : { scale: 0.994, transition: { duration: 0.12 } }
                }
            >
                {/* Soft violet / priority tint — same language as matrix quadrants */}
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 z-0 ${cardShape}`}
                    style={{
                        background: priorityMeta
                            ? `linear-gradient(135deg, ${priorityMeta.color}20 0%, transparent 48%, ${priorityMeta.color}12 100%)`
                            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, transparent 50%, rgba(99, 102, 241, 0.08) 100%)',
                        boxShadow: priorityMeta
                            ? `inset 0 0 0 1px ${priorityMeta.color}35`
                            : 'inset 0 0 0 1px rgba(139, 92, 246, 0.22)',
                    }}
                />

                {/* Hover sheen — frosted glass highlight */}
                <div
                    className={`pointer-events-none absolute inset-0 z-[1] ${cardShape} bg-gradient-to-br from-white/6 via-white/2 to-violet-500/4 transition-opacity duration-300 motion-reduce:opacity-0 ${
                        prefersReducedMotion ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-hidden
                />

                {/* Collapsed summary — click row to expand (not the action icons) */}
                <div className="relative z-10 flex items-center gap-3 px-4 py-3.5 sm:gap-5 sm:px-6 sm:py-4">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left sm:gap-4"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse task' : 'Expand task'}
                    >
                        {/* Circular progress */}
                        <div className="relative flex-shrink-0">
                            <svg width="44" height="44" className="-rotate-90" aria-hidden>
                                <defs>
                                    <linearGradient
                                        id={`taskRingGrad-${task.id}`}
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                    >
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="22"
                                    cy="22"
                                    r="18"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="3"
                                />
                                <motion.circle
                                    cx="22"
                                    cy="22"
                                    r="18"
                                    fill="none"
                                    stroke={`url(#taskRingGrad-${task.id})`}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    initial={false}
                                    animate={{
                                        strokeDashoffset:
                                            circumference -
                                            (progressPercent / 100) * circumference,
                                    }}
                                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ strokeDasharray: circumference }}
                                />
                            </svg>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="text-[11px] font-semibold tabular-nums text-white">
                                    {progressPercent}%
                                </span>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                            {/* Category + urgency — category first like reference */}
                            <div className="flex flex-wrap items-center gap-2">
                                {task.categories && (
                                    <span
                                        className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide sm:text-xs"
                                        style={{
                                            backgroundColor: `${task.categories.color}28`,
                                            color: task.categories.color,
                                        }}
                                    >
                                        {task.categories.name}
                                    </span>
                                )}
                                {task.priority && PRIORITY_META[task.priority as PriorityValue] && (
                                    <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs"
                                        style={{
                                            backgroundColor:
                                                PRIORITY_META[task.priority as PriorityValue].bg,
                                            color: PRIORITY_META[task.priority as PriorityValue].color,
                                        }}
                                    >
                                        {PRIORITY_META[task.priority as PriorityValue].sublabel}
                                    </span>
                                )}
                            </div>

                            <h3
                                className={`break-words text-[15px] font-semibold leading-tight text-white sm:text-base ${
                                    completed ? 'text-zinc-500 line-through' : ''
                                }`}
                            >
                                {task.title}
                            </h3>

                            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-zinc-400 sm:text-xs">
                                {estimatedLabel && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock size={13} className="shrink-0 opacity-80" />
                                        <span>{estimatedLabel}</span>
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                    {estimatedLabel ? (
                                        <span className="text-zinc-600" aria-hidden>
                                            ·
                                        </span>
                                    ) : null}
                                    <span>{formatTimeSpent(task.actual_duration ?? 0)} spent</span>
                                </span>
                                {dueLabel ? (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-zinc-600" aria-hidden>
                                            ·
                                        </span>
                                        <Calendar size={13} className="shrink-0 opacity-80" />
                                        <span>Due {dueLabel}</span>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </button>

                    <div
                        className="relative z-10 flex shrink-0 items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsTimerSetupOpen(true)
                            }}
                            className={iconBtn}
                            title="Start focus session"
                        >
                            <Timer size={18} strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsPushToLaterOpen(true)
                            }}
                            className={iconBtn}
                            title="Push to later"
                        >
                            <CalendarClock size={18} strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsLinkProjectOpen(true)
                            }}
                            className={iconBtn}
                            title="Link to project"
                        >
                            <Link2 size={17} strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsEditOpen(true)
                            }}
                            className={iconBtn}
                            title="Edit task"
                        >
                            <Pencil size={17} strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={iconBtn}
                            title="Delete task"
                        >
                            <Trash2 size={17} strokeWidth={1.75} />
                        </button>
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={expandTransition}
                            className="relative z-10 overflow-hidden"
                        >
                            <div className="space-y-3 border-t border-white/[0.1] px-4 pb-4 pt-2 sm:px-5 sm:pb-4">
                                {/* Progress — compact strip */}
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className="text-xs font-semibold tracking-wide text-violet-300/95">
                                                Progress
                                            </span>
                                            <span className="text-[10px] font-normal text-zinc-500">
                                                {' '}
                                                · drag to adjust
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-indigo-200 transition-[color,transform] duration-150">
                                            {progressPercent}%
                                        </span>
                                    </div>
                                    <Slider
                                        className="w-full h-5 !py-0"
                                        value={[progress]}
                                        onValueChange={([value]) => handleProgressChange(value)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        showValueOnThumb={false}
                                        trackClassName="!h-1 bg-zinc-700/75"
                                        rangeClassName="bg-gradient-to-r from-violet-500 to-indigo-400"
                                        thumbClassName="!h-3.5 !w-3.5 !ring-2 ring-violet-400/90 shadow-md shadow-violet-500/25"
                                    />
                                </div>

                                {task.projects && task.projects.length > 0 && (
                                    <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-3">
                                        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-emerald-400">
                                            <Link2 size={16} className="shrink-0 opacity-90" />
                                            <span>Linked Projects:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {task.projects.map((proj: any) => (
                                                <div key={proj.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                                    <div 
                                                        className="w-2 h-2 rounded-full" 
                                                        style={{ backgroundColor: proj.color || '#10b981' }} 
                                                    />
                                                    <span className="text-xs text-zinc-300">{proj.title || proj.name}</span>
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            await unlinkTaskFromProject(task.id, proj.id)
                                                        }}
                                                        className="ml-1 text-zinc-500 hover:text-red-400 transition-colors"
                                                        title="Unlink"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="space-y-1.5 text-xs text-zinc-400">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <Clock size={14} className="shrink-0 opacity-70" />
                                            <span>
                                                {estimatedLabel
                                                    ? `Estimated: ${estimatedLabel}`
                                                    : 'No estimate'}
                                                {dueLabel ? ` • Due ${dueLabel}` : ''}
                                            </span>
                                        </div>
                                        <p>
                                            Time spent so far:{' '}
                                            {formatTimeSpent(task.actual_duration ?? 0)}
                                        </p>
                                        <p className="text-zinc-500">
                                            Created:{' '}
                                            {format(new Date(task.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={handleToggleComplete}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                                            style={{
                                                ...glassBackdrop,
                                                background:
                                                    'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
                                                boxShadow:
                                                    'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.12)',
                                            }}
                                        >
                                            {completed ? (
                                                <CheckSquare size={18} className="text-emerald-400" />
                                            ) : (
                                                <Square size={18} className="text-zinc-500" />
                                            )}
                                            {completed ? 'Completed' : 'Mark as Complete'}
                                        </button>
                                    </div>
                                </div>

                                {task.description ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.05, duration: 0.2 }}
                                        className="whitespace-pre-wrap border-t border-white/[0.08] pt-4 text-sm leading-relaxed text-zinc-300/95"
                                    >
                                        {task.description}
                                    </motion.p>
                                ) : null}
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

            <AnimatePresence>
                {isPushToLaterOpen && (
                    <PushToLaterModal
                        taskId={task.id}
                        taskTitle={task.title}
                        onClose={() => setIsPushToLaterOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditOpen && (
                    <EditTaskModal task={task} onClose={() => setIsEditOpen(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLinkProjectOpen && (
                    <LinkProjectModal
                        taskId={task.id}
                        taskTitle={task.title}
                        onClose={() => setIsLinkProjectOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
