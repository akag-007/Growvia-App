'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createTaskSchema, updateTaskSchema, createCategorySchema } from '@app/shared'
import { z } from 'zod'

export async function getCategories() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data
}

export async function getTasks(date?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('tasks')
        .select(`
      *,
      categories (
        name,
        color
      )
    `)
        .order('created_at', { ascending: false })

    if (date) {
        query = query.eq('due_date', date)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return data
}

export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Parse form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const estimated_duration = formData.get('estimated_duration') ? parseInt(formData.get('estimated_duration') as string) : undefined
    const due_date = formData.get('due_date') as string || new Date().toISOString().split('T')[0]
    const priority = (formData.get('priority') as string) || null

    // Category handling
    let category_id = formData.get('category_id') as string
    const new_category_name = formData.get('new_category_name') as string
    const new_category_color = formData.get('new_category_color') as string

    // Logic: If new category details are present, create it first
    if (new_category_name && new_category_color) {
        const catValidation = createCategorySchema.safeParse({
            name: new_category_name,
            color: new_category_color
        })

        if (!catValidation.success) {
            return { error: 'Invalid category details' }
        }

        const { data: newCat, error: catError } = await supabase
            .from('categories')
            .insert({
                name: new_category_name,
                color: new_category_color,
                user_id: user.id
            })
            .select()
            .single()

        if (catError) {
            return { error: `Failed to create category: ${catError.message}` }
        }

        category_id = newCat.id
    }

    const rawData = {
        title,
        description,
        estimated_duration,
        category_id: category_id || null,
        due_date,
        priority: priority || null,
    }

    const { error } = await supabase
        .from('tasks')
        .insert({
            ...rawData,
            user_id: user.id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateTask(id: string, updates: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
}
