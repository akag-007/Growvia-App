'use client'

import { useState } from 'react'
import { TaskList } from '@/components/task/task-list'
import { CreateTaskForm } from '@/components/task/create-task-form'
import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

export default function ClientDashboard({ initialTasks, categories }: { initialTasks: any[], categories: any[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // In a real app with optimistic updates, we'd use useOptimistic here.
    // For now, we rely on Server Actions revalidating the page, so props will update.

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                    Tasks ({initialTasks.length})
                </h2>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Plus size={16} className="mr-2" />
                    New Task
                </button>
            </div>

            <TaskList tasks={initialTasks} />

            <AnimatePresence>
                {isCreateOpen && (
                    <CreateTaskForm
                        onClose={() => setIsCreateOpen(false)}
                        categories={categories}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
