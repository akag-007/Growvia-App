'use client'

import NumberFlow from '@number-flow/react'
import * as RadixSlider from '@radix-ui/react-slider'
import clsx from 'clsx'

// Grid-optimised slider: value floats above thumb, className overrides width.
export default function Slider({ value, className, ...props }: RadixSlider.SliderProps) {
    return (
        <RadixSlider.Root
            {...props}
            value={value}
            className={clsx(
                'relative flex h-5 touch-none select-none items-center',
                className ?? 'w-[200px]',
            )}
        >
            <RadixSlider.Track className="relative h-[3px] grow rounded-full bg-zinc-700">
                <RadixSlider.Range className="absolute h-full rounded-full bg-violet-500" />
            </RadixSlider.Track>
            <RadixSlider.Thumb
                className="relative block h-4 w-4 rounded-full bg-white shadow-md ring-2 ring-violet-500 focus:outline-none"
                aria-label="value"
            >
                {value?.[0] != null && (
                    <NumberFlow
                        willChange
                        value={value[0]}
                        isolate
                        opacityTiming={{ duration: 250, easing: 'ease-out' }}
                        transformTiming={{
                            easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
                            duration: 500,
                        }}
                        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-xs font-bold text-violet-400 whitespace-nowrap"
                    />
                )}
            </RadixSlider.Thumb>
        </RadixSlider.Root>
    )
}

export { Slider }
