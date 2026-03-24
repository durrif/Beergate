// src/components/fermentation/fermenter-twin.tsx — Beergate v3 Digital Twin Fermenter Card
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Thermometer, Droplets, Battery, Signal, Clock, Wifi, WifiOff,
  AlertTriangle, CheckCircle2, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FermenterSpec } from '@/data/fermenters'

/* ── Types ─────────────────────────────────────────────────────── */
export type FermenterStatus = 'active' | 'healthy' | 'attention' | 'alert' | 'idle'

export interface FermenterTwinData {
  fermenter: FermenterSpec
  beerName?: string
  style?: string
  dayNumber?: number
  totalDays?: number
  currentGravity?: number
  originalGravity?: number
  finalGravity?: number
  temperature?: number
  targetTemp?: number
  deviceOnline?: boolean
  deviceBattery?: number
  deviceRssi?: number
  lastSync?: string
  status: FermenterStatus
}

interface FermenterTwinProps {
  data: FermenterTwinData
  selected?: boolean
  onClick?: () => void
}

/* ── Helpers ───────────────────────────────────────────────────── */
function statusConfig(status: FermenterStatus) {
  switch (status) {
    case 'active': return { color: '#7CB342', ring: 'ring-accent-hop/30', labelKey: 'fermentation.status_active', dot: 'bg-accent-hop' }
    case 'healthy': return { color: '#4CAF50', ring: 'ring-green-500/30', labelKey: 'fermentation.status_healthy', dot: 'bg-green-500' }
    case 'attention': return { color: '#F5A623', ring: 'ring-accent-amber/30', labelKey: 'fermentation.status_attention', dot: 'bg-accent-amber' }
    case 'alert': return { color: '#EF5350', ring: 'ring-accent-danger/30', labelKey: 'fermentation.status_alert', dot: 'bg-accent-danger' }
    case 'idle': return { color: '#5A6B80', ring: 'ring-white/10', labelKey: 'fermentation.status_idle', dot: 'bg-text-tertiary' }
  }
}

function liquidColor(temp?: number): string {
  if (!temp) return '#5A6B80'
  if (temp < 10) return '#42A5F5'
  if (temp < 16) return '#26C6DA'
  if (temp < 22) return '#F5A623'
  return '#EF5350'
}

function fermProgress(og?: number, cg?: number, fg?: number): number {
  if (!og || !cg || !fg || og <= fg) return 0
  return Math.min(100, Math.max(0, ((og - cg) / (og - fg)) * 100))
}

function timeSince(dateStr?: string): string {
  if (!dateStr) return '—'
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

/* ── SVG Tank ──────────────────────────────────────────────────── */
function TankSVG({ fillPct, color, status, material }: {
  fillPct: number
  color: string
  status: FermenterStatus
  material: string
}) {
  const isConical = material === 'stainless' || material === 'pet'
  const fillY = 140 - (fillPct / 100) * 100 // tank body from y=40 to y=140

  return (
    <svg viewBox="0 0 80 160" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id={`liquid-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="tank-clip">
          {isConical ? (
            <path d="M15,30 L65,30 L65,120 L55,145 L25,145 L15,120 Z" />
          ) : (
            <rect x="15" y="30" width="50" height="115" rx="4" />
          )}
        </clipPath>
      </defs>

      {/* Tank outline */}
      {isConical ? (
        <>
          {/* Lid */}
          <rect x="12" y="24" width="56" height="8" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Body */}
          <path d="M15,30 L65,30 L65,120 L55,145 L25,145 L15,120 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          {/* Valve */}
          <circle cx="40" cy="150" r="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </>
      ) : (
        <>
          <rect x="15" y="26" width="50" height="8" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="15" y="30" width="50" height="115" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        </>
      )}

      {/* Liquid fill */}
      {fillPct > 0 && (
        <g clipPath="url(#tank-clip)">
          <motion.rect
            x="15"
            width="50"
            initial={{ y: 140, height: 0 }}
            animate={{ y: fillY, height: 140 - fillY }}
            transition={{ duration: 1, ease: 'easeOut' }}
            fill={`url(#liquid-${color.replace('#', '')})`}
          />
          {/* Surface wave */}
          {status === 'active' && (
            <motion.ellipse
              cx="40"
              rx="24"
              ry="2"
              fill={color}
              fillOpacity="0.6"
              animate={{ cy: [fillY, fillY - 1, fillY + 1, fillY] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </g>
      )}

      {/* Bubbles when active */}
      {status === 'active' && fillPct > 10 && (
        <>
          {[0, 0.5, 1].map((delay, i) => (
            <motion.circle
              key={i}
              cx={32 + i * 8}
              r="1.5"
              fill="white"
              fillOpacity="0.4"
              animate={{ cy: [fillY + 10, fillY - 5], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
            />
          ))}
        </>
      )}
    </svg>
  )
}

/* ── Main Component ────────────────────────────────────────────── */
export function FermenterTwin({ data, selected, onClick }: FermenterTwinProps) {
  const { t } = useTranslation('common')
  const {
    fermenter, beerName, style, dayNumber, totalDays,
    currentGravity, originalGravity, finalGravity,
    temperature, targetTemp, deviceOnline, deviceBattery,
    deviceRssi, lastSync, status,
  } = data

  const sc = statusConfig(status)
  const fillPct = status === 'idle' ? 0 : fermProgress(originalGravity, currentGravity, finalGravity)
  const liqColor = liquidColor(temperature)
  const attenuation = fillPct > 0 ? Math.round(fillPct) : null
  const abv = originalGravity && currentGravity
    ? ((originalGravity - currentGravity) * 131.25).toFixed(1)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'glass-card rounded-xl border p-4 cursor-pointer transition-all group',
        selected ? `ring-2 ${sc.ring} border-white/20` : 'border-white/10 hover:border-white/20',
        status === 'alert' && 'animate-pulse',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{fermenter.icon}</span>
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {beerName ?? fermenter.name}
            </h3>
          </div>
          <p className="text-[10px] text-text-tertiary mt-0.5 truncate">
            {beerName ? `${fermenter.name} · ${fermenter.capacity_liters}L` : `${fermenter.brand} · ${fermenter.capacity_liters}L`}
          </p>
          {style && <p className="text-[10px] text-text-secondary mt-0.5">{style}</p>}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('w-2 h-2 rounded-full', sc.dot)} />
          <span className="text-[10px] font-medium text-text-secondary">{t(sc.labelKey)}</span>
        </div>
      </div>

      {/* Tank Visualization */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-32 shrink-0">
          <TankSVG
            fillPct={status === 'idle' ? 5 : Math.max(20, 100 - fillPct)}
            color={liqColor}
            status={status}
            material={fermenter.material}
          />
        </div>

        {/* Stats column */}
        {status !== 'idle' ? (
          <div className="flex-1 space-y-2 min-w-0">
            {/* Day progress */}
            {dayNumber != null && totalDays != null && (
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-text-tertiary">{t('fermentation.day_progress', { current: dayNumber, total: totalDays })}</span>
                  <span className="text-text-secondary font-mono">{Math.round((dayNumber / totalDays) * 100)}%</span>
                </div>
                <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-amber rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(dayNumber / totalDays) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            )}

            {/* Gravity */}
            {currentGravity && (
              <div className="flex items-center gap-2">
                <Droplets size={12} className="text-accent-amber shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-tertiary">{t('fermentation.gravity')}</p>
                  <p className="text-sm font-mono font-bold text-text-primary">{currentGravity.toFixed(3)} SG</p>
                </div>
              </div>
            )}

            {/* Temperature */}
            {temperature != null && (
              <div className="flex items-center gap-2">
                <Thermometer size={12} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-tertiary">{t('fermentation.temperature')}</p>
                  <p className="text-sm font-mono font-bold text-text-primary">
                    {temperature.toFixed(1)}°C
                    {targetTemp != null && (
                      <span className="text-[10px] text-text-tertiary ml-1">({t('fermentation.target_short')}: {targetTemp}°C)</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* ABV / Attenuation */}
            {abv && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-accent-hop font-medium">{abv}% ABV</span>
                {attenuation != null && (
                  <span className="text-text-tertiary">{attenuation}% aten.</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary">
            <p className="text-xs">{t('fermentation.no_batch')}</p>
            <p className="text-[10px] mt-1">{fermenter.brand} · {fermenter.capacity_liters}L</p>
          </div>
        )}
      </div>

      {/* Device footer */}
      {deviceOnline != null && (
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-text-tertiary">
          {deviceOnline ? (
            <Wifi size={10} className="text-accent-hop" />
          ) : (
            <WifiOff size={10} className="text-accent-danger" />
          )}
          {deviceBattery != null && (
            <span className="flex items-center gap-1">
              <Battery size={10} />
              {deviceBattery}%
            </span>
          )}
          {deviceRssi != null && (
            <span className="flex items-center gap-1">
              <Signal size={10} />
              {deviceRssi} dBm
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={10} />
            {timeSince(lastSync)}
          </span>
        </div>
      )}
    </motion.div>
  )
}

/* ── Status Icon helper ────────────────────────────────────────── */
export function FermenterStatusIcon({ status, size = 14 }: { status: FermenterStatus; size?: number }) {
  switch (status) {
    case 'active': return <Activity size={size} className="text-accent-hop" />
    case 'healthy': return <CheckCircle2 size={size} className="text-green-500" />
    case 'attention': return <AlertTriangle size={size} className="text-accent-amber" />
    case 'alert': return <AlertTriangle size={size} className="text-accent-danger" />
    case 'idle': return <Clock size={size} className="text-text-tertiary" />
  }
}
