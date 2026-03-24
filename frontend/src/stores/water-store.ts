// frontend/src/stores/water-store.ts — Water Lab state for Beergate v4

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WaterProfile, IonKey } from '@/data/water-profiles'
import { WATER_PROFILES, RO_WATER, ION_KEYS } from '@/data/water-profiles'
import type { IonConcentrations, SaltAmounts, GrainBillEntry } from '@/lib/water-calc'
import {
  calcAdjustedWater,
  calcClSO4Ratio,
  calcDilutedWater,
  estimateMashPH,
  suggestSaltAdditions,
  profileToIons,
} from '@/lib/water-calc'

interface WaterState {
  /* ── Selected profiles ──── */
  sourceProfileId: string | null
  targetProfileId: string | null
  customSource: IonConcentrations | null
  customTarget: IonConcentrations | null

  /* ── Volumes ──── */
  mashVolume: number        // liters
  spargeVolume: number      // liters
  batchVolume: number       // liters

  /* ── Salt additions ──── */
  saltAmounts: SaltAmounts

  /* ── Dilution ──── */
  roFraction: number        // 0-1 fraction of RO/distilled water

  /* ── Grain bill for pH ──── */
  grainBill: GrainBillEntry[]

  /* ── Target mash pH ──── */
  targetPH: number
}

interface WaterActions {
  setSourceProfile: (id: string | null) => void
  setTargetProfile: (id: string | null) => void
  setCustomSource: (ions: IonConcentrations) => void
  setCustomTarget: (ions: IonConcentrations) => void
  setMashVolume: (v: number) => void
  setSpargeVolume: (v: number) => void
  setBatchVolume: (v: number) => void
  setSaltAmount: (saltId: string, grams: number) => void
  setRoFraction: (f: number) => void
  setGrainBill: (bill: GrainBillEntry[]) => void
  setTargetPH: (pH: number) => void
  autoSuggestSalts: () => void
  resetAll: () => void

  /* ── Derived getters ──── */
  getSourceWater: () => IonConcentrations
  getTargetWater: () => IonConcentrations
  getDilutedSource: () => IonConcentrations
  getAdjustedWater: () => IonConcentrations
  getClSO4Ratio: () => number
  getEstimatedPH: () => number
}

const DEFAULT_STATE: WaterState = {
  sourceProfileId: null,
  targetProfileId: null,
  customSource: null,
  customTarget: null,
  mashVolume: 20,
  spargeVolume: 15,
  batchVolume: 23,
  saltAmounts: {},
  roFraction: 0,
  grainBill: [{ type: 'base', amount_kg: 5 }],
  targetPH: 5.35,
}

const ZERO_IONS: IonConcentrations = {
  calcium: 0, magnesium: 0, sodium: 0,
  chloride: 0, sulfate: 0, bicarbonate: 0,
}

function resolveProfile(id: string | null, custom: IonConcentrations | null): IonConcentrations {
  if (custom) return custom
  if (!id) return ZERO_IONS
  const profile = WATER_PROFILES.find((p) => p.id === id)
  return profile ? profileToIons(profile) : ZERO_IONS
}

export const useWaterStore = create<WaterState & WaterActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setSourceProfile: (id) => set({ sourceProfileId: id, customSource: null }),
      setTargetProfile: (id) => set({ targetProfileId: id, customTarget: null }),
      setCustomSource: (ions) => set({ customSource: ions, sourceProfileId: null }),
      setCustomTarget: (ions) => set({ customTarget: ions, targetProfileId: null }),
      setMashVolume: (v) => set({ mashVolume: v }),
      setSpargeVolume: (v) => set({ spargeVolume: v }),
      setBatchVolume: (v) => set({ batchVolume: v }),
      setSaltAmount: (saltId, grams) =>
        set((s) => ({ saltAmounts: { ...s.saltAmounts, [saltId]: grams } })),
      setRoFraction: (f) => set({ roFraction: Math.max(0, Math.min(1, f)) }),
      setGrainBill: (bill) => set({ grainBill: bill }),
      setTargetPH: (pH) => set({ targetPH: pH }),

      autoSuggestSalts: () => {
        const s = get()
        const diluted = get().getDilutedSource()
        const target = get().getTargetWater()
        const totalVolume = s.mashVolume + s.spargeVolume
        const suggested = suggestSaltAdditions(diluted, target, totalVolume)
        set({ saltAmounts: suggested })
      },

      resetAll: () => set(DEFAULT_STATE),

      getSourceWater: () => {
        const s = get()
        return resolveProfile(s.sourceProfileId, s.customSource)
      },

      getTargetWater: () => {
        const s = get()
        return resolveProfile(s.targetProfileId, s.customTarget)
      },

      getDilutedSource: () => {
        const source = get().getSourceWater()
        return calcDilutedWater(source, get().roFraction)
      },

      getAdjustedWater: () => {
        const s = get()
        const diluted = get().getDilutedSource()
        const totalVolume = s.mashVolume + s.spargeVolume
        return calcAdjustedWater(diluted, s.saltAmounts, totalVolume)
      },

      getClSO4Ratio: () => {
        const adjusted = get().getAdjustedWater()
        return calcClSO4Ratio(adjusted.chloride, adjusted.sulfate)
      },

      getEstimatedPH: () => {
        const s = get()
        const adjusted = get().getAdjustedWater()
        return estimateMashPH(s.grainBill, adjusted, s.mashVolume)
      },
    }),
    {
      name: 'beergate-water',
      partialize: (state) => ({
        sourceProfileId: state.sourceProfileId,
        targetProfileId: state.targetProfileId,
        customSource: state.customSource,
        customTarget: state.customTarget,
        mashVolume: state.mashVolume,
        spargeVolume: state.spargeVolume,
        batchVolume: state.batchVolume,
        saltAmounts: state.saltAmounts,
        roFraction: state.roFraction,
        grainBill: state.grainBill,
        targetPH: state.targetPH,
      }),
    },
  ),
)
