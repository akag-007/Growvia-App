'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/actions/notes'
import { useNotesStore } from '@/stores/notes'

interface SpatialGridProps {
    notes: Note[]
    activeNoteId: string | null
    onNoteClick: (noteId: string) => void
    onCreateNote: () => void
    isEditorMode: boolean
}

export function SpatialGrid({ notes, activeNoteId, onNoteClick, onCreateNote, isEditorMode }: SpatialGridProps) {
    // Get color-based tint classes for glassmorphic effect
    const getGlassColorClass = (note: Note) => {
        const baseClass = 'backdrop-blur-md bg-black/40 border-white/10 hover:bg-black/50'
        return baseClass
    }

    const variants = {
        grid: {
            initial: { opacity: 0, scale: 0.8, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.8, y: -20 },
        },
        sidebar: {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
        },
    }

    // Calculate grid positions for spatial effect
    const getGridPosition = (index: number) => {
        const positions = [
            { col: 'col-span-2', row: 'row-span-2' }, // Large card
            { col: 'col-span-1', row: 'row-span-1' },
            { col: 'col-span-1', row: 'row-span-1' },
            { col: 'col-span-1', row: 'row-span-1' },
            { col: 'col-span-1', row: 'row-span-1' },
            { col: 'col-span-2', row: 'row-span-1' },
        ]
        return positions[index % positions.length]
    }

    return (
        <AnimatePresence mode="wait">
            {!isEditorMode ? (
                <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 p-8 overflow-y-auto"
                >
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white/90 mb-1 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                                Notes
                            </h1>
                            <p className="text-white/50 text-sm">Your thoughts, beautifully scattered</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCreateNote}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            New Note
                        </motion.button>
                    </div>

                    {/* Grid Layout */}
                    {notes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {notes.map((note, index) => {
                                const position = getGridPosition(index)
                                const isActive = activeNoteId === note.id
                                const preview = note.content.slice(0, 100).replace(/[#*_~`>\[\]]/g, '')

                                return (
                                    <motion.div
                                        key={note.id}
                                        {...variants.grid}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={cn(
                                            'relative rounded-2xl p-5 cursor-pointer',
                                            'transition-all duration-300',
                                            'hover:shadow-2xl hover:shadow-black/50 hover:scale-[1.02]',
                                            'hover:border-white/20',
                                            getGlassColorClass(note),
                                            'border backdrop-blur-md',
                                            position.col,
                                            position.row,
                                            isActive && 'ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20'
                                        )}
                                        onClick={() => onNoteClick(note.id)}
                                        whileHover={{ y: -4 }}
                                    >
                                        {/* Glow effect on hover */}
                                        <div className={cn(
                                            'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100',
                                            'transition-opacity duration-300',
                                            'bg-gradient-to-br from-white/5 to-transparent'
                                        )} />

                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3 relative z-10">
                                            <h3 className={cn(
                                                'font-semibold text-lg leading-tight',
                                                isActive ? 'text-emerald-400' : 'text-white/90'
                                            )}>
                                                {note.title || 'Untitled'}
                                            </h3>
                                            {note.is_pinned && (
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            )}
                                        </div>

                                        {/* Preview */}
                                        {preview && (
                                            <p className={cn(
                                                'text-sm leading-relaxed line-clamp-4',
                                                'text-white/60',
                                                'relative z-10'
                                            )}>
                                                {preview}
                                            </p>
                                        )}

                                        {/* Date */}
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                            <span className="text-xs text-white/40">
                                                {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Decorative gradient */}
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl" />
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-[60vh]"
                        >
                            <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center mb-6">
                                <Sparkles size={48} className="text-white/30" />
                            </div>
                            <h3 className="text-xl font-semibold text-white/70 mb-2">No notes yet</h3>
                            <p className="text-white/40 text-sm mb-6">Create your first note to get started</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCreateNote}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Create First Note
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
