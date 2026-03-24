// src/components/recipes/style-selector.tsx — BJCP 2021 Style Selector + Conformance Indicator
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Check, AlertTriangle, X, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BJCP_STYLES, BJCP_CATEGORIES, BJCP_MAP, checkStyleConformance, type BJCPStyle } from '@/data/bjcp-styles'
import { srmToHex } from '@/lib/brew-calc'

/* ── Style Selector Dropdown ──────────────────────────────── */
interface StyleSelectorProps {
  value: string       // style_code like '21A'
  onChange: (styleId: string, styleName: string) => void
  className?: string
}

export function StyleSelector({ value, onChange, className }: StyleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = value ? BJCP_MAP[value] : null

  const grouped = useMemo(() => {
    const q = query.toLowerCase()
    const filtered = q
      ? BJCP_STYLES.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.categoryName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        )
      : BJCP_STYLES

    const groups: Record<string, BJCPStyle[]> = {}
    for (const style of filtered) {
      const cat = style.categoryName
      if (!groups[cat]) groups[cat] = []
      groups[cat]!.push(style)
    }
    return groups
  }, [query])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-secondary border border-white/10 rounded-lg text-sm text-left hover:border-accent-amber/30 transition-colors"
      >
        <span className={selected ? 'text-text-primary' : 'text-text-tertiary'}>
          {selected ? `${selected.id} — ${selected.name}` : 'Seleccionar estilo BJCP...'}
        </span>
        <ChevronDown size={14} className={cn('text-text-tertiary transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 top-full mt-1 w-full max-h-80 overflow-hidden bg-bg-tertiary border border-white/10 rounded-xl shadow-elevated flex flex-col"
            >
              {/* Search */}
              <div className="p-2 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                  <input
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar estilo... (IPA, Stout, Pilsner...)"
                    className="w-full pl-8 pr-3 py-1.5 bg-bg-secondary border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/50"
                    autoFocus
                  />
                </div>
              </div>

              {/* Grouped list */}
              <div className="flex-1 overflow-y-auto">
                {Object.entries(grouped).map(([cat, styles]) => (
                  <div key={cat}>
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-accent-amber/70 font-bold bg-bg-secondary/30 sticky top-0">
                      {cat}
                    </p>
                    {styles.map(s => (
                      <button
                        key={s.id} type="button"
                        onClick={() => { onChange(s.id, s.name); setOpen(false); setQuery('') }}
                        className={cn(
                          'w-full px-3 py-2 text-left text-xs hover:bg-bg-hover transition-colors flex items-center gap-2',
                          value === s.id && 'bg-accent-amber/10',
                        )}
                      >
                        <span className="text-text-tertiary font-mono w-6 flex-shrink-0">{s.id}</span>
                        <span className="text-text-primary flex-1">{s.name}</span>
                        <span className="text-[10px] text-text-tertiary">
                          {s.abv_min}–{s.abv_max}%
                        </span>
                        {value === s.id && <Check size={12} className="text-accent-amber" />}
                      </button>
                    ))}
                  </div>
                ))}
                {Object.keys(grouped).length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-6">Sin resultados</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Style Conformance Indicator ──────────────────────────── */
interface StyleConformanceProps {
  styleId: string
  og: number; fg: number; ibu: number; srm: number; abv: number
}

export function StyleConformance({ styleId, og, fg, ibu, srm, abv }: StyleConformanceProps) {
  const result = useMemo(
    () => checkStyleConformance(styleId, og, fg, ibu, srm, abv),
    [styleId, og, fg, ibu, srm, abv],
  )

  if (!result) return null

  const { style, inRange, outOfRange, score } = result

  const paramLabels: Record<string, string> = { og: 'OG', fg: 'FG', ibu: 'IBU', srm: 'SRM', abv: 'ABV' }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      className="glass-card rounded-xl border border-white/10 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-accent-amber" />
          <h4 className="text-xs font-display font-bold text-text-primary">
            Conformidad BJCP
          </h4>
        </div>
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          inRange ? 'bg-green-500/20 text-green-400' : score >= 0.6 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400',
        )}>
          {inRange ? 'En rango' : `${Math.round(score * 100)}% conforme`}
        </span>
      </div>

      {/* Style info */}
      <p className="text-[10px] text-text-tertiary">
        {style.id} — {style.name}
      </p>

      {/* Parameter bars */}
      <div className="space-y-2">
        {[
          { key: 'og' as const, value: og, min: style.og_min, max: style.og_max, fmt: (v: number) => v.toFixed(3) },
          { key: 'fg' as const, value: fg, min: style.fg_min, max: style.fg_max, fmt: (v: number) => v.toFixed(3) },
          { key: 'ibu' as const, value: ibu, min: style.ibu_min, max: style.ibu_max, fmt: (v: number) => Math.round(v).toString() },
          { key: 'srm' as const, value: srm, min: style.srm_min, max: style.srm_max, fmt: (v: number) => v.toFixed(1) },
          { key: 'abv' as const, value: abv, min: style.abv_min, max: style.abv_max, fmt: (v: number) => v.toFixed(1) + '%' },
        ].map(p => {
          const isIn = p.value >= p.min && p.value <= p.max
          // Position: map value within an expanded range for visual
          const rangeSpan = p.max - p.min || 0.001
          const margin = rangeSpan * 0.3
          const visMin = p.min - margin
          const visMax = p.max + margin
          const visSpan = visMax - visMin
          const pos = Math.max(0, Math.min(100, ((p.value - visMin) / visSpan) * 100))
          const rangeLeft = ((p.min - visMin) / visSpan) * 100
          const rangeWidth = (rangeSpan / visSpan) * 100

          return (
            <div key={p.key} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-tertiary">{paramLabels[p.key]}</span>
                <span className={cn('text-[10px] font-mono', isIn ? 'text-green-400' : 'text-red-400')}>
                  {p.fmt(p.value)}
                  <span className="text-text-tertiary ml-1">({p.fmt(p.min)}–{p.fmt(p.max)})</span>
                </span>
              </div>
              <div className="relative h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                {/* Valid range zone */}
                <div
                  className="absolute h-full bg-green-500/20 rounded-full"
                  style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }}
                />
                {/* Marker */}
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border',
                    isIn ? 'bg-green-400 border-green-400/50' : 'bg-red-400 border-red-400/50',
                  )}
                  style={{ left: `${pos}%`, transform: `translateX(-50%) translateY(-50%)` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Out of range warnings */}
      {outOfRange.length > 0 && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-400/80">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span>
            {outOfRange.map(p => paramLabels[p.name]).join(', ')} fuera de rango para {style.name}
          </span>
        </div>
      )}

      {/* Examples */}
      {style.examples.length > 0 && (
        <p className="text-[10px] text-text-tertiary">
          Ejemplos: {style.examples.slice(0, 3).join(', ')}
        </p>
      )}
    </motion.div>
  )
}
