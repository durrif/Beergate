// frontend/src/pages/brewing.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, FlaskConical, Beer } from "lucide-react";
import { toast } from "sonner";

import { useUIStore } from "@/stores/ui-store";
import {
  useBrewSessions,
  useActiveSession,
  useAdvancePhase,
  useCreateSession,
} from "@/hooks/use-brewing";
import { BrewTimeline, type BrewPhase } from "@/components/brewing/brew-timeline";
import { DualTimer } from "@/components/brewing/dual-timer";
import { Button } from "@/components/ui/button";
import type { BrewSession } from "@/lib/types";

function SessionCard({ session }: { session: BrewSession }) {
  const advancePhase = useAdvancePhase();

  const handleAdvance = (phase: BrewPhase) => {
    advancePhase.mutate(
      { sessionId: session.id, phase },
      {
        onSuccess: () => toast.success(`Fase → ${phase}`),
        onError: () => toast.error("Error al avanzar fase"),
      }
    );
  };

  return (
    <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-primary">{session.name}</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs bg-accent-amber/20 text-accent-amber border border-accent-amber/30">
          {session.phase}
        </span>
      </div>

      <BrewTimeline
        currentPhase={session.phase as BrewPhase}
        onAdvance={handleAdvance}
        compact
      />

      {/* stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "OG", value: session.actual_og },
          { label: "FG", value: session.actual_fg },
          { label: "ABV", value: session.actual_og && session.actual_fg ? `${((session.actual_og - session.actual_fg) * 131.25).toFixed(1)}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-elevated rounded-lg p-2">
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="text-sm font-mono font-semibold text-text-primary">
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrewingPage() {
  const { setActivePage } = useUIStore();
  useEffect(() => setActivePage("brewing"), [setActivePage]);

  const { data: sessions = [], isLoading } = useBrewSessions();
  const { data: activeSession } = useActiveSession();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold amber-text">Elaboración</h1>
          <p className="text-sm text-text-muted mt-0.5">Control de lotes activos</p>
        </div>
        <Button className="bg-accent-amber hover:bg-accent-amber-bright text-black font-semibold">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo lote
        </Button>
      </div>

      {/* active session highlight */}
      {activeSession && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-accent-amber uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Lote activo
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SessionCard session={activeSession} />
            <DualTimer mashDurationMinutes={60} boilDurationMinutes={60} />
          </div>
        </div>
      )}

      {/* all sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Beer className="h-4 w-4" />
          Todos los lotes ({sessions.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-48 animate-pulse bg-bg-elevated" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Beer className="h-12 w-12 text-text-muted" />
            <p className="text-text-muted">No hay lotes todavía. ¡Empieza a elaborar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SessionCard session={s} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
