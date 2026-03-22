// frontend/src/components/layout/sidebar.tsx
import { Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Package, Beaker, FlaskConical,
  BookOpen, ShoppingCart, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ElementType
  labelKey: string
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { to: '/brewing', icon: Beaker, labelKey: 'nav.brewing' },
  { to: '/fermentation', icon: FlaskConical, labelKey: 'nav.fermentation' },
  { to: '/recipes', icon: BookOpen, labelKey: 'nav.recipes' },
  { to: '/shop', icon: ShoppingCart, labelKey: 'nav.shop' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function Sidebar() {
  const { t } = useTranslation('common')
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-full bg-bg-card border-r border-white/[0.08] overflow-hidden shrink-0"
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.08]">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <img src="/logo-icon.svg" alt="Beergate" className="w-8 h-8 shrink-0" />
              <span className="font-semibold text-lg amber-text whitespace-nowrap">Beergate</span>
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto">
              <img src="/logo-icon.svg" alt="Beergate" className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, labelKey }) => {
          const isActive = to === '/' ? currentPath === '/' : currentPath.startsWith(to)
          return (
            <Link key={to} to={to}>
              <div
                className={cn(
                  'sidebar-item',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-0'
                )}
                title={sidebarCollapsed ? t(labelKey) : undefined}
              >
                <Icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {t(labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/[0.08]">
        <button
          onClick={toggleSidebar}
          className="sidebar-item w-full justify-center"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  )
}
