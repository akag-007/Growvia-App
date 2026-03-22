'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

// Route → background images mapping
const ROUTE_BACKGROUNDS: Record<string, string[]> = {
    dashboard: ['bg4-dashboard.jpg'],
    projects: ['bg1-projects.jpg'],
    calendar: ['bg1 -calender.jpg'],
    gamification: ['bg1 -gamification.jpg'],
    challenges: ['bg2-challenges.jpg'],
    revisits: ['bg1-revisits.jpg', 'bg2-revisits.jpg'],
    notes: ['bg3-dashboard.jpg'],
    // fallback for any other route
    default: ['bg1-dashboard.jpg', 'bg3-dashboard.jpg'],
}

function getDeterministicBackground(pathname: string, arr: string[]): string {
    let hash = 0;
    for (let i = 0; i < pathname.length; i++) {
        hash = pathname.charCodeAt(i) + ((hash <<  5) - hash);
    }
    return arr[Math.abs(hash) % arr.length];
}

function getBackground(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean)
    // e.g. /dashboard/challenges → prefer to most specific segment (do not mutate `segments`)
    for (const seg of [...segments].reverse()) {
        if (ROUTE_BACKGROUNDS[seg]) {
            return getDeterministicBackground(pathname, ROUTE_BACKGROUNDS[seg])
        }
    }
    return getDeterministicBackground(pathname, ROUTE_BACKGROUNDS.default)
}

export function SpatialBackground() {
    const pathname = usePathname()

    // Stable image per route — recalculate only when pathname changes
    const imageFile = useMemo(() => getBackground(pathname || '/'), [pathname])
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    const markLoaded = useCallback(() => setLoaded(true), [])

    // Reset when route image changes, then handle cache: `onLoad` often never fires if the
    // bitmap was ready before React attached the handler (common on full reload of /dashboard).
    useLayoutEffect(() => {
        setLoaded(false)
        const el = imgRef.current
        if (el?.complete && el.naturalWidth > 0) {
            markLoaded()
        }
    }, [imageFile, markLoaded])

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ willChange: 'transform' }}
        >
            {/* The blurred environment image */}
            <img
                ref={imgRef}
                key={imageFile}
                src={`/backgrounds/${imageFile}`}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={markLoaded}
                onError={markLoaded}
                style={{
                    position: 'absolute',
                    inset: '-5%',
                    width: '110%',
                    height: '110%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'blur(10px) brightness(0.85)',
                    transform: 'scale(1.05)',
                    transition: 'opacity 0.45s ease',
                    opacity: loaded ? 1 : 0,
                }}
            />

            {/* Light overlay for glassmorphic effect - reduced opacity for more transparency */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 100%)',
                }}
            />

            {/* Very subtle vignette at edges - reduced for glassmorphic transparency */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.20) 100%)',
                }}
            />
        </div>
    )
}
