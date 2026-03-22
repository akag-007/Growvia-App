'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Flame, Moon, Sun, Settings, LogOut, Layers2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { signOut } from '@/app/auth/actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Menu, MenuItem, HoveredLink } from '@/components/ui/navbar-menu'
import { useTheme } from 'next-themes'
import { useTransparency } from '@/components/theme/transparency-context'

interface TopbarProps {
    user: SupabaseUser | null
}

export function Topbar({ user }: TopbarProps) {
    const pathname = usePathname()
    const [active, setActive] = useState<string | null>(null)
    const { theme, setTheme } = useTheme()
    const { reduceTransparency, toggleTransparency } = useTransparency()

    const segments = pathname.split('/').filter(Boolean)
    const displaySegments = segments.filter(s => s !== 'dashboard')

    const handleSignOut = async () => {
        await signOut()
    }

    const initial = user?.email?.charAt(0).toUpperCase() || 'U'
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

    return (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
            {/* Reduce Transparency Toggle */}
            <button
                onClick={toggleTransparency}
                title={reduceTransparency ? 'Enable Transparency' : 'Reduce Transparency'}
                className="flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all border border-white/10 backdrop-blur-xl bg-white/5"
                style={{
                    color: reduceTransparency ? 'rgba(165,170,255,0.9)' : 'rgba(255,255,255,0.5)',
                }}
            >
                <Layers2 size={18} />
            </button>

                <Menu setActive={setActive} className="px-3 py-2.5 space-x-0 rounded-2xl border border-white/10 shadow-lg shadow-black/20 backdrop-blur-xl bg-white/5">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5 px-3 py-1 cursor-default" title="Streak">
                        <Flame size={20} className="text-orange-500" fill="currentColor" />
                        <span className="text-sm font-bold text-orange-400">12</span>
                    </div>

                    {/* Theme Toggle */}
                    <div
                        className="flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                    >
                        <div className="relative w-5 h-5">
                            <Sun size={20} className="absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon size={20} className="absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                    </div>

                    {/* Notifications */}
                    <MenuItem
                        setActive={setActive}
                        active={active}
                        item="Notifications"
                        element={
                            <div className="p-2.5 rounded-xl transition-all" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                <Bell size={20} />
                            </div>
                        }
                    >
                        <div className="flex flex-col gap-3 p-3 w-64">
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Notifications</p>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">New Task Assigned</span>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Just now</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">Project Update</span>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>2 hours ago</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/10 text-center">
                                <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
                            </div>
                        </div>
                    </MenuItem>

                    {/* User Account */}
                    <MenuItem
                        setActive={setActive}
                        active={active}
                        item="Account"
                        element={
                            <div className="p-1 rounded-xl transition-all">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                    {initial}
                                </div>
                            </div>
                        }
                    >
                        <div className="flex flex-col space-y-3 text-sm w-52 p-3">
                            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {initial}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-white">{displayName}</span>
                                    <span className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
                                </div>
                            </div>
                            <HoveredLink href="/dashboard/settings">
                                <span className="flex items-center gap-2 py-1 text-white/80 hover:text-white">
                                    <Settings size={16} /> Settings
                                </span>
                            </HoveredLink>
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 py-1 text-left text-red-400 hover:text-red-300 transition-colors"
                            >
                                <LogOut size={16} />
                                Sign out
                            </button>
                        </div>
                    </MenuItem>
                </Menu>
        </div>
    )
}
