// src/components/shop/price-alert-badge.tsx — v3 glass design  
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, X } from 'lucide-react'
import type { PriceAlert } from '@/lib/types'

interface PriceAlertBadgeProps {
  alert: PriceAlert
  onDelete?: (id: number) => void
}

export function PriceAlertBadge({ alert, onDelete }: PriceAlertBadgeProps) {
  const { t } = useTranslation('common')
  const triggered = !!alert.last_triggered_at

  return (
    <div
      className={`group inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
        triggered
          ? 'border-accent-amber/40 text-accent-amber bg-accent-amber/10 animate-pulse'
          : 'border-white/[0.08] text-text-secondary bg-white/[0.03] hover:bg-white/[0.05]'
      }`}
      title={
        triggered
          ? `¡Precio por debajo de ${alert.threshold_price?.toFixed(2) ?? '?'} €! Disparada: ${alert.last_triggered_at ? new Date(alert.last_triggered_at).toLocaleString('es-ES') : ''}`
          : `Alerta cuando baje de ${alert.threshold_price?.toFixed(2) ?? '?'} €`
      }
    >
      {triggered ? <BellRing size={12} /> : <Bell size={12} />}
      <span className="font-medium">{alert.ingredient_name}</span>
      {alert.threshold_price != null && (
        <span className="text-text-tertiary">≤ {alert.threshold_price.toFixed(2)} €</span>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(alert.id)}
          className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
          aria-label={t('shop.delete_alert')}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
