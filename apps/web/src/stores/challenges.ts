import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackingUnit = 'hours' | 'days' | 'weeks'
export type CellStatus = 'empty' | 'completed'

export interface GridCell {
    index: number
    status: CellStatus
    categoryId?: string   // which category this cell belongs to
}

export interface Category {
    id: string
    name: string
    color: string          // hex colour
    unit: 'minutes' | 'hours' | 'count'
    totalLogged: number    // minutes / hours / count depending on unit
}

export interface Challenge {
    id: string
    title: string
    description?: string
    type: 'personal' | 'community'
    isPrivate: boolean
    startDate: string      // ISO date string "YYYY-MM-DD"
    durationDays: number
    trackingUnit: TrackingUnit
    totalCells: number     // computed from durationDays + trackingUnit
    gridCells: GridCell[]
    categories: Category[]
    // Grid style
    cellShape: 'square' | 'circle' | 'rounded'
    cellSize: 'xs' | 'sm' | 'md'
    createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function computeTotalCells(durationDays: number, unit: TrackingUnit): number {
    if (unit === 'hours') return durationDays * 24
    if (unit === 'weeks') return Math.ceil(durationDays / 7)
    return durationDays
}

function buildCells(total: number): GridCell[] {
    return Array.from({ length: total }, (_, i) => ({ index: i, status: 'empty' as CellStatus }))
}

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ChallengesState {
    challenges: Challenge[]
    activeChallengeId: string | null

    // Challenge CRUD
    addChallenge: (data: Omit<Challenge, 'id' | 'gridCells' | 'totalCells' | 'categories' | 'createdAt'>) => void
    updateChallenge: (id: string, updates: Partial<Omit<Challenge, 'id' | 'gridCells' | 'categories'>>) => void
    deleteChallenge: (id: string) => void
    setActiveChallenge: (id: string | null) => void

    // Grid
    toggleCell: (challengeId: string, cellIndex: number) => void
    setCellCategory: (challengeId: string, cellIndex: number, categoryId: string | undefined) => void

    // Categories
    addCategory: (challengeId: string, data: Omit<Category, 'id' | 'totalLogged'>) => void
    updateCategory: (challengeId: string, categoryId: string, updates: Partial<Omit<Category, 'id'>>) => void
    deleteCategory: (challengeId: string, categoryId: string) => void
    logCategoryEntry: (challengeId: string, categoryId: string, amount: number) => void
}

export const useChallengesStore = create<ChallengesState>()(
    persist(
        (set, get) => ({
            challenges: [],
            activeChallengeId: null,

            addChallenge: (data) => {
                const total = computeTotalCells(data.durationDays, data.trackingUnit)
                const challenge: Challenge = {
                    ...data,
                    id: uid(),
                    totalCells: total,
                    gridCells: buildCells(total),
                    categories: [],
                    createdAt: new Date().toISOString(),
                }
                set((s) => ({ challenges: [challenge, ...s.challenges] }))
            },

            updateChallenge: (id, updates) => set((s) => ({
                challenges: s.challenges.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteChallenge: (id) => set((s) => ({
                challenges: s.challenges.filter((c) => c.id !== id),
                activeChallengeId: s.activeChallengeId === id ? null : s.activeChallengeId,
            })),

            setActiveChallenge: (id) => set({ activeChallengeId: id }),

            toggleCell: (challengeId, cellIndex) => set((s) => ({
                challenges: s.challenges.map((c) => {
                    if (c.id !== challengeId) return c
                    return {
                        ...c,
                        gridCells: c.gridCells.map((cell) =>
                            cell.index === cellIndex
                                ? { ...cell, status: cell.status === 'completed' ? 'empty' : 'completed' }
                                : cell
                        ),
                    }
                }),
            })),

            setCellCategory: (challengeId, cellIndex, categoryId) => set((s) => ({
                challenges: s.challenges.map((c) => {
                    if (c.id !== challengeId) return c
                    return {
                        ...c,
                        gridCells: c.gridCells.map((cell) =>
                            cell.index === cellIndex ? { ...cell, categoryId } : cell
                        ),
                    }
                }),
            })),

            addCategory: (challengeId, data) => {
                const category: Category = { ...data, id: uid(), totalLogged: 0 }
                set((s) => ({
                    challenges: s.challenges.map((c) =>
                        c.id === challengeId ? { ...c, categories: [...c.categories, category] } : c
                    ),
                }))
            },

            updateCategory: (challengeId, categoryId, updates) => set((s) => ({
                challenges: s.challenges.map((c) => {
                    if (c.id !== challengeId) return c
                    return {
                        ...c,
                        categories: c.categories.map((cat) =>
                            cat.id === categoryId ? { ...cat, ...updates } : cat
                        ),
                    }
                }),
            })),

            deleteCategory: (challengeId, categoryId) => set((s) => ({
                challenges: s.challenges.map((c) => {
                    if (c.id !== challengeId) return c
                    return {
                        ...c,
                        categories: c.categories.filter((cat) => cat.id !== categoryId),
                        // unlink cells that used this category
                        gridCells: c.gridCells.map((cell) =>
                            cell.categoryId === categoryId ? { ...cell, categoryId: undefined } : cell
                        ),
                    }
                }),
            })),

            logCategoryEntry: (challengeId, categoryId, amount) => set((s) => ({
                challenges: s.challenges.map((c) => {
                    if (c.id !== challengeId) return c
                    return {
                        ...c,
                        categories: c.categories.map((cat) =>
                            cat.id === categoryId ? { ...cat, totalLogged: cat.totalLogged + amount } : cat
                        ),
                    }
                }),
            })),
        }),
        {
            name: 'challenges-store',
        }
    )
)
