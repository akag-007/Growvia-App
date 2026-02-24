'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ExternalLink, Save, Trash2, CheckCircle2,
    Clock, RotateCcw, CalendarDays, BookOpen, StickyNote,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { updateRevisit, deleteRevisit, markMastered } from '@/actions/revisits'
import { useRevisitsStore } from '@/stores/revisits'
import type { Revisit } from '@/actions/revisits'

const TYPE_OPTIONS = [
    { value: 'tech', label: 'Tech' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'math', label: 'Math' },
    { value: 'college', label: 'College' },
    { value: 'book', label: 'Book' },
    { value: 'misc', label: 'Misc' },
    { value: 'custom', label: '＋ Custom…' },
]

const TYPE_COLORS: Record<string, string> = {
    tech: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    leetcode: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
    math: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    college: 'bg-pink-900/40 text-pink-300 border-pink-700/50',
    book: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    misc: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    custom: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
}

interface Props {
    revisit: Revisit | null
    onClose: () => void
}

export function RevisitDetailDrawer({ revisit, onClose }: Props) {
    const { updateRevisitLocal, removeRevisit } = useRevisitsStore()
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [form, setForm] = useState({
        title: '',
        type: 'tech' as string,
        custom_type: '',
        resource_url: '',
        reason_to_return: '',
        estimated_time_min: '15',
        difficulty: 3,
        notes: '',
    })

    // Sync form when revisit changes
    useEffect(() => {
        if (!revisit) return
        setForm({
            title: revisit.title,
            type: revisit.type,
            custom_type: revisit.custom_type ?? '',
            resource_url: revisit.resource_url ?? '',
            reason_to_return: revisit.reason_to_return ?? '',
            estimated_time_min: String(revisit.estimated_time_min),
            difficulty: revisit.difficulty ?? 3,
            notes: revisit.notes ?? '',
        })
    }, [revisit])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleSave = async () => {
        if (!revisit) return
        setSaving(true)
        const patch = {
            title: form.title,
            type: form.type as any,
            custom_type: form.type === 'custom' ? form.custom_type : null,
            resource_url: form.resource_url || null,
            reason_to_return: form.reason_to_return || null,
            estimated_time_min: parseInt(form.estimated_time_min),
            difficulty: form.difficulty,
            notes: form.notes || null,
        }
        updateRevisitLocal(revisit.id, patch)
        await updateRevisit(revisit.id, patch)
        setSaving(false)
        onClose()
    }

    const handleDelete = async () => {
        if (!revisit) return
        removeRevisit(revisit.id)
        await deleteRevisit(revisit.id)
        onClose()
    }

    const handleMarkComplete = async () => {
        if (!revisit) return
        updateRevisitLocal(revisit.id, { status: 'done' })
        await markMastered(revisit.id)
        onClose()
    }

    const label = (s: string) => (
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{s}</p>
    )

    const inputCls = "w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"

    const displayType = revisit?.type === 'custom' && revisit?.custom_type
        ? revisit.custom_type
        : revisit?.type ?? 'misc'

    return (
        <AnimatePresence>
            {revisit && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-emerald-400" />
                                <div>
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Revisit Details</p>
                                    <span className={cn(
                                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize mt-0.5',
                                        TYPE_COLORS[revisit.type] ?? TYPE_COLORS.misc
                                    )}>
                                        {displayType}
                                    </span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable form */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Title */}
                            <div>
                                {label('Title')}
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className={inputCls}
                                    placeholder="Resource title"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                {label('Category')}
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                    className={inputCls + ' appearance-none cursor-pointer'}
                                >
                                    {TYPE_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                {form.type === 'custom' && (
                                    <input
                                        value={form.custom_type}
                                        onChange={e => setForm({ ...form, custom_type: e.target.value })}
                                        placeholder="Enter custom category name…"
                                        className={inputCls + ' mt-2'}
                                    />
                                )}
                            </div>

                            {/* URL */}
                            <div>
                                {label('Resource URL')}
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={form.resource_url}
                                        onChange={e => setForm({ ...form, resource_url: e.target.value })}
                                        className={inputCls + ' pr-10'}
                                        placeholder="https://…"
                                    />
                                    {form.resource_url && (
                                        <a href={form.resource_url} target="_blank" rel="noopener noreferrer"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Reason to return */}
                            <div>
                                {label('Reason to Return')}
                                <textarea
                                    rows={2}
                                    value={form.reason_to_return}
                                    onChange={e => setForm({ ...form, reason_to_return: e.target.value })}
                                    className={inputCls + ' resize-none'}
                                    placeholder="Why do you need to revisit this?"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                {label('Notes')}
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className={inputCls + ' resize-none'}
                                    placeholder="Any additional notes…"
                                />
                            </div>

                            {/* Est. Time + Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    {label('Est. Time')}
                                    <select
                                        value={form.estimated_time_min}
                                        onChange={e => setForm({ ...form, estimated_time_min: e.target.value })}
                                        className={inputCls + ' appearance-none cursor-pointer'}
                                    >
                                        {[5, 15, 30, 60].map(m => (
                                            <option key={m} value={m}>{m} mins</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    {label('Difficulty')}
                                    <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map(d => (
                                            <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                                                className={cn(
                                                    'flex-1 py-2 rounded-lg text-xs font-bold transition-colors',
                                                    form.difficulty >= d
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                                )}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Read-only stats */}
                            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 grid grid-cols-2 gap-3 text-sm">
                                <Stat icon={<RotateCcw size={13} />} label="Reviews" value={String(revisit.review_count)} />
                                <Stat icon={<CalendarDays size={13} />} label="Next Review"
                                    value={format(parseISO(revisit.next_review_at), 'MMM d, yyyy')} />
                                <Stat icon={<Clock size={13} />} label="Created"
                                    value={format(parseISO(revisit.created_at), 'MMM d, yyyy')} />
                                <Stat icon={<StickyNote size={13} />} label="Last Reviewed"
                                    value={revisit.last_reviewed_at
                                        ? format(parseISO(revisit.last_reviewed_at), 'MMM d, yyyy')
                                        : 'Never'} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 flex gap-3">
                            {/* Delete */}
                            {!deleting ? (
                                <button onClick={() => setDeleting(true)}
                                    className="p-2.5 rounded-xl text-red-500 hover:bg-red-900/20 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    <button onClick={handleMarkComplete}
                                        className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/40 transition-colors whitespace-nowrap">
                                        ✓ Mark Complete
                                    </button>
                                    <button onClick={handleDelete}
                                        className="px-3 py-2 text-xs font-bold rounded-xl bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-700/40 transition-colors whitespace-nowrap">
                                        ✕ Delete Forever
                                    </button>
                                    <button onClick={() => setDeleting(false)} className="text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
                                </div>
                            )}

                            <div className="flex-1" />

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div className="flex items-center gap-1 text-zinc-600 mb-0.5">{icon}<span className="text-[10px] uppercase tracking-wider font-bold">{label}</span></div>
            <p className="text-zinc-300 font-medium text-sm">{value}</p>
        </div>
    )
}
