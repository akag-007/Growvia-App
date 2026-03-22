'use client'

import { CalendarWidget } from '@/components/dashboard/calendar-widget'

interface DashboardSidebarProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
}

export function DashboardSidebar({ selectedDate, onDateSelect }: DashboardSidebarProps) {
    return (
        <div className="flex flex-col gap-6">
            <CalendarWidget selectedDate={selectedDate} onDateSelect={onDateSelect} />
        </div>
    )
}
