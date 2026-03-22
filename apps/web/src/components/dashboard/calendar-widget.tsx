'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, addDays, isToday as isTodayDate } from 'date-fns'

interface CalendarWidgetProps {
    selectedDate: Date
    onDateSelect?: (date: Date) => void
}

export function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
    const monthLabel = format(selectedDate, 'MMMM')
    const yearLabel = format(selectedDate, 'yyyy')

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
    // Single-letter day labels to prevent squishing
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div
            className="rounded-3xl p-5 transition-all duration-300 w-full"
            style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px) saturate(140%)',
                WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                border: '1px solid rgba(255,255,255,0.11)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.13)',
            }}
        >
            {/* Header — split month and year on two lines for breathing room */}
            <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-white leading-tight">{monthLabel}</h3>
                <p className="text-xl font-bold text-white/70 leading-tight">{yearLabel}</p>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {weekDays.map((day, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-center text-[10px] font-semibold text-zinc-400 py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate)
                    const isToday = isTodayDate(date)
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth()

                    return (
                        <button
                            key={index}
                            onClick={() => isCurrentMonth && onDateSelect?.(date)}
                            disabled={!isCurrentMonth}
                            className="flex items-center justify-center aspect-square text-xs font-medium transition-all duration-150 rounded-lg"
                            style={{
                                color: isCurrentMonth
                                    ? isSelected || isToday ? '#fff' : 'rgba(255,255,255,0.75)'
                                    : 'rgba(255,255,255,0.18)',
                                cursor: isCurrentMonth ? 'pointer' : 'default',
                                ...(isToday && !isSelected && {
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.45)',
                                    fontWeight: 700,
                                }),
                                ...(isSelected && isToday && {
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    boxShadow: '0 0 14px rgba(139,92,246,0.55)',
                                    fontWeight: 700,
                                }),
                                ...(isSelected && !isToday && {
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    boxShadow: '0 0 10px rgba(234,88,12,0.4)',
                                    fontWeight: 700,
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
