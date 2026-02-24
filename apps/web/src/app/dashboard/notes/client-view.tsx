'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotesStore } from '@/stores/notes'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { NoteEditor } from '@/components/notes/note-editor'
import { EmptyState } from '@/components/notes/empty-state'
import { createNote } from '@/actions/notes'
import { FileText } from 'lucide-react'
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

    const [mobileShowEditor, setMobileShowEditor] = useState(false)

    // Initialize store with server data
    useEffect(() => {
        setNotes(initialNotes)
    }, [initialNotes, setNotes])

    const activeNote = getActiveNote()

    // When activeNote is set on mobile, show editor
    useEffect(() => {
        if (activeNoteId) {
            setMobileShowEditor(true)
        }
    }, [activeNoteId])

    const handleCreateNote = useCallback(async () => {
        const result = await createNote()
        if (result.data) {
            addNote(result.data as Note)
            setMobileShowEditor(true)
        }
    }, [addNote])

    const handleMobileBack = useCallback(() => {
        setMobileShowEditor(false)
        setActiveNoteId(null)
    }, [setActiveNoteId])

    // Global keyboard shortcut: Ctrl+N to create note
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                handleCreateNote()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleCreateNote])

    const hasNotes = notes.length > 0

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6 lg:-m-10 overflow-hidden">
            {/* Sidebar - always visible on desktop, hidden on mobile when editor is shown */}
            <div className={`
                w-full lg:w-[320px] xl:w-[340px] flex-shrink-0 h-full
                ${mobileShowEditor ? 'hidden lg:flex' : 'flex'}
            `}>
                <NotesSidebar onCreateNote={handleCreateNote} />
            </div>

            {/* Editor area */}
            <div className={`
                flex-1 h-full bg-white dark:bg-zinc-950 
                ${!mobileShowEditor ? 'hidden lg:flex' : 'flex'}
                flex-col
            `}>
                <AnimatePresence mode="wait">
                    {activeNote ? (
                        <NoteEditor
                            key={activeNote.id}
                            note={activeNote}
                            onBack={handleMobileBack}
                        />
                    ) : hasNotes ? (
                        <motion.div
                            key="select-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center px-6"
                        >
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4"
                            >
                                <FileText size={28} className="text-zinc-400 dark:text-zinc-500" />
                            </motion.div>
                            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
                                Select a note from the sidebar to start editing, or press{' '}
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono">
                                    Ctrl+N
                                </kbd>{' '}
                                to create a new one.
                            </p>
                        </motion.div>
                    ) : (
                        <EmptyState key="empty" onCreateNote={handleCreateNote} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
