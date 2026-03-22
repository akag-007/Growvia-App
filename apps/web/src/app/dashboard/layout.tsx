import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { FloatingTimer } from '@/components/timer/floating-timer'
import { SpatialBackground } from '@/components/layout/spatial-background'
import { TransparencyProvider } from '@/components/theme/transparency-context'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <TransparencyProvider>
            {/* Layer 0: Spatial background (fixed, behind everything) */}
            <SpatialBackground />

            {/* Layer 1: App shell (relative, above background) */}
            <div className="relative z-10 flex h-screen w-full overflow-hidden">
                <Sidebar />

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <Topbar user={user} />
                    <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pt-20 lg:pt-20 p-6 lg:p-10 pb-32">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </main>

                    <FloatingTimer />
                </div>
            </div>
        </TransparencyProvider>
    )
}
