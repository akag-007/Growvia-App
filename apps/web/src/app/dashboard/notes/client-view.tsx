'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Lock, LockOpen } from 'lucide-react'
import { useNotesStore } from '@/stores/notes'
import { GalleryGrid } from '@/components/notes/spatial-grid'
import { CollectionsColumn } from '@/components/notes/note-sidebar-bar'
import { NoteEditor } from '@/components/notes/note-editor'
import { createNote } from '@/actions/notes'
import type { Note } from '@/actions/notes'

interface NotesClientViewProps {
    initialNotes: Note[]
}

export default function NotesClientView({ initialNotes }: NotesClientViewProps) {
    const {
        setNotes,
        notes,
        activeNoteId,
        setActiveNoteId,
        getActiveNote,
        addNote,
        searchQuery,
        setSearchQuery,
        showHidden,
        toggleShowHidden,
    } = useNotesStore()

    const [isEditorMode, setIsEditorMode] = useState(false)

    // Initialize store with server data
    useEffect(() => {
        setNotes(initialNotes)
    }, [initialNotes, setNotes])

    const activeNote = getActiveNote()

    const sortedNotes = [...notes].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    // Filter by search
    const searchFiltered = searchQuery
        ? sortedNotes.filter(n =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : sortedNotes

    // Filter out hidden unless showHidden is on
    const visibleNotes = showHidden
        ? searchFiltered
        : searchFiltered.filter(n => !n.is_archived)

    // Count hidden notes for the badge
    const hiddenCount = notes.filter(n => n.is_archived).length

    // When activeNoteId changes, update editor mode
    useEffect(() => {
        setIsEditorMode(!!activeNoteId)
    }, [activeNoteId])

    const handleCreateNote = useCallback(async () => {
        const result = await createNote()
        if (result.data) {
            addNote(result.data as Note)
            setActiveNoteId(result.data.id)
        }
    }, [addNote, setActiveNoteId])

    const handleNoteClick = useCallback((noteId: string) => {
        setActiveNoteId(noteId)
    }, [setActiveNoteId])

    const handleBackToGrid = useCallback(() => {
        setActiveNoteId(null)
    }, [setActiveNoteId])

    return (
        <div className="relative h-[calc(100vh-4rem)] -m-6 lg:-m-10 overflow-hidden">
            <div className="relative h-full z-10 flex flex-col">

                {/* Top bar — search + new note (only in gallery mode) */}
                {!isEditorMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between gap-4 px-6 lg:px-8 pt-24 lg:pt-24"
                    >
                        {/* Search bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* New Note button */}
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleCreateNote}
                            className="px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                boxShadow: '0 4px 16px rgba(20,184,166,0.30)',
                            }}
                        >
                            <Plus size={16} />
                            New Note
                        </motion.button>
                    </motion.div>
                )}

                {/* Main content */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {!isEditorMode ? (
                            /* Gallery Mode */
                            <GalleryGrid
                                key="gallery"
                                notes={visibleNotes}
                                onNoteClick={handleNoteClick}
                                onCreateNote={handleCreateNote}
                            />
                        ) : (
                            /* Editor Mode — Collections column + editor */
                            <motion.div
                                key="editor-layout"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex h-full gap-4 p-4 lg:p-6"
                            >
                                {/* Collections column */}
                                <CollectionsColumn
                                    notes={sortedNotes.filter(n => !n.is_archived)}
                                    activeNoteId={activeNoteId}
                                    onNoteClick={handleNoteClick}
                                    onBack={handleBackToGrid}
                                    onCreateNote={handleCreateNote}
                                />

                                {/* Editor */}
                                <AnimatePresence mode="wait">
                                    {activeNote && (
                                        <motion.div
                                            key={activeNote.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                            className="flex-1 rounded-2xl overflow-hidden flex flex-col"
                                            style={{
                                                background: 'rgba(6, 10, 18, 0.58)',
                                                backdropFilter: 'blur(32px) saturate(150%)',
                                                WebkitBackdropFilter: 'blur(32px) saturate(150%)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                boxShadow: '0 16px 60px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)',
                                            }}
                                        >
                                            <NoteEditor note={activeNote} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hidden notes lock toggle — bottom center, only in gallery mode */}
                {!isEditorMode && hiddenCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
                    >
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={toggleShowHidden}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200"
                            style={{
                                background: showHidden
                                    ? 'rgba(20,184,166,0.20)'
                                    : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${showHidden ? 'rgba(20,184,166,0.30)' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
                                color: showHidden ? '#5eead4' : 'rgba(255,255,255,0.45)',
                            }}
                        >
                            {showHidden
                                ? <LockOpen size={14} />
                                : <Lock size={14} />
                            }
                            {showHidden ? 'Hide' : 'Show'} hidden ({hiddenCount})
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
