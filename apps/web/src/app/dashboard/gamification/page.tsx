import { Trophy } from 'lucide-react'

export default function GamificationPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                <Trophy size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Gamification</h2>
            <p className="text-zinc-500 max-w-md">
                Track your XP, streaks, and level up your productivity. Coming soon.
            </p>
        </div>
    )
}
