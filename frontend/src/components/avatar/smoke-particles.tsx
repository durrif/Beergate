// frontend/src/components/avatar/smoke-particles.tsx — Beergate v4 FASE 1
// Magical smoke/particle effect during avatar summoning ("Efecto Aladino")
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvatarStore } from '@/stores/avatar-store'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  color: 'purple' | 'amber' | 'mixed'
}

function generateParticles(count: number, originX: number, originY: number): Particle[] {
  const colors: Array<Particle['color']> = ['purple', 'amber', 'mixed']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: originX + (Math.random() - 0.5) * 80,
    y: originY + (Math.random() - 0.5) * 40,
    size: 8 + Math.random() * 24,
    delay: Math.random() * 0.4,
    duration: 1.0 + Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * 3)] ?? 'purple',
  }))
}

const particleColors = {
  purple: 'radial-gradient(circle, rgba(156, 106, 222, 0.7) 0%, rgba(156, 106, 222, 0.2) 50%, transparent 70%)',
  amber: 'radial-gradient(circle, rgba(245, 166, 35, 0.6) 0%, rgba(245, 166, 35, 0.2) 50%, transparent 70%)',
  mixed: 'radial-gradient(circle, rgba(156, 106, 222, 0.5) 0%, rgba(245, 166, 35, 0.3) 50%, transparent 70%)',
}

export function SmokeParticles() {
  const { phase } = useAvatarStore()
  const [particles, setParticles] = useState<Particle[]>([])

  const isSummoning = phase === 'summoning'
  const isDismissing = phase === 'dismissing'
  const showParticles = isSummoning || isDismissing

  const spawnParticles = useCallback(() => {
    // Origin near bottom-right (barrel position)
    const originX = window.innerWidth - 88
    const originY = window.innerHeight - (window.innerWidth < 768 ? 100 : 48)
    setParticles(generateParticles(16, originX, originY))
  }, [])

  useEffect(() => {
    if (showParticles) {
      spawnParticles()
    } else {
      setParticles([])
    }
  }, [showParticles, spawnParticles])

  return (
    <AnimatePresence>
      {showParticles && particles.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[999]"
          aria-hidden="true"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: p.x,
                y: p.y,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: p.x + (Math.random() - 0.5) * 160,
                y: isDismissing ? p.y + 60 : p.y - 120 - Math.random() * 80,
                scale: [0, 1.5, 2.5],
                opacity: [1, 0.7, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
              }}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: particleColors[p.color],
                filter: 'blur(2px)',
              }}
            />
          ))}

          {/* Central magic flash during summoning */}
          {isSummoning && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 3, 5], opacity: [0, 0.5, 0] }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute rounded-full"
              style={{
                left: window.innerWidth - 88 - 20,
                top: window.innerHeight - (window.innerWidth < 768 ? 100 : 48) - 20,
                width: 40,
                height: 40,
                background: 'radial-gradient(circle, rgba(156, 106, 222, 0.4) 0%, rgba(245, 166, 35, 0.2) 40%, transparent 70%)',
              }}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
