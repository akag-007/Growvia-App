'use client'

import { TaskCard } from './task-card'

export function TaskList({ tasks }: { tasks: any[] }) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                    <span className="text-2xl">📝</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">No tasks yet</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Get started by creating a new task.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    )
}
