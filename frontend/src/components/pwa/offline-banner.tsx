// src/components/pwa/offline-banner.tsx — Offline status indicator
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-mobile'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium overflow-hidden"
        >
          <WifiOff size={14} />
          Sin conexión — modo offline activo
        </motion.div>
      )}
    </AnimatePresence>
  )
}
