// frontend/src/components/layout/mobile-nav.tsx — Beergate v3
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Beaker, Package, BookOpen, Beer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { to: '/brewing', icon: Beaker, labelKey: 'nav.brew_day' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { to: '/recipes', icon: BookOpen, labelKey: 'nav.recipes' },
  { to: '/keezer', icon: Beer, labelKey: 'nav.keezer' },
]

export function MobileNav() {
  const { t } = useTranslation('common')
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isActive = (to: string) =>
    to === '/' ? currentPath === '/' : currentPath.startsWith(to)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb" aria-label={t('nav.mobile_navigation', 'Mobile navigation')}>
      <div className="flex items-stretch justify-around h-14">
        {items.map(({ to, icon: Icon, labelKey }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 text-text-tertiary transition-colors',
              isActive(to) && 'text-accent-amber',
            )}
          >
            <Icon size={20} />
            <span className="text-2xs font-medium">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
