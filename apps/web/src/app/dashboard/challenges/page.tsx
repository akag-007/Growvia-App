import { Target } from 'lucide-react'

export default function ChallengesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <Target size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Challenges</h2>
            <p className="text-zinc-500 max-w-md">
                Join monthly challenges and compete with others. Coming soon.
            </p>
        </div>
    )
}
