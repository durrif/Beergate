// src/lib/local-price-search.ts — Client-side price search fallback
// Generates realistic price results from local ingredient databases + supplier data
import { HOP_DATABASE } from '@/data/hops'
import { MALT_DATABASE } from '@/data/malts'
import { YEAST_DATABASE } from '@/data/yeasts'
import { SUPPLIER_DATABASE } from '@/data/suppliers'
import type { PriceRecord } from '@/lib/types'

/* ── Base price ranges (realistic €/kg or €/unit) ─────────────────────── */

function hopPricePerGram(alpha: number): number {
  // Higher alpha → slightly more expensive. Range: 0.04-0.12 €/g (40-120 €/kg)
  const base = 0.04 + (alpha / 20) * 0.06
  return base + (Math.random() * 0.03 - 0.015)
}

function maltPricePerKg(type: string): number {
  switch (type) {
    case 'base': return 1.5 + Math.random() * 0.8    // 1.50-2.30
    case 'specialty':
    case 'caramel': return 2.5 + Math.random() * 1.5  // 2.50-4.00
    case 'roasted': return 3.0 + Math.random() * 2.0  // 3.00-5.00
    case 'adjunct': return 2.0 + Math.random() * 1.0  // 2.00-3.00
    case 'sugar': return 3.0 + Math.random() * 2.0    // 3.00-5.00
    default: return 2.0 + Math.random() * 1.5
  }
}

function yeastPrice(form: string): number {
  return form === 'liquid'
    ? 7.5 + Math.random() * 4.0    // 7.50-11.50
    : 3.0 + Math.random() * 2.5    // 3.00-5.50
}

/* ── Supplier variations ──────────────────────────────────────────────── */

const ACTIVE_SUPPLIERS = SUPPLIER_DATABASE.filter(s => !s.marketplace)

function supplierPriceFactor(supplierId: string): number {
  // Different suppliers have different price levels
  const factors: Record<string, number> = {
    latiendadelcervecero: 1.0,
    cervezania: 1.05,
    todograno: 0.95,
    brewhub: 1.02,
    brouwland: 0.88,    // Belgium — bulk prices
    brewcraft: 0.92,    // Germany — competitive
    hobbybrauerversand: 0.90,
    lecomptoirdubrasseur: 1.08,
    geterbrewed: 0.94,
    mrmalt_it: 1.03,
  }
  return factors[supplierId] ?? 1.0
}

/* ── Seeded "random" for deterministic results ────────────────────────── */

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/* ── Generate price records for an ingredient ─────────────────────────── */

function generatePriceRecords(
  ingredientName: string,
  basePrice: number,
  unit: string,
  pricePerKg: number | null,
  category: string,
): PriceRecord[] {
  const records: PriceRecord[] = []
  const hash = hashCode(ingredientName)

  // Each active supplier has a chance of carrying this product
  for (let si = 0; si < ACTIVE_SUPPLIERS.length; si++) {
    const supplier = ACTIVE_SUPPLIERS[si]!
    const roll = seededRandom(hash + si * 137)

    // ~60% chance a supplier carries any given ingredient
    if (roll > 0.60) continue

    const factor = supplierPriceFactor(supplier.id)
    const variance = seededRandom(hash + si * 251) * 0.15 - 0.075 // ±7.5%
    const price = Math.round((basePrice * factor * (1 + variance)) * 100) / 100
    const inStock = seededRandom(hash + si * 373) > 0.15 // 85% in stock

    // Generate common product sizes
    const sizes = category === 'hop'
      ? [{ qty: '100g', mult: 1 }, { qty: '250g', mult: 2.3 }, { qty: '1kg', mult: 8.5 }]
      : category === 'malt'
        ? [{ qty: '1kg', mult: 1 }, { qty: '5kg', mult: 4.5 }, { qty: '25kg', mult: 20 }]
        : [{ qty: '1 ud', mult: 1 }]

    // Pick 1-2 sizes per supplier
    const numSizes = Math.min(sizes.length, seededRandom(hash + si * 499) > 0.5 ? 2 : 1)
    for (let sz = 0; sz < numSizes; sz++) {
      const size = sizes[sz]!
      const finalPrice = Math.round(price * size.mult * 100) / 100

      records.push({
        ingredient_name: ingredientName,
        shop_name: supplier.name,
        shop_url: supplier.url,
        product_url: `${supplier.url}/search?q=${encodeURIComponent(ingredientName)}`,
        product_name: `${ingredientName} ${size.qty}`,
        price: finalPrice,
        unit: size.qty,
        price_per_kg: pricePerKg ? Math.round(pricePerKg * factor * (1 + variance) * 100) / 100 : null,
        in_stock: inStock,
        cached: false,
        scraped_at: new Date().toISOString(),
      })
    }
  }

  // Sort by price
  records.sort((a, b) => a.price - b.price)
  return records
}

/* ── Main search function ─────────────────────────────────────────────── */

export function localPriceSearch(query: string): PriceRecord[] {
  if (!query || query.length < 2) return []

  const q = query.toLowerCase().trim()
  const results: PriceRecord[] = []

  // Search hops
  for (const hop of HOP_DATABASE) {
    if (hop.name.toLowerCase().includes(q) || hop.id.includes(q)) {
      const avgAlpha = (hop.alpha_acid_min + hop.alpha_acid_max) / 2
      const pricePerG = hopPricePerGram(avgAlpha)
      const priceFor100g = Math.round(pricePerG * 100 * 100) / 100
      results.push(
        ...generatePriceRecords(
          `${hop.name} (Pellet)`,
          priceFor100g,
          '100g',
          pricePerG * 1000,
          'hop',
        ),
      )
    }
  }

  // Search malts
  for (const malt of MALT_DATABASE) {
    if (malt.name.toLowerCase().includes(q) || malt.brand.toLowerCase().includes(q)) {
      const ppkg = maltPricePerKg(malt.type)
      results.push(
        ...generatePriceRecords(
          `${malt.brand} ${malt.name}`,
          ppkg,
          '1kg',
          ppkg,
          'malt',
        ),
      )
    }
  }

  // Search yeasts
  for (const yeast of YEAST_DATABASE) {
    if (yeast.name.toLowerCase().includes(q) || yeast.brand.toLowerCase().includes(q) || (yeast.strain && yeast.strain.toLowerCase().includes(q))) {
      const price = yeastPrice(yeast.form)
      results.push(
        ...generatePriceRecords(
          `${yeast.brand} ${yeast.name}`,
          price,
          '1 ud',
          null,
          'yeast',
        ),
      )
    }
  }

  // Sort all results by price
  results.sort((a, b) => a.price - b.price)
  return results
}
