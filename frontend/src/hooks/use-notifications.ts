// src/hooks/use-notifications.ts — Push notification hook for brew alerts
import { useState, useEffect, useCallback } from 'react'

type NotificationPermission = 'default' | 'granted' | 'denied'

interface UseNotificationsReturn {
  permission: NotificationPermission
  isSupported: boolean
  requestPermission: () => Promise<boolean>
  sendLocal: (title: string, options?: NotificationOptions) => void
}

/**
 * Hook for managing push/local notifications.
 * Handles fermentation alerts, timer alerts, pool buying deadlines.
 */
export function useNotifications(): UseNotificationsReturn {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'default',
  )

  useEffect(() => {
    if (!isSupported) return
    setPermission(Notification.permission)
  }, [isSupported])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [isSupported])

  const sendLocal = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return

      // Use service worker registration if available (supports richer options)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'beergate-alert',
            ...options,
          })
        })
      } else {
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options,
        })
      }
    },
    [isSupported, permission],
  )

  return { permission, isSupported, requestPermission, sendLocal }
}

/* ── Pre-built alert helpers ──────────────────────────────────────────────── */

/** Send fermentation alert (gravity threshold, temp out of range) */
export function fermentationAlert(
  sendLocal: UseNotificationsReturn['sendLocal'],
  fermenterName: string,
  message: string,
) {
  sendLocal(`🧪 ${fermenterName}`, {
    body: message,
    tag: `ferm-${fermenterName}`,
  })
}

/** Send timer alert (hop addition, mash step, etc.) */
export function timerAlert(
  sendLocal: UseNotificationsReturn['sendLocal'],
  stepName: string,
) {
  sendLocal(`⏱️ ${stepName}`, {
    body: `¡Es hora de ${stepName}!`,
    tag: 'brew-timer',
  })
}

/** Send pool buying deadline alert */
export function poolBuyingAlert(
  sendLocal: UseNotificationsReturn['sendLocal'],
  poolName: string,
  hoursLeft: number,
) {
  sendLocal(`🛒 ${poolName}`, {
    body: `Quedan ${hoursLeft}h para unirte a esta compra conjunta`,
    tag: `pool-${poolName}`,
  })
}
