'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/actions/notes'

interface CollectionsColumnProps {
    notes: Note[]
    activeNoteId: string | null
    onNoteClick: (noteId: string) => void
    onBack: () => void
    onCreateNote: () => void
}

function getTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getPreview(note: Note): string {
    return note.content.slice(0, 80).replace(/\s+/g, ' ').trim()
}

export function CollectionsColumn({ notes, activeNoteId, onNoteClick, onBack, onCreateNote }: CollectionsColumnProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-64 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden h-full"
            style={{
                background: 'rgba(8, 14, 22, 0.65)',
                backdropFilter: 'blur(28px) saturate(140%)',
                WebkitBackdropFilter: 'blur(28px) saturate(140%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
        >
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 mb-4 group"
                    aria-label="Back to gallery"
                >
                    <ArrowLeft size={13} className="text-white/35 group-hover:text-white/60 transition-colors group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[10px] font-medium text-white/35 group-hover:text-white/60 transition-colors uppercase tracking-widest">
                        Gallery
                    </span>
                </button>

                <div className="flex items-end justify-between">
                    <h2
                        className="text-sm font-semibold"
                        style={{ color: 'rgba(255,255,255,0.70)' }}
                    >
                        Collections
                    </h2>
                    <span className="text-[10px] text-white/25 tabular-nums">{notes.length}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-white/[0.06]" />

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-hide">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-xs text-white/30 mb-3">No notes yet</p>
                        <button
                            onClick={onCreateNote}
                            className="text-[11px] text-teal-400/70 hover:text-teal-300 transition-colors"
                        >
                            + Create your first note
                        </button>
                    </div>
                ) : (
                    notes.map((note, index) => {
                        const isActive = activeNoteId === note.id
                        const preview = getPreview(note)
                        const timeAgo = getTimeAgo(note.updated_at)

                        return (
                            <motion.button
                                key={note.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => onNoteClick(note.id)}
                                className={cn(
                                    'w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group relative',
                                    isActive
                                        ? 'bg-teal-500/12'
                                        : 'hover:bg-white/[0.04]'
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-note-bar"
                                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-400"
                                    />
                                )}

                                <div className="flex items-start justify-between gap-1.5 mb-0.5">
                                    <h3 className={cn(
                                        'font-medium text-[12px] leading-snug line-clamp-1',
                                        isActive ? 'text-white/90' : 'text-white/65 group-hover:text-white/80'
                                    )}>
                                        {note.title || 'Untitled'}
                                    </h3>
                                    <span className="text-[9px] text-white/20 tabular-nums flex-shrink-0 mt-0.5">{timeAgo}</span>
                                </div>
                                {preview && (
                                    <p className="text-[10px] text-white/30 line-clamp-2 leading-relaxed">
                                        {preview}
                                    </p>
                                )}
                            </motion.button>
                        )
                    })
                )}
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-white/[0.06]" />

            {/* FAB */}
            <div className="p-4 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onCreateNote}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                        boxShadow: '0 4px 16px rgba(20,184,166,0.30)',
                    }}
                    aria-label="New note"
                >
                    <Plus size={16} className="text-white" />
                </motion.button>
            </div>
        </motion.div>
    )
}
