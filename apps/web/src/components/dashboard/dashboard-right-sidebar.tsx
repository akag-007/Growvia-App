'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjects } from '@/actions/project'
import { Layers, Flag, Plus, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isValid, parseISO } from 'date-fns'
import { ProjectModal } from '@/components/projects/project-modal'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { deleteProject } from '@/actions/project'

export function DashboardRightSidebar() {
    const [projects, setProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            setProjects(p => p.filter(x => x.id !== id))
            if (expandedProjectId === id) setExpandedProjectId(null)
            await deleteProject(id)
        }
    }

    const expandedProject = projects.find(p => p.id === expandedProjectId)
    const editingProject = projects.find(p => p.id === editingProjectId)

    useEffect(() => {
        getProjects().then(data => {
            setProjects(data.slice(0, 3))
            setIsLoading(false)
        })
    }, [])

    return (
        <div className="flex flex-col gap-4">
            {/* Score/Points Section — reduced to 80px circles */}
            <div className="grid grid-cols-2 gap-3 place-items-center">
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '100px',
                        height: '100px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.10) 100%)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(99,102,241,0.2)',
                    }}
                >
                    <span className="relative text-[11px] font-semibold text-white/70 mb-0.5">Score</span>
                    <span className="relative text-2xl font-bold text-indigo-300 group-hover:scale-110 transition-all">0</span>
                </div>
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.10) 100%)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                        boxShadow: '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(16,185,129,0.2)',
                    }}
                >
                    <span className="relative text-[11px] font-semibold text-white/70 mb-0.5">Points</span>
                    <span className="relative text-2xl font-bold text-emerald-300 group-hover:scale-110 transition-all">0</span>
                </div>
            </div>

            {/* Weekly Momentum Graph */}
            <div
                className="transition-all duration-300 hover:scale-[1.02]"
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(24px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                    height: '160px',
                }}
            >
                <h3 className="text-xs font-semibold text-white/80 px-4 pt-4 mb-2">Weekly Momentum</h3>
                <div className="flex items-center justify-center" style={{ minHeight: '100px' }}>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 mb-1">Daily Score Tracking</p>
                        <p className="text-xs text-zinc-400">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Longer Tasks/Projects */}
            <div
                className="transition-all flex flex-col flex-1 relative overflow-hidden group shadow-2xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(20, 28, 24, 0.4) 0%, rgba(10, 15, 12, 0.6) 100%)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 20px rgba(16, 185, 129, 0.05)',
                    minHeight: '260px',
                }}
            >
                {/* Glow blob behind */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -z-10 group-hover:bg-emerald-500/20 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] -z-10 group-hover:bg-indigo-500/20 transition-all duration-700" />

                <div className="flex items-center justify-between px-5 pt-5 mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <Flag className="text-[#34d399]" size={20} />
                        <h3 className="text-lg font-bold text-white tracking-tight leading-none text-shadow-sm">Longer Tasks</h3>
                    </div>
                    <Link 
                        href="/dashboard/projects" 
                        className="flex items-center gap-1.5 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#34d399] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 border border-[#10b981]/30"
                        style={{ boxShadow: '0 0 15px rgba(16,185,129,0.2)' }}
                    >
                        <Plus size={14} strokeWidth={3} /> Add
                    </Link>
                </div>
                
                <div className="flex flex-col flex-1 px-4 pb-5 space-y-3 relative z-10">
                    <AnimatePresence>
                        {isLoading ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-1 items-center justify-center opacity-50"
                            >
                                <Layers size={24} className="animate-pulse text-emerald-400" />
                            </motion.div>
                        ) : projects.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex flex-1 flex-col items-center justify-center text-center p-4 bg-black/20 rounded-2xl border border-white/5"
                            >
                                <p className="text-xs font-medium text-emerald-400/80 mb-2">No active projects</p>
                                <Link href="/dashboard/projects" className="text-sm font-bold text-white/90 hover:text-white transition-colors">Start a Project &rarr;</Link>
                            </motion.div>
                        ) : (
                            projects.map((project, i) => {
                                const prog = project.completionPercentage ? Math.round(project.completionPercentage) : 0
                                const circumference = 2 * Math.PI * 18
                                
                                const deadlineLabel = project.target_deadline 
                                    ? isValid(parseISO(project.target_deadline)) 
                                        ? format(parseISO(project.target_deadline), 'MMM d, yyyy') 
                                        : null
                                    : null

                                return (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1, duration: 0.4, type: 'spring' }}
                                    >
                                        <button 
                                            onClick={() => setExpandedProjectId(project.id)}
                                            className="w-full text-left group/link flex items-center p-3 rounded-2xl bg-[#111a14]/60 hover:bg-[#16241b]/80 border border-emerald-900/40 hover:border-emerald-500/30 transition-all duration-300 gap-4"
                                            style={{
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 4px 12px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <div className="relative shrink-0 flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#0a100c] border border-white/5 shadow-inner group-hover/link:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-shadow">
                                                <svg width="48" height="48" className="-rotate-90 absolute inset-0">
                                                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                                                    <motion.circle
                                                        cx="24" cy="24" r="18" fill="none"
                                                        stroke="#10b981"
                                                        strokeWidth="4" strokeLinecap="round"
                                                        initial={{ strokeDashoffset: circumference }}
                                                        animate={{ strokeDashoffset: circumference - (prog / 100) * circumference }}
                                                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.2 }}
                                                        style={{ strokeDasharray: circumference }}
                                                    />
                                                </svg>
                                                <span className="text-[11px] font-black text-white">{prog}%</span>
                                            </div>

                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                <p className="text-[15px] font-bold text-white/90 truncate group-hover/link:text-emerald-300 transition-colors tracking-tight">
                                                    {project.title}
                                                </p>
                                                {deadlineLabel && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1 font-medium">
                                                        <Calendar size={12} className="opacity-70 group-hover/link:text-emerald-400 group-hover/link:opacity-100 transition-colors" />
                                                        {deadlineLabel}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </motion.div>
                                )
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
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
