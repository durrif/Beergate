// frontend/src/stores/brew-store.ts
import { create } from 'zustand'
import type { BrewSession, BrewPhase } from '@/lib/types'

interface BrewTimerState {
  isRunning: boolean
  stepSeconds: number    // elapsed seconds in current step
  totalSeconds: number   // total elapsed seconds in session
  stepTimerRef: ReturnType<typeof setInterval> | null
}

interface BrewStore {
  // Active session
  activeSession: BrewSession | null
  currentStepIndex: number

  // Timer
  timer: BrewTimerState

  // Actions
  setActiveSession: (session: BrewSession | null) => void
  setCurrentStep: (index: number) => void
  updatePhase: (phase: BrewPhase) => void

  // Timer controls
  startTimer: () => void
  pauseTimer: () => void
  resetStepTimer: () => void

  clearSession: () => void
}

export const useBrewStore = create<BrewStore>()((set, get) => ({
  activeSession: null,
  currentStepIndex: 0,

  timer: {
    isRunning: false,
    stepSeconds: 0,
    totalSeconds: 0,
    stepTimerRef: null,
  },

  setActiveSession: (session) =>
    set({ activeSession: session, currentStepIndex: 0 }),

  setCurrentStep: (index) => set({ currentStepIndex: index }),

  updatePhase: (phase) =>
    set((state) => ({
      activeSession: state.activeSession ? { ...state.activeSession, phase } : null,
    })),

  startTimer: () => {
    const { timer } = get()
    if (timer.isRunning) return
    const ref = setInterval(() => {
      set((state) => ({
        timer: {
          ...state.timer,
          stepSeconds: state.timer.stepSeconds + 1,
          totalSeconds: state.timer.totalSeconds + 1,
        },
      }))
    }, 1000)
    set((state) => ({
      timer: { ...state.timer, isRunning: true, stepTimerRef: ref },
    }))
  },

  pauseTimer: () => {
    const { timer } = get()
    if (timer.stepTimerRef) clearInterval(timer.stepTimerRef)
    set((state) => ({
      timer: { ...state.timer, isRunning: false, stepTimerRef: null },
    }))
  },

  resetStepTimer: () =>
    set((state) => ({
      timer: { ...state.timer, stepSeconds: 0 },
    })),

  clearSession: () => {
    const { timer } = get()
    if (timer.stepTimerRef) clearInterval(timer.stepTimerRef)
    set({
      activeSession: null,
      currentStepIndex: 0,
      timer: { isRunning: false, stepSeconds: 0, totalSeconds: 0, stepTimerRef: null },
    })
  },
}))
