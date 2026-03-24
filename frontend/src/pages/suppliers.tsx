// frontend/src/pages/suppliers.tsx — v3 Supplier Directory
import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Store, Globe, Truck, Star, ExternalLink, MapPin,
  Search, X, ChevronDown, ChevronUp, Package,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import {
  SUPPLIER_DATABASE, SUPPLIER_COUNTRIES, COUNTRY_FLAGS, COUNTRY_NAMES,
  type SupplierInfo,
} from '@/data/suppliers'

function SupplierCard({ supplier }: { supplier: SupplierInfo }) {
  const [expanded, setExpanded] = useState(false)
  const flag = COUNTRY_FLAGS[supplier.country] ?? ''
  const countryName = COUNTRY_NAMES[supplier.country] ?? supplier.country

  return (
    <motion.div
      layout
      className="glass-card rounded-xl overflow-hidden group hover:bg-white/[0.03] transition-all"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${supplier.color}20` }}
            >
              <Store size={18} style={{ color: supplier.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm">{supplier.name}</h3>
              <p className="text-xs text-text-tertiary flex items-center gap-1">
                <MapPin size={10} />
                {flag} {countryName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {supplier.scraperActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Activo
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1 text-accent-amber mb-0.5">
              <Star size={10} />
              <span className="text-sm font-bold font-mono">{supplier.rating.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-text-tertiary">Valoración</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1 text-accent-copper mb-0.5">
              <Truck size={10} />
              <span className="text-sm font-bold font-mono">
                {supplier.freeShippingThreshold ? `${supplier.freeShippingThreshold}€` : '—'}
              </span>
            </div>
            <p className="text-[10px] text-text-tertiary">Envío gratis</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.02]">
            <div className="flex items-center justify-center gap-1 text-accent-hop mb-0.5">
              <Package size={10} />
              <span className="text-sm font-bold font-mono">
                {supplier.deliveryDays[0]}-{supplier.deliveryDays[1]}d
              </span>
            </div>
            <p className="text-[10px] text-text-tertiary">Entrega</p>
          </div>
        </div>

        {/* Specialties row */}
        <div className="flex flex-wrap gap-1 mb-3">
          {supplier.specialties.slice(0, expanded ? undefined : 3).map(s => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]"
            >
              {s}
            </span>
          ))}
          {!expanded && supplier.specialties.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full text-text-tertiary">
              +{supplier.specialties.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Menos' : 'Detalles'}
          </button>
          <a
            href={supplier.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-tertiary hover:text-accent-amber transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
          >
            Visitar <ExternalLink size={10} />
          </a>
        </div>

        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs"
          >
            <div className="flex justify-between">
              <span className="text-text-tertiary">Envío base</span>
              <span className="text-text-primary font-mono">{supplier.baseShipping.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Moneda</span>
              <span className="text-text-primary">{supplier.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Web</span>
              <a
                href={supplier.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-amber hover:underline flex items-center gap-1"
              >
                <Globe size={10} />
                {supplier.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default function SuppliersPage() {
  const { t } = useTranslation('common')
  const { setActivePage } = useUIStore()
  useEffect(() => { setActivePage('suppliers') }, [setActivePage])

  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = SUPPLIER_DATABASE
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.specialties.some(sp => sp.includes(q)))
    }
    if (countryFilter) {
      list = list.filter(s => s.country === countryFilter)
    }
    return list
  }, [search, countryFilter])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
          <Store size={24} className="text-accent-amber" />
          Proveedores
        </h1>
        <p className="text-sm text-text-tertiary mt-0.5">
          Directorio de proveedores de cerveza artesanal en España y Europa
        </p>
      </div>

      {/* Search + filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('shop.search_supplier_placeholder')}
              className="w-full pl-9 pr-8 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-amber/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCountryFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                !countryFilter
                  ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
                  : 'border-white/[0.08] text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Todos
            </button>
            {SUPPLIER_COUNTRIES.map(c => (
              <button
                key={c}
                onClick={() => setCountryFilter(countryFilter === c ? null : c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  countryFilter === c
                    ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
                    : 'border-white/[0.08] text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {COUNTRY_FLAGS[c]} {COUNTRY_NAMES[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <SupplierCard key={s.id} supplier={s} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <Store size={32} className="text-text-tertiary mx-auto mb-3 opacity-40" />
          <p className="text-text-secondary">No se encontraron proveedores</p>
        </div>
      )}
    </div>
  )
}
