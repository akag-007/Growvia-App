'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Trash2, EyeOff, Eye } from 'lucide-react'
import { deleteNote, updateNote } from '@/actions/notes'
import { useNotesStore } from '@/stores/notes'
import type { Note } from '@/actions/notes'

interface GalleryGridProps {
    notes: Note[]
    onNoteClick: (noteId: string) => void
    onCreateNote: () => void
}

function formatDate(dateString: string) {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function GalleryGrid({ notes, onNoteClick, onCreateNote }: GalleryGridProps) {
    const { removeNote, updateNoteLocal } = useNotesStore()

    const handleDelete = async (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation()
        if (!confirm('Delete this note permanently?')) return
        removeNote(noteId)
        await deleteNote(noteId)
    }

    const handleToggleHide = async (e: React.MouseEvent, note: Note) => {
        e.stopPropagation()
        const next = !note.is_archived
        updateNoteLocal(note.id, { is_archived: next })
        await updateNote(note.id, { is_archived: next })
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto p-6 lg:p-8"
            >
                {notes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {notes.map((note, index) => {
                            const preview = note.content.slice(0, 140).replace(/\s+/g, ' ').trim()
                            const isHidden = note.is_archived

                            return (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.04 }}
                                    onClick={() => onNoteClick(note.id)}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    className="relative rounded-2xl p-5 cursor-pointer group overflow-hidden"
                                    style={{
                                        background: isHidden
                                            ? 'rgba(30, 40, 50, 0.55)'
                                            : 'rgba(30, 50, 45, 0.45)',
                                        backdropFilter: 'blur(20px) saturate(130%)',
                                        WebkitBackdropFilter: 'blur(20px) saturate(130%)',
                                        border: `1px solid ${isHidden ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                                        minHeight: '220px',
                                        opacity: isHidden ? 0.65 : 1,
                                    }}
                                >
                                    {/* Hover glow */}
                                    <div
                                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
                                    />

                                    {/* Action buttons — top right, visible on hover */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                        <button
                                            onClick={(e) => handleToggleHide(e, note)}
                                            className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110"
                                            style={{
                                                background: 'rgba(0,0,0,0.45)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                            }}
                                            title={isHidden ? 'Unhide note' : 'Hide note'}
                                        >
                                            {isHidden
                                                ? <Eye size={13} className="text-teal-400" />
                                                : <EyeOff size={13} className="text-white/50 hover:text-white/80" />
                                            }
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, note.id)}
                                            className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110"
                                            style={{
                                                background: 'rgba(0,0,0,0.45)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                            }}
                                            title="Delete note"
                                        >
                                            <Trash2 size={13} className="text-white/50 hover:text-red-400" />
                                        </button>
                                    </div>

                                    {/* Hidden badge */}
                                    {isHidden && (
                                        <span className="absolute top-3 left-3 z-20 text-[8px] font-bold tracking-widest uppercase text-white/30 px-1.5 py-0.5 rounded bg-white/[0.06]">
                                            Hidden
                                        </span>
                                    )}

                                    {/* Pinned badge */}
                                    {note.is_pinned && !isHidden && (
                                        <span
                                            className="relative z-10 inline-block text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-md mb-3"
                                            style={{
                                                background: 'rgba(245, 158, 11, 0.2)',
                                                color: 'rgba(252, 211, 77, 0.9)',
                                            }}
                                        >
                                            PINNED
                                        </span>
                                    )}

                                    {/* Title */}
                                    <h3
                                        className="relative z-10 font-semibold leading-tight mb-3 line-clamp-3"
                                        style={{
                                            fontFamily: '"Newsreader", "Georgia", serif',
                                            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                                            color: isHidden ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.88)',
                                            marginTop: isHidden ? '28px' : undefined,
                                        }}
                                    >
                                        {note.title || 'Untitled'}
                                    </h3>

                                    {/* Preview text */}
                                    {preview && (
                                        <p
                                            className="relative z-10 text-[12px] leading-relaxed line-clamp-3 mb-4"
                                            style={{ color: isHidden ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.50)' }}
                                        >
                                            {preview}
                                        </p>
                                    )}

                                    {/* Spacer */}
                                    <div className="flex-1" />

                                    {/* Date */}
                                    <p
                                        className="relative z-10 text-[10px] mt-auto"
                                        style={{ color: 'rgba(255,255,255,0.28)' }}
                                    >
                                        {formatDate(note.updated_at)}
                                    </p>
                                </motion.div>
                            )
                        })}

                        {/* "Capture a new thought" card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: notes.length * 0.04 }}
                            onClick={onCreateNote}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="relative rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-center text-center group"
                            style={{
                                background: 'rgba(30, 50, 45, 0.25)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px dashed rgba(255,255,255,0.12)',
                                minHeight: '220px',
                            }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(20,184,166,0.3), rgba(13,148,136,0.2))',
                                    border: '1px solid rgba(20,184,166,0.3)',
                                }}
                            >
                                <Plus size={22} className="text-teal-400" />
                            </motion.div>
                            <p
                                className="text-sm"
                                style={{
                                    fontFamily: '"Newsreader", "Georgia", serif',
                                    color: 'rgba(255,255,255,0.40)',
                                }}
                            >
                                Capture a new thought
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    /* Empty state */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-[60vh]"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center mb-6">
                            <Sparkles size={48} className="text-white/30" />
                        </div>
                        <h3
                            className="text-xl font-semibold text-white/70 mb-2"
                            style={{ fontFamily: '"Newsreader", "Georgia", serif' }}
                        >
                            No notes yet
                        </h3>
                        <p className="text-white/40 text-sm mb-6">Create your first note to get started</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCreateNote}
                            className="px-6 py-3 text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                boxShadow: '0 4px 20px rgba(20,184,166,0.35)',
                            }}
                        >
                            <Plus size={18} />
                            Create First Note
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}
