// src/components/brewing/ambient-overlay.tsx
// Fullscreen ambient background effect that reacts to current brew phase
import { motion, AnimatePresence } from "framer-motion";
import type { BrewPhase } from "@/lib/types";

interface AmbientOverlayProps {
  phase: BrewPhase;
  enabled?: boolean;
}

const PHASE_CONFIG: Record<BrewPhase, { gradient: string; opacity: number }> = {
  planned: { gradient: "radial-gradient(ellipse at 50% 100%, #1c1c1c 0%, transparent 70%)", opacity: 0 },
  mashing: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(180,100,20,0.15) 0%, transparent 70%)", opacity: 1 },
  lautering: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(200,160,40,0.12) 0%, transparent 70%)", opacity: 1 },
  boiling: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(220,60,20,0.18) 0%, transparent 70%)", opacity: 1 },
  cooling: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(40,120,200,0.15) 0%, transparent 70%)", opacity: 1 },
  fermenting: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(100,60,200,0.12) 0%, transparent 70%)", opacity: 1 },
  conditioning: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(60,80,180,0.10) 0%, transparent 70%)", opacity: 1 },
  packaging: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(80,160,80,0.10) 0%, transparent 70%)", opacity: 1 },
  completed: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(255,220,80,0.10) 0%, transparent 70%)", opacity: 1 },
  aborted: { gradient: "radial-gradient(ellipse at 50% 100%, rgba(200,40,40,0.12) 0%, transparent 70%)", opacity: 1 },
};

export function AmbientOverlay({ phase, enabled = true }: AmbientOverlayProps) {
  if (!enabled) return null;
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.planned;

  return (
    <AnimatePresence>
      <motion.div
        key={phase}
        className="pointer-events-none fixed inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: cfg.opacity }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{ background: cfg.gradient }}
        aria-hidden
      />
    </AnimatePresence>
  );
}
