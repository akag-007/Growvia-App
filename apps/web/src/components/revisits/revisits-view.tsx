'use client'

import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap, Search, Download, CheckCircle2, Clock, Trash2,
    ArrowRight, CalendarDays, ChevronUp, ChevronDown, SlidersHorizontal, X,
    BookOpen, Timer, CalendarCheck,
} from 'lucide-react'
import { useRevisitsStore } from '@/stores/revisits'
import { QuickCaptureModal } from './quick-capture-modal'
import { RevisitDetailDrawer } from './revisit-detail-drawer'
import { completeReview, snoozeRevisit, deleteRevisit, markMastered } from '@/actions/revisits'
import type { Revisit } from '@/actions/revisits'
import { cn } from '@/lib/utils'
import { format, parseISO, isBefore, startOfDay, isToday } from 'date-fns'
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects'

interface RevisitsViewProps {
    initialRevisits: Revisit[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
    tech: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
    leetcode: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
    math: 'bg-purple-900/40 text-purple-300 border border-purple-700/50',
    college: 'bg-pink-900/40 text-pink-300 border border-pink-700/50',
    book: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
    misc: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    custom: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
}

function typeLabel(item: Revisit) {
    if (item.type === 'custom' && item.custom_type) return item.custom_type
    return item.type.charAt(0).toUpperCase() + item.type.slice(1)
}

function getStatus(item: Revisit): { label: string; cls: string } {
    if (item.status === 'done') return { label: 'mastered', cls: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50' }
    const today = startOfDay(new Date())
    const reviewDate = startOfDay(parseISO(item.next_review_at))
    if (isBefore(reviewDate, today)) return { label: 'overdue', cls: 'bg-red-900/40 text-red-400 border border-red-700/50' }
    if (isToday(reviewDate)) return { label: 'due today', cls: 'bg-amber-900/40 text-amber-400 border border-amber-700/50' }
    return { label: 'upcoming', cls: 'bg-zinc-800 text-zinc-400 border border-zinc-700' }
}

function exportToCSV(revisits: Revisit[]) {
    const headers = ['#', 'Title', 'URL', 'Type', 'Status', 'Next Review', 'Reviews', 'Time (min)', 'Created']
    const rows = revisits.map((r, i) => [
        i + 1,
        `"${r.title}"`,
        r.resource_url ?? '',
        typeLabel(r),
        r.status,
        format(parseISO(r.next_review_at), 'MMM d, yyyy'),
        r.review_count,
        r.estimated_time_min,
        format(parseISO(r.created_at), 'MMM d, yyyy'),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'revisits.csv'; a.click()
    URL.revokeObjectURL(url)
}

// ─── rating flow ──────────────────────────────────────────────────────────────

function RowRatingFlow({ onRate, onDelete, onCancel }: {
    onRate: (r: 'hard' | 'medium' | 'easy') => void
    onDelete: () => void
    onCancel: () => void
}) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1">
            <button onClick={() => onRate('hard')} title="Hard (+2d)"
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors">
                😫 Hard</button>
            <button onClick={() => onRate('medium')} title="Medium (+7d)"
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 transition-colors">
                😐 Med</button>
            <button onClick={() => onRate('easy')} title="Easy (+14d)"
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 transition-colors">
                🤩 Easy</button>
            <button onClick={onDelete} title="Remove / Mark Complete"
                className="p-1 rounded-lg text-red-500 hover:bg-red-900/30 transition-colors ml-0.5">
                <Trash2 size={14} /></button>
            <button onClick={onCancel} className="ml-0.5 text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
        </motion.div>
    )
}

// ─── schedule picker portal ──────────────────────────────────────────────────

function ScheduleDropdown({ onSchedule, onClose, anchorRect }: {
    onSchedule: (dateStr: string) => void
    onClose: () => void
    anchorRect: DOMRect
}) {
    const todayStr = new Date().toISOString().split('T')[0]
    const [picked, setPicked] = useState('')
    const quickPicks = [
        { label: 'Tomorrow', days: 1 }, { label: '3 Days', days: 3 },
        { label: '1 Week', days: 7 }, { label: '2 Weeks', days: 14 }, { label: '1 Month', days: 30 },
    ]
    const daysFromNow = (d: number) => {
        const dt = new Date(); dt.setDate(dt.getDate() + d)
        return dt.toISOString().split('T')[0]
    }
    const MENU_HEIGHT = 290
    const spaceBelow = window.innerHeight - anchorRect.bottom
    const top = spaceBelow > MENU_HEIGHT ? anchorRect.bottom + 6 : anchorRect.top - MENU_HEIGHT - 6
    const right = Math.max(8, window.innerWidth - anchorRect.right)

    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                style={{ position: 'fixed', top, right, zIndex: 9999, width: 224 }}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-4 pt-3 pb-2 border-b border-zinc-800">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarDays size={12} /> Schedule Next Review
                    </p>
                </div>
                <div className="py-1.5">
                    {quickPicks.map(opt => (
                        <button key={opt.days} onClick={() => onSchedule(daysFromNow(opt.days))}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center justify-between">
                            <span>{opt.label}</span>
                            <span className="text-[11px] text-zinc-600">{daysFromNow(opt.days)}</span>
                        </button>
                    ))}
                </div>
                <div className="px-4 py-3 border-t border-zinc-800">
                    <p className="text-[11px] text-zinc-500 mb-1.5">Pick a date</p>
                    <div className="flex gap-2">
                        <input type="date" min={todayStr} value={picked} onChange={e => setPicked(e.target.value)}
                            className="flex-1 bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                        <button disabled={!picked} onClick={() => picked && onSchedule(picked)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                            Set</button>
                    </div>
                </div>
            </motion.div>
        </>,
        document.body
    )
}

// ─── table row ───────────────────────────────────────────────────────────────

function RevisitRow({ revisit, index, onRowClick }: {
    revisit: Revisit
    index: number
    onRowClick: (r: Revisit) => void
}) {
    const { updateRevisitLocal, removeRevisit } = useRevisitsStore()
    const [finishing, setFinishing] = useState(false)
    const [snoozing, setSnoozing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [scheduleAnchor, setScheduleAnchor] = useState<DOMRect | null>(null)
    const clockBtnRef = useRef<HTMLButtonElement>(null)

    const isCompleted = revisit.status === 'done'
    const status = getStatus(revisit)

    const handleRate = async (rating: 'hard' | 'medium' | 'easy') => {
        updateRevisitLocal(revisit.id, { review_count: revisit.review_count + 1, status: 'active' })
        setFinishing(false)
        await completeReview(revisit.id, rating)
    }
    const handleSchedule = async (dateStr: string) => {
        setSnoozing(false); setScheduleAnchor(null)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
        const days = Math.max(1, Math.round((target.getTime() - today.getTime()) / 86400000))
        await snoozeRevisit(revisit.id, days)
    }
    const handleMarkComplete = async () => {
        updateRevisitLocal(revisit.id, { status: 'done' }); setDeleting(false)
        await markMastered(revisit.id)
    }
    const handleDelete = async () => {
        removeRevisit(revisit.id); await deleteRevisit(revisit.id)
    }

    // Stop action-button clicks from bubbling to the row click
    const stopProp = (e: React.MouseEvent) => e.stopPropagation()

    return (
        <motion.tr
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onRowClick(revisit)}
            className={cn(
                "border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors cursor-pointer group",
                isCompleted && "opacity-50"
            )}
        >
            {/* # */}
            <td className="py-3.5 pl-5 pr-3 text-sm text-zinc-500 w-8">{index + 1}</td>

            {/* Title + URL */}
            <td className="py-3.5 pr-4 min-w-[180px]">
                <p className={cn("text-sm font-semibold text-zinc-100 leading-tight",
                    isCompleted && "line-through text-zinc-500")}>{revisit.title}</p>
                {revisit.resource_url && (
                    <a href={revisit.resource_url} target="_blank" rel="noopener noreferrer"
                        onClick={stopProp}
                        className={cn("text-xs text-emerald-500 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-[220px]",
                            isCompleted && "line-through text-zinc-600")}>
                        {revisit.resource_url.replace(/^https?:\/\//, '')}
                    </a>
                )}
                {revisit.reason_to_return && (
                    <p className="text-xs text-zinc-500 italic mt-0.5 truncate max-w-[220px]">"{revisit.reason_to_return}"</p>
                )}
            </td>

            {/* Type */}
            <td className="py-3.5 pr-4">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize',
                    TYPE_COLORS[revisit.type] ?? TYPE_COLORS.misc)}>
                    {typeLabel(revisit)}
                </span>
            </td>

            {/* Status */}
            <td className="py-3.5 pr-4">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', status.cls)}>
                    {status.label}
                </span>
            </td>

            {/* Next Review */}
            <td className={cn('py-3.5 pr-4 text-sm font-medium',
                status.label === 'overdue' ? 'text-red-400' : 'text-zinc-300')}>
                {format(parseISO(revisit.next_review_at), 'MMM d, yyyy')}
            </td>

            {/* Reviews */}
            <td className="py-3.5 pr-4 text-sm text-zinc-400">{revisit.review_count}</td>

            {/* Time Est. */}
            <td className="py-3.5 pr-4 text-sm text-zinc-400">{revisit.estimated_time_min}m</td>

            {/* Created */}
            <td className="py-3.5 pr-4 text-sm text-zinc-500">
                {format(parseISO(revisit.created_at), 'MMM d, yyyy')}
            </td>

            {/* Actions */}
            <td className="py-3.5 pr-5" onClick={stopProp}>
                <AnimatePresence mode="wait">
                    {deleting ? (
                        <motion.div key="delete-confirm"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-1">
                            <button onClick={handleMarkComplete}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/40 transition-colors whitespace-nowrap">
                                ✓ Mark Complete</button>
                            <button onClick={handleDelete}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-700/40 transition-colors whitespace-nowrap">
                                ✕ Delete Forever</button>
                            <button onClick={() => { setDeleting(false); setFinishing(true) }} className="ml-0.5 text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
                        </motion.div>
                    ) : finishing ? (
                        <RowRatingFlow key="rate" onRate={handleRate}
                            onDelete={() => setDeleting(true)} onCancel={() => setFinishing(false)} />
                    ) : (
                        <div key="actions" className="flex items-center gap-1.5">
                            <button onClick={() => setFinishing(true)} title="Mark Done"
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-900/30 transition-colors">
                                <CheckCircle2 size={16} /></button>
                            <button ref={clockBtnRef}
                                onClick={() => setScheduleAnchor(scheduleAnchor ? null : clockBtnRef.current?.getBoundingClientRect() ?? null)}
                                title="Schedule next review"
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-900/30 transition-colors">
                                <Clock size={16} /></button>
                            <AnimatePresence>
                                {scheduleAnchor && (
                                    <ScheduleDropdown anchorRect={scheduleAnchor}
                                        onSchedule={handleSchedule} onClose={() => setScheduleAnchor(null)} />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </AnimatePresence>
            </td>
        </motion.tr>
    )
}

// ─── card view components ─────────────────────────────────────────────────────

function RevisitCard({ revisit, onRowClick }: { revisit: Revisit; onRowClick: (r: Revisit) => void }) {
    const { updateRevisitLocal, removeRevisit } = useRevisitsStore()
    const [finishing, setFinishing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [scheduleAnchor, setScheduleAnchor] = useState<DOMRect | null>(null)
    const clockBtnRef = useRef<HTMLButtonElement>(null)
    const status = getStatus(revisit)

    const handleRate = async (rating: 'hard' | 'medium' | 'easy') => {
        updateRevisitLocal(revisit.id, { review_count: revisit.review_count + 1, status: 'active' })
        setFinishing(false)
        await completeReview(revisit.id, rating)
    }
    const handleSchedule = async (dateStr: string) => {
        setScheduleAnchor(null)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
        const days = Math.max(1, Math.round((target.getTime() - today.getTime()) / 86400000))
        await snoozeRevisit(revisit.id, days)
    }
    const handleMarkComplete = async () => {
        updateRevisitLocal(revisit.id, { status: 'done' }); setDeleting(false)
        await markMastered(revisit.id)
    }
    const handleDelete = async () => {
        removeRevisit(revisit.id); await deleteRevisit(revisit.id)
    }
    const stopProp = (e: React.MouseEvent) => e.stopPropagation()

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onRowClick(revisit)}
            className={cn(
                'group relative w-full overflow-hidden rounded-2xl cursor-pointer h-[170px]',
                'transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1'
            )}
        >
            {/* ── Electric border: spinning conic-gradient, clipped by overflow-hidden ── */}
            <div
                className="absolute -inset-[150%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: 'conic-gradient(from 0deg, transparent 30%, #10b981 45%, #818cf8 55%, transparent 70%)',
                    animation: 'spin-border 3s linear infinite',
                }}
            />
            {/* Inner solid backing (masks the gradient except at edges → border effect) */}
            <div className="absolute inset-[1.5px] rounded-[14px] bg-zinc-900" />

            {/* Status-tinted accent */}
            <div className={cn(
                'absolute inset-[1.5px] rounded-[14px]',
                status.label === 'overdue' ? 'bg-gradient-to-br from-red-950/80   to-transparent' :
                    status.label === 'due today' ? 'bg-gradient-to-br from-amber-950/70 to-transparent' :
                        'bg-gradient-to-br from-zinc-800/80   to-transparent'
            )} />
            {/* Dark overlay for readability */}
            <div className="absolute inset-[1.5px] rounded-[14px] bg-gradient-to-t from-black/80 via-black/50 to-black/10" />

            {/* ── Content ── */}
            <div className="relative flex h-full flex-col justify-between p-5 text-white">

                {/* TOP: always-visible badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border', TYPE_COLORS[revisit.type] ?? TYPE_COLORS.misc)}>
                        {typeLabel(revisit)}
                    </span>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', status.cls)}>
                        {status.label}
                    </span>
                </div>

                {/* MIDDLE: title + meta — slides up on hover to reveal the bottom panel */}
                <div className="transition-transform duration-500 ease-in-out group-hover:-translate-y-[52px] space-y-1">
                    <h3 className="text-lg font-extrabold text-white leading-snug line-clamp-2">{revisit.title}</h3>
                    <p className="text-[11px] text-white/60 flex items-center gap-1">
                        <Clock size={11} />
                        {revisit.estimated_time_min}m &nbsp;·&nbsp; {revisit.review_count} review{revisit.review_count !== 1 ? 's' : ''}
                    </p>
                    {revisit.reason_to_return && (
                        <p className="text-[11px] text-white/45 italic line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            "{revisit.reason_to_return}"
                        </p>
                    )}
                </div>

                {/* BOTTOM PANEL: rises up + fades in on hover */}
                <div className="absolute -bottom-20 left-0 w-full px-4 pb-3 pt-2 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100">
                    {/* Resource URL hint */}
                    {revisit.resource_url && (
                        <p className="text-[11px] text-emerald-400 truncate mb-2 flex items-center gap-1">
                            <ArrowRight size={10} />
                            {revisit.resource_url.replace(/^https?:\/\//, '')}
                        </p>
                    )}

                    {/* Actions + Start — clicks stop propagation so drawer doesn't open */}
                    <div className="flex items-center justify-between gap-2">
                        <div onClick={stopProp} className="flex items-center gap-1.5">
                            <AnimatePresence mode="wait">
                                {deleting ? (
                                    <motion.div key="del" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                                        <button onClick={handleMarkComplete}
                                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-700/40 transition-colors whitespace-nowrap">
                                            ✓ Complete</button>
                                        <button onClick={handleDelete}
                                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/80 border border-red-700/40 transition-colors whitespace-nowrap">
                                            ✕ Delete</button>
                                        <button onClick={() => { setDeleting(false); setFinishing(true) }} className="text-zinc-500 hover:text-zinc-300 text-xs ml-0.5">✕</button>
                                    </motion.div>
                                ) : finishing ? (
                                    <RowRatingFlow key="rate" onRate={handleRate}
                                        onDelete={() => setDeleting(true)} onCancel={() => setFinishing(false)} />
                                ) : (
                                    <div key="idle" className="flex items-center gap-1.5">
                                        <button onClick={() => setFinishing(true)} title="Mark Done"
                                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/40 transition-colors">
                                            <CheckCircle2 size={15} /></button>
                                        <button ref={clockBtnRef}
                                            onClick={() => setScheduleAnchor(scheduleAnchor ? null : clockBtnRef.current?.getBoundingClientRect() ?? null)}
                                            title="Schedule"
                                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/40 transition-colors">
                                            <Clock size={15} /></button>
                                        <AnimatePresence>
                                            {scheduleAnchor && (
                                                <ScheduleDropdown anchorRect={scheduleAnchor}
                                                    onSchedule={handleSchedule} onClose={() => setScheduleAnchor(null)} />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Start button */}
                        <div onClick={stopProp}>
                            {revisit.resource_url ? (
                                <a href={revisit.resource_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors shadow shadow-emerald-500/30">
                                    Start <ArrowRight size={12} />
                                </a>
                            ) : (
                                <button onClick={(e) => { stopProp(e); onRowClick(revisit) }}
                                    title="No link — view notes"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors shadow shadow-emerald-500/30">
                                    Start <ArrowRight size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function CardSection({ title, items, accent, onCardClick }: {
    title: string
    items: Revisit[]
    accent: string
    onCardClick: (r: Revisit) => void
}) {
    if (items.length === 0) return null
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <span className={cn('w-2 h-2 rounded-full', accent)} />
                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{title}</h2>
                <span className="text-xs text-zinc-600 font-semibold">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map(r => <RevisitCard key={r.id} revisit={r} onRowClick={onCardClick} />)}
            </div>
        </div>
    )
}

// ─── filter bar ──────────────────────────────────────────────────────────────

type SortField = 'next_review_at' | 'created_at' | 'review_count' | 'title'

const STATUS_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Due Today', value: 'due today' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Mastered', value: 'mastered' },
]

const SORT_OPTIONS: { label: string; value: SortField }[] = [
    { label: 'Next Review', value: 'next_review_at' },
    { label: 'Created', value: 'created_at' },
    { label: 'Reviews', value: 'review_count' },
    { label: 'Title', value: 'title' },
]

// ─── main view ───────────────────────────────────────────────────────────────

export function RevisitsView({ initialRevisits }: RevisitsViewProps) {
    const { revisits, setRevisits } = useRevisitsStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeDrawer, setActiveDrawer] = useState<Revisit | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [sortField, setSortField] = useState<SortField>('next_review_at')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [showFilters, setShowFilters] = useState(false)
    const [viewMode, setViewMode] = useState<'today' | 'all'>('all')

    useEffect(() => { setRevisits(initialRevisits) }, [initialRevisits, setRevisits])

    // Derive unique type list from data
    const allTypes = Array.from(new Set(
        revisits.map(r => r.type === 'custom' && r.custom_type ? r.custom_type : r.type)
    ))

    // Today count (due today + overdue, active only)
    const todayItems = revisits.filter(r =>
        r.status !== 'archived' && ['due today', 'overdue'].includes(getStatus(r).label)
    )
    const todayCount = todayItems.length
    const todayTimeMin = todayItems.reduce((sum, r) => sum + (r.estimated_time_min ?? 0), 0)

    // Upcoming count (next 7 days, excluding today/overdue)
    const upcomingCount = revisits.filter(r => {
        if (r.status === 'archived') return false
        const label = getStatus(r).label
        return label === 'upcoming'
    }).length

    // Filter + sort
    const filtered = revisits
        .filter(r => r.status !== 'archived')
        // View mode pre-filter
        .filter(r => {
            if (viewMode === 'today') return ['due today', 'overdue'].includes(getStatus(r).label)
            return true
        })
        .filter(r => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return r.title.toLowerCase().includes(q) || r.reason_to_return?.toLowerCase().includes(q) || typeLabel(r).toLowerCase().includes(q)
        })
        .filter(r => {
            if (statusFilter === 'all') return true
            return getStatus(r).label === statusFilter
        })
        .filter(r => {
            if (typeFilter === 'all') return true
            return typeLabel(r).toLowerCase() === typeFilter.toLowerCase()
        })
        .sort((a, b) => {
            let va: any, vb: any
            if (sortField === 'title') { va = a.title.toLowerCase(); vb = b.title.toLowerCase() }
            else if (sortField === 'review_count') { va = a.review_count; vb = b.review_count }
            else { va = a[sortField]; vb = b[sortField] }
            if (va < vb) return sortDir === 'asc' ? -1 : 1
            if (va > vb) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    }

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Zap size={16} className="text-white" fill="white" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Precision Learning</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Return Stack</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Spaced repetition for things that actually matter.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                    <Zap size={18} fill="currentColor" /> Quick Capture
                </button>
            </div>

            {/* Stats banner */}
            <div className="mb-6 border border-zinc-800 rounded-2xl overflow-hidden">
                <FeaturesSectionWithHoverEffects features={[
                    {
                        title: todayCount === 0 ? 'All caught up!' : `${todayCount} Due Today`,
                        description: todayCount === 0
                            ? 'No overdue or due-today revisits.'
                            : `${todayCount} revisit${todayCount !== 1 ? 's' : ''} waiting for your attention today.`,
                        icon: <BookOpen size={22} className="text-emerald-400" />,
                    },
                    {
                        title: todayTimeMin >= 60
                            ? `${Math.floor(todayTimeMin / 60)}h ${todayTimeMin % 60}m`
                            : `${todayTimeMin} min`,
                        description: todayTimeMin === 0
                            ? 'Nothing scheduled for today.'
                            : `Estimated time to clear today's queue.`,
                        icon: <Timer size={22} className="text-amber-400" />,
                    },
                    {
                        title: `${upcomingCount} Upcoming`,
                        description: upcomingCount === 0
                            ? 'Nothing else on the horizon this week.'
                            : `${upcomingCount} revisit${upcomingCount !== 1 ? 's' : ''} scheduled for later this week.`,
                        icon: <CalendarCheck size={22} className="text-blue-400" />,
                    },
                ]} />
            </div>

            {/* View mode selector */}
            <div className="flex items-center gap-2 mb-6">
                <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 gap-1">
                    {(['today', 'all'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                                'relative px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2',
                                viewMode === mode
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                    : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            {mode === 'today' ? "Today's Revisits" : 'All Revisits'}
                            {mode === 'today' && todayCount > 0 && (
                                <span className={cn(
                                    'text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                    viewMode === 'today'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-red-500 text-white'
                                )}>{todayCount}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Today mode: card view ── */}
            {viewMode === 'today' && (() => {
                const today = startOfDay(new Date())
                const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
                const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
                const weekOut = new Date(today); weekOut.setDate(weekOut.getDate() + 7)

                const all = revisits.filter(r => r.status !== 'archived')
                const overdue = all.filter(r => getStatus(r).label === 'overdue')
                const dueToday = all.filter(r => getStatus(r).label === 'due today')
                const dueTomorrow = all.filter(r => {
                    const d = startOfDay(parseISO(r.next_review_at))
                    return d.getTime() === tomorrow.getTime()
                })
                const upcoming = all.filter(r => {
                    const d = startOfDay(parseISO(r.next_review_at))
                    return d > tomorrow && d <= weekOut
                })

                const isEmpty = overdue.length + dueToday.length + dueTomorrow.length + upcoming.length === 0

                return (
                    <div>
                        {isEmpty ? (
                            <div className="py-20 text-center">
                                <p className="text-4xl mb-3">🎉</p>
                                <p className="text-zinc-300 font-bold text-lg">You're all caught up!</p>
                                <p className="text-zinc-500 text-sm mt-1">No revisits due in the next 7 days.</p>
                                <button onClick={() => setIsModalOpen(true)}
                                    className="mt-5 text-emerald-500 font-bold text-sm hover:underline flex items-center gap-2 mx-auto">
                                    Add something new <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <CardSection title="Overdue" items={overdue} accent="bg-red-500" onCardClick={r => setActiveDrawer(r)} />
                                <CardSection title="Due Today" items={dueToday} accent="bg-amber-400" onCardClick={r => setActiveDrawer(r)} />
                                <CardSection title="Tomorrow" items={dueTomorrow} accent="bg-blue-400" onCardClick={r => setActiveDrawer(r)} />
                                <CardSection title="Upcoming (next 7 days)" items={upcoming} accent="bg-zinc-500" onCardClick={r => setActiveDrawer(r)} />
                            </>
                        )}
                    </div>
                )
            })()}

            {/* ── All mode: table view ── */}
            {viewMode === 'all' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

                    {/* Top bar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-400" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                            </svg>
                            <span className="text-base font-bold text-white">
                                All Revisits{' '}
                                <span className="text-zinc-500 font-normal">({filtered.length})</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…"
                                    className="bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-48" />
                            </div>
                            {/* Filter toggle */}
                            <button onClick={() => setShowFilters(v => !v)}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors",
                                    showFilters ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}>
                                <SlidersHorizontal size={14} /> Filters
                            </button>
                            {/* Export */}
                            <button onClick={() => exportToCSV(filtered)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                                <Download size={15} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {/* Filter panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                className="overflow-hidden border-b border-zinc-800">
                                <div className="px-5 py-4 space-y-3">
                                    {/* Status chips */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider w-14">Status</span>
                                        {STATUS_FILTERS.map(f => (
                                            <button key={f.value} onClick={() => setStatusFilter(f.value)}
                                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors border",
                                                    statusFilter === f.value
                                                        ? "bg-emerald-500 text-white border-emerald-500"
                                                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500")}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Type chips */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider w-14">Type</span>
                                        <button onClick={() => setTypeFilter('all')}
                                            className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors border",
                                                typeFilter === 'all' ? "bg-emerald-500 text-white border-emerald-500"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500")}>
                                            All
                                        </button>
                                        {allTypes.map(t => (
                                            <button key={t} onClick={() => setTypeFilter(t)}
                                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors border capitalize",
                                                    typeFilter === t ? "bg-emerald-500 text-white border-emerald-500"
                                                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500")}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Sort */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider w-14">Sort</span>
                                        {SORT_OPTIONS.map(o => (
                                            <button key={o.value} onClick={() => toggleSort(o.value)}
                                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors border flex items-center gap-1",
                                                    sortField === o.value ? "bg-emerald-500 text-white border-emerald-500"
                                                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500")}>
                                                {o.label}
                                                {sortField === o.value && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Clear */}
                                    {(statusFilter !== 'all' || typeFilter !== 'all' || sortField !== 'next_review_at' || searchQuery) && (
                                        <div className="pt-1 border-t border-zinc-800/60">
                                            <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSortField('next_review_at'); setSortDir('asc'); setSearchQuery('') }}
                                                className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                                                <X size={12} /> Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table */}
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-zinc-500 text-sm">No revisits match these filters.</p>
                            <button onClick={() => setIsModalOpen(true)}
                                className="mt-4 text-emerald-500 font-bold text-sm hover:underline flex items-center gap-2 mx-auto">
                                Add your first resource <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                        <th className="py-3 pl-5 pr-3 w-8">#</th>
                                        <th className="py-3 pr-4">Title</th>
                                        <th className="py-3 pr-4">Type</th>
                                        <th className="py-3 pr-4">Status</th>
                                        <th className="py-3 pr-4 cursor-pointer hover:text-zinc-300 select-none" onClick={() => toggleSort('next_review_at')}>
                                            <span className="flex items-center gap-1">Next Review <SortIcon field="next_review_at" /></span>
                                        </th>
                                        <th className="py-3 pr-4 cursor-pointer hover:text-zinc-300 select-none" onClick={() => toggleSort('review_count')}>
                                            <span className="flex items-center gap-1">Reviews <SortIcon field="review_count" /></span>
                                        </th>
                                        <th className="py-3 pr-4">Time Est.</th>
                                        <th className="py-3 pr-4 cursor-pointer hover:text-zinc-300 select-none" onClick={() => toggleSort('created_at')}>
                                            <span className="flex items-center gap-1">Created <SortIcon field="created_at" /></span>
                                        </th>
                                        <th className="py-3 pr-5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item, i) => (
                                        <RevisitRow key={item.id} revisit={item} index={i}
                                            onRowClick={r => setActiveDrawer(r)} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <QuickCaptureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <RevisitDetailDrawer revisit={activeDrawer} onClose={() => setActiveDrawer(null)} />
        </div>
    )
}
