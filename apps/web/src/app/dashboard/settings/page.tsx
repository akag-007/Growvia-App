import { Settings } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Settings</h2>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                            JD
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">John Doe</h3>
                            <p className="text-sm text-zinc-500">Pro Member</p>
                        </div>
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-4">Preferences</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Dark Mode</span>
                                <div className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 relative cursor-pointer">
                                    <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transform translate-x-5 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
