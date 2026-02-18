import { Layers } from 'lucide-react'

export default function ProjectsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Layers size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Projects</h2>
            <p className="text-zinc-500 max-w-md">
                Manage your long-term goals and break them down into actionable tasks. Coming soon.
            </p>
        </div>
    )
}
