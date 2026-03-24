// src/components/brewing/hop-schedule.tsx — Beergate v3 Hop Schedule Alert System
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertTriangle, Clock, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HopAddition {
  name: string
  amount_g: number
  time_min: number        // minutes from END of boil (60 = first addition, 0 = flameout)
  alpha_pct?: number
  ibu_contribution?: number
  added: boolean
  notified: boolean
}

interface HopScheduleProps {
  hops: HopAddition[]
  boilElapsedSec: number
  boilTotalMin: number
  onMarkAdded: (index: number) => void
}

export function HopSchedule({ hops, boilElapsedSec, boilTotalMin, onMarkAdded }: HopScheduleProps) {
  const boilTotalSec = boilTotalMin * 60
  const boilRemainingSec = Math.max(0, boilTotalSec - boilElapsedSec)
  const boilRemainingMin = boilRemainingSec / 60

  // Sort by time descending (first additions first)
  const sortedHops = useMemo(() =>
    hops.map((h, i) => ({ ...h, originalIndex: i }))
        .sort((a, b) => b.time_min - a.time_min),
    [hops]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Leaf size={12} className="text-accent-hop" />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Adiciones de lúpulo
        </span>
      </div>

      <AnimatePresence>
        {sortedHops.map((hop) => {
          const isDue = boilRemainingMin <= hop.time_min && !hop.added
          const isUpcoming = boilRemainingMin > hop.time_min && !hop.added
          const secsUntilDue = (boilRemainingMin - hop.time_min) * 60
          const isUrgent = isDue && !hop.added
          const isOverdue = isDue && secsUntilDue < -120 // 2 min past

          return (
            <motion.div
              key={`${hop.name}-${hop.time_min}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg text-xs transition-all',
                hop.added && 'bg-accent-hop/5 border border-accent-hop/20',
                isUrgent && !isOverdue && 'bg-accent-amber/10 border border-accent-amber/30 animate-pulse',
                isOverdue && 'bg-accent-danger/10 border border-accent-danger/30',
                isUpcoming && 'bg-bg-hover/40 border border-white/[0.06]',
              )}
            >
              {/* Status icon */}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                hop.added && 'bg-accent-hop/20',
                isUrgent && 'bg-accent-amber/20',
                isOverdue && 'bg-accent-danger/20',
                isUpcoming && 'bg-white/[0.06]',
              )}>
                {hop.added ? (
                  <Check size={12} className="text-accent-hop" />
                ) : isOverdue ? (
                  <AlertTriangle size={12} className="text-accent-danger" />
                ) : isDue ? (
                  <Clock size={12} className="text-accent-amber animate-pulse" />
                ) : (
                  <Clock size={12} className="text-text-tertiary" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'font-medium truncate',
                    hop.added ? 'text-text-secondary line-through' : 'text-text-primary'
                  )}>
                    {hop.amount_g}g {hop.name}
                  </span>
                  {hop.alpha_pct && (
                    <span className="text-text-tertiary">({hop.alpha_pct}% AA)</span>
                  )}
                </div>
                <span className="text-text-tertiary">
                  @{hop.time_min} min
                  {hop.ibu_contribution ? ` · ~${hop.ibu_contribution} IBU` : ''}
                </span>
              </div>

              {/* Action */}
              {!hop.added && isDue && (
                <button
                  onClick={() => onMarkAdded(hop.originalIndex)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-semibold shrink-0 transition-colors',
                    isOverdue
                      ? 'bg-accent-danger text-white hover:bg-accent-danger/80'
                      : 'bg-accent-amber text-bg-primary hover:bg-accent-amber/80'
                  )}
                >
                  Añadir ✓
                </button>
              )}
              {!hop.added && isUpcoming && (
                <span className="text-text-tertiary text-[10px] shrink-0">
                  en {Math.ceil(secsUntilDue / 60)} min
                </span>
              )}
              {hop.added && (
                <span className="text-accent-hop text-[10px] font-medium shrink-0">Añadido</span>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ── Hop Alert Banner ───────────────────────────────────────────── */
interface HopAlertBannerProps {
  hops: HopAddition[]
  boilElapsedSec: number
  boilTotalMin: number
}

export function HopAlertBanner({ hops, boilElapsedSec, boilTotalMin }: HopAlertBannerProps) {
  const boilRemainingSec = Math.max(0, boilTotalMin * 60 - boilElapsedSec)
  const boilRemainingMin = boilRemainingSec / 60

  const nextDue = hops
    .filter(h => !h.added)
    .sort((a, b) => b.time_min - a.time_min)
    .find(h => boilRemainingMin <= h.time_min + 3) // show 3 min early

  if (!nextDue) return null

  const isDue = boilRemainingMin <= nextDue.time_min
  const secsUntil = Math.max(0, Math.round((boilRemainingMin - nextDue.time_min) * 60))

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm',
        isDue
          ? 'bg-accent-amber/15 border border-accent-amber/30 text-accent-amber'
          : 'bg-bg-tertiary border border-white/[0.06] text-text-secondary'
      )}
    >
      {isDue ? (
        <AlertTriangle size={16} className="text-accent-amber animate-pulse shrink-0" />
      ) : (
        <Clock size={16} className="shrink-0" />
      )}
      <span className="flex-1">
        {isDue ? (
          <><strong>¡Ahora!</strong> Añade {nextDue.amount_g}g de {nextDue.name}</>
        ) : (
          <>⏰ Añade {nextDue.amount_g}g de {nextDue.name} en <strong className="font-mono">{Math.floor(secsUntil / 60)}:{String(secsUntil % 60).padStart(2, '0')}</strong></>
        )}
      </span>
    </motion.div>
  )
}
