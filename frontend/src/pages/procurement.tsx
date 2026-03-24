// frontend/src/pages/procurement.tsx — v3 Price Intel + Personal Shopper
import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw, Bell, BellPlus, X, LayoutGrid, TableProperties,
  Store, TrendingDown, ShoppingCart, Truck, Sparkles, Filter,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import {
  usePriceSearch, usePriceAlerts, useCreatePriceAlert,
  useDeletePriceAlert, useTriggerScrape,
} from '@/hooks/use-prices'
import type { PriceRecord, PriceAlert } from '@/lib/types'
import { PriceCard } from '@/components/shop/price-card'
import { PriceTable } from '@/components/shop/price-table'
import { PriceAlertBadge } from '@/components/shop/price-alert-badge'
import { PersonalShopper } from '@/components/procurement/personal-shopper'
import { SUPPLIER_DATABASE, COUNTRY_FLAGS, type SupplierInfo } from '@/data/suppliers'
import { toast } from 'sonner'

// ─── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip({
  results,
  alerts,
}: {
  results: PriceRecord[]
  alerts: PriceAlert[]
}) {
  const inStock = results.filter(r => r.in_stock).length
  const bestPrice = results.length > 0
    ? Math.min(...results.map(r => r.price))
    : null
  const shops = new Set(results.map(r => r.shop_name)).size
  const activeAlerts = alerts.filter(a => a.is_active).length

  const stats = [
    { label: 'Resultados', value: results.length.toString(), icon: Search, color: '#F5A623' },
    { label: 'Tiendas', value: shops.toString(), icon: Store, color: '#D4723C' },
    { label: 'En stock', value: `${inStock}/${results.length}`, icon: ShoppingCart, color: '#7CB342' },
    { label: 'Alertas', value: activeAlerts.toString(), icon: Bell, color: '#42A5F5' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <s.icon size={14} style={{ color: s.color }} />
            <span className="text-xs text-text-tertiary">{s.label}</span>
          </div>
          <p className="text-xl font-bold font-display text-text-primary">{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Supplier strip ───────────────────────────────────────────────────────────
function SupplierStrip({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
          !selected
            ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
            : 'border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03]'
        }`}
      >
        Todas
      </button>
      {SUPPLIER_DATABASE.filter(s => s.scraperActive).map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(selected === s.id ? null : s.id)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
            selected === s.id
              ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
              : 'border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03]'
          }`}
        >
          {COUNTRY_FLAGS[s.country]} {s.name}
        </button>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProcurementPage() {
  const { t } = useTranslation('common')
  const { setActivePage } = useUIStore()
  useEffect(() => { setActivePage('shop') }, [setActivePage])

  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [tab, setTab] = useState<'search' | 'alerts' | 'shopper'>('search')
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null)
  const [stockOnly, setStockOnly] = useState(false)

  // Alert form
  const [alertName, setAlertName] = useState('')
  const [alertPrice, setAlertPrice] = useState('')

  const { data: rawResults = [], isFetching } = usePriceSearch(query)
  const { data: alerts = [] } = usePriceAlerts()
  const createAlert = useCreatePriceAlert()
  const deleteAlert = useDeletePriceAlert()
  const scrape = useTriggerScrape()

  // Filter results
  const results = useMemo(() => {
    let r = rawResults
    if (supplierFilter) {
      const info = SUPPLIER_DATABASE.find(s => s.id === supplierFilter)
      if (info) r = r.filter(rec => rec.shop_name.toLowerCase().includes(info.name.toLowerCase().split(' ')[0]!))
    }
    if (stockOnly) r = r.filter(rec => rec.in_stock)
    return r
  }, [rawResults, supplierFilter, stockOnly])

  const bestPrice = results.length > 0
    ? results.reduce((best: PriceRecord, r: PriceRecord) => r.price < best.price ? r : best)
    : null

  const handleCreateAlert = () => {
    if (!alertName.trim() || !alertPrice.trim()) return
    createAlert.mutate(
      { ingredient_name: alertName.trim(), threshold_price: parseFloat(alertPrice) },
      {
        onSuccess: () => {
          toast.success(t('shop.alert_created'))
          setAlertName('')
          setAlertPrice('')
        },
        onError: () => toast.error(t('shop.alert_error')),
      }
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <ShoppingCart size={24} className="text-accent-amber" />
            Compras Inteligentes
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            Compara precios, configura alertas y optimiza tus compras
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {[
          { id: 'search' as const, label: 'Buscador', icon: Search },
          { id: 'shopper' as const, label: 'Personal Shopper', icon: Sparkles },
          { id: 'alerts' as const, label: `Alertas (${alerts.length})`, icon: Bell },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-accent-amber/10 text-accent-amber'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03]'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Search ── */}
      {tab === 'search' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search bar */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('shop.search_placeholder')}
                  className="w-full pl-9 pr-9 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/40 transition-colors"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                {isFetching && (
                  <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-amber animate-spin" />
                )}
              </div>
            </div>

            {/* Filters row */}
            <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
              <SupplierStrip selected={supplierFilter} onSelect={setSupplierFilter} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStockOnly(!stockOnly)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                    stockOnly
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'border-white/[0.08] text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <Filter size={10} />
                  Solo en stock
                </button>
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-accent-amber/10 text-accent-amber' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-accent-amber/10 text-accent-amber' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    <TableProperties size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {results.length > 0 && <StatsStrip results={results} alerts={alerts} />}

          {/* Results */}
          {results.length > 0 && (
            viewMode === 'cards' ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r, i) => (
                  <PriceCard
                    key={`${r.shop_name}-${r.product_name}-${i}`}
                    record={r}
                    isBest={bestPrice?.shop_name === r.shop_name && bestPrice?.product_name === r.product_name}
                  />
                ))}
              </div>
            ) : (
              <PriceTable records={results} />
            )
          )}

          {results.length === 0 && !isFetching && query.length > 2 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <Search size={32} className="text-text-tertiary mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary">Sin resultados para «{query}»</p>
              <button
                onClick={() => scrape.mutate(0)}
                className="mt-3 text-xs text-accent-amber hover:underline flex items-center gap-1 mx-auto"
              >
                <RefreshCw size={12} />
                Actualizar precios desde tiendas
              </button>
            </div>
          )}

          {results.length === 0 && query.length <= 2 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <Store size={32} className="text-text-tertiary mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary">Escribe al menos 3 caracteres para buscar</p>
              <p className="text-xs text-text-tertiary mt-1">
                Comparamos precios en {SUPPLIER_DATABASE.filter(s => s.scraperActive).length} tiendas de España y Europa
              </p>
            </div>
          )}

          {/* Best price banner */}
          {bestPrice && results.length > 1 && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-accent-amber/20"
              style={{ borderColor: 'rgba(245,166,35,0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-accent-amber/10 flex items-center justify-center shrink-0">
                <TrendingDown size={18} className="text-accent-amber" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  Mejor precio: <span className="text-accent-amber font-bold">{bestPrice.price.toFixed(2)} €</span> en {bestPrice.shop_name}
                </p>
                {(() => {
                  const supplierKey = bestPrice.shop_name.toLowerCase().replace(/\s+/g, '')
                  const supplier = SUPPLIER_DATABASE.find(s => s.id === supplierKey)
                  if (!supplier) return null
                  return (
                    <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                      <Truck size={10} />
                      {supplier.freeShippingThreshold
                        ? `Envío gratis a partir de ${supplier.freeShippingThreshold} €`
                        : `Envío: ${supplier.baseShipping.toFixed(2)} €`
                      }
                      {supplier.deliveryDays && ` · ${supplier.deliveryDays[0]}-${supplier.deliveryDays[1]} días`}
                    </p>
                  )
                })()}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB: Personal Shopper ── */}
      {tab === 'shopper' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PersonalShopper />
        </motion.div>
      )}

      {/* ── TAB: Alerts ── */}
      {tab === 'alerts' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Create alert form */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <BellPlus size={16} className="text-accent-amber" />
              {t('shop.new_price_alert')}
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                value={alertName}
                onChange={e => setAlertName(e.target.value)}
                placeholder={t('shop.ingredient_placeholder')}
                className="flex-1 min-w-[150px] px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/40 transition-colors"
              />
              <input
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder={t('shop.max_price_placeholder')}
                type="number"
                min="0"
                step="0.01"
                className="w-36 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/40 transition-colors"
              />
              <button
                onClick={handleCreateAlert}
                disabled={!alertName.trim() || !alertPrice.trim() || createAlert.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-accent-amber text-bg-primary hover:bg-accent-amber/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <BellPlus size={14} />
                Crear
              </button>
            </div>
          </div>

          {/* Active alerts */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Alertas activas ({alerts.length})
            </p>
            {alerts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {alerts.map((a: PriceAlert) => (
                  <PriceAlertBadge
                    key={a.id}
                    alert={a}
                    onDelete={id => deleteAlert.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary text-center py-6">
                Sin alertas activas. Crea una para recibir notificaciones cuando bajen los precios.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
