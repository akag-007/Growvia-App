import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { updateTask } from '@/actions/task'

interface TimerState {
    activeTaskId: string | null
    activeTaskTitle: string | null

    startTime: number | null
    sessionElapsed: number
    initialDbDuration: number // Store the DB value at start of session

    mode: 'stopwatch' | 'timer'
    targetDuration: number | null

    isRunning: boolean

    startNewSession: (taskId: string, title: string, mode: 'stopwatch' | 'timer', initialDbDuration: number, targetDuration?: number) => void
    resumeSession: () => void
    pauseSession: () => void
    stopSession: () => Promise<void>
    reset: () => void
}

export const useTimerStore = create<TimerState>()(
    persist(
        (set, get) => ({
            activeTaskId: null,
            activeTaskTitle: null,
            startTime: null,
            sessionElapsed: 0,
            initialDbDuration: 0,
            mode: 'stopwatch',
            targetDuration: null,
            isRunning: false,

            startNewSession: (taskId, title, mode, initialDbDuration, targetDuration = undefined) => {
                set({
                    activeTaskId: taskId,
                    activeTaskTitle: title,
                    mode,
                    initialDbDuration,
                    targetDuration: targetDuration ?? null,
                    startTime: Date.now(),
                    sessionElapsed: 0,
                    isRunning: true,
                })
            },

            resumeSession: () => {
                const state = get()
                if (state.activeTaskId && !state.isRunning) {
                    set({
                        startTime: Date.now(),
                        isRunning: true
                    })
                }
            },

            pauseSession: () => {
                const state = get()
                if (!state.isRunning || !state.startTime) return

                const currentSegment = Math.floor((Date.now() - state.startTime) / 1000)

                set({
                    isRunning: false,
                    startTime: null,
                    sessionElapsed: state.sessionElapsed + currentSegment
                })
            },

            stopSession: async () => {
                const state = get()
                if (state.activeTaskId) {
                    const currentSegment = state.isRunning && state.startTime
                        ? Math.floor((Date.now() - state.startTime) / 1000)
                        : 0

                    const totalSessionTime = state.sessionElapsed + currentSegment
                    // Final = What was in DB at start + This Session
                    const finalDuration = state.initialDbDuration + totalSessionTime

                    await updateTask(state.activeTaskId, { actual_duration: finalDuration })
                }

                set({
                    activeTaskId: null,
                    activeTaskTitle: null,
                    startTime: null,
                    sessionElapsed: 0,
                    initialDbDuration: 0,
                    isRunning: false,
                    mode: 'stopwatch',
                    targetDuration: null
                })
            },

            reset: () => {
                set({
                    activeTaskId: null,
                    activeTaskTitle: null,
                    startTime: null,
                    sessionElapsed: 0,
                    initialDbDuration: 0,
                    isRunning: false,
                    mode: 'stopwatch',
                    targetDuration: null
                })
            }
        }),
        {
            name: 'timer-storage',
        }
    )
)
