'use client'

import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

// Route → background images mapping
const ROUTE_BACKGROUNDS: Record<string, string[]> = {
    dashboard: ['bg4-dashboard.jpg'],
    projects: ['bg1-projects.jpg'],
    calendar: ['bg1 -calender.jpg'],
    gamification: ['bg1 -gamification.jpg'],
    challenges: ['bg2-challenges.jpg'],
    revisits: ['bg1-revisits.jpg', 'bg2-revisits.jpg'],
    // fallback for any other route
    default: ['bg1-dashboard.jpg', 'bg3-dashboard.jpg'],
}

function getDeterministicBackground(pathname: string, arr: string[]): string {
    let hash = 0;
    for (let i = 0; i < pathname.length; i++) {
        hash = pathname.charCodeAt(i) + ((hash << 5) - hash);
    }
    return arr[Math.abs(hash) % arr.length];
}

function getBackground(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean)
    // e.g. /dashboard/challenges → look for "challenges" first
    for (const seg of segments.reverse()) {
        if (ROUTE_BACKGROUNDS[seg]) {
            return getDeterministicBackground(pathname, ROUTE_BACKGROUNDS[seg])
        }
    }
    return getDeterministicBackground(pathname, ROUTE_BACKGROUNDS.default)
}

export function SpatialBackground() {
    const pathname = usePathname()

    // Stable image per route — recalculate only when pathname changes
    const imageFile = useMemo(() => getBackground(pathname), [pathname])
    const [loaded, setLoaded] = useState(false)

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ willChange: 'transform' }}
        >
            {/* The blurred environment image */}
            <img
                key={imageFile}
                src={`/backgrounds/${imageFile}`}
                alt=""
                loading="eager"
                decoding="async"
                onLoad={() => setLoaded(true)}
                style={{
                    position: 'absolute',
                    inset: '-5%',
                    width: '110%',
                    height: '110%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'blur(14px) brightness(0.7)',
                    transform: 'scale(1.05)',
                    transition: 'opacity 0.8s ease',
                    opacity: loaded ? 1 : 0,
                    // Do not promote to own compositor layer unnecessarily
                }}
            />

            {/* Dark overlay to normalise brightness and ensure glass readability */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.30) 100%)',
                }}
            />

            {/* Subtle vignette at the edges */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.50) 100%)',
                }}
            />
        </div>
    )
}
