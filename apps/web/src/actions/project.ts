'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id, title, description, color, status, target_deadline, estimated_total_duration,
            task_project_links (
                task_id,
                tasks (id, title, actual_duration, is_completed, progress, estimated_duration)
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    // Compute progress for each project
    return projects.map((p) => {
        let totalTimeSpent = 0
        const linkedTasks = p.task_project_links?.map((link: any) => {
            const t = link.tasks
            
            const loggedSeconds = t.actual_duration || 0
            let progressSeconds = 0
            
            if (t.estimated_duration && t.progress) {
                progressSeconds = (t.estimated_duration * 60) * (t.progress / 100)
            }
            
            totalTimeSpent += (loggedSeconds + progressSeconds)
            
            return t
        }) || []

        let completionPercentage = 0
        if (p.estimated_total_duration && p.estimated_total_duration > 0) {
            // duration is in seconds, estimated in minutes
            const estSeconds = p.estimated_total_duration * 60
            completionPercentage = Math.min((totalTimeSpent / estSeconds) * 100, 100)
        }

        return {
            ...p,
            linkedTasks,
            totalTimeSpent,
            completionPercentage
        }
    })
}

export async function createProject(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const color = formData.get('color') as string
    const target_deadline = formData.get('target_deadline') as string || null
    const estimated_total_duration = formData.get('estimated_total_duration') as string || null

    if (!title) return { error: 'Title is required' }

    const rawData = {
        title,
        description: description || null,
        color: color || '#8b5cf6',
        target_deadline,
        estimated_total_duration: estimated_total_duration ? parseInt(estimated_total_duration) : null,
        user_id: user.id
    }

    const { error } = await supabase
        .from('projects')
        .insert(rawData)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateProject(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const color = formData.get('color') as string
    const target_deadline = formData.get('target_deadline') as string || null
    const estimated_total_duration = formData.get('estimated_total_duration') as string || null

    if (!title) return { error: 'Title is required' }

    const updateData = {
        title,
        description: description || null,
        color: color || '#8b5cf6',
        target_deadline,
        estimated_total_duration: estimated_total_duration ? parseInt(estimated_total_duration) : null,
    }

    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    return { success: true }
}
