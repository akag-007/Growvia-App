'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mountain, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/actions/notes'

interface NoteSidebarBarProps {
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
    return note.content.slice(0, 90).replace(/\s+/g, ' ').trim()
}

export function NoteSidebarBar({ notes, activeNoteId, onNoteClick, onBack, onCreateNote }: NoteSidebarBarProps) {
    return (
        <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 flex flex-col z-40 overflow-hidden"
            style={{
                background: 'rgba(8, 14, 22, 0.72)',
                backdropFilter: 'blur(28px) saturate(140%)',
                WebkitBackdropFilter: 'blur(28px) saturate(140%)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-8 pb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 mb-5 group"
                    aria-label="Back to grid"
                >
                    <Mountain size={14} className="text-teal-400/70 group-hover:text-teal-300 transition-colors" />
                    <span className="text-[11px] font-medium text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest">
                        Collections
                    </span>
                </button>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">Mountain Summaries</p>
                    </div>
                    <span className="text-[10px] text-white/25 font-medium tabular-nums">{notes.length}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-sm text-white/30 mb-4">No notes yet</p>
                        <button
                            onClick={onCreateNote}
                            className="text-xs text-teal-400/70 hover:text-teal-300 transition-colors"
                        >
                            + Create your first note
                        </button>
                    </div>
                ) : (
                    notes.map((note, index) => {
                        const isActive = activeNoteId === note.id
                        const preview = getPreview(note)
                        const timeAgo = getTimeAgo(note.updated_at)
                        const isRecent = new Date().getTime() - new Date(note.updated_at).getTime() < 3600000

                        return (
                            <motion.button
                                key={note.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => onNoteClick(note.id)}
                                className={cn(
                                    'w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative',
                                    isActive
                                        ? 'bg-teal-500/10'
                                        : 'hover:bg-white/[0.04]'
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-note-indicator"
                                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-400"
                                    />
                                )}

                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className={cn(
                                        'font-medium text-[13px] leading-snug line-clamp-1',
                                        isActive ? 'text-white/95' : 'text-white/70 group-hover:text-white/85'
                                    )}>
                                        {note.title || 'Untitled'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                        {isRecent && !isActive && (
                                            <span className="text-[9px] font-semibold text-teal-400/90 bg-teal-400/10 px-1.5 py-0.5 rounded-full">
                                                NEW
                                            </span>
                                        )}
                                        <span className="text-[10px] text-white/25 tabular-nums">{timeAgo}</span>
                                    </div>
                                </div>
                                {preview && (
                                    <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed">
                                        {preview}
                                    </p>
                                )}
                            </motion.button>
                        )
                    })
                )}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* FAB */}
            <div className="p-5 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onCreateNote}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                        boxShadow: '0 4px 20px rgba(20,184,166,0.35)',
                    }}
                    aria-label="New note"
                >
                    <Plus size={18} className="text-white" />
                </motion.button>
            </div>
        </motion.div>
    )
}
