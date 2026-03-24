// frontend/src/pages/recipes.tsx — Beergate v3 Recipe Library
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Upload, RefreshCw, Grid3x3, List, Filter,
  SlidersHorizontal, BookOpen, Sparkles, X, FileDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

import { useUIStore } from '@/stores/ui-store'
import { useRecipes, useImportBeerXML, useStartBrewFromRecipe } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { srmToHex } from '@/lib/brew-calc'
import { toast } from 'sonner'
import type { Recipe } from '@/lib/types'

const RecipeCreator = lazy(() => import('@/components/recipes/recipe-creator'))

/* ── Sort options ──────────────────────────────────────────────── */
type SortKey = 'name' | 'style' | 'abv' | 'ibu' | 'recent'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'style', label: 'Estilo' },
  { key: 'abv', label: 'ABV' },
  { key: 'ibu', label: 'IBU' },
  { key: 'recent', label: 'Reciente' },
]

function sortRecipes(recipes: Recipe[], key: SortKey): Recipe[] {
  const sorted = [...recipes]
  switch (key) {
    case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'style': return sorted.sort((a, b) => (a.style ?? '').localeCompare(b.style ?? ''))
    case 'abv': return sorted.sort((a, b) => (b.abv ?? 0) - (a.abv ?? 0))
    case 'ibu': return sorted.sort((a, b) => (b.ibu ?? 0) - (a.ibu ?? 0))
    case 'recent': return sorted.reverse()
    default: return sorted
  }
}

/* ── ABV range filter ──────────────────────────────────────────── */
const ABV_RANGES = [
  { label: 'Todas', min: 0, max: 100 },
  { label: '< 4%', min: 0, max: 4 },
  { label: '4-6%', min: 4, max: 6 },
  { label: '6-8%', min: 6, max: 8 },
  { label: '> 8%', min: 8, max: 100 },
]

/* ── Main Page ─────────────────────────────────────────────────── */
export default function RecipesPage() {
  const { t } = useTranslation('common')
  const { setActivePage } = useUIStore()
  useEffect(() => { setActivePage('recipes') }, [setActivePage])

  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  // State
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [abvRange, setAbvRange] = useState(ABV_RANGES[0]!)
  const [showFilters, setShowFilters] = useState(false)
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Data
  const { data: recipes = [], isLoading } = useRecipes(search || undefined)
  const importBeerXML = useImportBeerXML()
  const startBrew = useStartBrewFromRecipe()

  // Apply filters + sort
  const filtered = sortRecipes(
    recipes.filter(r => {
      const abv = r.abv ?? 0
      return abv >= abvRange.min && abv < abvRange.max
    }),
    sortKey,
  )

  // Unique styles for stat
  const styles = new Set(recipes.map(r => r.style).filter(Boolean))

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importBeerXML.mutate(file, {
      onSuccess: (imported: Recipe[]) => toast.success(`${imported.length} ${t('recipes.import_success')}`),
      onError: () => toast.error(t('recipes.import_error')),
    })
    e.target.value = ''
  }, [importBeerXML])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.xml')) {
      toast.error('Solo archivos BeerXML (.xml)')
      return
    }
    importBeerXML.mutate(file, {
      onSuccess: (imported: Recipe[]) => toast.success(`${imported.length} ${t('recipes.import_success')}`),
      onError: () => toast.error(t('recipes.import_error')),
    })
  }, [importBeerXML])

  const handleStartBrew = (recipeId: string) => {
    startBrew.mutate(Number(recipeId), {
      onSuccess: () => {
        toast.success(t('brew_day.batch_started'))
        navigate({ to: '/brewing' })
      },
      onError: () => toast.error(t('brew_day.advance_error')),
    })
  }

  const handleEdit = (recipe: Recipe) => {
    setEditRecipe(recipe)
    setCreatorOpen(true)
  }

  return (
    <>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5"
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
              <div className="border-2 border-dashed border-accent-amber/50 rounded-2xl p-12 text-center">
                <Upload className="w-12 h-12 text-accent-amber mx-auto mb-3" />
                <p className="text-lg font-display font-bold text-text-primary">Suelta tu BeerXML aquí</p>
                <p className="text-sm text-text-secondary mt-1">Archivos .xml compatibles con BeerXML 1.0</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {t('recipes.title')}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {recipes.length} recetas · {styles.size} estilos
            </p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={handleImport} />
            <Button
              variant="outline" size="sm"
              className="border-white/10 text-text-secondary hover:text-text-primary text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={importBeerXML.isPending}
            >
              {importBeerXML.isPending
                ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                : <Upload className="w-3.5 h-3.5 mr-1" />}
              {t('recipes.import_beerxml')}
            </Button>
            <Button
              size="sm"
              className="bg-accent-amber text-bg-primary hover:bg-accent-amber/90 font-medium text-xs"
              onClick={() => { setEditRecipe(null); setCreatorOpen(true) }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('recipes.new_recipe')}
            </Button>
          </div>
        </div>

        {/* ── Search + View Controls ────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('recipes.search_placeholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
            className="bg-bg-secondary border border-white/10 rounded-lg text-xs text-text-secondary px-3 py-2 focus:outline-none focus:border-accent-amber/50"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <Button
            variant="outline" size="sm"
            className={cn(
              'border-white/10 text-xs',
              showFilters ? 'border-accent-amber/50 text-accent-amber' : 'text-text-secondary',
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} className="mr-1" />
            {t('actions.filter')}
          </Button>

          {/* View mode */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('px-2 py-1.5', viewMode === 'grid' ? 'bg-white/10 text-text-primary' : 'text-text-tertiary')}
            >
              <Grid3x3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-2 py-1.5', viewMode === 'list' ? 'bg-white/10 text-text-primary' : 'text-text-tertiary')}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* ── Filter bar (collapsible) ──────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card rounded-xl border border-white/10 p-3 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-text-secondary">ABV:</span>
                {ABV_RANGES.map(r => (
                  <button
                    key={r.label}
                    onClick={() => setAbvRange(r)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      abvRange.label === r.label
                        ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber'
                        : 'border-white/10 text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ───────────────────────────────────────── */}
        {isLoading ? (
          <div className={cn(
            'gap-4',
            viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col',
          )}>
            {[...Array(6)].map((_: unknown, i: number) => (
              <div key={i} className="h-48 rounded-xl bg-bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-amber/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-accent-amber" />
            </div>
            <h3 className="text-lg font-display font-bold text-text-primary mb-1">
              {search ? `Sin resultados para «${search}»` : 'Tu biblioteca de recetas está vacía'}
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm mx-auto">
              {search
                ? 'Intenta con otro término de búsqueda'
                : 'Importa recetas desde BeerXML o crea una nueva con el calculador integrado.'}
            </p>
            {!search && (
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" className="border-white/10 text-text-secondary text-xs"
                  onClick={() => fileRef.current?.click()}>
                  <Upload size={14} className="mr-1" /> Importar BeerXML
                </Button>
                <Button size="sm" className="bg-accent-amber text-bg-primary text-xs"
                  onClick={() => { setEditRecipe(null); setCreatorOpen(true) }}>
                  <Plus size={14} className="mr-1" /> Crear receta
                </Button>
              </div>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid view */
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe: Recipe, i: number) => (
              <RecipeCard
                key={recipe.id} recipe={recipe} index={i}
                onEdit={() => handleEdit(recipe)}
                onBrew={() => handleStartBrew(recipe.id)}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filtered.map((recipe: Recipe, i: number) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card rounded-lg border border-white/10 px-4 py-3 flex items-center gap-4 hover:border-accent-amber/30 transition-colors group cursor-pointer"
                onClick={() => handleEdit(recipe)}
              >
                {/* SRM swatch */}
                {recipe.srm != null && (
                  <div
                    className="w-3 h-8 rounded-full flex-shrink-0"
                    style={{ background: srmToHex(recipe.srm) }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-amber transition-colors">
                    {recipe.name}
                  </p>
                  {recipe.style && <p className="text-xs text-text-secondary truncate">{recipe.style}</p>}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-tertiary flex-shrink-0">
                  {recipe.abv != null && <span>{recipe.abv.toFixed(1)}%</span>}
                  {recipe.ibu != null && <span>{Math.round(recipe.ibu)} IBU</span>}
                  {recipe.batch_size_liters && <span>{recipe.batch_size_liters}L</span>}
                </div>
                <Button size="sm" variant="outline"
                  className="border-accent-amber/50 text-accent-amber text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => { e.stopPropagation(); handleStartBrew(recipe.id) }}>
                  Elaborar
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recipe Creator overlay ──────────────────────────── */}
      <AnimatePresence>
        {creatorOpen && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-accent-amber animate-spin" />
            </div>
          }>
            <RecipeCreator
              recipe={editRecipe}
              onClose={() => { setCreatorOpen(false); setEditRecipe(null) }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  )
}
