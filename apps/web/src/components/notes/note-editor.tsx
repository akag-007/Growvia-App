'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Link2,
    Minus,
    CheckSquare,
    Eye,
    EyeOff,
    Pin,
    PinOff,
    Trash2,
    Archive,
    Palette,
    Save,
    ArrowLeft,
    Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotesStore } from '@/stores/notes'
import { updateNote, deleteNote } from '@/actions/notes'
import { MarkdownRenderer } from './markdown-renderer'
import { NOTE_COLORS } from './note-card'
import type { Note } from '@/actions/notes'

interface NoteEditorProps {
    note: Note
    onBack?: () => void
}

const AUTOSAVE_DELAY = 1500

export function NoteEditor({ note, onBack }: NoteEditorProps) {
    const { updateNoteLocal, removeNote, setActiveNoteId, isSaving, setIsSaving, isEditorPreview, setIsEditorPreview } = useNotesStore()

    const [title, setTitle] = useState(note.title)
    const [content, setContent] = useState(note.content)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
    const titleRef = useRef<HTMLTextAreaElement>(null)

    // Sync state when note changes
    useEffect(() => {
        setTitle(note.title)
        setContent(note.content)
        setShowColorPicker(false)
        setShowDeleteConfirm(false)
    }, [note.id])

    // Auto-save
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

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [])

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setTitle(val)
        scheduleAutoSave(val, content)
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setContent(val)
        scheduleAutoSave(title, val)
    }

    // Markdown toolbar actions
    const insertMarkdown = useCallback(
        (before: string, after: string = '', placeholder: string = '') => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selected = content.substring(start, end) || placeholder

            const newContent =
                content.substring(0, start) +
                before +
                selected +
                after +
                content.substring(end)

            setContent(newContent)
            scheduleAutoSave(title, newContent)

            // Restore cursor
            requestAnimationFrame(() => {
                textarea.focus()
                const cursorPos = start + before.length + selected.length
                textarea.setSelectionRange(
                    start + before.length,
                    cursorPos
                )
            })
        },
        [content, title, scheduleAutoSave]
    )

    const insertAtLineStart = useCallback(
        (prefix: string) => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const lineStart = content.lastIndexOf('\n', start - 1) + 1

            const newContent =
                content.substring(0, lineStart) +
                prefix +
                content.substring(lineStart)

            setContent(newContent)
            scheduleAutoSave(title, newContent)

            requestAnimationFrame(() => {
                textarea.focus()
                textarea.setSelectionRange(
                    start + prefix.length,
                    start + prefix.length
                )
            })
        },
        [content, title, scheduleAutoSave]
    )

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return

            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault()
                    insertMarkdown('**', '**', 'bold text')
                    break
                case 'i':
                    e.preventDefault()
                    insertMarkdown('*', '*', 'italic text')
                    break
                case 's':
                    e.preventDefault()
                    // Force-save immediately
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                    setIsSaving(true)
                    updateNoteLocal(note.id, { title, content, updated_at: new Date().toISOString() })
                    updateNote(note.id, { title, content }).then(() => setIsSaving(false))
                    break
                case 'e':
                    e.preventDefault()
                    setIsEditorPreview(!isEditorPreview)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [content, title, isEditorPreview, insertMarkdown, note.id, updateNoteLocal, setIsSaving, setIsEditorPreview])

    // Pin toggle
    const handleTogglePin = async () => {
        const newPinned = !note.is_pinned
        updateNoteLocal(note.id, { is_pinned: newPinned })
        await updateNote(note.id, { is_pinned: newPinned })
    }

    // Archive
    const handleArchive = async () => {
        updateNoteLocal(note.id, { is_archived: true })
        setActiveNoteId(null)
        await updateNote(note.id, { is_archived: true })
        removeNote(note.id)
    }

    // Delete
    const handleDelete = async () => {
        removeNote(note.id)
        setActiveNoteId(null)
        await deleteNote(note.id)
    }

    // Color change
    const handleColorChange = async (color: string | null) => {
        updateNoteLocal(note.id, { color })
        setShowColorPicker(false)
        await updateNote(note.id, { color })
    }

    // Word count
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
    const charCount = content.length

    // Auto-resize title
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto'
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
        }
    }, [title])

    const toolbarButtons = [
        { icon: Bold, action: () => insertMarkdown('**', '**', 'bold'), title: 'Bold (Ctrl+B)' },
        { icon: Italic, action: () => insertMarkdown('*', '*', 'italic'), title: 'Italic (Ctrl+I)' },
        { icon: Strikethrough, action: () => insertMarkdown('~~', '~~', 'strikethrough'), title: 'Strikethrough' },
        { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Inline Code' },
        { type: 'divider' as const },
        { icon: Heading1, action: () => insertAtLineStart('# '), title: 'Heading 1' },
        { icon: Heading2, action: () => insertAtLineStart('## '), title: 'Heading 2' },
        { icon: Heading3, action: () => insertAtLineStart('### '), title: 'Heading 3' },
        { type: 'divider' as const },
        { icon: List, action: () => insertAtLineStart('- '), title: 'Bullet List' },
        { icon: ListOrdered, action: () => insertAtLineStart('1. '), title: 'Numbered List' },
        { icon: CheckSquare, action: () => insertAtLineStart('- [ ] '), title: 'Checkbox' },
        { icon: Quote, action: () => insertAtLineStart('> '), title: 'Blockquote' },
        { type: 'divider' as const },
        { icon: Link2, action: () => insertMarkdown('[', '](url)', 'link text'), title: 'Link' },
        { icon: Minus, action: () => insertMarkdown('\n---\n', '', ''), title: 'Horizontal Rule' },
        {
            icon: Type,
            action: () => insertMarkdown('\n```\n', '\n```\n', 'code block'),
            title: 'Code Block',
        },
    ]

    return (
        <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col h-full"
        >
            {/* Top action bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                    {onBack && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onBack}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden"
                        >
                            <ArrowLeft size={18} />
                        </motion.button>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTogglePin}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            note.is_pinned
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                        title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                        {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </motion.button>

                    {/* Color picker */}
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Note Color"
                        >
                            <Palette size={16} />
                        </motion.button>
                        <AnimatePresence>
                            {showColorPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                    className="absolute top-full left-0 mt-1 z-50 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 flex gap-1.5"
                                >
                                    <button
                                        onClick={() => handleColorChange(null)}
                                        className={cn(
                                            'w-6 h-6 rounded-full border-2 bg-zinc-200 dark:bg-zinc-600 transition-transform',
                                            !note.color ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent hover:scale-110'
                                        )}
                                        title="No color"
                                    />
                                    {Object.entries(NOTE_COLORS).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleColorChange(key)}
                                            className={cn(
                                                'w-6 h-6 rounded-full border-2 transition-transform',
                                                val.dot,
                                                note.color === key ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent hover:scale-110'
                                            )}
                                            title={key}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleArchive}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Archive"
                    >
                        <Archive size={16} />
                    </motion.button>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Save indicator */}
                    <AnimatePresence mode="wait">
                        {isSaving ? (
                            <motion.div
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-xs text-amber-500"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Save size={12} />
                                </motion.div>
                                <span>Saving...</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-xs text-emerald-500"
                            >
                                <Save size={12} />
                                <span>Saved</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Preview toggle */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsEditorPreview(!isEditorPreview)}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            isEditorPreview
                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                        title={isEditorPreview ? 'Edit (Ctrl+E)' : 'Preview (Ctrl+E)'}
                    >
                        {isEditorPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>

                    {/* Delete */}
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </motion.button>
                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 top-full mt-1 z-50 p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 min-w-[180px]"
                                >
                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">
                                        Delete this note permanently?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            {!isEditorPreview && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-0.5 px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 overflow-x-auto scrollbar-hide bg-zinc-50/40 dark:bg-zinc-900/20"
                >
                    {toolbarButtons.map((btn, i) => {
                        if ('type' in btn && btn.type === 'divider') {
                            return (
                                <div
                                    key={`divider-${i}`}
                                    className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"
                                />
                            )
                        }
                        const Icon = btn.icon!
                        return (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={btn.action}
                                title={btn.title}
                                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                            >
                                <Icon size={15} />
                            </motion.button>
                        )
                    })}
                </motion.div>
            )}

            {/* Editor / Preview area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    {/* Title */}
                    <textarea
                        ref={titleRef}
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        rows={1}
                        className="w-full text-3xl font-bold text-zinc-900 dark:text-white bg-transparent border-none outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 leading-tight mb-4 overflow-hidden"
                        readOnly={isEditorPreview}
                    />

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {isEditorPreview ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="min-h-[50vh]"
                            >
                                {content ? (
                                    <MarkdownRenderer content={content} />
                                ) : (
                                    <p className="text-zinc-400 dark:text-zinc-500 italic">
                                        Nothing to preview yet. Start writing!
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleContentChange}
                                    placeholder="Start writing... Use markdown for formatting."
                                    className="w-full min-h-[60vh] text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 bg-transparent border-none outline-none resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-mono"
                                    spellCheck={false}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-2 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/20 text-[11px] text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                </div>
                <div className="flex items-center gap-3">
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono">Ctrl+S</kbd> save
                    </span>
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono">Ctrl+E</kbd> preview
                    </span>
                </div>
            </div>
        </motion.div>
    )
}
