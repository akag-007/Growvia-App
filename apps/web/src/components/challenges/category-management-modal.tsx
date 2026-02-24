'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useChallengesStore, Category } from '@/stores/challenges'
import { syncChallengeData } from '@/actions/challenges'
import { cn } from '@/lib/utils'

interface Props {
    challengeId: string
    editingCategory?: Category
    onClose: () => void
}

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
    '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#ec4899', '#f43f5e', '#64748b', '#94a3b8', '#ffffff',
    '#fbbf24', '#34d399', '#60a5fa', '#c084fc',
]

const UNITS: { label: string; value: Category['unit'] }[] = [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Count', value: 'count' },
]

export function CategoryManagementModal({ challengeId, editingCategory, onClose }: Props) {
    const { addCategory, updateCategory, challenges } = useChallengesStore()
    const isEditing = !!editingCategory

    const [name, setName] = useState(editingCategory?.name ?? '')
    const [color, setColor] = useState(editingCategory?.color ?? '#8b5cf6')
    const [unit, setUnit] = useState<Category['unit']>(editingCategory?.unit ?? 'count')
    const [nameError, setNameError] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
        if (!name.trim()) { setNameError('Name is required'); return }
        setNameError('')
        setSaving(true)

        let updatedCats: Category[]
        if (isEditing) {
            updatedCats = updateCategory(challengeId, editingCategory.id, { name: name.trim(), color, unit })
        } else {
            updatedCats = addCategory(challengeId, { name: name.trim(), color, unit })
        }

        // Persist to Supabase (fire-and-forget with await for correctness)
        await syncChallengeData(challengeId, { categories: updatedCats })
        setSaving(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 16 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{isEditing ? 'Edit Category' : 'New Category'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Name *</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="e.g. Arrays, Morning Run…"
                        className={cn(
                            'w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40',
                            nameError ? 'border-red-500' : 'border-zinc-700'
                        )}
                        autoFocus
                    />
                    {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
                </div>

                {/* Color */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Color</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn('w-6 h-6 rounded-md transition-all hover:scale-110', color === c && 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110')}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer"
                        />
                        <input
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#8b5cf6"
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        />
                        <div className="w-8 h-8 rounded-lg border border-zinc-700 flex-shrink-0" style={{ backgroundColor: color }} />
                    </div>
                </div>

                {/* Unit */}
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tracking Unit</label>
                    <div className="flex gap-2">
                        {UNITS.map((u) => (
                            <button
                                key={u.value}
                                onClick={() => setUnit(u.value)}
                                className={cn(
                                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                                    unit === u.value ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                )}
                            >
                                {u.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition-colors shadow-lg shadow-violet-600/20 border border-transparent"
                        style={{ borderColor: color }}
                    >
                        {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Category'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
