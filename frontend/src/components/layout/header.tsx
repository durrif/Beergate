// frontend/src/components/layout/header.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search, Bell, Globe, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

export function Header() {
  const { t } = useTranslation('common')
  const { user, brewery, logout } = useAuthStore()
  const { language, setLanguage, unreadCount, clearUnread } = useUIStore()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    void navigate({ to: '/login' })
  }

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  return (
    <header className="h-16 flex items-center gap-4 px-4 md:px-6 bg-bg-card border-b border-white/[0.08] shrink-0">
      {/* Logo (mobile only) */}
      <img src="/logo-icon.svg" alt="Beergate" className="w-7 h-7 md:hidden shrink-0" />

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('actions.search') + '...'}
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-lg',
              'bg-bg-elevated border border-white/[0.08] text-text-primary placeholder:text-text-secondary',
              'focus:outline-none focus:ring-1 focus:ring-accent-amber/50 transition-all'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
          title="Switch language"
        >
          <Globe size={16} />
          <span className="hidden sm:inline uppercase">{language}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (notifOpen) clearUnread() }}
            className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-status-danger text-white rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl shadow-glass z-50 p-4"
              >
                <p className="text-sm text-text-secondary text-center py-4">{t('status.empty')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-bg-hover transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-accent-amber">
                {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden md:flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">{user?.full_name ?? 'User'}</span>
              <span className="text-xs text-text-secondary truncate max-w-[120px]">{brewery?.name ?? ''}</span>
            </div>
            <ChevronDown size={14} className={cn('text-text-secondary transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl shadow-glass z-50 py-1 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/[0.08]">
                  <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { void navigate({ to: '/settings' }); setUserMenuOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
                  >
                    <Settings size={16} /> {t('nav.settings')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-status-danger hover:bg-bg-hover transition-all"
                  >
                    <LogOut size={16} /> {t('auth.logout')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
