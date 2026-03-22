// frontend/src/pages/dashboard.tsx
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Package, Beaker, FlaskConical, TrendingDown, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useInventory, useInventoryAlerts } from '@/hooks/use-inventory'
import { useBrewSessions } from '@/hooks/use-brewing'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { t } = useTranslation(['common', 'inventory', 'brewing'])
  const { user, brewery } = useAuthStore()
  const { setActivePage } = useUIStore()

  useEffect(() => { setActivePage('dashboard') }, [setActivePage])

  const { data: inventoryData } = useInventory({ page_size: 200 })
  const { data: brewSessions } = useBrewSessions()
  const { data: fermentingSessions } = useBrewSessions('fermenting')
  const { lowStock, expiring } = useInventoryAlerts()

  const ingredientCount = inventoryData?.total ?? 0
  const brewCount = Array.isArray(brewSessions) ? brewSessions.length : 0
  const fermentingCount = Array.isArray(fermentingSessions) ? fermentingSessions.length : 0
  const lowStockCount = Array.isArray(lowStock.data) ? lowStock.data.length : 0
  const expiringItems = Array.isArray(expiring.data) ? expiring.data : []

  const stats = [
    { icon: Package, label: t('nav.inventory'), value: String(ingredientCount), color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { icon: Beaker, label: t('nav.brewing'), value: String(brewCount), color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: FlaskConical, label: t('nav.fermentation'), value: String(fermentingCount), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: TrendingDown, label: t('inventory:alerts.low_stock'), value: String(lowStockCount), color: 'text-status-danger', bg: 'bg-status-danger/10' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-text-primary">
          Hola, <span className="amber-text">{user?.full_name?.split(' ')[0] ?? 'Cervecero'}</span> 👋
        </h1>
        <p className="text-text-secondary text-sm mt-1">{brewery?.name ?? 'Tu cervecería'}</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts — expiring ingredients */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-status-warning" />
          <h2 className="text-base font-semibold text-text-primary">Alertas</h2>
          {expiringItems.length > 0 && (
            <span className="text-xs bg-status-warning/10 text-status-warning px-2 py-0.5 rounded-full">{expiringItems.length}</span>
          )}
        </div>
        {expiringItems.length > 0 ? (
          <div className="space-y-2">
            {expiringItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-elevated/50">
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-status-warning" />
                  <span className="text-sm text-text-primary">{item.name}</span>
                  <span className="text-xs text-text-secondary">{item.quantity} {item.unit}</span>
                </div>
                <span className="text-xs text-status-warning">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('es-ES') : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">{t('status.empty')}</p>
        )}
      </motion.div>

      {/* Recent brew sessions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Actividad reciente</h2>
        {brewCount > 0 && Array.isArray(brewSessions) ? (
          <div className="space-y-2">
            {brewSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-elevated/50">
                <div className="flex items-center gap-3">
                  <Beaker size={14} className="text-accent-amber" />
                  <span className="text-sm text-text-primary">{session.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber capitalize">{session.phase}</span>
                  <span className="text-xs text-text-secondary">{session.created_at ? new Date(session.created_at).toLocaleDateString('es-ES') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">{t('status.empty')}</p>
        )}
      </motion.div>
    </div>
  )
}
