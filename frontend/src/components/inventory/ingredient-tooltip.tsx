// src/components/inventory/ingredient-tooltip.tsx — Beergate v3
// Rich hover tooltip showing detailed ingredient info
import { motion } from 'framer-motion'
import { MapPin, Tag, Sparkles, TrendingDown, FlaskConical } from 'lucide-react'
import { categoryColor, categoryIcon } from '@/lib/utils'
import type { Ingredient } from '@/lib/types'

interface IngredientTooltipProps {
  ingredient: Ingredient
}

/* ── Substitutes per category (common known substitutes) ───── */
const SUBSTITUTES: Record<string, string[]> = {
  // Maltas
  'Pilsner': ['Pale Ale', 'Lager Malt'],
  'Pale Ale': ['Maris Otter', 'Pilsner', 'Golden Promise'],
  'Maris Otter': ['Pale Ale', 'Golden Promise'],
  'Munich': ['Vienna', 'Munich Dark'],
  'Vienna': ['Munich Light', 'Pale Ale'],
  'Wheat': ['White Wheat', 'Flaked Wheat'],
  'Crystal 60': ['Caramunich II', 'Crystal 40'],
  'Crystal 80': ['Caramunich III', 'Crystal 60'],
  'Chocolate': ['Chocolate Wheat', 'Carafa Special II'],
  'Roasted Barley': ['Black Patent', 'Carafa Special III'],
  // Lúpulos
  'Cascade': ['Centennial', 'Amarillo'],
  'Centennial': ['Cascade', 'Chinook'],
  'Citra': ['Mosaic', 'Galaxy'],
  'Mosaic': ['Citra', 'Simcoe'],
  'Simcoe': ['Mosaic', 'Columbus'],
  'Amarillo': ['Cascade', 'Centennial'],
  'Chinook': ['Columbus', 'Nugget'],
  'Saaz': ['Tettnanger', 'Hallertau'],
  'Hallertau': ['Tettnanger', 'Saaz'],
  'Fuggle': ['Willamette', 'EKG'],
  'EKG': ['Fuggle', 'Challenger'],
  // Levaduras
  'US-05': ['WLP001', '1056'],
  'S-04': ['WLP002', '1968'],
  'W-34/70': ['S-189', 'WLP830'],
  'Nottingham': ['US-05', 'WLP001'],
}

/* ── Style suggestions by ingredient name keywords ──────────── */
function guessStyles(name: string, cat: string): string[] {
  const n = name.toLowerCase()
  if (cat.startsWith('malta')) {
    if (n.includes('pilsner') || n.includes('pils')) return ['Pilsner', 'Lager', 'Kölsch']
    if (n.includes('pale ale') || n.includes('maris')) return ['Pale Ale', 'IPA', 'Bitter']
    if (n.includes('munich')) return ['Märzen', 'Bock', 'Dunkel']
    if (n.includes('vienna')) return ['Vienna Lager', 'Märzen']
    if (n.includes('wheat')) return ['Hefeweizen', 'Witbier']
    if (n.includes('crystal') || n.includes('cara')) return ['Amber Ale', 'Red Ale', 'ESB']
    if (n.includes('chocolate') || n.includes('roasted')) return ['Stout', 'Porter']
  }
  if (cat === 'lupulo') {
    if (n.includes('cascade') || n.includes('centennial') || n.includes('citra'))
      return ['American IPA', 'Pale Ale', 'NEIPA']
    if (n.includes('saaz') || n.includes('hallertau') || n.includes('tettnang'))
      return ['Pilsner', 'Lager', 'Kölsch']
    if (n.includes('fuggle') || n.includes('ekg'))
      return ['ESB', 'Bitter', 'Mild']
  }
  if (cat === 'levadura') {
    if (n.includes('us-05') || n.includes('001')) return ['American Ale', 'IPA', 'Pale Ale']
    if (n.includes('s-04') || n.includes('002')) return ['English Ale', 'ESB', 'Porter']
    if (n.includes('34/70') || n.includes('lager')) return ['Pilsner', 'Lager', 'Bock']
    if (n.includes('wb-06') || n.includes('3068')) return ['Hefeweizen']
    if (n.includes('saison') || n.includes('3711')) return ['Saison', 'Farmhouse']
  }
  return []
}

function findSubstitutes(name: string): string[] {
  for (const [key, subs] of Object.entries(SUBSTITUTES)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return subs
  }
  return []
}

/* ── Origin to flag emoji (best-effort) ─────────────────────── */
function originFlag(origin: string): string {
  const o = origin.toLowerCase()
  if (o.includes('alemania') || o.includes('germany')) return '🇩🇪'
  if (o.includes('bélgica') || o.includes('belgium')) return '🇧🇪'
  if (o.includes('reino unido') || o.includes('uk') || o.includes('england')) return '🇬🇧'
  if (o.includes('estados unidos') || o.includes('usa') || o.includes('us')) return '🇺🇸'
  if (o.includes('república checa') || o.includes('czech')) return '🇨🇿'
  if (o.includes('australia')) return '🇦🇺'
  if (o.includes('nueva zelanda') || o.includes('new zealand')) return '🇳🇿'
  if (o.includes('francia') || o.includes('france')) return '🇫🇷'
  if (o.includes('españa') || o.includes('spain')) return '🇪🇸'
  return '🌍'
}

export function IngredientTooltip({ ingredient }: IngredientTooltipProps) {
  const catColor = categoryColor(ingredient.category)
  const emoji = categoryIcon(ingredient.category)
  const substitutes = findSubstitutes(ingredient.name)
  const styles = guessStyles(ingredient.name, ingredient.category)
  const flavors = ingredient.flavor_profile
    ? ingredient.flavor_profile.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 pointer-events-none"
    >
      <div className="glass-card rounded-xl border border-white/15 p-4 space-y-3 shadow-elevated backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start gap-2">
          <span className="text-lg">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-text-primary truncate">
              {ingredient.name}
            </p>
            {ingredient.supplier && (
              <p className="text-[10px] text-text-tertiary">{ingredient.supplier}</p>
            )}
          </div>
          <div
            className="h-3 w-3 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: catColor }}
          />
        </div>

        {/* Origin */}
        {ingredient.origin && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={11} className="text-text-tertiary" />
            <span>{originFlag(ingredient.origin)} {ingredient.origin}</span>
          </div>
        )}

        {/* Flavor descriptors */}
        {flavors.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Sparkles size={10} className="text-accent-amber" />
              <span className="text-[10px] text-text-tertiary font-medium">Perfil de sabor</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {flavors.map(f => (
                <span
                  key={f}
                  className="px-1.5 py-0.5 rounded text-[10px] border border-white/8 bg-white/5 text-text-secondary"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suitable styles */}
        {styles.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FlaskConical size={10} className="text-accent-hop" />
              <span className="text-[10px] text-text-tertiary font-medium">Estilos sugeridos</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {styles.map(s => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] border border-accent-hop/20 bg-accent-hop/10 text-accent-hop"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Substitutes */}
        {substitutes.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown size={10} className="text-accent-copper" />
              <span className="text-[10px] text-text-tertiary font-medium">Sustitutos</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {substitutes.map(s => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] border border-accent-copper/20 bg-accent-copper/10 text-accent-copper"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stock & price */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
          <span className="text-text-tertiary">
            Stock: <span className="font-mono text-text-secondary">{ingredient.quantity} {ingredient.unit}</span>
          </span>
          {ingredient.purchase_price != null && ingredient.purchase_price > 0 && (
            <span className="text-text-tertiary">
              <span className="font-mono text-text-secondary">{ingredient.purchase_price.toFixed(2)}€</span>/{ingredient.unit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
