'use client'

import { useState } from 'react'
import { TaskList } from '@/components/task/task-list'
import { CreateTaskForm } from '@/components/task/create-task-form'
import { EisenhowerMatrix } from '@/components/task/eisenhower-matrix'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type ViewMode = 'list' | 'matrix'

export default function ClientDashboard({ initialTasks, categories }: { initialTasks: any[], categories: any[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('list')

    return (
        <>
            <div className="mb-6 flex justify-between items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center rounded-lg overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
                        style={{
                            background: viewMode === 'list' ? 'rgba(99,102,241,0.2)' : 'transparent',
                            color: viewMode === 'list' ? '#818cf8' : '#6b7280',
                        }}
                    >
                        <List size={14} />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('matrix')}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
                        style={{
                            background: viewMode === 'matrix' ? 'rgba(99,102,241,0.2)' : 'transparent',
                            color: viewMode === 'matrix' ? '#818cf8' : '#6b7280',
                        }}
                    >
                        <LayoutGrid size={14} />
                        Matrix
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <h2 className="text-sm text-zinc-500">
                        {initialTasks.length} task{initialTasks.length !== 1 ? 's' : ''}
                    </h2>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:brightness-110"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                        }}
                    >
                        <Plus size={16} className="mr-1.5" />
                        New Task
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TaskList tasks={initialTasks} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="matrix"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <EisenhowerMatrix tasks={initialTasks} />
                    </motion.div>
                )}
            </AnimatePresence>

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
