// src/components/shop/price-card.tsx — v3 glass design
import { ExternalLink, TrendingDown, TrendingUp, Minus, Store, Truck } from 'lucide-react'
import { Sparkline } from './sparkline'
import { SUPPLIER_MAP, COUNTRY_FLAGS } from '@/data/suppliers'
import type { PriceRecord } from '@/lib/types'

interface PriceCardProps {
  record: PriceRecord
  isBest?: boolean
  history?: Array<{ date: string; price: number }>
}

function trendIcon(history: Array<{ price: number }>) {
  if (history.length < 2) return <Minus size={12} className="text-text-tertiary" />
  const last = history[history.length - 1]
  const prev = history[history.length - 2]
  const delta = (last?.price ?? 0) - (prev?.price ?? 0)
  if (delta < 0) return <TrendingDown size={12} className="text-green-400" />
  if (delta > 0) return <TrendingUp size={12} className="text-red-400" />
  return <Minus size={12} className="text-text-tertiary" />
}

export function PriceCard({ record, isBest = false, history = [] }: PriceCardProps) {
  const supplierKey = record.shop_name.toLowerCase().replace(/\s+/g, '')
  const supplier = SUPPLIER_MAP.get(supplierKey)
  const flag = supplier ? COUNTRY_FLAGS[supplier.country] ?? '' : ''

  return (
    <div
      className={`glass-card rounded-xl p-4 transition-all group hover:bg-white/[0.04] ${
        isBest ? 'ring-1 ring-accent-amber/40 shadow-[0_0_20px_rgba(245,166,35,0.08)]' : ''
      }`}
    >
      {/* Header: shop + badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: supplier?.color ? `${supplier.color}20` : 'rgba(255,255,255,0.05)' }}
          >
            <Store size={14} style={{ color: supplier?.color ?? '#F5A623' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {flag} {record.shop_name}
            </p>
            <p className="text-xs text-text-tertiary truncate">{record.product_name || record.ingredient_name}</p>
          </div>
        </div>
        {isBest && (
          <span className="text-[10px] font-bold text-accent-amber bg-accent-amber/10 px-2 py-1 rounded-md shrink-0 border border-accent-amber/20">
            MEJOR
          </span>
        )}
      </div>

      {/* Price + trend + sparkline */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            {trendIcon(history)}
            <span className="text-2xl font-bold font-display text-accent-amber">
              {record.price.toFixed(2)} €
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-tertiary">por {record.unit}</span>
            {record.price_per_kg != null && (
              <span className="text-xs text-text-tertiary">
                · {record.price_per_kg.toFixed(2)} €/kg
              </span>
            )}
          </div>
        </div>
        {history.length > 1 && (
          <Sparkline data={history.map(h => h.price)} className="w-20 h-10" />
        )}
      </div>

      {/* Footer: stock + shipping + link */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
              record.in_stock
                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                : 'border-red-500/30 text-red-400 bg-red-500/10'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${record.in_stock ? 'bg-green-400' : 'bg-red-400'}`} />
            {record.in_stock ? 'Stock' : 'Agotado'}
          </span>
          {supplier && (
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Truck size={10} />
              {supplier.freeShippingThreshold
                ? `Gratis +${supplier.freeShippingThreshold}€`
                : `${supplier.baseShipping.toFixed(0)}€`
              }
            </span>
          )}
        </div>
        <a
          href={record.product_url || record.shop_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-text-tertiary hover:text-accent-amber flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
        >
          Comprar <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}
