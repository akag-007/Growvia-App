'use client'

import { useMemo } from 'react'

interface TaskFiltersProps {
    categories: any[]
    selectedCategory: string | null
    onCategoryChange: (category: string | null) => void
    taskCategories: string[]
}

export function TaskFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    taskCategories,
}: TaskFiltersProps) {
    // Get unique categories from tasks on current day
    const availableCategories = useMemo(() => {
        const uniqueCategories = [...new Set(taskCategories)]
        return categories.filter(cat => uniqueCategories.includes(cat.name))
    }, [categories, taskCategories])

    const handleFilterClick = (categoryName: string | null) => {
        onCategoryChange(categoryName === selectedCategory ? null : categoryName)
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => handleFilterClick(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                    background: selectedCategory === null
                        ? 'linear-gradient(135deg, #f97316, #ea580c)'
                        : 'rgba(255,255,255,0.05)',
                    color: selectedCategory === null ? '#fff' : '#9ca3af',
                }}
            >
                All Tasks
            </button>

            {availableCategories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => handleFilterClick(category.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                    style={{
                        background: selectedCategory === category.name
                            ? `${category.color}20`
                            : 'rgba(255,255,255,0.05)',
                        color: selectedCategory === category.name
                            ? category.color
                            : '#9ca3af',
                    }}
                >
                    {category.name}
                </button>
            ))}
        </div>
    )
}
