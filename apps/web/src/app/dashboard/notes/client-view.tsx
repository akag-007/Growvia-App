'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useNotesStore } from '@/stores/notes'
import { SpatialGrid } from '@/components/notes/spatial-grid'
import { NoteSidebarBar } from '@/components/notes/note-sidebar-bar'
import { NoteEditor } from '@/components/notes/note-editor'
import { EmptyState } from '@/components/notes/empty-state'
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

    // When activeNoteId changes, update editor mode
    useEffect(() => {
        if (activeNoteId) {
            setIsEditorMode(true)
        } else {
            setIsEditorMode(false)
        }
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

    const handleNoteChange = useCallback((newNote: Note) => {
        // Note updates are handled in the NoteEditor component via the store
    }, [])

    return (
        <div className="relative h-[calc(100vh-4rem)] -m-6 lg:-m-10 overflow-hidden">
            {/* Content Layer */}
            <div className="relative h-full z-10">
                {/* Sidebar Bar - Only visible in editor mode */}
                <AnimatePresence mode="wait">
                    {isEditorMode && (
                        <NoteSidebarBar
                            key="sidebar"
                            notes={sortedNotes}
                            activeNoteId={activeNoteId}
                            onNoteClick={handleNoteClick}
                            onBack={handleBackToGrid}
                            onCreateNote={handleCreateNote}
                        />
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className={cn(
                    'h-full transition-all duration-500 ease-out',
                    isEditorMode ? 'ml-80' : ''
                )}>
                    {/* Spatial Grid - Only visible when not in editor mode */}
                    <SpatialGrid
                        notes={sortedNotes}
                        activeNoteId={activeNoteId}
                        onNoteClick={handleNoteClick}
                        onCreateNote={handleCreateNote}
                        isEditorMode={isEditorMode}
                    />

                    {/* Editor - Only visible in editor mode */}
                    <AnimatePresence mode="wait">
                        {isEditorMode && activeNote && (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0 flex items-start justify-center pt-6 pb-8 px-6 overflow-y-auto"
                            >
                                <div
                                    className="w-full max-w-3xl rounded-2xl overflow-hidden"
                                    style={{
                                        background: 'rgba(6, 10, 18, 0.58)',
                                        backdropFilter: 'blur(32px) saturate(150%)',
                                        WebkitBackdropFilter: 'blur(32px) saturate(150%)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset',
                                        minHeight: 'calc(100vh - 14rem)',
                                    }}
                                >
                                    <NoteEditor
                                        note={activeNote}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
