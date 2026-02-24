'use client'

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Plus,
    LayoutGrid,
    LayoutList,
    Pin,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotesStore } from '@/stores/notes'
import { NoteCard, NOTE_COLORS } from './note-card'

interface NotesSidebarProps {
    onCreateNote: () => void
}

const colorOptions = [
    { key: 'all', label: 'All', className: 'bg-zinc-400' },
    { key: 'red', label: 'Red', className: 'bg-red-400' },
    { key: 'orange', label: 'Orange', className: 'bg-orange-400' },
    { key: 'yellow', label: 'Yellow', className: 'bg-yellow-400' },
    { key: 'green', label: 'Green', className: 'bg-emerald-400' },
    { key: 'blue', label: 'Blue', className: 'bg-blue-400' },
    { key: 'purple', label: 'Purple', className: 'bg-purple-400' },
    { key: 'pink', label: 'Pink', className: 'bg-pink-400' },
]

export function NotesSidebar({ onCreateNote }: NotesSidebarProps) {
    const {
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        activeNoteId,
        setActiveNoteId,
        getFilteredNotes,
        notes,
    } = useNotesStore()

    const [activeColorFilter, setActiveColorFilter] = React.useState<string>('all')
    const { pinned, unpinned } = getFilteredNotes()

    // Additional color filtering
    const filterByColor = useCallback(
        (noteList: typeof pinned) => {
            if (activeColorFilter === 'all') return noteList
            return noteList.filter((n) => n.color === activeColorFilter)
        },
        [activeColorFilter]
    )

    const filteredPinned = filterByColor(pinned)
    const filteredUnpinned = filterByColor(unpinned)
    const totalNotes = filteredPinned.length + filteredUnpinned.length

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full w-full bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border-r border-zinc-200/60 dark:border-zinc-800/60"
        >
            {/* Header */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                        Notes
                        <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                            {notes.length}
                        </span>
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={onCreateNote}
                        className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow"
                        title="New Note (Ctrl+N)"
                    >
                        <Plus size={16} />
                    </motion.button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filters row */}
                <div className="flex items-center justify-between gap-2">
                    {/* Color filter pills */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {colorOptions.map((c) => (
                            <button
                                key={c.key}
                                onClick={() => setActiveColorFilter(c.key)}
                                title={c.label}
                                className={cn(
                                    'w-5 h-5 rounded-full border-2 transition-all flex-shrink-0',
                                    c.className,
                                    activeColorFilter === c.key
                                        ? 'border-zinc-800 dark:border-white scale-110'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                )}
                            />
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-1.5 rounded-md transition-all',
                                viewMode === 'list'
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600'
                                    : 'text-zinc-400 hover:text-zinc-600'
                            )}
                        >
                            <LayoutList size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-1.5 rounded-md transition-all',
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600'
                                    : 'text-zinc-400 hover:text-zinc-600'
                            )}
                        >
                            <LayoutGrid size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-hide">
                {totalNotes === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search size={32} className="text-zinc-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            {searchQuery || activeColorFilter !== 'all'
                                ? 'No notes match your filter'
                                : 'No notes yet'}
                        </p>
                    </div>
                )}

                {/* Pinned section */}
                <AnimatePresence mode="popLayout">
                    {filteredPinned.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-2"
                        >
                            <div className="flex items-center gap-1.5 px-1 py-1.5">
                                <Pin size={10} className="text-amber-500" />
                                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Pinned
                                </span>
                            </div>
                            <div className={cn(
                                viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'
                            )}>
                                {filteredPinned.map((note, i) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isActive={activeNoteId === note.id}
                                        onClick={() => setActiveNoteId(note.id)}
                                        index={i}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Other notes */}
                    {filteredUnpinned.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {filteredPinned.length > 0 && (
                                <div className="flex items-center gap-1.5 px-1 py-1.5 mt-1">
                                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                        Others
                                    </span>
                                </div>
                            )}
                            <div className={cn(
                                viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'
                            )}>
                                {filteredUnpinned.map((note, i) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isActive={activeNoteId === note.id}
                                        onClick={() => setActiveNoteId(note.id)}
                                        index={i}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
