'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2, X } from 'lucide-react'
import { getProjects } from '@/actions/project'
import { linkTaskToProject } from '@/actions/task'

interface LinkProjectModalProps {
    taskId: string
    taskTitle: string
    onClose: () => void
}

export function LinkProjectModal({ taskId, taskTitle, onClose }: LinkProjectModalProps) {
    const [projects, setProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')

    useEffect(() => {
        async function fetchProjects() {
            const data = await getProjects()
            setProjects(data)
            setIsLoading(false)
        }
        fetchProjects()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProjectId) return
        
        setIsSubmitting(true)

        const result = await linkTaskToProject(taskId, selectedProjectId)

        setIsSubmitting(false)
        if (result?.success) {
            onClose()
        } else {
            alert(result?.error || 'Failed to link task')
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
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    background: 'linear-gradient(145deg, rgba(30,30,40,0.9) 0%, rgba(15,15,20,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 z-10"
                    style={{
                        background: 'rgba(12,12,22,0.85)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600/20 rounded-lg">
                            <Link2 size={20} className="text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Link Project</h2>
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
                        <label className="block text-sm font-semibold mb-3 text-emerald-400">
                            Select a Project
                        </label>
                        {isLoading ? (
                            <div className="text-sm text-zinc-400 py-4 text-center">Loading projects...</div>
                        ) : projects.length === 0 ? (
                            <div className="text-sm text-zinc-400 py-4 text-center">No active projects found. Create one from the Dashboard!</div>
                        ) : (
                            <div className="space-y-2">
                                {projects.map(project => (
                                    <label
                                        key={project.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                            selectedProjectId === project.id 
                                                ? 'border-emerald-500/50 bg-emerald-500/10' 
                                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="project"
                                            value={project.id}
                                            checked={selectedProjectId === project.id}
                                            onChange={() => setSelectedProjectId(project.id)}
                                            className="hidden"
                                        />
                                        <div 
                                            className="w-4 h-4 rounded-full border flex items-center justify-center"
                                            style={{ borderColor: selectedProjectId === project.id ? '#10b981' : 'rgba(255,255,255,0.3)' }}
                                        >
                                            {selectedProjectId === project.id && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{project.title}</p>
                                            {project.description && (
                                                <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{project.description}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
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
                            disabled={!selectedProjectId || isSubmitting}
                            className="flex-1 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                boxShadow: '0 4px 15px rgba(16,185,129,0.35)',
                            }}
                        >
                            {isSubmitting ? 'Linking...' : 'Link Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
