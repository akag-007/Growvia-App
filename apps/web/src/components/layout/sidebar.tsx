'use client'

import React, { useState } from 'react'
import { Sidebar as SidebarContainer, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import {
    LayoutDashboard,
    Calendar,
    Trophy,
    Target,
    FileText,
    Settings,
    Layers,
    RotateCcw
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function Sidebar() {
    const [open, setOpen] = useState(false)

    const links = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: (
                <LayoutDashboard className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Projects',
            href: '/dashboard/projects',
            icon: (
                <Layers className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Calendar',
            href: '/dashboard/calendar',
            icon: (
                <Calendar className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Gamification',
            href: '/dashboard/gamification',
            icon: (
                <Trophy className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Challenges',
            href: '/dashboard/challenges',
            icon: (
                <Target className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Notes',
            href: '/dashboard/notes',
            icon: (
                <FileText className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: 'Revisits',
            href: '/dashboard/revisits',
            icon: (
                <RotateCcw className="text-white/70 h-5 w-5 flex-shrink-0" />
            ),
        }
    ]

    return (
        <SidebarContainer open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {open ? <Logo /> : <LogoIcon />}
                    <div className="mt-8 flex flex-col gap-2">
                        {links.map((link, idx) => (
                            <SidebarLink key={idx} link={link} />
                        ))}
                    </div>
                </div>
                <div>
                    <SidebarLink
                        link={{
                            label: 'Settings',
                            href: '/dashboard/settings',
                            icon: (
                                <Settings className="text-white/70 h-5 w-5 flex-shrink-0" />
                            ),
                        }}
                    />
                </div>
            </SidebarBody>
        </SidebarContainer>
    )
}

export const Logo = () => {
    return (
        <Link
            href="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-white/90 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-semibold text-white whitespace-pre"
            >
                Growvia
            </motion.span>
        </Link>
    )
}

export const LogoIcon = () => {
    return (
        <Link
            href="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-white/90 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    )
}
