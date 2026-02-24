import { create } from 'zustand'
import type { Note } from '@/actions/notes'

type ViewMode = 'list' | 'grid'

interface NotesState {
    notes: Note[]
    activeNoteId: string | null
    searchQuery: string
    viewMode: ViewMode
    isSaving: boolean
    isEditorPreview: boolean

    // Actions
    setNotes: (notes: Note[]) => void
    setActiveNoteId: (id: string | null) => void
    setSearchQuery: (query: string) => void
    setViewMode: (mode: ViewMode) => void
    setIsSaving: (saving: boolean) => void
    setIsEditorPreview: (preview: boolean) => void

    // Derived helpers
    getActiveNote: () => Note | undefined
    getFilteredNotes: () => { pinned: Note[]; unpinned: Note[] }

    // Optimistic updates
    addNote: (note: Note) => void
    removeNote: (id: string) => void
    updateNoteLocal: (id: string, updates: Partial<Note>) => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],
    activeNoteId: null,
    searchQuery: '',
    viewMode: 'list',
    isSaving: false,
    isEditorPreview: false,

    setNotes: (notes) => set({ notes }),
    setActiveNoteId: (id) => set({ activeNoteId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setIsSaving: (saving) => set({ isSaving: saving }),
    setIsEditorPreview: (preview) => set({ isEditorPreview: preview }),

    getActiveNote: () => {
        const { notes, activeNoteId } = get()
        return notes.find((n) => n.id === activeNoteId)
    },

    getFilteredNotes: () => {
        const { notes, searchQuery } = get()
        const q = searchQuery.toLowerCase()
        const filtered = q
            ? notes.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q)
            )
            : notes

        return {
            pinned: filtered.filter((n) => n.is_pinned),
            unpinned: filtered.filter((n) => !n.is_pinned),
        }
    },

    addNote: (note) =>
        set((state) => ({
            notes: [note, ...state.notes],
            activeNoteId: note.id,
        })),

    removeNote: (id) =>
        set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),

    updateNoteLocal: (id, updates) =>
        set((state) => ({
            notes: state.notes.map((n) =>
                n.id === id ? { ...n, ...updates } : n
            ),
        })),
}))
