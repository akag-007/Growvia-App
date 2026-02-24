/**
 * card-7.tsx — Revisit Hover Card
 *
 * Inspired by TravelCard hover-reveal UX:
 *   - Default state: gradient background with accent colour, type + status badges, title, time estimate
 *   - Hover state: middle content slides up, bottom panel fades in with details + actions
 *
 * No extra npm dependencies required — uses only lucide-react which is already installed.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface RevisitCardData {
    id: string
    title: string
    /** Display label for the type (e.g. "Tech", "Interview Prep") */
    typeLabel: string
    /** Status label: "overdue" | "due today" | "upcoming" | "done" etc. */
    statusLabel: string
    statusCls: string
    typeCls: string
    estimatedTimeMin: number
    reviewCount: number
    reasonToReturn?: string | null
    resourceUrl?: string | null
    /** Accent gradient key */
    accentClass: string
}

interface RevisitHoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
    data: RevisitCardData
    /** Called when the card background is clicked (opens detail drawer) */
    onCardClick: () => void
    /** Slot for the action buttons row (Mark Done, Schedule, etc.) rendered inside the hover panel */
    actions: React.ReactNode
    /** Slot for the Start button */
    startButton: React.ReactNode
}

export const RevisitHoverCard = React.forwardRef<HTMLDivElement, RevisitHoverCardProps>(
    ({ data, onCardClick, actions, startButton, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                onClick={onCardClick}
                className={cn(
                    'group relative w-full overflow-hidden rounded-2xl cursor-pointer',
                    'h-[220px]',               // fixed height so the reveal animation is predictable
                    'transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1',
                    'border border-zinc-800 hover:border-zinc-600',
                    className
                )}
                {...props}
            >
                {/* Accent background gradient */}
                <div className={cn('absolute inset-0', data.accentClass)} />

                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

                {/* Content */}
                <div className="relative flex h-full flex-col justify-between p-5 text-white">

                    {/* TOP: badges always visible */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border', data.typeCls)}>
                            {data.typeLabel}
                        </span>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', data.statusCls)}>
                            {data.statusLabel}
                        </span>
                    </div>

                    {/* MIDDLE: title + time — slides up on hover to make room for the bottom panel */}
                    <div className="transition-transform duration-500 ease-in-out group-hover:-translate-y-14 space-y-1">
                        <h3 className="text-lg font-extrabold text-white leading-snug line-clamp-2">
                            {data.title}
                        </h3>
                        <p className="text-[11px] text-white/60 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {data.estimatedTimeMin}m &nbsp;·&nbsp; {data.reviewCount} review{data.reviewCount !== 1 ? 's' : ''}
                        </p>
                        {data.reasonToReturn && (
                            <p className="text-[11px] text-white/50 italic line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                "{data.reasonToReturn}"
                            </p>
                        )}
                    </div>

                    {/* BOTTOM PANEL: revealed on hover */}
                    <div className="absolute -bottom-24 left-0 w-full px-5 pb-4 pt-3 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100">
                        {/* Resource URL */}
                        {data.resourceUrl && (
                            <p className="text-[11px] text-emerald-400 truncate mb-2">
                                🔗 {data.resourceUrl.replace(/^https?:\/\//, '')}
                            </p>
                        )}

                        {/* Actions row */}
                        <div className="flex items-center justify-between gap-2">
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                                {actions}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                {startButton}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
)
RevisitHoverCard.displayName = 'RevisitHoverCard'
