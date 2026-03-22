'use client'

export function DashboardRightSidebar() {
    return (
        <div className="flex flex-col gap-4">
            {/* Score/Points Section — reduced to 80px circles */}
            <div className="grid grid-cols-2 gap-3 place-items-center">
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '100px',
                        height: '100px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.10) 100%)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(99,102,241,0.2)',
                    }}
                >
                    <span className="relative text-[11px] font-semibold text-white/70 mb-0.5">Score</span>
                    <span className="relative text-2xl font-bold text-indigo-300 group-hover:scale-110 transition-all">0</span>
                </div>
                <div
                    className="relative flex flex-col items-center justify-center rounded-full transition-all duration-500 hover:scale-110 hover:shadow-2xl group"
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.10) 100%)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                        boxShadow: '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(16,185,129,0.2)',
                    }}
                >
                    <span className="relative text-[11px] font-semibold text-white/70 mb-0.5">Points</span>
                    <span className="relative text-2xl font-bold text-emerald-300 group-hover:scale-110 transition-all">0</span>
                </div>
            </div>

            {/* Weekly Momentum Graph */}
            <div
                className="transition-all duration-300 hover:scale-[1.02]"
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(24px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                    height: '160px',
                }}
            >
                <h3 className="text-xs font-semibold text-white/80 px-4 pt-4 mb-2">Weekly Momentum</h3>
                <div className="flex items-center justify-center" style={{ minHeight: '100px' }}>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 mb-1">Daily Score Tracking</p>
                        <p className="text-xs text-zinc-400">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Longer Tasks/Projects */}
            <div
                className="transition-all duration-300 hover:scale-[1.02] flex-1"
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(24px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                    minHeight: '240px',
                }}
            >
                <h3 className="text-xs font-semibold text-white/80 px-4 pt-4 mb-2">Longer Tasks/Projects</h3>
                <div className="flex items-center justify-center" style={{ minHeight: '160px' }}>
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 mb-1">Extended Task Management</p>
                        <p className="text-xs text-zinc-400">Coming Soon</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
