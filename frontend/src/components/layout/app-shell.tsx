// frontend/src/components/layout/app-shell.tsx
import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/ui-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { AiFab } from './ai-fab'
import { VoiceFab } from './voice-fab'
import { AiPanel } from '@/components/ai/ai-panel'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
}

const ambientClasses: Record<string, string> = {
  idle: 'ambient-idle',
  mashing: 'ambient-mashing',
  boiling: 'ambient-boiling',
  fermenting: 'ambient-fermenting',
}

export function AppShell({ children }: AppShellProps) {
  const { aiPanelOpen, brewPhase } = useUIStore()

  // Keyboard shortcut: Cmd/Ctrl + K to open AI panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useUIStore.getState().toggleAiPanel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const ambientClass = ambientClasses[brewPhase] ?? 'ambient-idle'

  return (
    <div className={cn('flex h-dvh overflow-hidden bg-bg-primary', ambientClass)}>
      {/* Ambient background overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-1000"
        style={{ background: 'radial-gradient(ellipse at top right, var(--ambient-color, transparent), transparent 70%)' }}
      />

      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <Header />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={brewPhase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Panel — drawer right */}
      <AnimatePresence>
        {aiPanelOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => useUIStore.getState().closeAiPanel()}
              className="md:hidden fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm md:max-w-[360px] flex flex-col glass-card border-l border-white/[0.08] shadow-glass"
            >
              <AiPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI FAB */}
      <AiFab />

      {/* Voice FAB */}
      <VoiceFab />

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
