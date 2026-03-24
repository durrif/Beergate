// frontend/src/components/layout/sidebar.tsx — Beergate v3
import { Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Beaker, FlaskConical, BookOpen,
  Package, ShoppingCart, FileText, Settings,
  ChevronLeft, ChevronRight, Cpu, Beer, BarChart3, Bot,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ElementType
  labelKey: string
}

interface NavGroup {
  labelKey: string | null
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    labelKey: null,
    items: [
      { to: '/', icon: LayoutDashboard, labelKey: 'nav.overview' },
    ],
  },
  {
    labelKey: 'nav.group_brew',
    items: [
      { to: '/brewing', icon: Beaker, labelKey: 'nav.brew_day' },
      { to: '/fermentation', icon: FlaskConical, labelKey: 'nav.fermentation' },
      { to: '/recipes', icon: BookOpen, labelKey: 'nav.recipes' },
    ],
  },
  {
    labelKey: 'nav.group_ops',
    items: [
      { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
      { to: '/procurement', icon: ShoppingCart, labelKey: 'nav.procurement' },
      { to: '/suppliers', icon: FileText, labelKey: 'nav.suppliers' },
    ],
  },
  {
    labelKey: 'nav.group_gear',
    items: [
      { to: '/devices', icon: Cpu, labelKey: 'nav.devices' },
      { to: '/keezer', icon: Beer, labelKey: 'nav.keezer' },
    ],
  },
  {
    labelKey: 'nav.group_insights',
    items: [
      { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
      { to: '/ai-chat', icon: Bot, labelKey: 'nav.ai_assistant' },
    ],
  },
]

const bottomNav: NavItem[] = [
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function Sidebar() {
  const { t } = useTranslation('common')
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isActive = (to: string) =>
    to === '/' ? currentPath === '/' : currentPath.startsWith(to)

  const handleClick = (to: string) => {
    if (to === '#ai') {
      useUIStore.getState().openAiPanel()
    }
  }

  const renderItem = ({ to, icon: Icon, labelKey }: NavItem) => {
    const active = to !== '#ai' && isActive(to)
    const content = (
      <div
        className={cn(
          'sidebar-item group',
          active && 'active',
          sidebarCollapsed && 'justify-center px-0',
        )}
        title={sidebarCollapsed ? t(labelKey) : undefined}
        onClick={() => handleClick(to)}
      >
        <Icon size={18} className="shrink-0 sidebar-icon" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
            >
              {t(labelKey)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    )

    if (to === '#ai') {
      return <div key={to} className="cursor-pointer">{content}</div>
    }

    return (
      <Link key={to} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-full bg-bg-secondary border-r border-white/[0.06] overflow-hidden shrink-0"
      role="navigation"
      aria-label={t('nav.main_navigation', 'Main navigation')}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-white/[0.06]">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <img src="/logo-icon.svg" alt="Beergate" className="w-7 h-7 shrink-0" />
              <span className="font-display font-semibold text-base amber-text whitespace-nowrap">Beergate</span>
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto">
              <img src="/logo-icon.svg" alt="Beergate" className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto no-scrollbar" aria-label={t('nav.main_navigation', 'Site navigation')}>
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.labelKey && !sidebarCollapsed && (
              <div className="nav-section-label">{t(group.labelKey)}</div>
            )}
            {group.labelKey && sidebarCollapsed && (
              <div className="h-px bg-white/[0.04] mx-2 my-3" />
            )}
            <div className="space-y-0.5">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: settings + user avatar */}
      <div className="border-t border-white/[0.06]">
        <div className="px-2 py-2 space-y-0.5">
          {bottomNav.map(renderItem)}
        </div>

        {/* User avatar */}
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2.5 px-3 pb-3">
            <div className="w-8 h-8 rounded-full bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-accent-amber">
                {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user.full_name}</p>
              <p className="text-2xs text-text-tertiary truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <div className="px-2 pb-2">
          <button
            onClick={toggleSidebar}
            className="sidebar-item w-full justify-center"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
