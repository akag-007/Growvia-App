import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { FloatingTimer } from '@/components/timer/floating-timer'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Topbar />

                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 p-6 lg:p-10 pb-32">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>

                <FloatingTimer />
            </div>
        </div>
    )
}
