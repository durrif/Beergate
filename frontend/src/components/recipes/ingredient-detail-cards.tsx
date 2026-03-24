// src/components/recipes/ingredient-detail-cards.tsx — Rich ingredient detail cards for Beergate v4
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wheat, Leaf, Pill, ArrowRightLeft, Globe, Palette, FlaskConical, Thermometer, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MALT_MAP, type MaltSpec } from '@/data/malts'
import { HOP_MAP, type HopSpec } from '@/data/hops'
import { YEAST_MAP, type YeastSpec } from '@/data/yeasts'
import { srmToHex } from '@/lib/brew-calc'

/* ── Origin flag helper ─────────────────────────────────────── */
const ORIGIN_FLAGS: Record<string, string> = {
  DE: '🇩🇪', BE: '🇧🇪', GB: '🇬🇧', US: '🇺🇸', AU: '🇦🇺', NZ: '🇳🇿',
  CZ: '🇨🇿', IE: '🇮🇪', FR: '🇫🇷', CA: '🇨🇦', DK: '🇩🇰', NO: '🇳🇴',
}

const MALT_TYPE_COLORS: Record<string, string> = {
  base: 'bg-amber-500/20 text-amber-400',
  specialty: 'bg-purple-500/20 text-purple-400',
  caramel: 'bg-orange-500/20 text-orange-400',
  roasted: 'bg-red-900/30 text-red-400',
  adjunct: 'bg-blue-500/20 text-blue-400',
  sugar: 'bg-pink-500/20 text-pink-400',
}

const HOP_USAGE_COLORS: Record<string, string> = {
  bittering: 'bg-green-900/30 text-green-400',
  aroma: 'bg-violet-500/20 text-violet-400',
  dual: 'bg-cyan-500/20 text-cyan-400',
}

/* ── Stat Row helper ─────────────────────────────────────── */
function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
        {icon} {label}
      </span>
      <span className="text-xs font-mono text-text-primary">{value}</span>
    </div>
  )
}

/* ── Malt Detail Card ─────────────────────────────────────── */
export function MaltDetailCard({ malt, onClose }: { malt: MaltSpec; onClose: () => void }) {
  const colorHex = srmToHex(malt.color_lovibond)

  return (
    <DetailCardShell onClose={onClose} title={malt.name} subtitle={malt.brand}
      icon={<Wheat size={16} className="text-amber-400" />}
      badge={<span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', MALT_TYPE_COLORS[malt.type])}>{malt.type}</span>}
    >
      {/* Color preview */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg border border-white/10" style={{ background: colorHex }} />
        <div>
          <p className="text-xs text-text-primary font-mono">{malt.color_lovibond}°L / {malt.color_ebc} EBC</p>
          <p className="text-[10px] text-text-tertiary">Color</p>
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-0">
        <Stat label="Potencial SG" value={malt.potential_sg.toFixed(3)} icon={<FlaskConical size={12} />} />
        <Stat label="Uso máx." value={`${malt.max_pct}%`} />
        {malt.diastatic_power != null && <Stat label="Potencia diastásica" value={`${malt.diastatic_power}°L`} />}
        {malt.protein_pct != null && <Stat label="Proteína" value={`${malt.protein_pct}%`} />}
        <Stat label="Origen" value={<span>{ORIGIN_FLAGS[malt.origin] ?? ''} {malt.origin}</span>} icon={<Globe size={12} />} />
      </div>

      {/* Flavor */}
      <div className="mt-3">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Sabor / Aroma</p>
        <p className="text-xs text-text-secondary leading-relaxed">{malt.flavor}</p>
      </div>

      {/* Substitutes */}
      {malt.substitutes.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ArrowRightLeft size={10} /> Sustitutos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {malt.substitutes.map(sid => {
              const sub = MALT_MAP[sid]
              return (
                <span key={sid} className="text-[10px] bg-white/5 text-text-secondary px-2 py-0.5 rounded-full">
                  {sub?.name ?? sid}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </DetailCardShell>
  )
}

/* ── Hop Detail Card ──────────────────────────────────────── */
export function HopDetailCard({ hop, onClose }: { hop: HopSpec; onClose: () => void }) {
  return (
    <DetailCardShell onClose={onClose} title={hop.name}
      subtitle={`${ORIGIN_FLAGS[hop.origin] ?? ''} ${hop.origin}`}
      icon={<Leaf size={16} className="text-green-400" />}
      badge={<span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', HOP_USAGE_COLORS[hop.usage])}>{hop.usage}</span>}
    >
      {/* Alpha/Beta acids */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-bg-secondary/50 rounded-lg p-2 text-center">
          <p className="text-xs font-mono text-green-400 font-bold">
            {hop.alpha_acid_min}–{hop.alpha_acid_max}%
          </p>
          <p className="text-[10px] text-text-tertiary">α Ácido</p>
        </div>
        <div className="bg-bg-secondary/50 rounded-lg p-2 text-center">
          <p className="text-xs font-mono text-blue-400 font-bold">
            {hop.beta_acid_min}–{hop.beta_acid_max}%
          </p>
          <p className="text-[10px] text-text-tertiary">β Ácido</p>
        </div>
      </div>

      {/* Flavor descriptors */}
      <div className="mb-3">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1.5">Perfil de sabor</p>
        <div className="flex flex-wrap gap-1.5">
          {hop.flavor.map(f => (
            <span key={f} className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Substitutes */}
      {hop.substitutes.length > 0 && (
        <div>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ArrowRightLeft size={10} /> Sustitutos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hop.substitutes.map(sid => {
              const sub = HOP_MAP[sid]
              return (
                <span key={sid} className="text-[10px] bg-white/5 text-text-secondary px-2 py-0.5 rounded-full">
                  {sub?.name ?? sid}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </DetailCardShell>
  )
}

/* ── Yeast Detail Card ────────────────────────────────────── */
export function YeastDetailCard({ yeast, onClose }: { yeast: YeastSpec; onClose: () => void }) {
  const FLOC_COLORS: Record<string, string> = {
    low: 'text-red-400', medium: 'text-yellow-400', 'medium-high': 'text-amber-400',
    high: 'text-green-400', 'very high': 'text-emerald-400',
  }

  return (
    <DetailCardShell onClose={onClose} title={yeast.name} subtitle={yeast.brand}
      icon={<Pill size={16} className="text-violet-400" />}
      badge={<span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
        yeast.form === 'dry' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
      )}>{yeast.form}</span>}
    >
      {/* Attenuation gauge */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-tertiary">Atenuación</span>
          <span className="text-xs font-mono text-text-primary">{yeast.attenuation_min}–{yeast.attenuation_max}%</span>
        </div>
        <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-accent-amber rounded-full"
            style={{ marginLeft: `${yeast.attenuation_min - 55}%`, width: `${yeast.attenuation_max - yeast.attenuation_min + 5}%` }}
          />
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-0">
        {yeast.strain && <Stat label="Cepa" value={yeast.strain} />}
        <Stat label="Temp. óptima" value={`${yeast.temp_min}–${yeast.temp_max}°C`} icon={<Thermometer size={12} />} />
        <Stat label="Tolerancia alcohol" value={`${yeast.alcohol_tolerance_pct}%`} />
        <Stat label="Floculación" value={
          <span className={FLOC_COLORS[yeast.flocculation] ?? 'text-text-primary'}>{yeast.flocculation}</span>
        } />
      </div>

      {/* Flavor */}
      <div className="mt-3">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Carácter</p>
        <p className="text-xs text-text-secondary leading-relaxed">{yeast.flavor}</p>
      </div>

      {/* Style recommendations */}
      {yeast.styles.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1.5">Estilos recomendados</p>
          <div className="flex flex-wrap gap-1.5">
            {yeast.styles.map(s => (
              <span key={s} className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </DetailCardShell>
  )
}

/* ── Shared detail card shell ─────────────────────────────── */
function DetailCardShell({ onClose, title, subtitle, icon, badge, children }: {
  onClose: () => void; title: string; subtitle?: string
  icon: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute z-60 top-full mt-1 right-0 w-72 glass-card rounded-xl border border-white/10 shadow-elevated p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h4 className="text-sm font-display font-bold text-text-primary truncate">{title}</h4>
            {subtitle && <p className="text-[10px] text-text-tertiary">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {badge}
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary transition-colors p-0.5">
            <X size={14} />
          </button>
        </div>
      </div>

      {children}
    </motion.div>
  )
}

/* ── Clickable detail trigger (wraps ingredient name) ─────── */
export function IngredientDetailTrigger({ children, detail }: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        className="text-left hover:text-accent-amber transition-colors cursor-pointer flex items-center gap-1"
      >
        {children}
        <Info size={10} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
            {detail}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
