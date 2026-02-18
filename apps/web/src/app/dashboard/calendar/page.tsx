import { Calendar } from 'lucide-react'

export default function CalendarPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <Calendar size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Calendar</h2>
            <p className="text-zinc-500 max-w-md">
                Visualize your schedule and sync with external calendars. Coming soon.
            </p>
        </div>
    )
}
