'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, X } from 'lucide-react'
import { createProject, updateProject } from '@/actions/project'

export function CreateProjectModal({ onClose, project }: { onClose: () => void, project?: any }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: project?.title || '',
        description: project?.description || '',
        color: project?.color || '#8b5cf6',
        target_deadline: project?.target_deadline ? project.target_deadline.split('T')[0] : '',
        estimated_total_duration: project?.estimated_total_duration ? (project.estimated_total_duration / 60).toString() : ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        const form = new FormData()
        form.append('title', formData.title)
        form.append('description', formData.description)
        form.append('color', formData.color)
        if (formData.target_deadline) form.append('target_deadline', formData.target_deadline)
        if (formData.estimated_total_duration) {
            const minutes = Math.round(parseFloat(formData.estimated_total_duration) * 60)
            form.append('estimated_total_duration', minutes.toString())
        }

        let result
        if (project?.id) {
            result = await updateProject(project.id, form)
        } else {
            result = await createProject(form)
        }
        
        setIsSubmitting(false)
        if (result?.success) {
            onClose()
        } else {
            alert(result?.error || 'Failed to save project')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121218] shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Layers size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">{project ? 'Edit Project' : 'New Project'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Project Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Redesign Landing Page"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Brief context about this endeavor..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Deadline</label>
                            <input
                                type="date"
                                value={formData.target_deadline}
                                onChange={e => setFormData({ ...formData, target_deadline: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1.5 leading-tight">Est. Duration <br/><span className="text-[10px] text-zinc-500">(hours)</span></label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.estimated_total_duration}
                                onChange={e => setFormData({ ...formData, estimated_total_duration: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                placeholder="e.g. 10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Color Theme</label>
                        <div className="flex gap-3">
                            {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (project ? 'Saving...' : 'Creating...') : (project ? 'Save Changes' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
