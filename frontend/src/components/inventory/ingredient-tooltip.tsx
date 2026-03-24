// src/components/inventory/ingredient-tooltip.tsx — Beergate v4
// Rich hover tooltip with real DB data: substitutes, styles, specs
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Sparkles, FlaskConical, ArrowRightLeft, Thermometer, Droplets, Gauge } from 'lucide-react'
import { categoryColor, categoryIcon } from '@/lib/utils'
import {
  matchIngredient, getSubstitutes, getCompatibleStyles,
  originToFlag, type SubstituteInfo,
} from '@/lib/ingredient-matcher'
import type { Ingredient } from '@/lib/types'

interface IngredientTooltipProps {
  ingredient: Ingredient
  allInventory?: Ingredient[]
}

export function IngredientTooltip({ ingredient, allInventory = [] }: IngredientTooltipProps) {
  const catColor = categoryColor(ingredient.category)
  const emoji = categoryIcon(ingredient.category)

  const matched = useMemo(() => matchIngredient(ingredient), [ingredient])
  const substitutes = useMemo(() => getSubstitutes(matched, allInventory), [matched, allInventory])
  const styles = useMemo(() => getCompatibleStyles(matched), [matched])

  // Flavor: prefer DB data, fall back to ingredient.flavor_profile
  const flavors = useMemo(() => {
    if (matched?.type === 'malt') return matched.spec.flavor.split(',').map(s => s.trim())
    if (matched?.type === 'hop') return matched.spec.flavor
    if (matched?.type === 'yeast') return matched.spec.flavor.split(',').map(s => s.trim())
    return ingredient.flavor_profile?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  }, [matched, ingredient.flavor_profile])

  // Origin: prefer DB origin code, fall back to ingredient.origin
  const origin = matched?.type === 'malt' ? matched.spec.origin
    : matched?.type === 'hop' ? matched.spec.origin
    : ingredient.origin

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 pointer-events-none"
    >
      <div className="glass-card rounded-xl border border-white/15 p-4 space-y-2.5 shadow-elevated backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start gap-2">
          <span className="text-lg">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-text-primary truncate">
              {ingredient.name}
            </p>
            <div className="flex items-center gap-1.5">
              {ingredient.supplier && (
                <span className="text-[10px] text-text-tertiary">{ingredient.supplier}</span>
              )}
              {matched?.type === 'malt' && (
                <span className="text-[10px] px-1 rounded bg-white/5 text-text-tertiary border border-white/5">
                  {matched.spec.brand}
                </span>
              )}
              {matched?.type === 'yeast' && (
                <span className="text-[10px] px-1 rounded bg-white/5 text-text-tertiary border border-white/5">
                  {matched.spec.brand} · {matched.spec.form}
                </span>
              )}
            </div>
          </div>
          <div
            className="h-3 w-3 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: catColor }}
          />
        </div>

        {/* Origin */}
        {origin && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={11} className="text-text-tertiary" />
            <span>{originToFlag(origin)} {origin}</span>
          </div>
        )}

        {/* Technical specs — compact row */}
        {matched?.type === 'malt' && (
          <div className="flex gap-3 text-[10px] text-text-secondary">
            <span className="flex items-center gap-0.5">
              <Droplets size={9} className="text-amber-400" />
              {matched.spec.color_ebc} EBC
            </span>
            <span className="font-mono">{matched.spec.potential_sg.toFixed(3)} SG</span>
            {matched.spec.diastatic_power != null && (
              <span>{matched.spec.diastatic_power}°L DP</span>
            )}
            <span className="ml-auto">{matched.spec.type}</span>
          </div>
        )}
        {matched?.type === 'hop' && (
          <div className="flex gap-3 text-[10px] text-text-secondary">
            <span className="flex items-center gap-0.5">
              <Gauge size={9} className="text-green-400" />
              α {matched.spec.alpha_acid_min}–{matched.spec.alpha_acid_max}%
            </span>
            <span>β {matched.spec.beta_acid_min}–{matched.spec.beta_acid_max}%</span>
            <span className="ml-auto capitalize">{matched.spec.usage}</span>
          </div>
        )}
        {matched?.type === 'yeast' && (
          <div className="flex gap-3 text-[10px] text-text-secondary">
            <span className="flex items-center gap-0.5">
              <Thermometer size={9} className="text-blue-400" />
              {matched.spec.temp_min}–{matched.spec.temp_max}°C
            </span>
            <span>Att: {matched.spec.attenuation_min}–{matched.spec.attenuation_max}%</span>
            <span className="ml-auto capitalize">{matched.spec.flocculation}</span>
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
              {flavors.slice(0, 6).map(f => (
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
              <span className="text-[10px] text-text-tertiary font-medium">Estilos compatibles</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {styles.slice(0, 5).map(s => (
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

        {/* Substitutes with stock availability */}
        {substitutes.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowRightLeft size={10} className="text-accent-copper" />
              <span className="text-[10px] text-text-tertiary font-medium">Sustitutos</span>
            </div>
            <div className="space-y-0.5">
              {substitutes.map((s: SubstituteInfo) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-1.5 w-1.5 rounded-full ${s.inStock ? 'bg-emerald-400' : 'bg-red-400/60'}`} />
                  <span className="text-text-secondary">{s.name}</span>
                  {s.inStock && s.quantity != null && (
                    <span className="ml-auto font-mono text-text-tertiary">
                      {s.quantity} {s.unit}
                    </span>
                  )}
                  {!s.inStock && (
                    <span className="ml-auto text-text-tertiary italic">sin stock</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock & price footer */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px]">
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
