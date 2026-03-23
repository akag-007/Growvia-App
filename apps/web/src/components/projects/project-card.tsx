'use client'

import { format, isValid, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, Clock, Trash2, ArrowRight } from 'lucide-react'
import { glassBackdrop } from '@/lib/glass-tokens'
import Link from 'next/link'

function formatEstimatedMins(mins: number) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins} min`
}

function formatTimeSpent(seconds: number) {
    if (!seconds || seconds <= 0) return '0m'
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rm = m % 60
    return rm ? `${h}h ${rm}m` : `${h}h`
}

export function ProjectCard({ project, onDelete }: { project: any, onDelete?: (id: string) => void }) {
    const progressPercent = project.completionPercentage ? Math.round(project.completionPercentage) : 0
    // Increased radius from 18 to 24 for a larger, more prominent circle (48x48 to 64x64)
    const circumference = 2 * Math.PI * 24
    
    // Convert target_deadline string to valid label
    const deadlineLabel = project.target_deadline 
        ? isValid(parseISO(project.target_deadline)) 
            ? format(parseISO(project.target_deadline), 'MMM d, yyyy') 
            : null
        : null

    const estMins = project.estimated_total_duration || 0

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative z-0 overflow-hidden flex flex-col"
            style={{
                background: `linear-gradient(145deg, ${project.color || '#8b5cf6'}15 0%, rgba(10, 15, 12, 0.6) 100%)`,
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                borderRadius: '24px',
                border: `1px solid ${project.color || '#8b5cf6'}33`,
                boxShadow: `0 10px 40px -10px ${project.color || '#8b5cf6'}1A, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 20px ${project.color || '#8b5cf6'}1A`,
                minHeight: '220px',
            }}
        >
            {/* Glow Blobs */}
            <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -z-10 transition-all duration-700 opacity-60 group-hover:opacity-100" 
                style={{ backgroundColor: `${project.color || '#8b5cf6'}33` }} 
            />
            <div 
                className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[50px] -z-10 transition-all duration-700 opacity-40 group-hover:opacity-80" 
                style={{ backgroundColor: `${project.color || '#8b5cf6'}22` }} 
            />

            <div className="relative z-10 flex flex-col p-6 h-full flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <h3 
                            className="text-xl font-bold text-white mb-2 tracking-tight transition-colors group-hover:text-white" 
                            style={{ textShadow: `0 0 15px ${project.color || '#8b5cf6'}40` }}
                        >
                            {project.title}
                        </h3>
                        {project.description && (
                            <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{project.description}</p>
                        )}
                    </div>

                    <div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-black/20 border border-white/5 shadow-inner group-hover:shadow-lg transition-shadow"
                         style={{ boxShadow: `inset 0 2px 4px rgba(0,0,0,0.4), inset 0 0 20px ${project.color || '#8b5cf6'}1A` }}>
                        <svg width="64" height="64" className="-rotate-90 absolute inset-0">
                            <circle
                                cx="32" cy="32" r="24"
                                fill="none"
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth="5"
                            />
                            <circle
                                cx="32" cy="32" r="24"
                                fill="none"
                                stroke={project.color || "#8b5cf6"}
                                strokeWidth="5"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: circumference - (progressPercent / 100) * circumference,
                                    transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                                    filter: `drop-shadow(0 0 6px ${project.color || '#8b5cf6'}66)`
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[13px] font-black text-white">{progressPercent}%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-white/10 relative">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <Clock size={14} className="opacity-70" />
                            <span>
                                {formatTimeSpent(project.totalTimeSpent)} <span className="text-zinc-500">/ {estMins ? formatEstimatedMins(estMins) : '∞'}</span>
                            </span>
                        </div>
                        {deadlineLabel && (
                            <div className="flex items-center gap-1.5 text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                <Calendar size={14} className="opacity-70" />
                                <span>{deadlineLabel}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <span 
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white border border-white/5 hover:scale-105 active:scale-95 cursor-pointer"
                            style={{ boxShadow: `0 4px 12px ${project.color || '#8b5cf6'}1A` }}
                        >
                            View Details <ArrowRight size={14} />
                        </span>
                        
                        {onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(project.id) }}
                                className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
