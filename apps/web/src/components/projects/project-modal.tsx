'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, X, Edit, Trash2 } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

function formatEstimatedMins(mins: number) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins} min`
}

function formatTimeSpent(seconds: number) {
    if (!seconds || seconds <= 0) return '0.0h'
    const h = (seconds / 3600).toFixed(1)
    return `${h}h`
}

export function ProjectModal({ project, onClose, onEdit, onDelete }: { project: any, onClose: () => void, onEdit?: (id: string) => void, onDelete?: (id: string) => void }) {
    if (!project) return null

    const progressPercent = project.completionPercentage ? Math.round(project.completionPercentage) : 0
    const circumference = 2 * Math.PI * 32 // radius 32
    
    const deadlineLabel = project.target_deadline 
        ? isValid(parseISO(project.target_deadline)) 
            ? format(parseISO(project.target_deadline), 'MMM d, yyyy') 
            : null
        : null

    const estMins = project.estimated_total_duration || 0
    const color = project.color || '#8b5cf6'

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
                    style={{
                        background: `linear-gradient(145deg, rgba(20, 24, 20, 0.95) 0%, rgba(10, 15, 12, 0.98) 100%)`, // Base dark background
                        borderRadius: '32px',
                        border: `1px solid ${color}33`,
                        boxShadow: `0 20px 60px -10px ${color}20, inset 0 1px 0 rgba(255,255,255,0.08)`,
                        minHeight: '400px',
                    }}
                >
                    {/* Header Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                        {onEdit && (
                            <button onClick={() => onEdit(project.id)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <Edit size={16} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="relative z-10 flex flex-col p-8 flex-1">
                        {/* Title and Icon */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: color }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                    <line x1="4" y1="22" x2="4" y2="15"></line>
                                </svg>
                            </div>
                            <h2 
                                className="text-2xl font-black text-white tracking-tight" 
                                style={{ textShadow: `0 0 15px ${color}40` }}
                            >
                                {project.title}
                            </h2>
                        </div>

                        {/* Overall Progress Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-zinc-300 font-semibold text-sm">Overall Progress</h3>
                                <span className="text-2xl font-black" style={{ color: color }}>
                                    {progressPercent}%
                                </span>
                            </div>
                            
                            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                    className="h-full rounded-full relative"
                                    style={{ 
                                        backgroundColor: color,
                                        boxShadow: `0 0 15px ${color}80` 
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium mb-10 pb-8 border-b border-white/10">
                            {deadlineLabel && (
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Calendar size={16} />
                                    <span>Target: {deadlineLabel}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Clock size={16} />
                                <span>{formatTimeSpent(project.totalTimeSpent)} / {estMins ? formatEstimatedMins(estMins) : '∞'} total</span>
                            </div>
                        </div>

                        {/* Linked Daily Tasks */}
                        <div className="flex-1">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                                Linked Daily Tasks ({project.linkedTasks?.length || 0})
                            </h3>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {project.linkedTasks?.length > 0 ? (
                                    project.linkedTasks.map((task: any) => (
                                        <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium mb-1 text-sm">{task.title}</h4>
                                                    <p className="text-xs text-zinc-500 mb-3">Daily Task</p>
                                                    
                                                    {/* Task Progress Bar */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full rounded-full" 
                                                                style={{ 
                                                                    width: `${task.progress || 0}%`,
                                                                    backgroundColor: `${color}cc`,
                                                                }} 
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold" style={{ color: color }}>
                                                            {task.progress || 0}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-zinc-500 py-4 text-center">No daily tasks linked yet.</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Close button at bottom */}
                        <div className="mt-8">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl font-bold text-black transition-transform active:scale-95"
                                style={{ backgroundColor: color }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
