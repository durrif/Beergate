// src/components/pwa/install-prompt.tsx — PWA install banner
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-mobile'
import { useState } from 'react'

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[60] bg-accent-amber/95 backdrop-blur-sm text-bg-primary px-4 py-2.5 flex items-center gap-3 safe-area-pt"
      >
        <Download size={18} className="shrink-0" />
        <p className="text-sm font-medium flex-1">
          Instala Beergate para acceso rápido y modo offline
        </p>
        <button
          onClick={async () => {
            await install()
          }}
          className="px-3 py-1 bg-bg-primary text-accent-amber rounded-lg text-xs font-semibold hover:bg-bg-primary/90 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
