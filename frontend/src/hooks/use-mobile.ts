// src/hooks/use-mobile.ts — Responsive hooks for mobile detection
import { useState, useEffect, useSyncExternalStore } from 'react'

/* ── Media query hook ─────────────────────────────────────────────────────── */

function subscribe(query: string, callback: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/** Reactive CSS media query hook */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => window.matchMedia(query).matches,
    () => false, // SSR fallback
  )
}

/** True when viewport < 768px (Tailwind md breakpoint) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/** True when viewport < 640px (Tailwind sm breakpoint) */
export function useIsSmall(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

/** True when viewport >= 1024px (Tailwind lg breakpoint) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/** True when device prefers reduced motion */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** True when app is running as installed PWA (display-mode: standalone) */
export function useIsPWA(): boolean {
  return useMediaQuery('(display-mode: standalone)')
}

/* ── PWA Install Prompt ───────────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Hook that captures the browser's install prompt event */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    install,
  }
}

/* ── Online/Offline ───────────────────────────────────────────────────────── */

/** Returns true when the browser is online */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}
