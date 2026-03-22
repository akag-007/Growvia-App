'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, X } from 'lucide-react'

interface PushToLaterModalProps {
    taskId: string
    taskTitle: string
    onClose: () => void
}

export function PushToLaterModal({ taskId, taskTitle, onClose }: PushToLaterModalProps) {
    const [selectedDate, setSelectedDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Import updateTask dynamically to avoid circular dependency
        const { updateTask } = await import('@/actions/task')
        
        const result = await updateTask(taskId, { 
            due_date: selectedDate 
        })

        setIsSubmitting(false)
        if (result?.success) {
            onClose()
        }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Generate next 7 days options
    const dateOptions = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        return date.toISOString().split('T')[0]
    })

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-modal w-full max-w-md rounded-2xl"
                style={{
                    maxHeight: '90vh',
                    overflowY: 'scroll',
                    scrollbarWidth: 'none',
                }}
            >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 z-10"
                    style={{
                        background: 'rgba(12,12,22,0.85)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(20px)',
                    }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/20 rounded-lg">
                            <Calendar size={20} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Push to Later</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <X size={18} className="text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    <div>
                        <p className="text-sm text-zinc-400 mb-4">
                            Task: <span className="text-white font-medium">{taskTitle}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-3 text-indigo-400">
                            Select New Due Date
                        </label>
                        <div className="space-y-2">
                            {dateOptions.map((date) => (
                                <label
                                    key={date}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                                    style={{
                                        background: selectedDate === date 
                                            ? 'rgba(99,102,241,0.2)' 
                                            : 'rgba(255,255,255,0.03)',
                                        border: selectedDate === date 
                                            ? '1px solid rgba(99,102,241,0.4)' 
                                            : '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="dueDate"
                                        value={date}
                                        checked={selectedDate === date}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">
                                            {new Date(date).toLocaleDateString('en-US', { 
                                                weekday: 'long', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(date).toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    {selectedDate === date && (
                                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1 pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedDate || isSubmitting}
                            className="flex-1 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: '#fff',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                            }}
                        >
                            {isSubmitting ? 'Moving...' : 'Push to Later'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
