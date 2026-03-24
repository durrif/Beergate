// src/lib/ingredient-matcher.ts — Connect inventory ingredients to rich DB data
import { MALT_DATABASE, type MaltSpec } from '@/data/malts'
import { HOP_DATABASE, type HopSpec } from '@/data/hops'
import { YEAST_DATABASE, type YeastSpec } from '@/data/yeasts'
import type { Ingredient, IngredientCategory } from '@/lib/types'

/* ── Origin Flags ──────────────────────────────────────────── */
export const ORIGIN_FLAGS: Record<string, string> = {
  DE: '🇩🇪', BE: '🇧🇪', GB: '🇬🇧', US: '🇺🇸', AU: '🇦🇺', NZ: '🇳🇿',
  CZ: '🇨🇿', IE: '🇮🇪', FR: '🇫🇷', CA: '🇨🇦', DK: '🇩🇰', NO: '🇳🇴',
  ES: '🇪🇸', NL: '🇳🇱', JP: '🇯🇵', CN: '🇨🇳', AR: '🇦🇷', ZA: '🇿🇦',
}

/** Resolve country name → flag emoji */
export function originToFlag(origin: string): string {
  // Direct code match
  const upper = origin.toUpperCase()
  const flag = ORIGIN_FLAGS[upper]
  if (flag) return flag
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
  if (o.includes('holanda') || o.includes('netherlands')) return '🇳🇱'
  return '🌍'
}

/* ── Name matching (fuzzy-ish) ─────────────────────────────── */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function matchScore(inventoryName: string, dbName: string): number {
  const inv = normalize(inventoryName)
  const db = normalize(dbName)
  if (inv === db) return 100
  if (inv.includes(db) || db.includes(inv)) return 80
  // Word overlap
  const invWords = inventoryName.toLowerCase().split(/[\s\-\/]+/)
  const dbWords = dbName.toLowerCase().split(/[\s\-\/]+/)
  const overlap = invWords.filter(w => dbWords.some(dw => dw.includes(w) || w.includes(dw))).length
  const total = Math.max(invWords.length, dbWords.length)
  return total > 0 ? (overlap / total) * 70 : 0
}

/* ── Match inventory item to DB entry ──────────────────────── */
export type MatchedIngredient =
  | { type: 'malt'; spec: MaltSpec }
  | { type: 'hop'; spec: HopSpec }
  | { type: 'yeast'; spec: YeastSpec }
  | null

export function matchIngredient(ingredient: Ingredient): MatchedIngredient {
  const { name, category } = ingredient

  if (category.startsWith('malta')) {
    let best: MaltSpec | null = null
    let bestScore = 40 // threshold
    for (const m of MALT_DATABASE) {
      const s = matchScore(name, m.name) + matchScore(name, m.brand + ' ' + m.name) * 0.3
      if (s > bestScore) { best = m; bestScore = s }
    }
    if (best) return { type: 'malt', spec: best }
  }

  if (category === 'lupulo') {
    let best: HopSpec | null = null
    let bestScore = 40
    for (const h of HOP_DATABASE) {
      const s = matchScore(name, h.name)
      if (s > bestScore) { best = h; bestScore = s }
    }
    if (best) return { type: 'hop', spec: best }
  }

  if (category === 'levadura') {
    let best: YeastSpec | null = null
    let bestScore = 40
    for (const y of YEAST_DATABASE) {
      const s = Math.max(
        matchScore(name, y.name),
        y.strain ? matchScore(name, y.strain) * 1.2 : 0,
        matchScore(name, y.brand + ' ' + y.name) * 0.5,
      )
      if (s > bestScore) { best = y; bestScore = s }
    }
    if (best) return { type: 'yeast', spec: best }
  }

  return null
}

/* ── Substitutes with stock availability ───────────────────── */
export interface SubstituteInfo {
  name: string
  inStock: boolean
  quantity?: number
  unit?: string
}

export function getSubstitutes(
  matched: MatchedIngredient,
  inventory: Ingredient[],
): SubstituteInfo[] {
  if (!matched) return []

  const subIds: string[] =
    matched.type === 'malt' ? matched.spec.substitutes :
    matched.type === 'hop' ? matched.spec.substitutes : []

  if (matched.type === 'malt') {
    const maltSubs: SubstituteInfo[] = []
    for (const id of subIds) {
      const dbItem = MALT_DATABASE.find(m => m.id === id)
      if (!dbItem) continue
      const invItem = inventory.find(i =>
        i.category.startsWith('malta') && matchScore(i.name, dbItem.name) > 50
      )
      maltSubs.push({
        name: dbItem.name,
        inStock: !!invItem && invItem.quantity > 0,
        quantity: invItem?.quantity,
        unit: invItem?.unit,
      })
    }
    return maltSubs
  }

  if (matched.type === 'hop') {
    const hopSubs: SubstituteInfo[] = []
    for (const id of subIds) {
      const dbItem = HOP_DATABASE.find(h => h.id === id)
      if (!dbItem) continue
      const invItem = inventory.find(i =>
        i.category === 'lupulo' && matchScore(i.name, dbItem.name) > 50
      )
      hopSubs.push({
        name: dbItem.name,
        inStock: !!invItem && invItem.quantity > 0,
        quantity: invItem?.quantity,
        unit: invItem?.unit,
      })
    }
    return hopSubs
  }

  // Yeasts don't have substitute IDs in the DB, use strain-based
  if (matched.type === 'yeast') {
    const y = matched.spec
    // Find yeasts with overlapping styles
    const related = YEAST_DATABASE.filter(other =>
      other.id !== y.id &&
      other.styles.some(s => y.styles.includes(s))
    ).slice(0, 3)
    return related.map(r => {
      const invItem = inventory.find(i =>
        i.category === 'levadura' && matchScore(i.name, r.name) > 50
      )
      return {
        name: r.name,
        inStock: !!invItem && invItem.quantity > 0,
        quantity: invItem?.quantity,
        unit: invItem?.unit,
      }
    })
  }

  return []
}

/* ── Compatible styles from DB ─────────────────────────────── */
export function getCompatibleStyles(matched: MatchedIngredient): string[] {
  if (!matched) return []
  if (matched.type === 'yeast') return matched.spec.styles
  if (matched.type === 'malt') {
    const m = matched.spec
    const n = m.name.toLowerCase()
    if (m.type === 'base') {
      if (n.includes('pilsner') || n.includes('pils')) return ['Pilsner', 'Lager', 'Kölsch', 'Helles']
      if (n.includes('pale ale') || n.includes('maris')) return ['Pale Ale', 'IPA', 'ESB', 'Bitter']
      if (n.includes('munich')) return ['Märzen', 'Bock', 'Dunkel', 'Munich Helles']
      if (n.includes('vienna')) return ['Vienna Lager', 'Märzen', 'Amber Ale']
      if (n.includes('wheat')) return ['Hefeweizen', 'Witbier', 'American Wheat']
      return ['Various']
    }
    if (m.type === 'caramel') return ['Amber Ale', 'Red Ale', 'ESB', 'Scottish Ale']
    if (m.type === 'roasted') return ['Stout', 'Porter', 'Black IPA', 'Schwarzbier']
    if (m.type === 'specialty') return ['Specialty', 'Belgian', 'German Lager']
    return []
  }
  if (matched.type === 'hop') {
    const h = matched.spec
    if (h.usage === 'bittering') return ['IPA', 'Lager', 'Stout', 'Pale Ale']
    if (h.origin === 'US') return ['American IPA', 'Pale Ale', 'NEIPA', 'West Coast IPA']
    if (h.origin === 'DE' || h.origin === 'CZ') return ['Pilsner', 'Lager', 'Kölsch', 'Helles']
    if (h.origin === 'GB') return ['ESB', 'Bitter', 'English IPA', 'Porter']
    if (h.origin === 'AU' || h.origin === 'NZ') return ['Pale Ale', 'IPA', 'Saison']
    return ['Various']
  }
  return []
}

/* ── Subcategory inference for two-level grouping ──────────── */
export type MaltSubcategory = 'base' | 'crystal' | 'tostada' | 'adjunto'
export type HopSubcategory = 'amargo' | 'dual' | 'aromatico'
export type YeastSubcategory = 'ale' | 'lager' | 'specialty'
export type Subcategory = MaltSubcategory | HopSubcategory | YeastSubcategory | 'general'

export interface SubcategoryInfo {
  key: Subcategory
  label: string
  emoji: string
}

const MALT_SUBCATS: Record<MaltSubcategory, SubcategoryInfo> = {
  base:    { key: 'base',    label: 'Base',              emoji: '🌾' },
  crystal: { key: 'crystal', label: 'Especial / Crystal', emoji: '🍂' },
  tostada: { key: 'tostada', label: 'Tostada',           emoji: '☕' },
  adjunto: { key: 'adjunto', label: 'Adjuntos',          emoji: '🌰' },
}

const HOP_SUBCATS: Record<HopSubcategory, SubcategoryInfo> = {
  amargo:    { key: 'amargo',    label: 'Amargos',     emoji: '⚡' },
  dual:      { key: 'dual',      label: 'Dual Purpose', emoji: '🔄' },
  aromatico: { key: 'aromatico', label: 'Aromáticos',  emoji: '🌸' },
}

const YEAST_SUBCATS: Record<YeastSubcategory, SubcategoryInfo> = {
  ale:       { key: 'ale',       label: 'Ale',       emoji: '🍺' },
  lager:     { key: 'lager',     label: 'Lager',     emoji: '🥶' },
  specialty: { key: 'specialty', label: 'Specialty', emoji: '✨' },
}

export function inferMaltSubcategory(ingredient: Ingredient, matched: MatchedIngredient): MaltSubcategory {
  if (matched?.type === 'malt') {
    const t = matched.spec.type
    if (t === 'base') return 'base'
    if (t === 'caramel' || t === 'specialty') return 'crystal'
    if (t === 'roasted') return 'tostada'
    if (t === 'adjunct' || t === 'sugar') return 'adjunto'
  }
  // Fallback by category
  if (ingredient.category === 'malta_base') return 'base'
  if (ingredient.category === 'malta_especial') return 'crystal'
  return 'adjunto'
}

export function inferHopSubcategory(ingredient: Ingredient, matched: MatchedIngredient): HopSubcategory {
  if (matched?.type === 'hop') {
    return matched.spec.usage === 'bittering' ? 'amargo'
         : matched.spec.usage === 'aroma' ? 'aromatico'
         : 'dual'
  }
  return 'dual' // default
}

export function inferYeastSubcategory(ingredient: Ingredient, matched: MatchedIngredient): YeastSubcategory {
  if (matched?.type === 'yeast') {
    const y = matched.spec
    if (y.temp_max <= 15) return 'lager'
    const isSpecialty = y.styles.some(s =>
      /saison|farmhouse|kveik|sour|brett|wild|belgian|wheat|wit|weizen/i.test(s)
    )
    if (isSpecialty) return 'specialty'
    return 'ale'
  }
  return 'ale'
}

/* ── Major category grouping ──────────────────────────────── */
export type MajorCategory = 'maltas' | 'lupulos' | 'levaduras' | 'otros'

export interface MajorCategoryInfo {
  key: MajorCategory
  label: string
  emoji: string
  color: string
}

export const MAJOR_CATEGORIES: MajorCategoryInfo[] = [
  { key: 'maltas',    label: 'Maltas',    emoji: '🌾', color: '#B8860B' },
  { key: 'lupulos',   label: 'Lúpulos',   emoji: '🌿', color: '#4CAF50' },
  { key: 'levaduras', label: 'Levaduras', emoji: '🔬', color: '#FF9800' },
  { key: 'otros',     label: 'Otros',     emoji: '📦', color: '#607D8B' },
]

export function toMajorCategory(cat: IngredientCategory): MajorCategory {
  if (cat.startsWith('malta')) return 'maltas'
  if (cat === 'lupulo') return 'lupulos'
  if (cat === 'levadura') return 'levaduras'
  return 'otros'
}

export function getSubcategoryInfo(
  major: MajorCategory,
  sub: Subcategory,
): SubcategoryInfo {
  if (major === 'maltas' && sub in MALT_SUBCATS) return MALT_SUBCATS[sub as MaltSubcategory]
  if (major === 'lupulos' && sub in HOP_SUBCATS) return HOP_SUBCATS[sub as HopSubcategory]
  if (major === 'levaduras' && sub in YEAST_SUBCATS) return YEAST_SUBCATS[sub as YeastSubcategory]
  return { key: 'general', label: 'General', emoji: '📦' }
}

/** Two-level grouping: { maltas: { base: [...], crystal: [...] }, ... } */
export function groupByMajorAndSub(
  items: Ingredient[],
): Map<MajorCategory, Map<Subcategory, Ingredient[]>> {
  const result = new Map<MajorCategory, Map<Subcategory, Ingredient[]>>()

  for (const item of items) {
    const major = toMajorCategory(item.category)
    if (!result.has(major)) result.set(major, new Map())
    const subMap = result.get(major)!

    const matched = matchIngredient(item)
    let sub: Subcategory = 'general'
    if (major === 'maltas') sub = inferMaltSubcategory(item, matched)
    else if (major === 'lupulos') sub = inferHopSubcategory(item, matched)
    else if (major === 'levaduras') sub = inferYeastSubcategory(item, matched)

    if (!subMap.has(sub)) subMap.set(sub, [])
    subMap.get(sub)!.push(item)
  }

  // Sort major categories
  const order: MajorCategory[] = ['maltas', 'lupulos', 'levaduras', 'otros']
  const subOrders: Record<MajorCategory, Subcategory[]> = {
    maltas: ['base', 'crystal', 'tostada', 'adjunto'],
    lupulos: ['amargo', 'dual', 'aromatico'],
    levaduras: ['ale', 'lager', 'specialty'],
    otros: ['general'],
  }

  const sorted = new Map<MajorCategory, Map<Subcategory, Ingredient[]>>()
  for (const major of order) {
    const subMap = result.get(major)
    if (!subMap || subMap.size === 0) continue
    const sortedSub = new Map<Subcategory, Ingredient[]>()
    for (const sub of subOrders[major]) {
      const items = subMap.get(sub)
      if (items && items.length > 0) sortedSub.set(sub, items)
    }
    // Any remaining subs not in order
    for (const [sub, items] of subMap) {
      if (!sortedSub.has(sub)) sortedSub.set(sub, items)
    }
    sorted.set(major, sortedSub)
  }

  return sorted
}
