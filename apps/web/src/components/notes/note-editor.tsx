'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Link2,
    Minus,
    Pin,
    PinOff,
    Trash2,
    Archive,
    Save,
    AlignLeft,
    Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotesStore } from '@/stores/notes'
import { updateNote, deleteNote } from '@/actions/notes'
import type { Note } from '@/actions/notes'

interface NoteEditorProps {
    note: Note
    onBack?: () => void
}

const AUTOSAVE_DELAY = 1500

export function NoteEditor({ note }: NoteEditorProps) {
    const { updateNoteLocal, removeNote, isSaving, setIsSaving } = useNotesStore()

    const [title, setTitle] = useState(note.title)
    const [content, setContent] = useState(note.content)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const editorRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLTextAreaElement>(null)
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
    // Track whether the contenteditable is initialized
    const isInitialized = useRef(false)

    // Schedule auto-save
    const scheduleAutoSave = useCallback(
        (newTitle: string, newContent: string) => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            setIsSaving(true)
            saveTimerRef.current = setTimeout(async () => {
                updateNoteLocal(note.id, {
                    title: newTitle,
                    content: newContent,
                    updated_at: new Date().toISOString(),
                })
                await updateNote(note.id, { title: newTitle, content: newContent })
                setIsSaving(false)
            }, AUTOSAVE_DELAY)
        },
        [note.id, updateNoteLocal, setIsSaving]
    )

    // Sync state when note changes
    useEffect(() => {
        setTitle(note.title)
        setContent(note.content)
        setShowDeleteConfirm(false)
        isInitialized.current = false
    }, [note.id])

    // Initialize editor content
    useEffect(() => {
        if (editorRef.current && !isInitialized.current) {
            editorRef.current.innerText = note.content
            isInitialized.current = true
        }
    }, [note.id, note.content])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [])

    // Title change handler
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setTitle(val)
        scheduleAutoSave(val, content)
    }

    // Content input handler from contenteditable
    const handleContentInput = () => {
        const newContent = editorRef.current?.innerText ?? ''
        setContent(newContent)
        scheduleAutoSave(title, newContent)
    }

    // Rich text exec commands (uses browser's built-in execCommand for simple formatting)
    const execFormat = useCallback((command: string, value?: string) => {
        editorRef.current?.focus()
        document.execCommand(command, false, value)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault()
                    execFormat('bold')
                    break
                case 'i':
                    e.preventDefault()
                    execFormat('italic')
                    break
                case 's':
                    e.preventDefault()
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                    setIsSaving(true)
                    const currentContent = editorRef.current?.innerText ?? content
                    updateNoteLocal(note.id, { title, content: currentContent, updated_at: new Date().toISOString() })
                    updateNote(note.id, { title, content: currentContent }).then(() => setIsSaving(false))
                    break
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [content, title, execFormat, note.id, updateNoteLocal, setIsSaving])

    // Pin toggle
    const handleTogglePin = async () => {
        const newPinned = !note.is_pinned
        updateNoteLocal(note.id, { is_pinned: newPinned })
        await updateNote(note.id, { is_pinned: newPinned })
    }

    // Archive
    const handleArchive = async () => {
        updateNoteLocal(note.id, { is_archived: true })
        await updateNote(note.id, { is_archived: true })
        removeNote(note.id)
    }

    // Delete
    const handleDelete = async () => {
        await deleteNote(note.id)
        removeNote(note.id)
    }

    // Word count
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    // Auto-resize title
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto'
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
        }
    }, [title])

    // Format bar buttons
    const toolbarButtons = [
        { icon: Italic, action: () => execFormat('italic'), title: 'Italic (Ctrl+I)' },
        { icon: Quote, action: () => execFormat('formatBlock', 'blockquote'), title: 'Quote' },
        { type: 'divider' as const },
        { icon: Minus, action: () => execFormat('insertHorizontalRule'), title: 'Divider' },
        { icon: List, action: () => execFormat('insertUnorderedList'), title: 'Bullet List' },
        { icon: ListOrdered, action: () => execFormat('insertOrderedList'), title: 'Numbered List' },
        { type: 'divider' as const },
        { icon: Bold, action: () => execFormat('bold'), title: 'Bold (Ctrl+B)' },
        { icon: Strikethrough, action: () => execFormat('strikeThrough'), title: 'Strikethrough' },
        { icon: Code, action: () => execFormat('insertHTML', '<code style="font-family:monospace;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px">code</code>'), title: 'Code' },
        { type: 'divider' as const },
        { icon: AlignLeft, action: () => execFormat('removeFormat'), title: 'Clear Formatting' },
        { icon: Link2, action: () => {
            const url = prompt('Enter URL:')
            if (url) execFormat('createLink', url)
        }, title: 'Link' },
        { icon: Share2, action: () => {}, title: 'Share' },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Floating Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.07]" style={{ background: 'rgba(0,0,0,0.15)' }}>
                {/* Format buttons */}
                <div className="flex items-center gap-0.5">
                    {toolbarButtons.map((btn, i) => {
                        if ('type' in btn && btn.type === 'divider') {
                            return <div key={`div-${i}`} className="w-px h-4 bg-white/10 mx-1.5" />
                        }
                        const Icon = btn.icon!
                        return (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onMouseDown={(e) => { e.preventDefault(); btn.action?.() }}
                                title={btn.title}
                                className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                            >
                                <Icon size={14} />
                            </motion.button>
                        )
                    })}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1">
                    {/* Save indicator */}
                    <AnimatePresence mode="wait">
                        {isSaving ? (
                            <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] text-amber-400/80 mr-2">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <Save size={11} />
                                </motion.div>
                                <span>Saving</span>
                            </motion.div>
                        ) : (
                            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-[11px] text-teal-400/70 mr-2">
                                <Save size={11} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleTogglePin}
                        className={cn('p-1.5 rounded-lg transition-colors', note.is_pinned ? 'text-amber-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5')}
                        title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                        {note.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleArchive}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        title="Archive"
                    >
                        <Archive size={14} />
                    </motion.button>

                    {/* Delete */}
                    <div className="relative">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </motion.button>
                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                                    className="absolute right-0 top-full mt-1 z-50 p-3 rounded-xl shadow-xl border border-white/10 min-w-[170px]"
                                    style={{ background: 'rgba(8,8,20,0.92)', backdropFilter: 'blur(20px)' }}
                                >
                                    <p className="text-xs text-white/60 mb-2.5">Delete this note permanently?</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white/8 text-white/60 hover:bg-white/15 transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={handleDelete} className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="max-w-2xl mx-auto px-10 pt-10 pb-16">

                    {/* Date label */}
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-4 font-medium">
                        Personal Musings — {new Date(note.created_at ?? note.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>

                    {/* Title — uses Newsreader serif */}
                    <textarea
                        ref={titleRef}
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        rows={1}
                        className="w-full bg-transparent border-none outline-none resize-none placeholder:text-white/20 leading-tight mb-6 overflow-hidden"
                        style={{
                            fontFamily: '"Newsreader", "Georgia", serif',
                            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                            fontWeight: 400,
                            color: 'rgba(255,255,255,0.92)',
                            letterSpacing: '-0.01em',
                        }}
                    />

                    {/* Body — contenteditable plain rich text */}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleContentInput}
                        data-placeholder="There is a specific quality to the light at 5:42 AM..."
                        className="note-editor-body min-h-[50vh] focus:outline-none"
                        style={{
                            fontFamily: '"Newsreader", "Georgia", serif',
                            fontSize: '1rem',
                            lineHeight: '1.85',
                            color: 'rgba(255,255,255,0.72)',
                            caretColor: 'rgba(20,184,166,0.9)',
                        }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div
                className="flex items-center justify-between px-8 py-2.5 border-t border-white/[0.06]"
                style={{ background: 'rgba(0,0,0,0.10)', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}
            >
                <div className="flex items-center gap-3">
                    <span>Saved {new Date(note.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>·</span>
                    <span>{wordCount} words</span>
                </div>
                <div className="flex items-center gap-3">
                    <span><kbd className="px-1 py-0.5 rounded bg-white/8 text-[9px] font-mono">Ctrl+S</kbd> save</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-white/8 text-[9px] font-mono">Ctrl+B</kbd> bold</span>
                </div>
            </div>
        </div>
    )
}
