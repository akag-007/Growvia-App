'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface TransparencyContextValue {
    reduceTransparency: boolean
    toggleTransparency: () => void
}

const TransparencyContext = createContext<TransparencyContextValue>({
    reduceTransparency: false,
    toggleTransparency: () => {},
})

export function TransparencyProvider({ children }: { children: React.ReactNode }) {
    const [reduceTransparency, setReduceTransparency] = useState(false)

    // Persist preference in localStorage
    useEffect(() => {
        const stored = localStorage.getItem('reduce-transparency')
        if (stored === 'true') setReduceTransparency(true)
    }, [])

    const toggleTransparency = () => {
        setReduceTransparency((prev) => {
            const next = !prev
            localStorage.setItem('reduce-transparency', String(next))
            return next
        })
    }

    return (
        <TransparencyContext.Provider value={{ reduceTransparency, toggleTransparency }}>
            <div className={reduceTransparency ? 'reduce-transparency' : ''} style={{ display: 'contents' }}>
                {children}
            </div>
        </TransparencyContext.Provider>
    )
}

export function useTransparency() {
    return useContext(TransparencyContext)
}
