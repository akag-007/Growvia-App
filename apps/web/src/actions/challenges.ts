'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeTotalCells } from '@/stores/challenges'
import type { TrackingUnit, GridCell, Category } from '@/stores/challenges'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChallengeRow = {
    id: string
    user_id: string
    title: string
    description: string | null
    type: 'personal' | 'community'
    is_private: boolean
    start_date: string
    duration_days: number
    tracking_unit: TrackingUnit
    total_cells: number
    grid_cells: GridCell[]
    categories: Category[]
    cell_shape: 'square' | 'rounded' | 'circle'
    cell_size: 'xs' | 'sm' | 'md'
    created_at: string
    updated_at: string
}

function buildCells(total: number): GridCell[] {
    return Array.from({ length: total }, (_, i) => ({ index: i, status: 'empty' as const }))
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getChallenges(): Promise<ChallengeRow[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) { console.error('getChallenges error:', error); return [] }
    return data as ChallengeRow[]
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateChallengeInput = {
    title: string
    description?: string
    type: 'personal' | 'community'
    isPrivate: boolean
    startDate: string
    durationDays: number
    trackingUnit: TrackingUnit
    cellShape: 'square' | 'rounded' | 'circle'
    cellSize: 'xs' | 'sm' | 'md'
}

export async function createChallenge(input: CreateChallengeInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const total = computeTotalCells(input.durationDays, input.trackingUnit)

    const { data, error } = await supabase
        .from('challenges')
        .insert({
            user_id: user.id,
            title: input.title,
            description: input.description ?? null,
            type: input.type,
            is_private: input.isPrivate,
            start_date: input.startDate,
            duration_days: input.durationDays,
            tracking_unit: input.trackingUnit,
            total_cells: total,
            grid_cells: buildCells(total),
            categories: [],
            cell_shape: input.cellShape,
            cell_size: input.cellSize,
        })
        .select()
        .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/challenges')
    return { success: true, data: data as ChallengeRow }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteChallenge(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/challenges')
    return { success: true }
}

// ─── Update style ─────────────────────────────────────────────────────────────

export async function updateChallengeStyle(
    id: string,
    patch: { cell_shape?: 'square' | 'rounded' | 'circle'; cell_size?: 'xs' | 'sm' | 'md' }
) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('challenges')
        .update(patch)
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

// ─── Toggle cell ──────────────────────────────────────────────────────────────

export async function toggleGridCell(challengeId: string, cells: GridCell[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('challenges')
        .update({ grid_cells: cells })
        .eq('id', challengeId)

    if (error) return { error: error.message }
    return { success: true }
}

// ─── Set cell category ────────────────────────────────────────────────────────

export async function setCellCategoryDb(challengeId: string, cells: GridCell[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('challenges')
        .update({ grid_cells: cells })
        .eq('id', challengeId)

    if (error) return { error: error.message }
    return { success: true }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function saveCategoriesDb(challengeId: string, categories: Category[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('challenges')
        .update({ categories })
        .eq('id', challengeId)

    if (error) return { error: error.message }
    return { success: true }
}

// ─── Save full grid + categories (bulk sync) ──────────────────────────────────

export async function syncChallengeData(
    challengeId: string,
    patch: { grid_cells?: GridCell[]; categories?: Category[] }
) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('challenges')
        .update(patch)
        .eq('id', challengeId)

    if (error) return { error: error.message }
    return { success: true }
}
