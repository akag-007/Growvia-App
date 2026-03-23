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

function logSupabaseError(context: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
    console.error(
        context,
        error.message ?? '(no message)',
        error.code ? `code=${error.code}` : '',
        error.details ? `details=${error.details}` : '',
        error.hint ? `hint=${error.hint}` : '',
    )
}

export async function getTasks(date?: string) {
    const supabase = await createClient()

    // Nested `projects (...)` requires a registered FK in PostgREST; if migrations are missing it fails.
    // Fetch tasks + categories, then attach project rows in a second query.
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

    const { data: tasks, error } = await query

    if (error) {
        logSupabaseError('Error fetching tasks:', error)
        return []
    }

    if (!tasks?.length) {
        return tasks ?? []
    }

    // Instead of filtering tasks based on project_id and fetching projects separately,
    // we use a left join via task_project_links, but since we are replacing the old approach
    // we need to re-query the join table or join in via PostgREST if FKs exist.
    // Let's assume the migration adds the FKs.
    // "projects" is what we attach. 
    // In Supabase we can do: `..., task_project_links( project_id, projects(id, title, color) )` 
    // For now, I'll fetch links manually as we did projects before.
    const taskIds = tasks.map((t) => t.id)
    if (taskIds.length === 0) return tasks
    
    const { data: links, error: linksError } = await supabase
        .from('task_project_links')
        .select(`
            task_id,
            projects (id, title, color)
        `)
        .in('task_id', taskIds)

    if (linksError) {
        logSupabaseError('Error fetching task projects:', linksError)
        return tasks.map(t => ({ ...t, projects: [] }))
    }

    const linksByTask = new Map()
    for (const link of links || []) {
        if (!linksByTask.has(link.task_id)) {
            linksByTask.set(link.task_id, [])
        }
        if (link.projects) {
            linksByTask.get(link.task_id).push(link.projects)
        }
    }

    return tasks.map((t) => ({
        ...t,
        projects: linksByTask.get(t.id) || [],
    }))
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
        // project_id is removed from here
    }

    const { data: insertedTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
            ...rawData,
            user_id: user.id
        })
        .select('id')
        .single()
        
    if (insertError) {
        return { error: insertError.message }
    }


    // Now insert links if any project_ids were provided
    // By default the prompt doesn't ask for project_ids in form, but just in case:
    
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

export async function linkTaskToProject(task_id: string, project_id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('task_project_links')
        .insert({ task_id, project_id, user_id: user.id })

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: true }
}

export async function unlinkTaskFromProject(task_id: string, project_id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('task_project_links')
        .delete()
        .match({ task_id, project_id })

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: true }
}
