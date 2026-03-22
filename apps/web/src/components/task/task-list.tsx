'use client'

import { TaskCard } from './task-card'

export function TaskList({ tasks }: { tasks: any[] }) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-2xl">📝</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No tasks yet</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Get started by creating a new task.</p>
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
