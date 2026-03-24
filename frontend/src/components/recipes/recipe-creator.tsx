// frontend/src/components/recipes/recipe-creator.tsx — Beergate v3 Recipe Creator/Calculator
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, GripVertical, Save, ChevronDown, ChevronUp,
  Beaker, Droplets, Zap, Thermometer, FlaskConical, Search,
  ArrowLeft, Sparkles, Wheat, Leaf, Pill, ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MALT_DATABASE, type MaltSpec } from '@/data/malts'
import { HOP_DATABASE, type HopSpec } from '@/data/hops'
import { YEAST_DATABASE, type YeastSpec } from '@/data/yeasts'
import {
  calcOG, calcFG, calcABV, calcTotalIBU, calcSRM, srmToHex,
  calcStrikeTemp, calcPrimingSugar, calcForcedCarbPSI,
  sgToPlato,
} from '@/lib/brew-calc'
import { useCreateRecipe, useUpdateRecipe } from '@/hooks/use-recipes'
import { toast } from 'sonner'
import type { Recipe, RecipeIngredient, MashStep } from '@/lib/types'
import { StyleSelector, StyleConformance } from './style-selector'
import { MaltDetailCard, HopDetailCard, YeastDetailCard, IngredientDetailTrigger } from './ingredient-detail-cards'
import { MALT_MAP } from '@/data/malts'
import { HOP_MAP } from '@/data/hops'
import { YEAST_MAP } from '@/data/yeasts'

/* ── Types ─────────────────────────────────────────────────────── */
interface GrainRow {
  id: string; maltId: string; name: string; amount_kg: number
  potential_sg: number; color_lovibond: number; type: string
}
interface HopRow {
  id: string; hopId: string; name: string; amount_g: number
  alpha_pct: number; time_min: number; use: 'boil' | 'whirlpool' | 'dry-hop'
}
interface YeastRow {
  id: string; yeastId: string; name: string; brand: string
  attenuation: number; tempMin: number; tempMax: number
}

const uid = () => crypto.randomUUID().slice(0, 8)

/* ── Autocomplete Search ───────────────────────────────────────── */
function IngredientSearch<T extends { id: string; name: string }>({
  items, onSelect, placeholder, renderItem, className,
}: {
  items: T[]
  onSelect: (item: T) => void
  placeholder: string
  renderItem?: (item: T) => React.ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 15)
    const q = query.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)).slice(0, 15)
  }, [items, query])

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-1.5 bg-bg-secondary border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/50"
        />
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto bg-bg-tertiary border border-white/10 rounded-lg shadow-elevated"
          >
            {filtered.map(item => (
              <button
                key={item.id} type="button"
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-bg-hover transition-colors flex items-center gap-2"
                onClick={() => { onSelect(item); setQuery(''); setOpen(false) }}
              >
                {renderItem ? renderItem(item) : (
                  <span className="text-text-primary">{item.name}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

/* ── Stats Panel ───────────────────────────────────────────────── */
function StatCard({ label, value, unit, icon, color }: {
  label: string; value: string; unit?: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="glass-card rounded-lg border border-white/5 p-3 text-center">
      <div className={cn('mx-auto mb-1', color)}>{icon}</div>
      <p className="font-display text-xl font-bold text-text-primary">{value}</p>
      {unit && <p className="text-[10px] text-text-tertiary">{unit}</p>}
      <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

/* ── Color Swatch ──────────────────────────────────────────────── */
function BeerColorSwatch({ srm }: { srm: number }) {
  const hex = srmToHex(srm)
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-14 rounded-lg border border-white/10 shadow-inner"
        style={{ background: `linear-gradient(180deg, ${hex}cc 0%, ${hex} 100%)` }}
      />
      <span className="text-[10px] text-text-tertiary">{srm.toFixed(1)} SRM</span>
    </div>
  )
}

/* ── Main Recipe Creator ───────────────────────────────────────── */
interface RecipeCreatorProps {
  recipe?: Recipe | null
  onClose: () => void
}

export function RecipeCreator({ recipe, onClose }: RecipeCreatorProps) {
  const { t } = useTranslation('common')
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()
  const isEdit = !!recipe

  // Recipe metadata
  const [name, setName] = useState(recipe?.name ?? '')
  const [style, setStyle] = useState(recipe?.style ?? '')
  const [styleCode, setStyleCode] = useState(recipe?.style_code ?? '')
  const [batchSize, setBatchSize] = useState(recipe?.batch_size_liters ?? 20)
  const [efficiency, setEfficiency] = useState(recipe?.efficiency_pct ?? 72)
  const [boilTime, setBoilTime] = useState(60)
  const [notes, setNotes] = useState(recipe?.notes ?? '')

  // Grain bill
  const [grains, setGrains] = useState<GrainRow[]>(() => {
    if (recipe?.fermentables?.length) {
      return recipe.fermentables.map(f => ({
        id: uid(), maltId: '', name: f.name, amount_kg: f.amount_kg ?? 0,
        potential_sg: 1.037, color_lovibond: f.color_ebc ? f.color_ebc / 1.97 : 3, type: f.type ?? 'base',
      }))
    }
    return []
  })

  // Hops
  const [hops, setHops] = useState<HopRow[]>(() => {
    if (recipe?.hops?.length) {
      return recipe.hops.map(h => ({
        id: uid(), hopId: '', name: h.name, amount_g: h.amount_g ?? (h.amount_kg ? h.amount_kg * 1000 : 0),
        alpha_pct: h.alpha_pct ?? 5, time_min: h.time_min ?? 60, use: 'boil' as const,
      }))
    }
    return []
  })

  // Yeast
  const [yeast, setYeast] = useState<YeastRow | null>(() => {
    if (recipe?.yeasts?.length) {
      const y = recipe.yeasts[0]!
      return {
        id: uid(), yeastId: '', name: y.name, brand: y.lab ?? '',
        attenuation: y.attenuation_pct ?? 78, tempMin: y.min_temp ?? 15, tempMax: y.max_temp ?? 24,
      }
    }
    return null
  })

  // Mash steps
  const [mashSteps, setMashSteps] = useState<Array<{ id: string; name: string; temp_c: number; time_min: number }>>(() => {
    if (recipe?.mash_steps?.length) {
      return recipe.mash_steps.map(s => ({
        id: uid(), name: s.name ?? '', temp_c: s.temp_c, time_min: s.duration_min ?? s.time_min ?? 60,
      }))
    }
    return [{ id: uid(), name: 'Sacarificación', temp_c: 67, time_min: 60 }]
  })

  // ── Calculations (real-time) ──────────────────────────────
  const og = useMemo(
    () => calcOG(grains.map(g => ({ amount_kg: g.amount_kg, potential_sg: g.potential_sg })), batchSize, efficiency),
    [grains, batchSize, efficiency],
  )
  const attenuation = yeast?.attenuation ?? 78
  const fg = useMemo(() => calcFG(og, attenuation), [og, attenuation])
  const abv = useMemo(() => calcABV(og, fg), [og, fg])
  const ibu = useMemo(
    () => calcTotalIBU(hops.filter(h => h.use === 'boil').map(h => ({ alpha_pct: h.alpha_pct, amount_g: h.amount_g, time_min: h.time_min })), og, batchSize),
    [hops, og, batchSize],
  )
  const srm = useMemo(
    () => calcSRM(grains.map(g => ({ amount_kg: g.amount_kg, color_lovibond: g.color_lovibond })), batchSize),
    [grains, batchSize],
  )
  const buGuRatio = og > 1 ? (ibu / ((og - 1) * 1000)).toFixed(2) : '—'
  const totalGrainKg = grains.reduce((s, g) => s + g.amount_kg, 0)
  const strikeTemp = mashSteps[0] ? calcStrikeTemp(2.8, 20, mashSteps[0].temp_c) : 0

  // ── Handlers ──────────────────────────────────────────────
  const addGrain = (malt: MaltSpec) => {
    setGrains(prev => [...prev, {
      id: uid(), maltId: malt.id, name: malt.name, amount_kg: 1,
      potential_sg: malt.potential_sg, color_lovibond: malt.color_lovibond, type: malt.type,
    }])
  }

  const addHop = (hop: HopSpec) => {
    const alpha = (hop.alpha_acid_min + hop.alpha_acid_max) / 2
    setHops(prev => [...prev, {
      id: uid(), hopId: hop.id, name: hop.name, amount_g: 25,
      alpha_pct: alpha, time_min: 60, use: 'boil',
    }])
  }

  const selectYeast = (y: YeastSpec) => {
    setYeast({
      id: uid(), yeastId: y.id, name: y.name, brand: y.brand,
      attenuation: (y.attenuation_min + y.attenuation_max) / 2,
      tempMin: y.temp_min, tempMax: y.temp_max,
    })
  }

  const updateGrain = (id: string, field: keyof GrainRow, value: number | string) =>
    setGrains(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  const removeGrain = (id: string) => setGrains(prev => prev.filter(g => g.id !== id))

  const updateHop = (id: string, field: keyof HopRow, value: number | string) =>
    setHops(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  const removeHop = (id: string) => setHops(prev => prev.filter(h => h.id !== id))

  const addMashStep = () =>
    setMashSteps(prev => [...prev, { id: uid(), name: '', temp_c: 72, time_min: 15 }])
  const updateMashStep = (id: string, field: string, value: number | string) =>
    setMashSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  const removeMashStep = (id: string) => setMashSteps(prev => prev.filter(s => s.id !== id))

  // ── Save ──────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!name.trim()) { toast.error('Nombre requerido'); return }

    const data: Partial<Recipe> = {
      name, style, style_code: styleCode || undefined, batch_size_liters: batchSize, efficiency_pct: efficiency,
      og: Math.round(og * 1000) / 1000,
      fg: Math.round(fg * 1000) / 1000,
      abv: Math.round(abv * 10) / 10,
      ibu: Math.round(ibu),
      srm: Math.round(srm * 10) / 10,
      notes,
      fermentables: grains.map(g => ({
        name: g.name, amount_kg: g.amount_kg, type: g.type, color_ebc: Math.round(g.color_lovibond * 1.97),
      })),
      hops: hops.map(h => ({
        name: h.name, amount_g: h.amount_g, alpha_pct: h.alpha_pct,
        time_min: h.use === 'dry-hop' ? 0 : h.time_min, use: h.use,
      })),
      yeasts: yeast ? [{ name: yeast.name, lab: yeast.brand, attenuation_pct: yeast.attenuation }] : [],
      mash_steps: mashSteps.map(s => ({ name: s.name || undefined, temp_c: s.temp_c, duration_min: s.time_min })),
    }

    if (isEdit && recipe) {
      updateRecipe.mutate({ id: Number(recipe.id), data }, {
        onSuccess: () => { toast.success(t('recipes.updated')); onClose() },
        onError: () => toast.error(t('recipes.update_error')),
      })
    } else {
      createRecipe.mutate(data, {
        onSuccess: () => { toast.success(t('recipes.created')); onClose() },
        onError: () => toast.error(t('recipes.create_error')),
      })
    }
  }, [name, style, batchSize, efficiency, og, fg, abv, ibu, srm, notes, grains, hops, yeast, mashSteps, isEdit, recipe, createRecipe, updateRecipe, onClose])

  // ── Collapsible sections ──────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    grains: true, hops: true, yeast: true, mash: false, tools: false,
  })
  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex bg-bg-primary/80 backdrop-blur-sm"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm">
              <ArrowLeft size={16} /> {t('recipes.back_to_list')}
            </button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 text-text-secondary" onClick={onClose}>
                {t('actions.cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-accent-amber text-bg-primary hover:bg-accent-amber/90 font-medium"
                onClick={handleSave}
                disabled={createRecipe.isPending || updateRecipe.isPending}
              >
                <Save size={14} className="mr-1.5" />
                {isEdit ? t('recipes.save_recipe') : t('recipes.create_recipe')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── LEFT: Metadata + Ingredients ─────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Metadata card */}
              <div className="glass-card rounded-xl border border-white/10 p-4 space-y-3">
                <h2 className="font-display font-bold text-lg text-text-primary">
                  {isEdit ? t('recipes.edit_recipe') : t('recipes.new_recipe')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">{t('recipes.recipe_name')}</label>
                    <Input value={name} onChange={e => setName(e.target.value)}
                      className="bg-bg-secondary border-white/10 text-sm" placeholder="West Coast IPA" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">{t('recipes.style')} (BJCP)</label>
                    <StyleSelector
                      value={styleCode}
                      onChange={(id, name) => { setStyleCode(id); setStyle(name) }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">{t('recipes.batch_size')}</label>
                    <Input type="number" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
                      className="bg-bg-secondary border-white/10 text-sm" min={1} step={1} />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">{t('recipes.efficiency')}</label>
                    <Input type="number" value={efficiency} onChange={e => setEfficiency(Number(e.target.value))}
                      className="bg-bg-secondary border-white/10 text-sm" min={50} max={95} step={1} />
                  </div>
                </div>
              </div>

              {/* ─── Grain Bill ────────────────────────────────── */}
              <SectionCard
                title={t('recipes.fermentables')} icon={<Wheat size={16} />} badge={`${grains.length}`}
                open={openSections.grains ?? true} onToggle={() => toggleSection('grains')}
              >
                <IngredientSearch
                  items={MALT_DATABASE} onSelect={addGrain} placeholder={t('recipes.add_grain')}
                  className="mb-3"
                  renderItem={m => (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-text-primary">{m.name} <span className="text-text-tertiary ml-1">{m.brand}</span></span>
                      <span className="text-text-tertiary text-[10px]">{m.color_lovibond}°L · {m.type}</span>
                    </div>
                  )}
                />
                {grains.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">{t('recipes.search_add_malts')}</p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[1fr_80px_60px_28px] gap-2 text-[10px] text-text-tertiary uppercase tracking-wider px-1">
                      <span>{t('recipes.malt')}</span><span>{t('recipes.quantity')}</span><span>%</span><span />
                    </div>
                    {grains.map(g => {
                      const pct = totalGrainKg > 0 ? (g.amount_kg / totalGrainKg * 100) : 0
                      return (
                        <motion.div key={g.id} layout
                          className="grid grid-cols-[1fr_80px_60px_28px] gap-2 items-center bg-bg-secondary/50 rounded-lg px-2 py-1.5 group"
                        >
                          <IngredientDetailTrigger
                            detail={MALT_MAP[g.maltId] ? <MaltDetailCard malt={MALT_MAP[g.maltId]!} onClose={() => {}} /> : null}
                          >
                            <span className="text-xs text-text-primary truncate" title={g.name}>{g.name}</span>
                          </IngredientDetailTrigger>
                          <input type="number" value={g.amount_kg} min={0.01} step={0.1}
                            onChange={e => updateGrain(g.id, 'amount_kg', Number(e.target.value))}
                            className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-xs text-center text-text-primary w-full"
                          />
                          <span className="text-xs text-text-secondary text-center">{pct.toFixed(1)}%</span>
                          <button onClick={() => removeGrain(g.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-danger">
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      )
                    })}
                    <p className="text-xs text-text-tertiary text-right pr-1">
                      Total: {totalGrainKg.toFixed(2)} kg
                    </p>
                  </div>
                )}
              </SectionCard>

              {/* ─── Hops ─────────────────────────────────────── */}
              <SectionCard
                title={t('recipes.hops')} icon={<Leaf size={16} />} badge={`${hops.length}`}
                open={openSections.hops ?? true} onToggle={() => toggleSection('hops')}
              >
                <IngredientSearch
                  items={HOP_DATABASE} onSelect={addHop} placeholder={t('recipes.add_hop')}
                  className="mb-3"
                  renderItem={h => (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-text-primary">{h.name} <span className="text-text-tertiary ml-1">{h.origin}</span></span>
                      <span className="text-text-tertiary text-[10px]">α {h.alpha_acid_min}-{h.alpha_acid_max}% · {h.usage}</span>
                    </div>
                  )}
                />
                {hops.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">{t('recipes.search_add_hops')}</p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[1fr_65px_55px_65px_28px] gap-2 text-[10px] text-text-tertiary uppercase tracking-wider px-1">
                      <span>{t('recipes.hops')}</span><span>{t('recipes.grams')}</span><span>α %</span><span>{t('recipes.time')}</span><span />
                    </div>
                    {hops.map(h => (
                      <motion.div key={h.id} layout
                        className="grid grid-cols-[1fr_65px_55px_65px_28px] gap-2 items-center bg-bg-secondary/50 rounded-lg px-2 py-1.5 group"
                      >
                        <IngredientDetailTrigger
                          detail={HOP_MAP[h.hopId] ? <HopDetailCard hop={HOP_MAP[h.hopId]!} onClose={() => {}} /> : null}
                        >
                          <span className="text-xs text-text-primary truncate">{h.name}</span>
                        </IngredientDetailTrigger>
                        <input type="number" value={h.amount_g} min={1} step={1}
                          onChange={e => updateHop(h.id, 'amount_g', Number(e.target.value))}
                          className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-center text-text-primary w-full"
                        />
                        <input type="number" value={h.alpha_pct} min={0.1} step={0.1}
                          onChange={e => updateHop(h.id, 'alpha_pct', Number(e.target.value))}
                          className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-center text-text-primary w-full"
                        />
                        <div className="flex items-center gap-1">
                          <input type="number" value={h.time_min} min={0} step={5}
                            onChange={e => updateHop(h.id, 'time_min', Number(e.target.value))}
                            className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-center text-text-primary w-14"
                          />
                        </div>
                        <button onClick={() => removeHop(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-danger">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* ─── Yeast ────────────────────────────────────── */}
              <SectionCard
                title={t('recipes.yeasts')} icon={<Pill size={16} />} badge={yeast ? '1' : '0'}
                open={openSections.yeast ?? true} onToggle={() => toggleSection('yeast')}
              >
                {!yeast ? (
                  <IngredientSearch
                    items={YEAST_DATABASE} onSelect={selectYeast} placeholder={t('recipes.add_yeast')}
                    renderItem={y => (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-text-primary">{y.name} <span className="text-text-tertiary ml-1">{y.brand}</span></span>
                        <span className="text-text-tertiary text-[10px]">{y.attenuation_min}-{y.attenuation_max}% · {y.form}</span>
                      </div>
                    )}
                  />
                ) : (
                  <div className="bg-bg-secondary/50 rounded-lg p-3 flex items-center justify-between group">
                    <IngredientDetailTrigger
                      detail={YEAST_MAP[yeast.yeastId] ? <YeastDetailCard yeast={YEAST_MAP[yeast.yeastId]!} onClose={() => {}} /> : null}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{yeast.name}</p>
                        <p className="text-xs text-text-secondary">{yeast.brand} · Att: {yeast.attenuation}% · {yeast.tempMin}-{yeast.tempMax}°C</p>
                      </div>
                    </IngredientDetailTrigger>
                    <button onClick={() => setYeast(null)} className="text-accent-danger hover:scale-110 transition-transform">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* ─── Mash Schedule ─────────────────────────────── */}
              <SectionCard
                title={t('recipes.mash_schedule')} icon={<Thermometer size={16} />} badge={`${mashSteps.length}`}
                open={openSections.mash ?? false} onToggle={() => toggleSection('mash')}
              >
                <div className="space-y-1.5">
                  {mashSteps.map((s, i) => (
                    <div key={s.id} className="grid grid-cols-[1fr_70px_70px_28px] gap-2 items-center bg-bg-secondary/50 rounded-lg px-2 py-1.5 group">
                      <input type="text" value={s.name} placeholder={`Paso ${i + 1}`}
                        onChange={e => updateMashStep(s.id, 'name', e.target.value)}
                        className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-xs text-text-primary w-full"
                      />
                      <div className="flex items-center gap-0.5">
                        <input type="number" value={s.temp_c} min={30} max={80} step={1}
                          onChange={e => updateMashStep(s.id, 'temp_c', Number(e.target.value))}
                          className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-center text-text-primary w-full"
                        />
                        <span className="text-[10px] text-text-tertiary">°C</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <input type="number" value={s.time_min} min={1} step={5}
                          onChange={e => updateMashStep(s.id, 'time_min', Number(e.target.value))}
                          className="bg-transparent border border-white/10 rounded px-1 py-0.5 text-xs text-center text-text-primary w-full"
                        />
                        <span className="text-[10px] text-text-tertiary">min</span>
                      </div>
                      <button onClick={() => removeMashStep(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addMashStep} className="flex items-center gap-1 text-xs text-accent-amber hover:text-accent-amber/80 pt-1">
                    <Plus size={12} /> {t('recipes.add_step')}
                  </button>
                </div>
                {mashSteps.length > 0 && strikeTemp > 0 && (
                  <p className="text-xs text-text-secondary mt-2">
                    <Thermometer size={12} className="inline mr-1" />
                    Temp. agua de empaste: <span className="font-mono text-accent-amber">{strikeTemp.toFixed(1)}°C</span>
                    <span className="text-text-tertiary ml-1">(ratio 2.8 L/kg, grano a 20°C)</span>
                  </p>
                )}
              </SectionCard>

              {/* ─── Notes ─────────────────────────────────────── */}
              <div className="glass-card rounded-xl border border-white/10 p-4">
                <label className="text-xs text-text-secondary mb-1 block">{t('recipes.notes')}</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent-amber/50"
                  placeholder={t('recipes.notes_placeholder')}
                />
              </div>
            </div>

            {/* ─── RIGHT: Live Stats Dashboard ─────────────────── */}
            <div className="space-y-4">
              {/* Style conformance */}
              {styleCode && (
                <StyleConformance styleId={styleCode} og={og} fg={fg} ibu={ibu} srm={srm} abv={abv} />
              )}

              <div className="glass-card rounded-xl border border-white/10 p-4 sticky top-4">
                <h3 className="font-display font-bold text-sm text-text-primary mb-3">
                  Estadísticas en vivo
                </h3>

                <div className="flex items-center gap-3 mb-4 justify-center">
                  <BeerColorSwatch srm={srm} />
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-text-primary">
                      {abv.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-text-secondary">ABV estimado</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <StatCard label="OG" value={og.toFixed(3)} unit={`${sgToPlato(og).toFixed(1)}°P`}
                    icon={<Droplets size={16} />} color="text-blue-400" />
                  <StatCard label="FG" value={fg.toFixed(3)} unit={`${sgToPlato(fg).toFixed(1)}°P`}
                    icon={<Droplets size={16} />} color="text-cyan-400" />
                  <StatCard label="IBU" value={Math.round(ibu).toString()} unit={`BU:GU ${buGuRatio}`}
                    icon={<Beaker size={16} />} color="text-green-400" />
                  <StatCard label="SRM" value={srm.toFixed(1)} unit={`${(srm * 1.97).toFixed(0)} EBC`}
                    icon={<Zap size={16} />} color="text-amber-400" />
                </div>

                {/* Quick calcs */}
                <div className="border-t border-white/5 pt-3 space-y-2">
                  <p className="text-xs text-text-secondary">
                    <FlaskConical size={12} className="inline mr-1" />
                    Grano total: <span className="font-mono text-text-primary">{totalGrainKg.toFixed(2)} kg</span>
                  </p>
                  {strikeTemp > 0 && (
                    <p className="text-xs text-text-secondary">
                      <Thermometer size={12} className="inline mr-1" />
                      Agua empaste: <span className="font-mono text-text-primary">{strikeTemp.toFixed(1)}°C</span>
                    </p>
                  )}
                  <p className="text-xs text-text-secondary">
                    <Sparkles size={12} className="inline mr-1" />
                    Priming (2.4 vol): <span className="font-mono text-text-primary">{calcPrimingSugar(2.4, 20, batchSize).toFixed(0)} g</span> azúcar
                  </p>
                  <p className="text-xs text-text-secondary">
                    <Sparkles size={12} className="inline mr-1" />
                    Carb. forzada (2.4 vol, 3°C): <span className="font-mono text-text-primary">{calcForcedCarbPSI(2.4, 3).toFixed(1)} PSI</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Collapsible Section Card ──────────────────────────────────── */
function SectionCard({ title, icon, badge, open, onToggle, children }: {
  title: string; icon: React.ReactNode; badge?: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-accent-amber">{icon}</span>
          <span className="font-display font-bold text-sm text-text-primary">{title}</span>
          {badge && (
            <span className="text-[10px] bg-white/5 text-text-secondary px-1.5 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RecipeCreator
