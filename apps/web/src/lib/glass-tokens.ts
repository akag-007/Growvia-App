/** Shared frosted-glass stack — translucent fill + strong blur so the page shows through. */
export const GLASS_BLUR = 'blur(20px) saturate(160%)'

export const glassBackdrop = {
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
} as const
