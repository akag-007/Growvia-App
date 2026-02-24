'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Settings2, Plus, Pencil, Trash2,
    CheckCircle2, Circle, BarChart3, Grid3x3,
} from 'lucide-react'
import { useChallengesStore, Challenge, Category, GridCell } from '@/stores/challenges'
import { CategoryManagementModal } from './category-management-modal'
import { toggleGridCell, setCellCategoryDb, syncChallengeData, updateChallengeStyle } from '@/actions/challenges'
import { cn } from '@/lib/utils'
import { format, addDays, parseISO } from 'date-fns'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellLabel(cell: GridCell, challenge: Challenge) {
    const { trackingUnit, startDate } = challenge
    const date = addDays(
        parseISO(startDate),
        trackingUnit === 'hours' ? Math.floor(cell.index / 24)
            : trackingUnit === 'weeks' ? cell.index * 7
                : cell.index
    )
    if (trackingUnit === 'hours') {
        const hour = cell.index % 24
        return `${format(date, 'MMM d')} · ${hour}:00`
    }
    if (trackingUnit === 'weeks') return `Week ${cell.index + 1} · ${format(date, 'MMM d')}`
    return format(date, 'MMM d, yyyy')
}

function unitLabel(u: Category['unit']) {
    return u === 'minutes' ? 'min' : u === 'hours' ? 'hr' : ''
}

// ─── Cell Popover ─────────────────────────────────────────────────────────────

function CellPopover({ cell, challenge, onClose, anchorEl }: {
    cell: GridCell
    challenge: Challenge
    onClose: () => void
    anchorEl: HTMLElement | null
}) {
    const { toggleCell, setCellCategory } = useChallengesStore()
    const ref = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!anchorEl || !ref.current) return
        const rect = anchorEl.getBoundingClientRect()
        const pw = ref.current.offsetWidth || 200
        const ph = ref.current.offsetHeight || 160
        let left = rect.left + rect.width / 2 - pw / 2
        let top = rect.bottom + 8
        if (top + ph > window.innerHeight - 8) top = rect.top - ph - 8
        left = Math.max(8, Math.min(left, window.innerWidth - pw - 8))
        setPos({ top, left })
    }, [anchorEl])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) && anchorEl && !anchorEl.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [anchorEl, onClose])

    const handleToggle = () => {
        const updatedCells = toggleCell(challenge.id, cell.index)
        toggleGridCell(challenge.id, updatedCells) // fire-and-forget to DB
        onClose()
    }

    const handleSetCategory = (catId: string | undefined) => {
        const updatedCells = setCellCategory(challenge.id, cell.index, catId)
        setCellCategoryDb(challenge.id, updatedCells) // fire-and-forget to DB
        onClose()
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 196 }}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-3 space-y-3"
        >
            <p className="text-[11px] font-bold text-zinc-500">{cellLabel(cell, challenge)}</p>

            <button
                onClick={handleToggle}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    cell.status === 'completed'
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-red-950 hover:text-red-400'
                        : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white'
                )}
            >
                {cell.status === 'completed'
                    ? <><Circle size={14} /> Mark empty</>
                    : <><CheckCircle2 size={14} /> Mark done</>}
            </button>

            {challenge.categories.length > 0 && (
                <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mb-1.5">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => handleSetCategory(undefined)}
                            className={cn(
                                'px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all',
                                !cell.categoryId ? 'bg-zinc-700 border-zinc-600 text-white' : 'border-zinc-700 text-zinc-500 hover:text-white'
                            )}
                        >
                            None
                        </button>
                        {challenge.categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleSetCategory(c.id)}
                                className={cn(
                                    'px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all',
                                    cell.categoryId === c.id ? 'border-white/30 text-white' : 'border-transparent text-white hover:border-white/20'
                                )}
                                style={{ backgroundColor: c.color + '33', borderColor: cell.categoryId === c.id ? c.color : undefined }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// ─── Grid Tab ─────────────────────────────────────────────────────────────────

function GridTab({ challenge }: { challenge: Challenge }) {
    const { updateChallengeStyle: updateStyle } = useChallengesStore()
    const [activeCell, setActiveCell] = useState<{ cell: GridCell; el: HTMLElement } | null>(null)
    const [showStyle, setShowStyle] = useState(false)

    const completed = challenge.gridCells.filter((c) => c.status === 'completed').length
    const total = challenge.totalCells
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const endDate = addDays(parseISO(challenge.startDate), challenge.durationDays - 1)
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))

    const shapeClass = challenge.cellShape === 'circle' ? 'rounded-full' : challenge.cellShape === 'rounded' ? 'rounded-md' : 'rounded-sm'
    const sizeClass = challenge.cellSize === 'xs' ? 'w-2.5 h-2.5' : challenge.cellSize === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

    const handleCellClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, cell: GridCell) => {
        e.stopPropagation()
        setActiveCell((prev) => prev?.cell.index === cell.index ? null : { cell, el: e.currentTarget })
    }, [])

    const handleStyleChange = (updates: { cellShape?: Challenge['cellShape']; cellSize?: Challenge['cellSize'] }) => {
        updateStyle(challenge.id, updates)
        updateChallengeStyle(challenge.id, {
            cell_shape: updates.cellShape ?? challenge.cellShape,
            cell_size: updates.cellSize ?? challenge.cellSize,
        })
    }

    const cat = (id?: string) => id ? challenge.categories.find((c) => c.id === id) : undefined

    return (
        <div>
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'Completed', value: `${completed}/${total}`, accent: 'text-violet-400' },
                    { label: 'Progress', value: `${pct}%`, accent: 'text-emerald-400' },
                    { label: 'Days Left', value: daysLeft > 0 ? `${daysLeft}d` : 'Done!', accent: 'text-amber-400' },
                    { label: 'End Date', value: format(endDate, 'MMM d'), accent: 'text-blue-400' },
                ].map((s) => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                        <p className={cn('text-lg font-extrabold', s.accent)}>{s.value}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-800 rounded-full mb-5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                />
            </div>

            {/* Grid style toggle */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500">Click a cell to mark it done · Hover for date label</p>
                <button
                    onClick={() => setShowStyle((v) => !v)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                        showStyle ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    )}
                >
                    <Settings2 size={12} /> Grid Style
                </button>
            </div>

            <AnimatePresence>
                {showStyle && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex gap-6">
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Shape</p>
                                <div className="flex gap-1.5">
                                    {(['square', 'rounded', 'circle'] as const).map((s) => (
                                        <button key={s} onClick={() => handleStyleChange({ cellShape: s })}
                                            className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                                                challenge.cellShape === s ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white')}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Size</p>
                                <div className="flex gap-1.5">
                                    {(['xs', 'sm', 'md'] as const).map((s) => (
                                        <button key={s} onClick={() => handleStyleChange({ cellSize: s })}
                                            className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all uppercase',
                                                challenge.cellSize === s ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white')}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div className="relative" onClick={() => setActiveCell(null)}>
                <div className="flex flex-wrap gap-0.5 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                    {challenge.gridCells.map((cell) => {
                        const category = cat(cell.categoryId)
                        const isActive = activeCell?.cell.index === cell.index
                        return (
                            <button
                                key={cell.index}
                                title={cellLabel(cell, challenge)}
                                onClick={(e) => handleCellClick(e, cell)}
                                className={cn(
                                    'flex-shrink-0 border transition-all duration-150',
                                    sizeClass, shapeClass,
                                    isActive && 'ring-2 ring-white/60 ring-offset-1 ring-offset-zinc-950',
                                    cell.status !== 'completed' && 'bg-zinc-800 border-zinc-700/50 hover:bg-zinc-700',
                                )}
                                style={cell.status === 'completed' ? {
                                    backgroundColor: category ? category.color : '#8b5cf6',
                                    borderColor: 'transparent',
                                } : undefined}
                            />
                        )
                    })}
                </div>

                {/* Category legend */}
                {challenge.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {challenge.categories.map((c) => {
                            const count = challenge.gridCells.filter((cell) => cell.status === 'completed' && cell.categoryId === c.id).length
                            return (
                                <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                                    <span className="text-xs text-zinc-300 font-medium">{c.name}</span>
                                    <span className="text-xs text-zinc-600">{count}</span>
                                </div>
                            )
                        })}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                            <div className="w-2.5 h-2.5 rounded-sm bg-violet-500 flex-shrink-0" />
                            <span className="text-xs text-zinc-300 font-medium">Uncategorized</span>
                            <span className="text-xs text-zinc-600">
                                {challenge.gridCells.filter((c) => c.status === 'completed' && !c.categoryId).length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {activeCell && (
                    <CellPopover
                        key={activeCell.cell.index}
                        cell={activeCell.cell}
                        challenge={challenge}
                        anchorEl={activeCell.el}
                        onClose={() => setActiveCell(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ challenge }: { challenge: Challenge }) {
    const { logCategoryEntry, deleteCategory } = useChallengesStore()
    const [showModal, setShowModal] = useState(false)
    const [editingCat, setEditingCat] = useState<Category | undefined>()
    const [logInputs, setLogInputs] = useState<Record<string, string>>({})
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleLog = (catId: string) => {
        const val = parseFloat(logInputs[catId] ?? '')
        if (isNaN(val) || val <= 0) return
        const updatedCats = logCategoryEntry(challenge.id, catId, val)
        syncChallengeData(challenge.id, { categories: updatedCats }) // fire-and-forget
        setLogInputs((prev) => ({ ...prev, [catId]: '' }))
    }

    const handleDelete = (catId: string) => {
        const { categories, gridCells } = deleteCategory(challenge.id, catId)
        syncChallengeData(challenge.id, { categories, grid_cells: gridCells }) // fire-and-forget
        setDeletingId(null)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-zinc-500">
                    {challenge.categories.length === 0
                        ? 'No categories yet — add one to colour-code your grid cells.'
                        : `${challenge.categories.length} categor${challenge.categories.length === 1 ? 'y' : 'ies'}`}
                </p>
                <button
                    onClick={() => { setEditingCat(undefined); setShowModal(true) }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-lg shadow-violet-600/20"
                >
                    <Plus size={15} /> Add Category
                </button>
            </div>

            {challenge.categories.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-3xl mb-3">🏷️</p>
                    <p className="text-zinc-400 font-semibold">No categories yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Create categories like "Arrays", "Morning Run" to track different areas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {challenge.categories.map((cat) => {
                        const cellsTagged = challenge.gridCells.filter((c) => c.categoryId === cat.id && c.status === 'completed').length
                        return (
                            <motion.div key={cat.id} layout className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: cat.color + '22', border: `2px solid ${cat.color}` }}>
                                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {cat.totalLogged} {unitLabel(cat.unit)} logged · {cellsTagged} cells tagged
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => { setEditingCat(cat); setShowModal(true) }}
                                            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        {deletingId === cat.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleDelete(cat.id)}
                                                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900 border border-red-800 transition-colors whitespace-nowrap">
                                                    Confirm
                                                </button>
                                                <button onClick={() => setDeletingId(null)} className="text-zinc-600 hover:text-zinc-400 text-xs px-1">✕</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeletingId(cat.id)}
                                                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="number" min={0}
                                        value={logInputs[cat.id] ?? ''}
                                        onChange={(e) => setLogInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLog(cat.id)}
                                        placeholder={`Log ${cat.unit === 'count' ? 'count' : cat.unit}…`}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    />
                                    <button
                                        onClick={() => handleLog(cat.id)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                                        style={{ backgroundColor: cat.color }}
                                    >
                                        + Log
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <CategoryManagementModal
                        challengeId={challenge.id}
                        editingCategory={editingCat}
                        onClose={() => { setShowModal(false); setEditingCat(undefined) }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Detail View ──────────────────────────────────────────────────────────────

type DetailTab = 'grid' | 'categories'

export function ChallengeDetailView({ challengeId, onBack }: { challengeId: string; onBack: () => void }) {
    const { challenges } = useChallengesStore()
    const challenge = challenges.find((c) => c.id === challengeId)
    const [tab, setTab] = useState<DetailTab>('grid')

    if (!challenge) return (
        <div className="text-center py-20 text-zinc-500">Challenge not found. <button onClick={onBack} className="text-violet-400 underline">Go back</button></div>
    )

    const completed = challenge.gridCells.filter((c) => c.status === 'completed').length
    const pct = Math.round((completed / challenge.totalCells) * 100)

    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-extrabold text-white truncate">{challenge.title}</h1>
                        <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                            challenge.isPrivate ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-violet-900/40 text-violet-300 border-violet-700/50'
                        )}>
                            {challenge.isPrivate ? '🔒 Private' : '🌐 Community'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-zinc-800 text-zinc-400 border-zinc-700 capitalize">
                            {challenge.trackingUnit}
                        </span>
                    </div>
                    {challenge.description && (
                        <p className="text-zinc-500 text-sm mt-0.5 truncate">{challenge.description}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-extrabold text-violet-400">{pct}%</p>
                    <p className="text-xs text-zinc-600">{completed}/{challenge.totalCells}</p>
                </div>
            </div>

            <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 gap-1 mb-6">
                {([
                    { id: 'grid', label: 'Grid', icon: <Grid3x3 size={14} /> },
                    { id: 'categories', label: 'Categories', icon: <BarChart3 size={14} /> },
                ] as const).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200',
                            tab === t.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-zinc-400 hover:text-white'
                        )}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {tab === 'grid' ? (
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GridTab challenge={challenge} />
                    </motion.div>
                ) : (
                    <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CategoriesTab challenge={challenge} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
