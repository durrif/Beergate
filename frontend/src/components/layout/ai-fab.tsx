// frontend/src/components/layout/ai-fab.tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MessageSquare, X } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function AiFab() {
  const { t } = useTranslation('common')
  const { aiPanelOpen, toggleAiPanel } = useUIStore()

  return (
    <motion.button
      onClick={toggleAiPanel}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-amber-gradient shadow-glow flex items-center justify-center"
      aria-label={aiPanelOpen ? t('ai.close_panel') : t('ai.open_panel')}
      title={aiPanelOpen ? t('ai.close_panel') : t('ai.open_panel')}
    >
      <motion.div
        animate={{ rotate: aiPanelOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {aiPanelOpen ? (
          <X size={22} className="text-bg-primary" />
        ) : (
          <MessageSquare size={22} className="text-bg-primary" />
        )}
      </motion.div>

      {/* Pulse ring when closed */}
      {!aiPanelOpen && (
        <motion.span
          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-accent-amber/30"
        />
      )}
    </motion.button>
  )
}
