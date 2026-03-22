'use client'

export function DashboardRightSidebar() {
    return (
        <div className="flex flex-col gap-6">
            {/* Score/Points Section - Circular */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse-glow"
                        style={{
                            background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.4) 0%, transparent 70%)',
                        }}
                    />
                    <span className="relative text-xs font-semibold text-white mb-1">Score</span>
                    <span className="relative text-3xl font-bold text-indigo-400 group-hover:scale-110 transition-all">0</span>
                </div>
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse-glow"
                        style={{
                            background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.4) 0%, transparent 70%)',
                        }}
                    />
                    <span className="relative text-xs font-semibold text-white mb-1">Points</span>
                    <span className="relative text-3xl font-bold text-emerald-400 group-hover:scale-110 transition-all">0</span>
                </div>
            </div>

            {/* Weekly Momentum Graph - More rectangular and smaller */}
            <div
                className="transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    height: '180px',
                }}
            >
                <h3 className="text-sm font-semibold text-white mb-3 px-4 pt-4">Weekly Momentum Graph</h3>
                <div className="rounded-2xl p-4 flex items-center justify-center"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        minHeight: '100px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                    <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-1">Daily Score Tracking</p>
                        <p className="text-sm text-zinc-400">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Longer Tasks/Projects - Longer rectangle */}
            <div
                className="transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex-1"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    minHeight: '280px',
                }}
            >
                <h3 className="text-sm font-semibold text-white mb-4 px-4 pt-4">Longer Tasks/Projects</h3>
                <div className="rounded-2xl p-4 flex items-center justify-center"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        minHeight: '180px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                    <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-2">Extended Task Management</p>
                        <p className="text-sm text-zinc-400">Coming Soon</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
