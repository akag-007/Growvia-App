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
        <div className="min-h-screen">
            <header className="mb-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Today's Focus</h1>
                    <p className="text-sm mt-1 font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <ClientDashboard initialTasks={tasks} categories={categories} />
            </main>
        </div>
    )
}
