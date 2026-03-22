// frontend/src/components/layout/mobile-nav.tsx
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Package, Beaker, BookOpen, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { to: '/brewing', icon: Beaker, labelKey: 'nav.brewing' },
  { to: '/recipes', icon: BookOpen, labelKey: 'nav.recipes' },
  { to: '/shop', icon: ShoppingCart, labelKey: 'nav.shop' },
]

export function MobileNav() {
  const { t } = useTranslation('common')
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-bg-card border-t border-white/[0.08] safe-area-pb">
      {mobileNav.map(({ to, icon: Icon, labelKey }) => {
        const isActive = to === '/' ? currentPath === '/' : currentPath.startsWith(to)
        return (
          <Link key={to} to={to} className="flex-1">
            <div className={cn(
              'flex flex-col items-center gap-1 py-2.5 px-2 transition-all',
              isActive ? 'text-accent-amber' : 'text-text-secondary'
            )}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
              {isActive && <span className="absolute bottom-0 w-8 h-0.5 bg-accent-amber rounded-t-full" />}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
