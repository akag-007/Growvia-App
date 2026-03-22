import { getTasks, getCategories } from '@/actions/task'
import { TaskList } from '@/components/task/task-list'
import { CreateTaskForm } from '@/components/task/create-task-form'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ClientDashboard from './client-view'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const tasks = await getTasks() || []
    const categories = await getCategories() || []

    return (
        <ClientDashboard initialTasks={tasks} categories={categories} />
    )
}
