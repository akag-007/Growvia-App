import { FileText } from 'lucide-react'

export default function NotesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <FileText size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Notes</h2>
            <p className="text-zinc-500 max-w-md">
                Capture your thoughts and ideas in one place. Coming soon.
            </p>
        </div>
    )
}
