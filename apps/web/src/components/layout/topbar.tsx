'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Flame, Moon, Sun, Settings, LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { signOut } from '@/app/auth/actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Menu, MenuItem, HoveredLink } from '@/components/ui/navbar-menu'
import { useTheme } from 'next-themes'

interface TopbarProps {
    user: SupabaseUser | null
}

export function Topbar({ user }: TopbarProps) {
    const pathname = usePathname()
    const [active, setActive] = useState<string | null>(null)
    const { theme, setTheme } = useTheme()

    const segments = pathname.split('/').filter(Boolean)
    const displaySegments = segments.filter(s => s !== 'dashboard')

    const handleSignOut = async () => {
        await signOut()
    }

    const initial = user?.email?.charAt(0).toUpperCase() || 'U'
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 pt-3">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-200">Home</Link>
                {displaySegments.map((segment) => (
                    <div key={segment} className="flex items-center gap-2">
                        <span>/</span>
                        <span className="capitalize">{segment}</span>
                    </div>
                ))}
            </div>

            {/* Right: Floating Icon Actions */}
            <div className="flex items-center mr-10">
                <Menu setActive={setActive} className="px-3 py-2.5 space-x-0 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl bg-zinc-50/60 dark:bg-zinc-950/60">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5 px-3 py-1 cursor-default" title="Streak">
                        <Flame size={20} className="text-orange-500" fill="currentColor" />
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">12</span>
                    </div>

                    {/* Theme Toggle */}
                    <div
                        className="flex items-center justify-center p-2.5 rounded-xl cursor-pointer text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all"
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
                            <div className="p-2.5 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all">
                                <Bell size={20} />
                            </div>
                        }
                    >
                        <div className="flex flex-col gap-3 p-3 w-64">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notifications</p>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">New Task Assigned</span>
                                    <span className="text-xs text-zinc-500">Just now</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Project Update</span>
                                    <span className="text-xs text-zinc-500">2 hours ago</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                                <Link href="#" className="text-xs text-indigo-500 hover:text-indigo-600">View all</Link>
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
                            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {initial}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900 dark:text-white">{displayName}</span>
                                    <span className="text-xs text-zinc-500 truncate max-w-[140px]">{user?.email}</span>
                                </div>
                            </div>
                            <HoveredLink href="/dashboard/settings">
                                <span className="flex items-center gap-2 py-1">
                                    <Settings size={16} /> Settings
                                </span>
                            </HoveredLink>
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 py-1 text-left text-red-600 hover:text-red-700 transition-colors"
                            >
                                <LogOut size={16} />
                                Sign out
                            </button>
                        </div>
                    </MenuItem>
                </Menu>
            </div>
        </header>
    )
}
