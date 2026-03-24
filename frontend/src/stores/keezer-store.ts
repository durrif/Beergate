// src/stores/keezer-store.ts — Keezer Digital Twin state (Zustand + persist)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TapConfig } from '@/data/kegs'
import { MOCK_TAPS } from '@/data/kegs'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type KeezerType = 'chest_freezer' | 'fridge_tower' | 'jockey_box' | 'custom'

export interface KeezerConfig {
  type: KeezerType
  tapCount: number
  /** Per-tap keg type id (index = tap index) */
  tapKegTypes: (string | null)[]
  /** Optional sensor flags */
  hasFlowMeter: boolean
  hasTempSensor: boolean
  hasPressureSensor: boolean
  /** Whether the wizard has been completed */
  configured: boolean
}

export interface PourEntry {
  id: string
  tapId: number
  volume: number // liters
  timestamp: string
}

/* ── Store ─────────────────────────────────────────────────────────────────── */

interface KeezerState {
  config: KeezerConfig
  taps: TapConfig[]
  pourLog: PourEntry[]

  // Config actions
  setConfig: (config: KeezerConfig) => void
  resetConfig: () => void

  // Tap actions
  setTaps: (taps: TapConfig[]) => void
  updateTap: (tapId: number, changes: Partial<TapConfig>) => void
  assignBeer: (tapId: number, beer: {
    beer_name: string; style: string; abv: number
    og: number; fg: number; liters_total: number; color_hex: string
    tapped_date: string; co2_volumes: number
  }) => void
  clearTap: (tapId: number) => void

  // Pour actions
  pourBeer: (tapId: number, volumeL: number) => void
}

const DEFAULT_CONFIG: KeezerConfig = {
  type: 'chest_freezer',
  tapCount: 4,
  tapKegTypes: ['corny-19', 'corny-19', 'corny-19', 'corny-19'],
  hasFlowMeter: false,
  hasTempSensor: true,
  hasPressureSensor: false,
  configured: false,
}

export const useKeezerStore = create<KeezerState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      taps: MOCK_TAPS,
      pourLog: [],

      setConfig: (config) =>
        set((s) => {
          // If tap count changed, adjust taps array
          const diff = config.tapCount - s.taps.length
          let newTaps = [...s.taps]
          if (diff > 0) {
            for (let i = 0; i < diff; i++) {
              const id = s.taps.length + i + 1
              newTaps.push({
                id,
                keg_type_id: config.tapKegTypes[s.taps.length + i] ?? 'corny-19',
                beer_name: null, style: null, abv: null, og: null, fg: null,
                liters_remaining: 0, liters_total: 19,
                temperature: 3.0, pressure_bar: 0, co2_volumes: 0,
                tapped_date: null, days_remaining: null,
                consumption_rate_per_day: 0, color_hex: '#3A4A5C',
                status: 'empty', serving_count: 0, last_pour: null,
              })
            }
          } else if (diff < 0) {
            newTaps = newTaps.slice(0, config.tapCount)
          }
          // Update keg type ids for existing taps
          newTaps = newTaps.map((t, i) => ({
            ...t,
            keg_type_id: config.tapKegTypes[i] ?? t.keg_type_id,
          }))
          return { config, taps: newTaps }
        }),

      resetConfig: () => set({ config: DEFAULT_CONFIG, taps: MOCK_TAPS, pourLog: [] }),

      setTaps: (taps) => set({ taps }),

      updateTap: (tapId, changes) =>
        set((s) => ({
          taps: s.taps.map((t) =>
            t.id === tapId ? { ...t, ...changes } : t
          ),
        })),

      assignBeer: (tapId, beer) =>
        set((s) => {
          const keg = s.taps.find((t) => t.id === tapId)
          return {
            taps: s.taps.map((t) =>
              t.id === tapId
                ? {
                    ...t,
                    ...beer,
                    liters_remaining: beer.liters_total,
                    status: 'active' as const,
                    serving_count: 0,
                    last_pour: null,
                    days_remaining: null,
                    consumption_rate_per_day: 0,
                    pressure_bar: 1.2,
                    temperature: keg?.temperature ?? 3.0,
                  }
                : t
            ),
          }
        }),

      clearTap: (tapId) =>
        set((s) => ({
          taps: s.taps.map((t) =>
            t.id === tapId
              ? {
                  ...t,
                  beer_name: null, style: null, abv: null, og: null, fg: null,
                  liters_remaining: 0, color_hex: '#3A4A5C',
                  status: 'empty' as const, serving_count: 0, last_pour: null,
                  days_remaining: null, consumption_rate_per_day: 0,
                  pressure_bar: 0, co2_volumes: 0, tapped_date: null,
                }
              : t
          ),
        })),

      pourBeer: (tapId, volumeL) =>
        set((s) => {
          const entry: PourEntry = {
            id: `${Date.now()}-${tapId}`,
            tapId,
            volume: volumeL,
            timestamp: new Date().toISOString(),
          }
          return {
            pourLog: [entry, ...s.pourLog].slice(0, 500), // keep last 500
            taps: s.taps.map((t) => {
              if (t.id !== tapId || t.status !== 'active') return t
              const remaining = Math.max(0, t.liters_remaining - volumeL)
              const newCount = t.serving_count + 1
              // Recalculate consumption rate (simple: total consumed / days since tapped)
              const daysActive = t.tapped_date
                ? Math.max(1, (Date.now() - new Date(t.tapped_date).getTime()) / 86400000)
                : 1
              const consumed = t.liters_total - remaining
              const rate = consumed / daysActive
              const daysLeft = rate > 0 ? Math.round(remaining / rate) : null
              return {
                ...t,
                liters_remaining: remaining,
                serving_count: newCount,
                last_pour: entry.timestamp,
                consumption_rate_per_day: +rate.toFixed(2),
                days_remaining: daysLeft,
                status: remaining <= 0 ? ('empty' as const) : t.status,
              }
            }),
          }
        }),
    }),
    { name: 'beergate-keezer' }
  )
)
