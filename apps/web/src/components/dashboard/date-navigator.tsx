'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'

interface DateNavigatorProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
    const handlePreviousDay = () => {
        onDateChange(subDays(selectedDate, 1))
    }

    const handleNextDay = () => {
        onDateChange(addDays(selectedDate, 1))
    }

    const handleGoToToday = () => {
        onDateChange(new Date())
    }

    const isToday = () => {
        const today = new Date()
        return selectedDate.getDate() === today.getDate() &&
               selectedDate.getMonth() === today.getMonth() &&
               selectedDate.getFullYear() === today.getFullYear()
    }

    return (
        <div className="flex items-center justify-center gap-4 mx-auto rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                width: 'fit-content',
                maxWidth: '500px',
            }}>
            <button
                onClick={handlePreviousDay}
                className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/10"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
                aria-label="Previous day"
            >
                <ChevronLeft size={18} className="text-zinc-300" />
            </button>

            <button
                onClick={handleGoToToday}
                className="text-center transition-all duration-200 hover:scale-105"
            >
                <div className="flex items-center justify-center gap-2 px-4">
                    <span className="text-lg font-bold text-white">
                        {format(selectedDate, 'EEEE')}
                    </span>
                    <span className="text-sm text-zinc-400">
                        {format(selectedDate, 'MMMM d')}
                    </span>
                </div>
            </button>

            <button
                onClick={handleNextDay}
                className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/10"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
                aria-label="Next day"
            >
                <ChevronRight size={18} className="text-zinc-300" />
            </button>
        </div>
    )
}
