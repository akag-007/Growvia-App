import React from 'react'
import { cn } from '@/lib/utils'

export interface FeatureItem {
    title: string
    description: string
    icon: React.ReactNode
}

export function FeaturesSectionWithHoverEffects({ features }: { features: FeatureItem[] }) {
    return (
        <div className={cn(
            'grid relative z-10',
            features.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
                features.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}>
            {features.map((feature, index) => (
                <Feature key={feature.title} {...feature} index={index} total={features.length} />
            ))}
        </div>
    )
}

const Feature = ({
    title,
    description,
    icon,
    index,
    total,
}: {
    title: string
    description: string
    icon: React.ReactNode
    index: number
    total: number
}) => {
    const cols = total <= 2 ? 2 : total <= 3 ? 3 : 4
    const isLastRow = index >= total - (total % cols || cols)
    const isLeftEdge = index % cols === 0
    const isRightEdge = index % cols === cols - 1

    return (
        <div
            className={cn(
                'flex flex-col py-8 relative group/feature border-zinc-800',
                !isRightEdge && 'lg:border-r',
                isLeftEdge && 'lg:border-l',
                !isLastRow && 'lg:border-b'
            )}
        >
            {/* Hover gradient — top half rows go bottom→top, bottom rows go top→bottom */}
            <div className={cn(
                'opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full pointer-events-none',
                !isLastRow
                    ? 'bg-gradient-to-t from-zinc-800/60 to-transparent'
                    : 'bg-gradient-to-b from-zinc-800/60 to-transparent'
            )} />

            <div className="mb-4 relative z-10 px-8 text-zinc-400">
                {icon}
            </div>

            <div className="text-base font-bold mb-1 relative z-10 px-8">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-zinc-700 group-hover/feature:bg-emerald-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-zinc-100">
                    {title}
                </span>
            </div>

            <p className="text-sm text-zinc-400 max-w-xs relative z-10 px-8">
                {description}
            </p>
        </div>
    )
}
