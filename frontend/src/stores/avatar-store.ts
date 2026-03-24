// frontend/src/stores/avatar-store.ts — Beergate v4 FASE 1: Avatar Store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AvatarStyle = 'cartoon' | 'realistic' | 'anime' | 'classic'
export type PersonalityType = 'professional' | 'casual' | 'sarcastic' | 'shy' | 'demanding'
export type GeniePhase = 'hidden' | 'summoning' | 'active' | 'navigating' | 'dismissing'
export type PresetCharacter = 'david' | 'maestro' | 'cientifica' | 'punk' | 'hop3000'

export interface AvatarConfig {
  /** Whether the avatar system is enabled */
  enabled: boolean
  /** URL of the avatar source image (with chroma-key green bg) */
  imageUrl: string | null
  /** URL of the pre-generated talking-head demo video */
  videoUrl: string | null
  /** Style of the avatar */
  style: AvatarStyle
  /** Personality for AI responses */
  personality: PersonalityType
  /** Whether user chose a preset vs uploaded photo */
  source: 'photo' | 'preset'
  /** Selected preset character (if source is preset) */
  presetCharacter: PresetCharacter | null
  /** Whether voice is enabled */
  voiceEnabled: boolean
  /** Replicate voice model ID (if voice-cloned) */
  voiceModelId: string | null
  /** Preset voice ID */
  presetVoice: string | null
}

export interface AvatarAction {
  type: 'speak' | 'navigate' | 'point_at' | 'show_video' | 'warn' | 'celebrate' | 'dismiss'
  text?: string
  to?: string
  selector?: string
  explanation?: string
  videoId?: string
  title?: string
  message?: string
  severity?: 'info' | 'warning' | 'error'
  reason?: string
}

interface AvatarState {
  // Configuration (persisted)
  config: AvatarConfig

  // Runtime state (not persisted)
  phase: GeniePhase
  position: { x: number; y: number }
  currentMessage: string | null
  currentAction: AvatarAction | null
  isGenerating: boolean

  // Config actions
  setConfig: (partial: Partial<AvatarConfig>) => void
  resetConfig: () => void

  // Genie lifecycle
  summon: () => void
  activate: () => void
  dismiss: () => void
  setPhase: (phase: GeniePhase) => void
  setPosition: (pos: { x: number; y: number }) => void

  // Message/action
  setCurrentMessage: (msg: string | null) => void
  executeAction: (action: AvatarAction) => void
  clearAction: () => void
  setIsGenerating: (val: boolean) => void
}

const defaultConfig: AvatarConfig = {
  enabled: false,
  imageUrl: null,
  videoUrl: null,
  style: 'cartoon',
  personality: 'casual',
  source: 'preset',
  presetCharacter: null,
  voiceEnabled: false,
  voiceModelId: null,
  presetVoice: null,
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      config: { ...defaultConfig },

      // Runtime state
      phase: 'hidden' as GeniePhase,
      position: { x: 0, y: 0 },
      currentMessage: null,
      currentAction: null,
      isGenerating: false,

      setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),

      resetConfig: () => set({ config: { ...defaultConfig } }),

      summon: () => {
        const { config, phase } = get()
        if (!config.enabled || phase !== 'hidden') return
        set({ phase: 'summoning' })
        // Transition to active after animation
        setTimeout(() => {
          if (get().phase === 'summoning') {
            set({ phase: 'active' })
          }
        }, 1200)
      },

      activate: () => set({ phase: 'active' }),

      dismiss: () => {
        set({ phase: 'dismissing' })
        setTimeout(() => {
          if (get().phase === 'dismissing') {
            set({
              phase: 'hidden',
              currentMessage: null,
              currentAction: null,
            })
          }
        }, 800)
      },

      setPhase: (phase) => set({ phase }),
      setPosition: (pos) => set({ position: pos }),

      setCurrentMessage: (msg) => set({ currentMessage: msg }),

      executeAction: (action) => {
        set({ currentAction: action })
        if (action.type === 'speak' && action.text) {
          set({ currentMessage: action.text })
        }
        if (action.type === 'dismiss') {
          get().dismiss()
        }
      },

      clearAction: () => set({ currentAction: null }),
      setIsGenerating: (val) => set({ isGenerating: val }),
    }),
    {
      name: 'beergate-avatar',
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
)
