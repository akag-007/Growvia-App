'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Sparkles } from 'lucide-react'

interface EmptyStateProps {
    onCreateNote: () => void
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6"
        >
            {/* Animated icon */}
            <motion.div
                initial={{ y: -10 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative mb-6"
            >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shadow-lg">
                    <FileText size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"
                >
                    <Sparkles size={14} className="text-amber-500" />
                </motion.div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-2xl font-bold text-zinc-900 dark:text-white mb-2"
            >
                Start capturing your ideas
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-8 leading-relaxed"
            >
                Create rich notes with markdown formatting, organize with colors, and pin your most important thoughts.
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                whileHover={{ scale: 1.05, boxShadow: '0 10px 40px -12px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onCreateNote}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
            >
                <Plus size={18} />
                Create your first note
            </motion.button>

            {/* Keyboard hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500"
            >
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">N</kbd>
                <span className="ml-1">to create a new note</span>
            </motion.div>
        </motion.div>
    )
}
