import { create } from 'zustand'
import type { ChallengeRow } from '@/actions/challenges'

// ─── Re-export types used by components ───────────────────────────────────────

export type TrackingUnit = 'hours' | 'days' | 'weeks'
export type CellStatus = 'empty' | 'completed'

export interface GridCell {
    index: number
    status: CellStatus
    categoryId?: string
}

export interface Category {
    id: string
    name: string
    color: string
}

export interface Challenge {
    id: string
    title: string
    description?: string
    type: 'personal' | 'community'
    isPrivate: boolean
    startDate: string
    durationDays: number
    trackingUnit: TrackingUnit
    totalCells: number
    gridCells: GridCell[]
    categories: Category[]
    cellShape: 'square' | 'circle' | 'rounded'
    cellSize: number      // pixel size, e.g. 8, 10, 14, 20
    gridColumns: number
    createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeTotalCells(durationDays: number, unit: TrackingUnit): number {
    if (unit === 'hours') return durationDays * 24
    if (unit === 'weeks') return Math.ceil(durationDays / 7)
    return durationDays
}

/** Map a DB row to the client-side Challenge shape */
export function rowToChallenge(row: ChallengeRow): Challenge {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        type: row.type,
        isPrivate: row.is_private,
        startDate: row.start_date,
        durationDays: row.duration_days,
        trackingUnit: row.tracking_unit,
        totalCells: row.total_cells,
        gridCells: row.grid_cells,
        categories: row.categories,
        cellShape: row.cell_shape,
        cellSize: row.cell_size ?? 14,
        gridColumns: row.grid_columns ?? 20,
        createdAt: row.created_at,
    }
}

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Store ─────────────────────────────────────────────────────────────────────
// No `persist` — data lives in Supabase; store is just a client-side cache.

interface ChallengesState {
    challenges: Challenge[]
    activeChallengeId: string | null
    isFetching: boolean

    // Hydrate from server (called once on page mount)
    hydrate: (rows: ChallengeRow[]) => void

    // Optimistic add (server action called by the component)
    addChallengeOptimistic: (challenge: Challenge) => void
    // Replace a temp challenge with the real DB row
    confirmChallenge: (tempId: string, real: ChallengeRow) => void

    // Remove
    removeChallengeOptimistic: (id: string) => void

    setActiveChallenge: (id: string | null) => void

    // Grid — optimistic; caller is responsible for persisting to DB
    toggleCell: (challengeId: string, cellIndex: number) => GridCell[]
    // Bulk range toggle — sets all cells [lo..hi] to targetStatus
    setCellsRange: (challengeId: string, lo: number, hi: number, targetStatus: CellStatus, categoryId?: string) => GridCell[]
    setCellCategory: (challengeId: string, cellIndex: number, categoryId: string | undefined) => GridCell[]

    // Categories — optimistic; caller persists to DB
    addCategory: (challengeId: string, data: Omit<Category, 'id'>) => { categories: Category[]; category: Category }
    updateCategory: (challengeId: string, categoryId: string, updates: Partial<Omit<Category, 'id'>>) => { categories: Category[]; category: Category }
    deleteCategory: (challengeId: string, categoryId: string) => { categories: Category[]; gridCells: GridCell[] }
    logCategoryEntry: (challengeId: string, categoryId: string, amount: number) => Category[] // Keeping this for now to avoid breaking types too much, but it's unused

    // Style — optimistic; caller persists to DB
    updateChallengeStyle: (id: string, updates: Partial<Pick<Challenge, 'cellShape' | 'cellSize' | 'gridColumns'>>) => void
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
    challenges: [],
    activeChallengeId: null,
    isFetching: false,

    hydrate: (rows) => set({ challenges: rows.map(rowToChallenge) }),

    addChallengeOptimistic: (challenge) =>
        set((s) => ({ challenges: [challenge, ...s.challenges] })),

    confirmChallenge: (tempId, real) =>
        set((s) => ({
            challenges: s.challenges.map((c) =>
                c.id === tempId ? rowToChallenge(real) : c
            ),
        })),

    removeChallengeOptimistic: (id) =>
        set((s) => ({
            challenges: s.challenges.filter((c) => c.id !== id),
            activeChallengeId: s.activeChallengeId === id ? null : s.activeChallengeId,
        })),

    setActiveChallenge: (id) => set({ activeChallengeId: id }),

    // Returns the updated cells array so the caller can pass it to the server action
    toggleCell: (challengeId, cellIndex) => {
        let updatedCells: GridCell[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cells = c.gridCells.map((cell) =>
                    cell.index === cellIndex
                        ? { ...cell, status: (cell.status === 'completed' ? 'empty' : 'completed') as CellStatus }
                        : cell
                )
                updatedCells = cells
                return { ...c, gridCells: cells }
            }),
        }))
        return updatedCells
    },

    setCellsRange: (challengeId, lo, hi, targetStatus, categoryId) => {
        let updatedCells: GridCell[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cells = c.gridCells.map((cell) =>
                    cell.index >= lo && cell.index <= hi
                        ? { ...cell, status: targetStatus, categoryId: targetStatus === 'completed' ? categoryId : undefined }
                        : cell
                )
                updatedCells = cells
                return { ...c, gridCells: cells }
            }),
        }))
        return updatedCells
    },

    setCellCategory: (challengeId, cellIndex, categoryId) => {
        let updatedCells: GridCell[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cells = c.gridCells.map((cell) =>
                    cell.index === cellIndex ? { ...cell, categoryId } : cell
                )
                updatedCells = cells
                return { ...c, gridCells: cells }
            }),
        }))
        return updatedCells
    },

    addCategory: (challengeId, data) => {
        const category: Category = { ...data, id: uid() }
        let updatedCats: Category[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cats = [...c.categories, category]
                updatedCats = cats
                return { ...c, categories: cats }
            }),
        }))
        return { categories: updatedCats, category }
    },

    updateCategory: (challengeId, categoryId, updates) => {
        let updatedCats: Category[] = []
        let updatedCat: Category | undefined
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cats = c.categories.map((cat) => {
                    if (cat.id === categoryId) {
                        updatedCat = { ...cat, ...updates }
                        return updatedCat
                    }
                    return cat
                })
                updatedCats = cats
                return { ...c, categories: cats }
            }),
        }))
        return { categories: updatedCats, category: updatedCat! }
    },

    deleteCategory: (challengeId, categoryId) => {
        let updatedCats: Category[] = []
        let updatedCells: GridCell[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cats = c.categories.filter((cat) => cat.id !== categoryId)
                const cells = c.gridCells.map((cell) =>
                    cell.categoryId === categoryId ? { ...cell, categoryId: undefined } : cell
                )
                updatedCats = cats
                updatedCells = cells
                return { ...c, categories: cats, gridCells: cells }
            }),
        }))
        return { categories: updatedCats, gridCells: updatedCells }
    },

    logCategoryEntry: (challengeId, categoryId, amount) => {
        let updatedCats: Category[] = []
        set((s) => ({
            challenges: s.challenges.map((c) => {
                if (c.id !== challengeId) return c
                const cats = c.categories.map((cat) =>
                    cat.id === categoryId ? { ...cat, totalLogged: cat.totalLogged + amount } : cat
                )
                updatedCats = cats
                return { ...c, categories: cats }
            }),
        }))
        return updatedCats
    },

    updateChallengeStyle: (id, updates) =>
        set((s) => ({
            challenges: s.challenges.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
        })),
}))
