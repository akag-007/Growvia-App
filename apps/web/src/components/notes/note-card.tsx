'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Pin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/actions/notes'

const NOTE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-l-red-400', dot: 'bg-red-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-l-orange-400', dot: 'bg-orange-400' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-l-yellow-400', dot: 'bg-yellow-400' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-l-blue-400', dot: 'bg-blue-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-l-purple-400', dot: 'bg-purple-400' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-l-pink-400', dot: 'bg-pink-400' },
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
                'group relative cursor-pointer rounded-xl border-l-[3px] p-3.5 transition-all duration-200',
                'hover:shadow-md hover:scale-[1.01]',
                isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : colorStyle
                        ? `${colorStyle.bg} ${colorStyle.border}`
                        : 'bg-white dark:bg-zinc-900/60 border-l-zinc-200 dark:border-l-zinc-700 hover:border-l-emerald-400',
                'border border-l-[3px] border-zinc-100 dark:border-zinc-800/50'
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
