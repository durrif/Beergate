// src/stores/pool-store.ts — Pool Buying local state (Zustand + persist)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PoolOrder, PoolItem, PoolParticipant, PoolStatus } from '@/lib/types'

interface PoolState {
  pools: PoolOrder[]
  myZone: string
  myRadius: number // km

  setZone: (zone: string) => void
  setRadius: (radius: number) => void
  createPool: (pool: PoolOrder) => void
  updatePoolStatus: (poolId: string, status: PoolStatus) => void
  addParticipant: (poolId: string, participant: PoolParticipant) => void
  addItem: (poolId: string, item: PoolItem) => void
  updateItemQuantity: (poolId: string, itemId: string, participantId: string, qty: number) => void
  removePool: (poolId: string) => void
}

export const usePoolStore = create<PoolState>()(
  persist(
    (set) => ({
      pools: [],
      myZone: 'Madrid',
      myRadius: 40,

      setZone: (zone) => set({ myZone: zone }),
      setRadius: (radius) => set({ myRadius: radius }),

      createPool: (pool) =>
        set((s) => ({ pools: [...s.pools, pool] })),

      updatePoolStatus: (poolId, status) =>
        set((s) => ({
          pools: s.pools.map((p) =>
            p.id === poolId ? { ...p, status } : p
          ),
        })),

      addParticipant: (poolId, participant) =>
        set((s) => ({
          pools: s.pools.map((p) =>
            p.id === poolId
              ? { ...p, participants: [...p.participants, participant] }
              : p
          ),
        })),

      addItem: (poolId, item) =>
        set((s) => ({
          pools: s.pools.map((p) =>
            p.id === poolId ? { ...p, items: [...p.items, item] } : p
          ),
        })),

      updateItemQuantity: (poolId, itemId, participantId, qty) =>
        set((s) => ({
          pools: s.pools.map((p) =>
            p.id === poolId
              ? {
                  ...p,
                  items: p.items.map((it) =>
                    it.id === itemId
                      ? {
                          ...it,
                          quantities: { ...it.quantities, [participantId]: qty },
                        }
                      : it
                  ),
                }
              : p
          ),
        })),

      removePool: (poolId) =>
        set((s) => ({ pools: s.pools.filter((p) => p.id !== poolId) })),
    }),
    { name: 'beergate-pool-buying' }
  )
)
