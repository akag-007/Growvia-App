'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Settings2, Plus, Pencil, Trash2,
    BarChart3, Grid3x3, Tag, Calendar, Flag,
} from 'lucide-react'
import { useChallengesStore, Challenge, Category, GridCell } from '@/stores/challenges'
import { CategoryManagementModal } from './category-management-modal'
import { toggleGridCell, setCellCategoryDb, syncChallengeData, updateChallengeStyle } from '@/actions/challenges'
import { cn } from '@/lib/utils'
import { format, addDays, parseISO } from 'date-fns'
import { Slider } from '@/components/ui/slider-number-flow'

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

// ─── Category Popover (right-click) ──────────────────────────────────────────

function CategoryPopover({ cell, challenge, onClose, anchorEl }: {
    cell: GridCell
    challenge: Challenge
    onClose: () => void
    anchorEl: HTMLElement | null
}) {
    const { setCellCategory } = useChallengesStore()
    const ref = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!anchorEl || !ref.current) return
        const rect = anchorEl.getBoundingClientRect()
        const pw = ref.current.offsetWidth || 180
        const ph = ref.current.offsetHeight || 120
        let left = rect.left + rect.width / 2 - pw / 2
        let top = rect.bottom + 6
        if (top + ph > window.innerHeight - 8) top = rect.top - ph - 6
        left = Math.max(8, Math.min(left, window.innerWidth - pw - 8))
        setPos({ top, left })
    }, [anchorEl])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose])

    const handleSetCategory = (catId: string | undefined) => {
        const updatedCells = setCellCategory(challenge.id, cell.index, catId)
        setCellCategoryDb(challenge.id, updatedCells)
        onClose()
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 160 }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2.5"
        >
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                <Tag size={9} className="inline mr-1" />{cellLabel(cell, challenge)}
            </p>
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
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all text-white"
                        style={{
                            backgroundColor: c.color + '33',
                            borderColor: cell.categoryId === c.id ? c.color : 'transparent',
                            outline: cell.categoryId === c.id ? `1px solid ${c.color}` : undefined,
                        }}
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </motion.div>
    )
}

// ─── Grid Tab ─────────────────────────────────────────────────────────────────

function GridTab({ challenge }: { challenge: Challenge }) {
    const { updateChallengeStyle: updateStyle, setCellsRange } = useChallengesStore()
    const [catPopover, setCatPopover] = useState<{ cell: GridCell; el: HTMLElement } | null>(null)
    const [gridStyleHover, setGridStyleHover] = useState(false)

    // Drag-to-select state
    const [dragStartIdx, setDragStartIdx] = useState<number | null>(null)
    const [dragEndIdx, setDragEndIdx] = useState<number | null>(null)
    // 'completed' = dragging to fill, 'empty' = dragging to clear
    const dragTargetStatus = useRef<'completed' | 'empty'>('completed')
    const isDragging = useRef(false)

    const completed = challenge.gridCells.filter((c) => c.status === 'completed').length
    const total = challenge.totalCells
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const endDate = addDays(parseISO(challenge.startDate), challenge.durationDays - 1)
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))

    const shapeClass = challenge.cellShape === 'circle' ? 'rounded-full' : challenge.cellShape === 'rounded' ? 'rounded-md' : 'rounded-sm'
    const cellPx = challenge.cellSize           // integer px from store
    const cols = challenge.gridColumns
    const rowCount = Math.ceil(total / cols)
    const styleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Compute highlighted range indices during drag
    const dragRange = (dragStartIdx !== null && dragEndIdx !== null)
        ? { lo: Math.min(dragStartIdx, dragEndIdx), hi: Math.max(dragStartIdx, dragEndIdx) }
        : null

    // Commit the range to the store + DB on mouseup
    const commitDrag = useCallback(() => {
        if (!isDragging.current || dragStartIdx === null) return
        const end = dragEndIdx ?? dragStartIdx
        const lo = Math.min(dragStartIdx, end)
        const hi = Math.max(dragStartIdx, end)
        const target = dragTargetStatus.current
        const updatedCells = setCellsRange(challenge.id, lo, hi, target)
        toggleGridCell(challenge.id, updatedCells)
        isDragging.current = false
        setDragStartIdx(null)
        setDragEndIdx(null)
    }, [challenge.id, dragStartIdx, dragEndIdx, setCellsRange])

    // Listen for mouseup anywhere so releasing outside the grid commits correctly
    useEffect(() => {
        const handler = () => { if (isDragging.current) commitDrag() }
        document.addEventListener('mouseup', handler)
        return () => document.removeEventListener('mouseup', handler)
    }, [commitDrag])



    const handleCellMouseDown = (e: React.MouseEvent, cell: GridCell) => {
        if (e.button !== 0) return // left button only
        e.preventDefault() // prevent text-selection cursor during drag
        isDragging.current = true
        setDragStartIdx(cell.index)
        setDragEndIdx(cell.index)
        // Intent: if cell is empty → fill; if completed → clear
        dragTargetStatus.current = cell.status === 'completed' ? 'empty' : 'completed'
    }

    const handleCellMouseEnter = (cell: GridCell) => {
        if (!isDragging.current) return
        setDragEndIdx(cell.index)
    }

    // Right-click: category picker
    const handleCellContextMenu = (e: React.MouseEvent<HTMLButtonElement>, cell: GridCell) => {
        if (challenge.categories.length === 0) return
        e.preventDefault()
        setCatPopover({ cell, el: e.currentTarget })
    }

    // Instant store update; debounced DB write so sliders don't spam the API
    const handleStyleChange = (updates: Partial<Pick<Challenge, 'cellShape' | 'cellSize' | 'gridColumns'>>) => {
        updateStyle(challenge.id, updates)
        const patch = {
            cell_shape: updates.cellShape ?? challenge.cellShape,
            cell_size: updates.cellSize ?? challenge.cellSize,
            grid_columns: updates.gridColumns ?? challenge.gridColumns,
        }
        if (styleDebounceRef.current) clearTimeout(styleDebounceRef.current)
        styleDebounceRef.current = setTimeout(() => updateChallengeStyle(challenge.id, patch), 600)
    }

    const cat = (id?: string) => id ? challenge.categories.find((c) => c.id === id) : undefined


    return (
        <div>
            {/* Progress bar only */}
            <div className="h-1.5 bg-zinc-800 rounded-full mb-5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                />
            </div>

            {/* Grid style toggle — hover dropdown */}
            <div className="mb-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                        Click or drag to toggle ·{' '}
                        {challenge.categories.length > 0 ? 'Right-click to assign category' : 'Add categories to colour-code cells'}
                    </p>

                    {/* Hover-activated dropdown button */}
                    <div
                        className="relative"
                        onMouseEnter={() => setGridStyleHover(true)}
                        onMouseLeave={() => setGridStyleHover(false)}
                    >
                        <button
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                                gridStyleHover
                                    ? 'bg-violet-600 border-violet-500 text-white'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            )}
                        >
                            <Settings2 size={12} /> Grid Style
                        </button>

                        {/* Floating dropdown panel */}
                        <AnimatePresence>
                            {gridStyleHover && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                                    transition={{
                                        type: 'spring',
                                        mass: 0.5,
                                        damping: 11.5,
                                        stiffness: 100,
                                        restDelta: 0.001,
                                        restSpeed: 0.001,
                                    }}
                                    className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-80"
                                >
                                    <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-5 shadow-2xl shadow-black/50 space-y-5">
                                        {/* Shape */}
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Shape</p>
                                            <div className="flex gap-1.5">
                                                {(['square', 'rounded', 'circle'] as const).map((s) => (
                                                    <button key={s} onClick={() => handleStyleChange({ cellShape: s })}
                                                        className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                                                            challenge.cellShape === s
                                                                ? 'bg-violet-600 border-violet-500 text-white'
                                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white')}>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cell Size */}
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Cell Size</p>
                                            <Slider
                                                value={[cellPx]}
                                                min={6} max={36} step={1}
                                                onValueChange={([v]) => handleStyleChange({ cellSize: v })}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Columns */}
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Columns</p>
                                            <Slider
                                                value={[cols]}
                                                min={5} max={32} step={1}
                                                onValueChange={([v]) => handleStyleChange({ gridColumns: v })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>{/* end grid style */}

            {/* Grid — auto-sizes to cols × cellPx, centered */}
            <div className="relative">
                <div
                    className="mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-4 overflow-y-auto scrollbar-thin select-none"
                    style={{ maxHeight: 520, width: 'fit-content', maxWidth: '100%' }}
                    onDragStart={(e) => e.preventDefault()}
                >
                    <div
                        className="grid"
                        style={{ gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`, gap: 2 }}
                    >
                        {challenge.gridCells.map((cell) => {
                            const category = cat(cell.categoryId)
                            const inDragRange = dragRange && cell.index >= dragRange.lo && cell.index <= dragRange.hi
                            const willFill = inDragRange && dragTargetStatus.current === 'completed'
                            const willClear = inDragRange && dragTargetStatus.current === 'empty'

                            return (
                                <button
                                    key={cell.index}
                                    title={cellLabel(cell, challenge)}
                                    onMouseDown={(e) => handleCellMouseDown(e, cell)}
                                    onMouseEnter={() => handleCellMouseEnter(cell)}
                                    onContextMenu={(e) => handleCellContextMenu(e, cell)}
                                    className={cn(
                                        'flex-shrink-0 border-0 transition-colors duration-75',
                                        shapeClass,
                                        !inDragRange && cell.status !== 'completed' && 'bg-zinc-800 hover:bg-zinc-600',
                                        willFill && 'ring-1 ring-white/40',
                                        willClear && 'opacity-30',
                                    )}
                                    style={{
                                        width: cellPx,
                                        height: cellPx,
                                        ...(() => {
                                            if (willFill) return { backgroundColor: '#8b5cf6' }
                                            if (willClear) return { backgroundColor: category?.color ?? '#8b5cf6' }
                                            if (cell.status === 'completed') return { backgroundColor: category?.color ?? '#8b5cf6' }
                                            return {}
                                        })()
                                    }}
                                />
                            )
                        })}
                    </div>{/* end CSS grid */}
                </div>{/* end scroll container */}

                {/* Drag count badge */}
                <AnimatePresence>
                    {dragRange && dragRange.hi > dragRange.lo && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-600 text-white shadow-lg pointer-events-none"
                        >
                            {dragRange.hi - dragRange.lo + 1} selected
                        </motion.div>
                    )}
                </AnimatePresence>

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
            </div>{/* End relative */}

            <AnimatePresence>
                {catPopover && (
                    <CategoryPopover
                        key={catPopover.cell.index}
                        cell={catPopover.cell}
                        challenge={challenge}
                        anchorEl={catPopover.el}
                        onClose={() => setCatPopover(null)}
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
    const endDate = addDays(parseISO(challenge.startDate), challenge.durationDays - 1)
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))

    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            {/* Header area — relative so the ring can be positioned absolutely */}
            <div className="relative mb-6">

                {/* Title row */}
                <div className="flex items-center gap-4 pr-36">
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
                </div>

                {/* Ring — absolutely positioned top-right */}
                <div className="absolute top-0 right-0 flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="26" fill="none" stroke="#27272a" strokeWidth="5" />
                            <circle
                                cx="32" cy="32" r="26"
                                fill="none"
                                stroke="url(#progGradient)"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray="163.4"
                                strokeDashoffset={163.4 - (163.4 * pct) / 100}
                                style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                            />
                            <defs>
                                <linearGradient id="progGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#7c3aed" />
                                    <stop offset="100%" stopColor="#a78bfa" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-base font-extrabold text-violet-400">{pct}%</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold text-white leading-none">
                            <span className="text-violet-400">{completed}</span>
                            <span className="text-zinc-500 mx-1">/</span>
                            <span>{challenge.totalCells}</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{challenge.trackingUnit}</p>
                    </div>
                </div>

                {/* Timeline — centred below title */}
                <div className="flex items-center gap-0 px-2 my-[44px] w-full max-w-xl mx-auto">
                    {/* Start date */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center">
                            <Calendar size={15} className="text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Start Date</p>
                        <p className="text-sm font-bold text-white">{format(parseISO(challenge.startDate), 'MMM d, yyyy')}</p>
                    </div>

                    <div className="flex-1 border-t-2 border-dashed border-zinc-700 mx-2" />

                    <div className="flex-shrink-0 px-3 py-1.5 rounded-full border-2 text-xs font-extrabold tracking-wide"
                        style={{
                            borderColor: daysLeft > 0 ? '#4ade80' : '#f59e0b',
                            color: daysLeft > 0 ? '#4ade80' : '#f59e0b',
                            backgroundColor: daysLeft > 0 ? '#4ade8010' : '#f59e0b10',
                        }}
                    >
                        {daysLeft > 0 ? `${daysLeft} DAYS LEFT` : 'COMPLETED'}
                    </div>

                    <div className="flex-1 border-t-2 border-dashed border-zinc-700 mx-2" />

                    {/* End date */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-orange-500 bg-orange-500/10 flex items-center justify-center">
                            <Flag size={15} className="text-orange-400" />
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">End Date</p>
                        <p className="text-sm font-bold text-white">{format(endDate, 'MMM d, yyyy')}</p>
                    </div>
                </div>

            </div>

            {/* Tab selector */}
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
