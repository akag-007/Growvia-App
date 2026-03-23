'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, Trash2, Unlink } from 'lucide-react'
import Link from 'next/link'
import { format, isValid, parseISO } from 'date-fns'
import { unlinkTaskFromProject } from '@/actions/task'

function formatTimeSpent(seconds: number) {
    if (!seconds || seconds <= 0) return '0m'
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rm = m % 60
    return rm ? `${h}h ${rm}m` : `${h}h`
}

function formatEstimatedMins(mins: number) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins} min`
}

export function ProjectDetailClient({ project }: { project: any }) {
    const [linkedTasks, setLinkedTasks] = useState<any[]>(project.linkedTasks || [])
    
    const progressPercent = project.completionPercentage ? Math.round(project.completionPercentage) : 0
    const circumference = 2 * Math.PI * 36

    const deadlineLabel = project.target_deadline 
        ? isValid(parseISO(project.target_deadline)) 
            ? format(parseISO(project.target_deadline), 'MMM d, yyyy') 
            : null
        : null

    const handleUnlink = async (taskId: string) => {
        if (confirm('Unlink this task from the project?')) {
            setLinkedTasks(prev => prev.filter(t => t.id !== taskId))
            await unlinkTaskFromProject(taskId, project.id)
        }
    }

    return (
        <div className="space-y-8">
            <Link 
                href="/dashboard/projects" 
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-3xl p-8 border border-white/10"
                 style={{
                     background: `linear-gradient(135deg, ${project.color || '#8b5cf6'}1A 0%, rgba(20, 20, 28, 0.4) 100%)`,
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: `0 0 20px ${project.color}40` }}>
                        {project.title}
                    </h1>
                    {project.description && (
                        <p className="text-zinc-400 max-w-xl text-lg mb-6">{project.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Clock size={16} className="text-indigo-400" />
                            <span>
                                <strong className="text-white">{formatTimeSpent(project.totalTimeSpent)}</strong> spent
                                {project.estimated_total_duration && ` / ${formatEstimatedMins(project.estimated_total_duration)} est.`}
                            </span>
                        </div>
                        {deadlineLabel && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                                <Calendar size={16} />
                                <span>Due: <strong>{deadlineLabel}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative shrink-0 flex flex-col items-center">
                    <svg width="96" height="96" className="-rotate-90">
                        <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle
                            cx="48" cy="48" r="36" fill="none" 
                            stroke={project.color || "#8b5cf6"} 
                            strokeWidth="8" strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: circumference - (progressPercent / 100) * circumference,
                                transition: 'stroke-dashoffset 1s ease-out'
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{progressPercent}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Linked Tasks</h3>
                {linkedTasks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400">
                        No tasks are linked to this project yet. Go to your tasks and click "Link to Project".
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {linkedTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${task.is_completed ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                                        <p className={`text-base font-semibold truncate ${task.is_completed ? 'text-zinc-400 line-through' : 'text-white'}`}>
                                            {task.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-4">
                                        <Clock size={12} /> {formatTimeSpent(task.actual_duration || 0)} spent
                                        <span className="mx-1">•</span>
                                        <span className={task.is_completed ? "text-emerald-400/80" : "text-zinc-500"}>
                                            {task.is_completed ? "Completed" : "In Progress"}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleUnlink(task.id)}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                    title="Unlink task"
                                >
                                    <Unlink size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
