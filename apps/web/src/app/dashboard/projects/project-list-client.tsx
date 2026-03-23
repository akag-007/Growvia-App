'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProjectCard } from '@/components/projects/project-card'
import { deleteProject } from '@/actions/project'
import { Plus } from 'lucide-react'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { ProjectModal } from '@/components/projects/project-modal'

export function ProjectListClient({ initialProjects }: { initialProjects: any[] }) {
    const [projects, setProjects] = useState(initialProjects)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null)

    useEffect(() => {
        setProjects(initialProjects)
    }, [initialProjects])

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            setProjects(p => p.filter(x => x.id !== id))
            if (expandedProjectId === id) setExpandedProjectId(null)
            await deleteProject(id)
        }
    }

    const expandedProject = projects.find(p => p.id === expandedProjectId)
    const editingProject = projects.find(p => p.id === editingProjectId)

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                >
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-zinc-400">You don't have any projects yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {projects.map((project) => (
                            <div key={project.id} onClick={() => setExpandedProjectId(project.id)}>
                                <ProjectCard 
                                    project={project} 
                                    onDelete={handleDelete}
                                />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isCreateOpen && (
                    <CreateProjectModal onClose={() => setIsCreateOpen(false)} />
                )}
                {editingProject && (
                    <CreateProjectModal 
                        project={editingProject} 
                        onClose={() => setEditingProjectId(null)} 
                    />
                )}
            </AnimatePresence>

            {expandedProject && (
                <ProjectModal 
                    project={expandedProject} 
                    onClose={() => setExpandedProjectId(null)} 
                    onEdit={(id) => {
                        setEditingProjectId(id)
                        setExpandedProjectId(null)
                    }}
                    onDelete={handleDelete}
                />
            )}
        </div>
    )
}
