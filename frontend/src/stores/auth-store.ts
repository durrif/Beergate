// frontend/src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import type { User, Brewery, TokenResponse } from '@/lib/types'

interface AuthState {
  user: User | null
  brewery: Brewery | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setAuth: (data: TokenResponse) => void
  setBrewery: (brewery: Brewery) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      brewery: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data) => {
        api.setToken(data.access_token)
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        set({
          user: data.user ?? null,
          brewery: data.brewery ?? null,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        })
      },

      setBrewery: (brewery) => set({ brewery }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => {
        api.setToken(null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          brewery: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'beergate-auth',
      partialize: (state) => ({
        user: state.user,
        brewery: state.brewery,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token in API client after page refresh
        if (state?.accessToken) api.setToken(state.accessToken)
      },
    }
  )
)

// Listen for forced logout (token expired and refresh failed)
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout()
})
