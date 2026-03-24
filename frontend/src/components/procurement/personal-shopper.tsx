// src/components/procurement/personal-shopper.tsx
// AI-powered procurement recommendations based on inventory & prices
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, ShoppingCart, TrendingDown, Truck, Package,
  ChevronDown, ChevronUp, Check, Sparkles, AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useInventory } from '@/hooks/use-inventory'
import { useMultiPriceSearch } from '@/hooks/use-prices'
import { SUPPLIER_MAP } from '@/data/suppliers'
import type { Ingredient, PriceRecord } from '@/lib/types'

interface ShopperItem {
  name: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
  currentQty: number
  unit: string
  suggestedQty: string
}

interface ShopperOption {
  label: string
  supplier: string
  items: { name: string; price: number }[]
  subtotal: number
  shipping: number
  total: number
  savings?: string
  badge?: string
}

function analyzeInventory(items: Ingredient[]): ShopperItem[] {
  const needs: ShopperItem[] = []

  for (const item of items) {
    const minStock = item.min_stock ?? 0
    const qty = item.quantity

    // Out of stock
    if (qty <= 0) {
      needs.push({
        name: item.name,
        reason: 'no_stock',
        urgency: 'high',
        currentQty: qty,
        unit: item.unit,
        suggestedQty: `${Math.max(minStock * 2, 1)} ${item.unit}`,
      })
      continue
    }

    // Below minimum stock
    if (minStock > 0 && qty < minStock) {
      needs.push({
        name: item.name,
        reason: `below_min:${qty}/${minStock} ${item.unit}`,
        urgency: qty < minStock * 0.5 ? 'high' : 'medium',
        currentQty: qty,
        unit: item.unit,
        suggestedQty: `${minStock * 2 - qty} ${item.unit}`,
      })
      continue
    }

    // Expiring soon
    if (item.expiry_date) {
      const days = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (days <= 30 && days > 0) {
        needs.push({
          name: item.name,
          reason: `expires:${days}`,
          urgency: days <= 7 ? 'high' : 'medium',
          currentQty: qty,
          unit: item.unit,
          suggestedQty: `${qty} ${item.unit} (reposición)`,
        })
      }
    }
  }

  return needs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.urgency] - order[b.urgency]
  })
}

function buildOptions(needs: ShopperItem[], priceData: Map<string, PriceRecord[]>): ShopperOption[] {
  // Group best prices by supplier
  const supplierItems = new Map<string, { name: string; price: number }[]>()

  for (const need of needs) {
    const offers = priceData.get(need.name.toLowerCase()) ?? []
    if (offers.length === 0) continue

    // Best offer overall
    const best = offers.reduce((a, b) => a.price < b.price ? a : b)
    const existing = supplierItems.get(best.shop_name) ?? []
    existing.push({ name: need.name, price: best.price })
    supplierItems.set(best.shop_name, existing)
  }

  const options: ShopperOption[] = []

  for (const [supplier, items] of supplierItems) {
    const info = SUPPLIER_MAP.get(supplier.toLowerCase().replace(/\s+/g, ''))
    const subtotal = items.reduce((s, i) => s + i.price, 0)
    const shipping = info
      ? (info.freeShippingThreshold && subtotal >= info.freeShippingThreshold ? 0 : info.baseShipping)
      : 5.00

    options.push({
      label: supplier,
      supplier,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping,
      total: Math.round((subtotal + shipping) * 100) / 100,
    })
  }

  // Sort by total ascending
  options.sort((a, b) => a.total - b.total)

  // Tag the cheapest
  if (options.length > 0) {
    options[0]!.badge = 'best_price'
  }

  return options
}

const urgencyConfig = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Package },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Package },
}

export function PersonalShopper() {
  const { t } = useTranslation('common')
  const [expanded, setExpanded] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const { data: inventoryData } = useInventory({ page: 1, page_size: 200 })
  const items = inventoryData?.items ?? []

  const translateReason = (reason: string) => {
    if (reason === 'no_stock') return t('shop.no_stock')
    if (reason.startsWith('below_min:')) return t('shop.below_min', { detail: reason.slice(10) })
    if (reason.startsWith('expires:')) return t('shop.expires_in', { days: reason.slice(8) })
    return reason
  }

  // Analyze what we need
  const needs = useMemo(() => analyzeInventory(items), [items])

  // Search prices for top needs (first 5) — all in parallel
  const topNeedNames = useMemo(() => needs.slice(0, 5).map(n => n.name), [needs])
  const { data: searchResults = [] } = useMultiPriceSearch(topNeedNames)

  // Build price map
  const priceMap = useMemo(() => {
    const m = new Map<string, PriceRecord[]>()
    for (const r of searchResults) {
      const key = r.ingredient_name.toLowerCase()
      const arr = m.get(key) ?? []
      arr.push(r)
      m.set(key, arr)
    }
    return m
  }, [searchResults])

  const options = useMemo(() => buildOptions(needs, priceMap), [needs, priceMap])

  if (needs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <Check size={24} className="text-green-400" />
        </div>
        <p className="text-text-primary font-medium">{t('shop.inventory_complete')}</p>
        <p className="text-text-tertiary text-sm mt-1">
          {t('shop.no_restock_needed')}
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-amber/20 to-accent-copper/20 flex items-center justify-center">
            <Bot size={20} className="text-accent-amber" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Personal Shopper
              <Sparkles size={14} className="text-accent-amber" />
            </h3>
            <p className="text-xs text-text-tertiary">
              {needs.length} ingrediente{needs.length !== 1 ? 's' : ''} necesita{needs.length !== 1 ? 'n' : ''} reposición
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-text-tertiary" /> : <ChevronDown size={18} className="text-text-tertiary" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Needs list */}
            <div className="px-4 pb-3">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                Análisis de inventario
              </p>
              <div className="space-y-1.5">
                {needs.slice(0, 8).map((need) => {
                  const cfg = urgencyConfig[need.urgency]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={need.name}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${cfg.bg} border ${cfg.border}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={14} className={cfg.text} />
                        <span className="text-sm text-text-primary truncate">{need.name}</span>
                      </div>
                      <span className={`text-xs ${cfg.text} shrink-0 ml-2`}>{translateReason(need.reason)}</span>
                    </div>
                  )
                })}
                {needs.length > 8 && (
                  <p className="text-xs text-text-tertiary text-center py-1">
                    +{needs.length - 8} más...
                  </p>
                )}
              </div>
            </div>

            {/* Purchase options */}
            {options.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                  <TrendingDown size={12} className="inline mr-1" />
                  Opciones de compra optimizadas
                </p>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(selectedOption === i ? null : i)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        selectedOption === i
                          ? 'border-accent-amber/50 bg-accent-amber/5'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ShoppingCart size={14} className="text-accent-amber" />
                          <span className="text-sm font-medium text-text-primary">{t('shop.all_at', { supplier: opt.label })}</span>
                          {opt.badge && (
                            <span className="text-[10px] font-bold text-accent-amber bg-accent-amber/10 px-1.5 py-0.5 rounded">
                              {t(`shop.${opt.badge}`)}
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-accent-amber">
                          {opt.total.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span>{opt.items.length} artículo{opt.items.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{t('shop.subtotal')}: {opt.subtotal.toFixed(2)} €</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Truck size={10} />
                          {opt.shipping === 0 ? (
                            <span className="text-green-400">Envío gratis</span>
                          ) : (
                            <span>+{opt.shipping.toFixed(2)} € envío</span>
                          )}
                        </span>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {selectedOption === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                              {opt.items.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                  <span className="text-text-secondary">{item.name}</span>
                                  <span className="text-text-primary font-mono">{item.price.toFixed(2)} €</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {options.length === 0 && needs.length > 0 && (
              <div className="px-4 pb-4 text-center">
                <p className="text-xs text-text-tertiary">
                  Busca ingredientes para ver opciones de compra optimizadas
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
