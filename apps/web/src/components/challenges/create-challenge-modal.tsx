'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Calendar, Clock, Grid3x3, Lock, Globe } from 'lucide-react'
import { useChallengesStore, TrackingUnit, computeTotalCells } from '@/stores/challenges'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    onClose: () => void
}

type Step = 'basics' | 'schedule' | 'preview'

interface FormData {
    title: string
    description: string
    isPrivate: boolean
    startDate: string
    durationDays: number
    trackingUnit: TrackingUnit
    cellShape: 'square' | 'circle' | 'rounded'
    cellSize: 'xs' | 'sm' | 'md'
}

const TRACKING_UNITS: { label: string; value: TrackingUnit; desc: string }[] = [
    { label: 'Hours', value: 'hours', desc: 'Each cell = 1 hour' },
    { label: 'Days', value: 'days', desc: 'Each cell = 1 day' },
    { label: 'Weeks', value: 'weeks', desc: 'Each cell = 1 week' },
]

const DURATION_PRESETS = [
    { label: '30 days', days: 30 },
    { label: '60 days', days: 60 },
    { label: '90 days', days: 90 },
    { label: '6 months', days: 180 },
    { label: '1 year', days: 365 },
]

// ─── Mini Grid Preview ────────────────────────────────────────────────────────

function GridPreview({ total, shape, size }: { total: number; shape: string; size: string }) {
    const maxShow = Math.min(total, size === 'xs' ? 200 : size === 'sm' ? 150 : 100)
    const cells = Array.from({ length: maxShow })
    const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-md' : 'rounded-sm'
    const sizeClass = size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
    return (
        <div className="flex flex-wrap gap-0.5 p-4 bg-zinc-950 rounded-xl border border-zinc-800 max-h-40 overflow-hidden">
            {cells.map((_, i) => (
                <div
                    key={i}
                    className={cn('bg-zinc-800 border border-zinc-700/50 flex-shrink-0', shapeClass, sizeClass)}
                />
            ))}
            {total > maxShow && (
                <span className="text-xs text-zinc-600 self-end ml-1">+{total - maxShow} more…</span>
            )}
        </div>
    )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function CreateChallengeModal({ onClose }: Props) {
    const { addChallenge } = useChallengesStore()
    const today = new Date().toISOString().split('T')[0]

    const [step, setStep] = useState<Step>('basics')
    const [form, setForm] = useState<FormData>({
        title: '',
        description: '',
        isPrivate: true,
        startDate: today,
        durationDays: 90,
        trackingUnit: 'days',
        cellShape: 'square',
        cellSize: 'sm',
    })
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

    const totalCells = computeTotalCells(form.durationDays, form.trackingUnit)

    const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

    const validateBasics = () => {
        const e: typeof errors = {}
        if (!form.title.trim()) e.title = 'Title is required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const validateSchedule = () => {
        const e: typeof errors = {}
        if (!form.startDate) e.startDate = 'Start date is required'
        if (form.durationDays < 1) e.durationDays = 'Duration must be at least 1'
        if (totalCells > 20000) {
            e.durationDays = `Too many cells (${totalCells.toLocaleString()}). Use a larger tracking unit.`
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleNext = () => {
        if (step === 'basics') { if (validateBasics()) setStep('schedule') }
        else if (step === 'schedule') { if (validateSchedule()) setStep('preview') }
    }

    const handleBack = () => {
        if (step === 'schedule') setStep('basics')
        else if (step === 'preview') setStep('schedule')
    }

    const handleSubmit = () => {
        addChallenge({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            type: 'personal',
            isPrivate: form.isPrivate,
            startDate: form.startDate,
            durationDays: form.durationDays,
            trackingUnit: form.trackingUnit,
            cellShape: form.cellShape,
            cellSize: form.cellSize,
        })
        onClose()
    }

    const steps: Step[] = ['basics', 'schedule', 'preview']
    const stepIdx = steps.indexOf(step)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-white">New Challenge</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Step {stepIdx + 1} of {steps.length} — {step === 'basics' ? 'Basics' : step === 'schedule' ? 'Schedule & Tracking' : 'Preview'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Step progress bar */}
                <div className="flex gap-1 px-6 pt-4">
                    {steps.map((s, i) => (
                        <div
                            key={s}
                            className={cn(
                                'h-1 flex-1 rounded-full transition-all duration-300',
                                i <= stepIdx ? 'bg-violet-500' : 'bg-zinc-800'
                            )}
                        />
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 py-5 min-h-[320px]">
                    <AnimatePresence mode="wait">
                        {step === 'basics' && (
                            <motion.div key="basics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Challenge Title *</label>
                                    <input
                                        value={form.title}
                                        onChange={(e) => set({ title: e.target.value })}
                                        placeholder="e.g. DSA Prep, 100 Days of Code…"
                                        className={cn(
                                            'w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                                            errors.title ? 'border-red-500' : 'border-zinc-700'
                                        )}
                                    />
                                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => set({ description: e.target.value })}
                                        placeholder="What's this challenge about?"
                                        rows={3}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                                    />
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Visibility</label>
                                    <div className="flex gap-3">
                                        {([true, false] as const).map((priv) => (
                                            <button
                                                key={String(priv)}
                                                onClick={() => set({ isPrivate: priv })}
                                                className={cn(
                                                    'flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                                                    form.isPrivate === priv
                                                        ? 'bg-violet-600 border-violet-500 text-white'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                                )}
                                            >
                                                {priv ? <Lock size={14} /> : <Globe size={14} />}
                                                {priv ? 'Private' : 'Community'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'schedule' && (
                            <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                {/* Start date */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={12} /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => set({ startDate: e.target.value })}
                                        className={cn(
                                            'w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                                            errors.startDate ? 'border-red-500' : 'border-zinc-700'
                                        )}
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Duration</label>
                                    <div className="flex gap-2 flex-wrap mb-2">
                                        {DURATION_PRESETS.map((p) => (
                                            <button
                                                key={p.days}
                                                onClick={() => set({ durationDays: p.days })}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                                                    form.durationDays === p.days
                                                        ? 'bg-violet-600 border-violet-500 text-white'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.durationDays}
                                        onChange={(e) => set({ durationDays: parseInt(e.target.value) || 1 })}
                                        className={cn(
                                            'w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                                            errors.durationDays ? 'border-red-500' : 'border-zinc-700'
                                        )}
                                        placeholder="Custom days"
                                    />
                                    {errors.durationDays && <p className="text-red-400 text-xs mt-1">{errors.durationDays}</p>}
                                </div>

                                {/* Tracking unit */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Clock size={12} /> Tracking Breakdown
                                    </label>
                                    <div className="flex gap-2">
                                        {TRACKING_UNITS.map((u) => (
                                            <button
                                                key={u.value}
                                                onClick={() => set({ trackingUnit: u.value })}
                                                className={cn(
                                                    'flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                                                    form.trackingUnit === u.value
                                                        ? 'bg-violet-600 border-violet-500 text-white'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                                )}
                                            >
                                                <div>{u.label}</div>
                                                <div className="text-[10px] opacity-60 mt-0.5">{u.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">
                                        This will create <span className="text-violet-400 font-bold">{totalCells.toLocaleString()} cells</span> in your grid.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'preview' && (
                            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Grid3x3 size={12} /> Grid Style
                                    </label>
                                    <div className="flex gap-3 mb-4">
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 mb-1.5">Cell shape</p>
                                            <div className="flex gap-1.5">
                                                {(['square', 'rounded', 'circle'] as const).map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => set({ cellShape: s })}
                                                        className={cn(
                                                            'flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize',
                                                            form.cellShape === s
                                                                ? 'bg-violet-600 border-violet-500 text-white'
                                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                                        )}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 mb-1.5">Cell size</p>
                                            <div className="flex gap-1.5">
                                                {(['xs', 'sm', 'md'] as const).map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => set({ cellSize: s })}
                                                        className={cn(
                                                            'flex-1 py-2 rounded-lg text-xs font-semibold border transition-all uppercase',
                                                            form.cellSize === s
                                                                ? 'bg-violet-600 border-violet-500 text-white'
                                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                                        )}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <GridPreview total={totalCells} shape={form.cellShape} size={form.cellSize} />
                                    <p className="text-xs text-zinc-600 mt-2 text-center">
                                        {totalCells.toLocaleString()} cells · You can change the style later inside the challenge
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                    <button
                        onClick={step === 'basics' ? onClose : handleBack}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={16} />
                        {step === 'basics' ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={step === 'preview' ? handleSubmit : handleNext}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-lg shadow-violet-600/25"
                    >
                        {step === 'preview' ? 'Create Challenge' : 'Next'}
                        {step !== 'preview' && <ChevronRight size={16} />}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
