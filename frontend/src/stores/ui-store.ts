// frontend/src/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/lib/i18n'
import type { BrewPhase } from '@/lib/types'

type Language = 'es' | 'en'
type Theme = 'dark' // only dark for now

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (val: boolean) => void

  // AI Panel
  aiPanelOpen: boolean
  openAiPanel: () => void
  closeAiPanel: () => void
  toggleAiPanel: () => void

  // Language
  language: Language
  setLanguage: (lang: Language) => void

  // Theme
  theme: Theme

  // Active page context (for AI contextual suggestions)
  activePage: string
  setActivePage: (page: string) => void

  // Ambient UI — current brew phase
  brewPhase: BrewPhase
  setBrewPhase: (phase: BrewPhase) => void

  // Notifications unread count
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  clearUnread: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      aiPanelOpen: false,
      openAiPanel: () => set({ aiPanelOpen: true }),
      closeAiPanel: () => set({ aiPanelOpen: false }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),

      language: 'es',
      setLanguage: (lang) => {
        void i18n.changeLanguage(lang)
        localStorage.setItem('beergate_lang', lang)
        set({ language: lang })
      },

      theme: 'dark',

      activePage: 'dashboard',
      setActivePage: (page) => set({ activePage: page }),

      brewPhase: 'planned' as BrewPhase,
      setBrewPhase: (phase) => set({ brewPhase: phase }),

      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'beergate-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
    }
  )
)
