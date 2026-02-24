'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Note = {
    id: string
    user_id: string
    title: string
    content: string
    color: string | null
    is_pinned: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
}

export async function getNotes(): Promise<Note[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching notes:', error)
        return []
    }

    return data || []
}

export async function getArchivedNotes(): Promise<Note[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('is_archived', true)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching archived notes:', error)
        return []
    }

    return data || []
}

export async function createNote(noteData?: Partial<Pick<Note, 'title' | 'content' | 'color'>>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: user.id,
            title: noteData?.title || 'Untitled',
            content: noteData?.content || '',
            color: noteData?.color || null,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/notes')
    return { success: true, data }
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'color' | 'is_pinned' | 'is_archived'>>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/notes')
    return { success: true }
}

export async function deleteNote(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/notes')
    return { success: true }
}

export async function searchNotes(query: string): Promise<Note[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('is_archived', false)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error searching notes:', error)
        return []
    }

    return data || []
}
