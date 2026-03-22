// src/components/brewing/brew-timeline.tsx
import { motion } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrewPhase =
  | "planned"
  | "mashing"
  | "lautering"
  | "boiling"
  | "cooling"
  | "fermenting"
  | "conditioning"
  | "packaging"
  | "completed"
  | "aborted";

const PHASES: { key: BrewPhase; label: string; emoji: string }[] = [
  { key: "mashing", label: "Maceración", emoji: "🌡️" },
  { key: "lautering", label: "Filtrado", emoji: "🪣" },
  { key: "boiling", label: "Cocción", emoji: "🔥" },
  { key: "cooling", label: "Enfriado", emoji: "❄️" },
  { key: "fermenting", label: "Fermentación", emoji: "🧫" },
  { key: "conditioning", label: "Maduración", emoji: "🍺" },
  { key: "packaging", label: "Envasado", emoji: "📦" },
  { key: "completed", label: "Terminado", emoji: "✅" },
];

const PHASE_ORDER: BrewPhase[] = PHASES.map((p) => p.key);

interface BrewTimelineProps {
  currentPhase: BrewPhase;
  onAdvance?: (phase: BrewPhase) => void;
  compact?: boolean;
}

export function BrewTimeline({
  currentPhase,
  onAdvance,
  compact = false,
}: BrewTimelineProps) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const isAborted = currentPhase === "aborted";

  return (
    <div
      className={cn(
        "flex items-center gap-0",
        compact ? "w-full overflow-x-auto pb-1" : "flex-col gap-2 md:flex-row"
      )}
    >
      {PHASES.map(({ key, label, emoji }, idx) => {
        const done = currentIdx > idx && !isAborted;
        const active = currentIdx === idx && !isAborted;
        const upcoming = currentIdx < idx;
        const isNext = currentIdx === idx - 1 && !isAborted;

        return (
          <div
            key={key}
            className={cn("flex items-center", compact ? "flex-row" : "flex-col md:flex-row")}
          >
            {/* connector */}
            {idx > 0 && (
              <div
                className={cn(
                  compact ? "w-4 h-0.5" : "h-0.5 w-8 md:w-6",
                  done ? "bg-accent-amber" : "bg-white/10"
                )}
              />
            )}

            <motion.div
              className={cn(
                "flex flex-col items-center gap-1 px-1",
                isNext && onAdvance && "cursor-pointer"
              )}
              whileHover={isNext && onAdvance ? { scale: 1.05 } : {}}
              onClick={() => isNext && onAdvance && onAdvance(key)}
            >
              <div
                className={cn(
                  "rounded-full border-2 flex items-center justify-center transition-colors",
                  compact ? "w-8 h-8 text-sm" : "w-10 h-10 text-base",
                  done && "bg-accent-amber/30 border-accent-amber text-accent-amber",
                  active && "bg-accent-amber border-accent-amber-bright text-black animate-pulse-amber",
                  upcoming && !isNext && "bg-bg-elevated border-white/20 text-text-muted",
                  isNext && "bg-bg-elevated border-accent-amber/50 text-accent-amber hover:bg-accent-amber/20"
                )}
              >
                {done ? (
                  <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
                ) : active ? (
                  <Loader2 className={cn(compact ? "h-3 w-3" : "h-4 w-4", "animate-spin")} />
                ) : (
                  <span>{emoji}</span>
                )}
              </div>
              {!compact && (
                <span
                  className={cn(
                    "text-xs text-center leading-tight",
                    active && "text-accent-amber font-semibold",
                    done && "text-text-secondary",
                    upcoming && "text-text-muted"
                  )}
                >
                  {label}
                </span>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
