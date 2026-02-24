import { create } from 'zustand'
import type { Revisit } from '@/actions/revisits'
import { isBefore, isToday, parseISO, startOfDay } from 'date-fns'

interface RevisitsState {
    revisits: Revisit[]
    isFetching: boolean

    // Actions
    setRevisits: (revisits: Revisit[]) => void
    setIsFetching: (fetching: boolean) => void

    // Optimistic helpers
    addRevisit: (revisit: Revisit) => void
    updateRevisitLocal: (id: string, updates: Partial<Revisit>) => void
    removeRevisit: (id: string) => void

    // Selectors
    getDueToday: () => Revisit[]
    getUpcoming: () => Revisit[]
    getMastered: () => Revisit[]
}

export const useRevisitsStore = create<RevisitsState>((set, get) => ({
    revisits: [],
    isFetching: false,

    setRevisits: (revisits) => set({ revisits }),
    setIsFetching: (fetching) => set({ isFetching: fetching }),

    addRevisit: (revisit) => set((state) => ({
        revisits: [revisit, ...state.revisits]
    })),

    updateRevisitLocal: (id, updates) => set((state) => ({
        revisits: state.revisits.map((r) => r.id === id ? { ...r, ...updates } : r)
    })),

    removeRevisit: (id) => set((state) => ({
        revisits: state.revisits.filter((r) => r.id !== id)
    })),

    getDueToday: () => {
        const today = startOfDay(new Date());
        return get().revisits.filter((r) => {
            if (r.status !== 'active') return false;
            const reviewDate = startOfDay(parseISO(r.next_review_at));
            return isToday(reviewDate) || isBefore(reviewDate, today);
        });
    },

    getUpcoming: () => {
        const today = startOfDay(new Date());
        return get().revisits.filter((r) => {
            if (r.status !== 'active') return false;
            const reviewDate = startOfDay(parseISO(r.next_review_at));
            return !isToday(reviewDate) && !isBefore(reviewDate, today);
        }).sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
    },

    getMastered: () => {
        return get().revisits.filter((r) => r.status === 'done');
    }
}))
