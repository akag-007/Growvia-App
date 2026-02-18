'use client'

import { useState } from 'react'
import { createTask } from '@/actions/task'
import { createCategorySchema } from '@app/shared'
import { X, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CreateTaskForm({
    onClose,
    categories,
}: {
    onClose: () => void,
    categories: any[]
}) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        estimated_duration: 30,
        category_id: '',
    })

    const [isNewCategory, setIsNewCategory] = useState(false)
    const [newCategory, setNewCategory] = useState({ name: '', color: '#6366f1' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const predefinedColors = [
        '#6366f1', // Indigo
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b', // Slate
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('description', formData.description)
        submitData.append('estimated_duration', formData.estimated_duration.toString())

        if (isNewCategory) {
            if (!newCategory.name) {
                setError('Category name is required')
                setIsSubmitting(false)
                return
            }
            submitData.append('new_category_name', newCategory.name)
            submitData.append('new_category_color', newCategory.color)
        } else if (formData.category_id) {
            submitData.append('category_id', formData.category_id)
        }

        const result = await createTask(submitData)

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
            >
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create New Task</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
                        <div className="mt-1 space-y-2">
                            {!isNewCategory ? (
                                <div className="flex gap-2">
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewCategory(true)}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        New
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-zinc-500">NEW CATEGORY</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsNewCategory(false)}
                                            className="text-xs text-indigo-600 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Category Name"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white mb-3"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {predefinedColors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewCategory({ ...newCategory, color })}
                                                className={`h-6 w-6 rounded-full border border-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-zinc-900 ${newCategory.color === color ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Duration (mins)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.estimated_duration}
                                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                                className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Description (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
