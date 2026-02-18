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
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <header className="bg-white shadow-sm dark:bg-zinc-900 border-b dark:border-zinc-800">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Today's Focus</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-500">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <ClientDashboard initialTasks={tasks} categories={categories} />
            </main>
        </div>
    )
}
