// src/stores/academy-store.ts — Brew Academy state (Zustand + persist)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TutorialCategory, BrewPhase } from '@/data/tutorials'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface WatchProgress {
  tutorialId: string
  watchedAt: string
  completed: boolean
}

export interface CoachSession {
  id: string
  phase: BrewPhase
  startedAt: string
  endedAt?: string
  issuesDetected: string[]
  notesCount: number
}

interface AcademyState {
  /** Watched tutorials tracking */
  watchHistory: WatchProgress[]
  /** Bookmarked tutorials */
  bookmarks: string[]
  /** Active category filter */
  activeCategory: TutorialCategory | 'all'
  /** Search query */
  searchQuery: string
  /** Brew coach sessions */
  coachSessions: CoachSession[]
  /** Whether vision AI is enabled */
  visionEnabled: boolean
  /** Active brew coach phase */
  activeCoachPhase: BrewPhase | null

  // Actions
  markWatched: (tutorialId: string) => void
  toggleBookmark: (tutorialId: string) => void
  setCategory: (cat: TutorialCategory | 'all') => void
  setSearch: (q: string) => void
  startCoachSession: (phase: BrewPhase) => void
  endCoachSession: () => void
  addIssueToSession: (issueId: string) => void
  setVisionEnabled: (on: boolean) => void
}

/* ── Store ─────────────────────────────────────────────────────────────────── */

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      watchHistory: [],
      bookmarks: [],
      activeCategory: 'all',
      searchQuery: '',
      coachSessions: [],
      visionEnabled: false,
      activeCoachPhase: null,

      markWatched: (tutorialId) =>
        set((s) => {
          const exists = s.watchHistory.find((w) => w.tutorialId === tutorialId)
          if (exists) return s
          return {
            watchHistory: [
              ...s.watchHistory,
              { tutorialId, watchedAt: new Date().toISOString(), completed: true },
            ],
          }
        }),

      toggleBookmark: (tutorialId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(tutorialId)
            ? s.bookmarks.filter((b) => b !== tutorialId)
            : [...s.bookmarks, tutorialId],
        })),

      setCategory: (cat) => set({ activeCategory: cat }),
      setSearch: (q) => set({ searchQuery: q }),

      startCoachSession: (phase) => {
        const session: CoachSession = {
          id: `coach-${Date.now()}`,
          phase,
          startedAt: new Date().toISOString(),
          issuesDetected: [],
          notesCount: 0,
        }
        set((s) => ({
          coachSessions: [...s.coachSessions, session],
          activeCoachPhase: phase,
        }))
      },

      endCoachSession: () =>
        set((s) => {
          const sessions = [...s.coachSessions]
          const last = sessions[sessions.length - 1]
          if (last && !last.endedAt) {
            sessions[sessions.length - 1] = {
              ...last,
              endedAt: new Date().toISOString(),
            }
          }
          return { coachSessions: sessions, activeCoachPhase: null }
        }),

      addIssueToSession: (issueId) =>
        set((s) => {
          const sessions = [...s.coachSessions]
          const last = sessions[sessions.length - 1]
          if (last && !last.endedAt) {
            sessions[sessions.length - 1] = {
              ...last,
              issuesDetected: [...last.issuesDetected, issueId],
            }
          }
          return { coachSessions: sessions }
        }),

      setVisionEnabled: (on) => set({ visionEnabled: on }),
    }),
    { name: 'beergate-academy' },
  ),
)
