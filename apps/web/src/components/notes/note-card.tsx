'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Pin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/actions/notes'

const NOTE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
    red: { bg: 'bg-red-500/10 backdrop-blur-md', border: 'border-red-400/30', dot: 'bg-red-400' },
    orange: { bg: 'bg-orange-500/10 backdrop-blur-md', border: 'border-orange-400/30', dot: 'bg-orange-400' },
    yellow: { bg: 'bg-yellow-500/10 backdrop-blur-md', border: 'border-yellow-400/30', dot: 'bg-yellow-400' },
    green: { bg: 'bg-emerald-500/10 backdrop-blur-md', border: 'border-emerald-400/30', dot: 'bg-emerald-400' },
    blue: { bg: 'bg-blue-500/10 backdrop-blur-md', border: 'border-blue-400/30', dot: 'bg-blue-400' },
    purple: { bg: 'bg-purple-500/10 backdrop-blur-md', border: 'border-purple-400/30', dot: 'bg-purple-400' },
    pink: { bg: 'bg-pink-500/10 backdrop-blur-md', border: 'border-pink-400/30', dot: 'bg-pink-400' },
}

interface NoteCardProps {
    note: Note
    isActive: boolean
    onClick: () => void
    index: number
}

export function NoteCard({ note, isActive, onClick, index }: NoteCardProps) {
    const colorStyle = note.color ? NOTE_COLORS[note.color] : null
    const preview = note.content.slice(0, 120).replace(/[#*_~`>\[\]]/g, '')
    const timeAgo = getRelativeTime(note.updated_at)

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            onClick={onClick}
            className={cn(
                'group relative cursor-pointer p-3.5 transition-all duration-200',
                'hover:shadow-xl hover:scale-[1.02] hover:border-white/20',
                isActive
                    ? 'bg-black/50 backdrop-blur-md border-emerald-400/50 shadow-lg ring-1 ring-emerald-400/30'
                    : colorStyle
                        ? `${colorStyle.bg} backdrop-blur-md border shadow-lg`
                        : 'bg-black/40 backdrop-blur-md border-white/10 shadow-lg',
                'border-l-[3px] border-white/10 rounded-2xl'
            )}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <h3 className={cn(
                    'font-semibold text-sm leading-snug truncate flex-1',
                    isActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-zinc-800 dark:text-zinc-200'
                )}>
                    {note.title || 'Untitled'}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {note.is_pinned && (
                        <Pin size={12} className="text-amber-500 fill-amber-500" />
                    )}
                    {colorStyle && (
                        <div className={cn('w-2.5 h-2.5 rounded-full', colorStyle.dot)} />
                    )}
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <p className={cn(
                    'text-xs leading-relaxed mt-1.5 line-clamp-2',
                    isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'
                )}>
                    {preview}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-2">
                <Clock size={10} className="text-zinc-400 dark:text-zinc-500" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    {timeAgo}
                </span>
            </div>
        </motion.div>
    )
}

function getRelativeTime(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export { NOTE_COLORS }
