'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useChallengesStore, Category } from '@/stores/challenges'
import { cn } from '@/lib/utils'

interface Props {
    challengeId: string
    editingCategory?: Category
    onClose: () => void
}

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#84cc16', '#14b8a6', '#6366f1', '#a855f7', '#fb923c',
    '#ffffff', '#94a3b8', '#71717a',
]

const UNIT_OPTIONS: { label: string; value: Category['unit'] }[] = [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Count', value: 'count' },
]

export function CategoryManagementModal({ challengeId, editingCategory, onClose }: Props) {
    const { addCategory, updateCategory } = useChallengesStore()
    const isEditing = !!editingCategory

    const [name, setName] = useState(editingCategory?.name ?? '')
    const [color, setColor] = useState(editingCategory?.color ?? '#8b5cf6')
    const [unit, setUnit] = useState<Category['unit']>(editingCategory?.unit ?? 'count')
    const [customColor, setCustomColor] = useState(editingCategory?.color ?? '#8b5cf6')
    const [nameError, setNameError] = useState('')

    useEffect(() => {
        if (!PRESET_COLORS.includes(color)) setCustomColor(color)
    }, [color])

    const handleSubmit = () => {
        if (!name.trim()) { setNameError('Name is required'); return }
        if (isEditing) {
            updateCategory(challengeId, editingCategory.id, { name: name.trim(), color, unit })
        } else {
            addCategory(challengeId, { name: name.trim(), color, unit })
        }
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
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h3 className="text-base font-bold text-white">{isEditing ? 'Edit Category' : 'New Category'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Name *</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => { setName(e.target.value); setNameError('') }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="e.g. Arrays, Morning Run…"
                            className={cn(
                                'w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                                nameError ? 'border-red-500' : 'border-zinc-700'
                            )}
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
                                    className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center"
                                    style={{
                                        backgroundColor: c,
                                        borderColor: color === c ? 'white' : 'transparent',
                                    }}
                                >
                                    {color === c && <Check size={12} className="text-black" style={{ filter: 'drop-shadow(0 0 2px white)' }} />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value) }}
                                className="w-8 h-8 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                            />
                            <span className="text-xs text-zinc-500">Custom color</span>
                            <div
                                className="w-6 h-6 rounded-md ml-auto"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tracking Unit</label>
                        <div className="flex gap-2">
                            {UNIT_OPTIONS.map((u) => (
                                <button
                                    key={u.value}
                                    onClick={() => setUnit(u.value)}
                                    className={cn(
                                        'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                                        unit === u.value
                                            ? 'bg-violet-600 border-violet-500 text-white'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                    )}
                                >
                                    {u.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 pb-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white border border-zinc-700 bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                        style={{ backgroundColor: color }}
                    >
                        {isEditing ? 'Save Changes' : 'Add Category'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
