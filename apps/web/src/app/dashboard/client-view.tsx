'use client'

import { useState, useMemo, useEffect } from 'react'
import { TaskList } from '@/components/task/task-list'
import { CreateTaskForm } from '@/components/task/create-task-form'
import { EisenhowerMatrix } from '@/components/task/eisenhower-matrix'
import { DateNavigator } from '@/components/dashboard/date-navigator'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardRightSidebar } from '@/components/dashboard/dashboard-right-sidebar'
import { TaskFilters } from '@/components/dashboard/task-filters'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, isSameDay, parseISO } from 'date-fns'

type ViewMode = 'list' | 'matrix'

export default function ClientDashboard({ initialTasks, categories, user }: { initialTasks: any[], categories: any[], user?: { user_metadata?: { full_name?: string } } }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [typedName, setTypedName] = useState('')

    // Typing effect for welcome message
    useEffect(() => {
        const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
        let index = 0

        const interval = setInterval(() => {
            setTypedName(displayName.substring(0, index + 1))
            index++

            if (index >= displayName.length) {
                clearInterval(interval)
            }
        }, 100) // Typing speed

        return () => clearInterval(interval)
    }, [user])

    const welcomeText = `Welcome, ${typedName}`

    // Filter tasks by selected date
    const filteredTasks = useMemo(() => {
        return initialTasks.filter(task => {
            if (!task.due_date) return false

            const taskDate = parseISO(task.due_date)
            return isSameDay(taskDate, selectedDate)
        })
    }, [initialTasks, selectedDate])

    // Filter tasks by category
    const categoryFilteredTasks = useMemo(() => {
        if (!selectedCategory) return filteredTasks
        return filteredTasks.filter(task => task.categories?.name === selectedCategory)
    }, [filteredTasks, selectedCategory])

    // Get unique categories from filtered tasks
    const taskCategories = useMemo(() => {
        return filteredTasks.map(task => task.categories?.name).filter(Boolean)
    }, [filteredTasks])

    return (
        <>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-white">{welcomeText}</h1>
            </div>

            {/* 3-Column Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar - 2 columns */}
                <div className="lg:col-span-2">
                    <DashboardSidebar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </div>

                {/* Main Content - 7 columns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Date Selector - Centered */}
                    <div className="flex justify-center">
                        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    </div>

                    {/* View Toggle and Filters */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            {/* View toggle */}
                            <div className="flex items-center rounded-xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
                                    style={{
                                        background: viewMode === 'list' ? 'rgba(99,102,241,0.25)' : 'transparent',
                                        color: viewMode === 'list' ? '#818cf8' : '#9ca3af',
                                    }}
                                >
                                    <List size={15} />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('matrix')}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
                                    style={{
                                        background: viewMode === 'matrix' ? 'rgba(99,102,241,0.25)' : 'transparent',
                                        color: viewMode === 'matrix' ? '#818cf8' : '#9ca3af',
                                    }}
                                >
                                    <LayoutGrid size={15} />
                                    Matrix
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <h2 className="text-sm text-zinc-400">
                                    {categoryFilteredTasks.length} task{categoryFilteredTasks.length !== 1 ? 's' : ''}
                                </h2>
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-all hover:scale-105 hover:shadow-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: '#fff',
                                        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                                    }}
                                >
                                    <Plus size={16} className="mr-2" />
                                    New Task
                                </button>
                            </div>
                        </div>

                        {/* Task Filters */}
                        <TaskFilters
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            taskCategories={taskCategories}
                        />
                    </div>

                    {/* Task List */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {viewMode === 'list' ? (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <TaskList tasks={categoryFilteredTasks} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="matrix"
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <EisenhowerMatrix tasks={categoryFilteredTasks} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Sidebar - 3 columns */}
                <div className="lg:col-span-3">
                    <DashboardRightSidebar />
                </div>
            </div>

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
