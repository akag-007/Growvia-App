'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, addDays, isToday as isTodayDate } from 'date-fns'

interface CalendarWidgetProps {
    selectedDate: Date
    onDateSelect?: (date: Date) => void
}

export function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
    const currentMonth = format(selectedDate, 'MMMM yyyy')

    const generateCalendarDays = () => {
        const startOfCurrentMonth = startOfMonth(selectedDate)
        const endOfCurrentMonth = endOfMonth(selectedDate)
        const startOfCalendar = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 })
        const endOfCalendar = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 })

        const days = []
        let day = startOfCalendar

        while (day <= endOfCalendar) {
            days.push(new Date(day))
            day = addDays(day, 1)
        }

        return days
    }

    const calendarDays = generateCalendarDays()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>
            {/* Header with month/year */}
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">{currentMonth}</h3>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-0.5 mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-bold text-zinc-400 py-1.5"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate)
                    const isToday = isTodayDate(date)
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth()

                    return (
                        <button
                            key={index}
                            onClick={() => isCurrentMonth && onDateSelect?.(date)}
                            disabled={!isCurrentMonth}
                            className={`
                                relative w-full aspect-square flex items-center justify-center rounded-lg text-base font-bold transition-all duration-200
                                ${isCurrentMonth ? 'text-white' : 'text-zinc-600'}
                                ${isSelected ? 'scale-105' : 'hover:scale-100'}
                                ${!isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            style={{
                                ...(isToday && !isSelected && {
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    boxShadow: '0 0 12px rgba(99,102,241,0.4), inset 0 1.5px solid rgba(255,255,255,0.3)',
                                }),
                                ...(isSelected && isToday && {
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    boxShadow: '0 0 16px rgba(139,92,246,0.5), inset 0 1.5px solid rgba(255,255,255,0.4)',
                                }),
                                ...(isSelected && !isToday && {
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    boxShadow: '0 0 12px rgba(234,88,12,0.4), inset 0 1.5px solid rgba(255,255,255,0.3)',
                                }),
                            }}
                            aria-label={format(date, 'MMMM d, yyyy')}
                        >
                            {format(date, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
