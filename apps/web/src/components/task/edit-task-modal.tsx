'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { getCategories } from '@/actions/task'
import { PRIORITY_META, PRIORITY_VALUES, PriorityValue } from '@app/shared'

interface EditTaskModalProps {
    task: any
    onClose: () => void
}

const COLOR_SWATCHES = [
    '#6366f1', '#4ade80', '#10b981', '#a855f7', '#ec4899',
    '#ef4444', '#f59e0b', '#3b82f6', '#64748b', '#f97316',
]

const PRIORITY_ICONS: Record<PriorityValue, string> = {
    important_urgent: '🔴',
    important_not_urgent: '🟡',
    not_important_urgent: '🔵',
    not_important_not_urgent: '⚫',
}

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: task.title || '',
        description: task.description || '',
        estimated_hours: Math.floor((task.estimated_duration || 0) / 60),
        estimated_minutes: (task.estimated_duration || 0) % 60,
        category_id: task.category_id || '',
        priority: (task.priority || '') as PriorityValue | '',
        isNewCategory: false,
        newCategoryName: '',
        newCategoryColor: COLOR_SWATCHES[0],
    })

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const cats = await getCategories()
        setCategories(cats || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        const totalMinutes =
            (formData.estimated_hours * 60) + formData.estimated_minutes

        // Import updateTask dynamically
        const { updateTask } = await import('@/actions/task')

        const updates: any = {
            title: formData.title,
            description: formData.description,
            estimated_duration: totalMinutes,
            priority: formData.priority || null,
        }

        // Handle category
        if (formData.isNewCategory && formData.newCategoryName) {
            updates.new_category_name = formData.newCategoryName
            updates.new_category_color = formData.newCategoryColor
        } else if (formData.category_id) {
            updates.category_id = formData.category_id
        }

        const result = await updateTask(task.id, updates)

        if (result?.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            onClose()
        }
    }

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
                    <h2 className="text-xl font-bold text-white">Edit Task</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <X size={18} className="text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Task Title */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-indigo-400">
                            Task Title
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What do you want to accomplish?"
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-indigo-400">
                            Category
                        </label>
                        {!formData.isNewCategory ? (
                            <div className="flex gap-2">
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <option value="" style={{ background: '#16172a' }}>Select category...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} style={{ background: '#16172a' }}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isNewCategory: true })}
                                    className="flex items-center gap-1 rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}
                                >
                                    New
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-xl p-4 space-y-3"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold tracking-wider text-indigo-400">NEW CATEGORY</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({ ...formData, isNewCategory: false })}
                                        className="text-xs text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    value={formData.newCategoryName}
                                    onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                                    className="w-full rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                                <div>
                                    <p className="text-xs text-zinc-500 mb-2">Category Color</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLOR_SWATCHES.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, newCategoryColor: color })}
                                                className="h-7 w-7 rounded-full transition-all"
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: formData.newCategoryColor === color
                                                        ? `0 0 0 2px #0d0e1a, 0 0 0 4px ${color}`
                                                        : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Priority — Eisenhower Matrix Selector */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-indigo-400">
                            Priority
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PRIORITY_VALUES.map((p) => {
                                const meta = PRIORITY_META[p]
                                const isSelected = formData.priority === p
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: isSelected ? '' : p })}
                                        className="rounded-xl p-3 text-left transition-all"
                                        style={{
                                            background: isSelected ? meta.bg : 'rgba(255,255,255,0.04)',
                                            border: isSelected
                                                ? `1.5px solid ${meta.color}`
                                                : '1.5px solid rgba(255,255,255,0.07)',
                                            boxShadow: isSelected ? `0 0 12px ${meta.color}30` : 'none',
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-base">{PRIORITY_ICONS[p]}</span>
                                            <span className="text-xs font-bold"
                                                style={{ color: isSelected ? meta.color : '#6b7280' }}>
                                                {meta.sublabel}
                                            </span>
                                        </div>
                                        <p className="text-xs leading-tight" style={{ color: isSelected ? '#d1d5db' : '#6b7280' }}>
                                            {meta.label}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-indigo-400">
                            Estimated Duration
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Hours</p>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.estimated_hours}
                                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-xl px-4 py-3 text-white text-center text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Minutes</p>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    step="5"
                                    value={formData.estimated_minutes}
                                    onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-xl px-4 py-3 text-white text-center text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-indigo-400">
                            Description <span className="font-normal text-zinc-500">(Optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Any extra details..."
                            className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none resize-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 rounded-lg px-3 py-2"
                            style={{ background: 'rgba(239,68,68,0.1)' }}>
                            {error}
                        </p>
                    )}

                    {/* Actions */}
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
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: '#fff',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                            }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Save size={16} />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save size={16} />
                                    Save Changes
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
