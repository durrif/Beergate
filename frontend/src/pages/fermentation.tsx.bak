// frontend/src/pages/fermentation.tsx
import { useEffect, useState } from "react";
import { FlaskConical, Thermometer, Droplets } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import { useBrewSessions, useFermentationData } from "@/hooks/use-brewing";
import { GravityChart } from "@/components/brewing/gravity-chart";
import type { BrewSession } from "@/lib/types";

function SessionSelector({
  sessions,
  selected,
  onSelect,
}: {
  sessions: BrewSession[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
            selected === s.id
              ? "bg-accent-amber/20 border-accent-amber text-accent-amber"
              : "bg-bg-card border-white/10 text-text-muted hover:border-white/30"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}

export default function FermentationPage() {
  const { setActivePage } = useUIStore();
  useEffect(() => setActivePage("fermentation"), [setActivePage]);

  const { data: sessions = [] } = useBrewSessions("fermenting");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = selectedId ?? sessions[0]?.id ?? null;
  const selectedSession = sessions.find((s) => s.id === activeId);
  const { data: points = [], isLoading } = useFermentationData(activeId ?? undefined);

  const lastPoint = points[points.length - 1];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold amber-text">Fermentación</h1>
        <p className="text-sm text-text-muted mt-0.5">Monitoreo de fermentación activa</p>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FlaskConical className="h-12 w-12 text-text-muted" />
          <p className="text-text-muted">No hay lotes en fermentación actualmente.</p>
        </div>
      ) : (
        <>
          <SessionSelector
            sessions={sessions}
            selected={activeId}
            onSelect={setSelectedId}
          />

          {/* live stats */}
          {lastPoint && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Droplets,
                  label: "Densidad",
                  value: lastPoint.gravity
                    ? lastPoint.gravity.toFixed(3)
                    : "—",
                  unit: "SG",
                  color: "text-amber-400",
                },
                {
                  icon: Thermometer,
                  label: "Temperatura",
                  value: lastPoint.temperature?.toFixed(1) ?? "—",
                  unit: "°C",
                  color: "text-blue-400",
                },
                {
                  icon: FlaskConical,
                  label: "ABV estimada",
                  value:
                    selectedSession?.actual_og && lastPoint.gravity
                      ? (
                          (selectedSession.actual_og - lastPoint.gravity) *
                          131.25
                        ).toFixed(1)
                      : "—",
                  unit: "%",
                  color: "text-emerald-400",
                },
                {
                  icon: Droplets,
                  label: "Ángulo iSpindel",
                  value: lastPoint.angle?.toFixed(1) ?? "—",
                  unit: "°",
                  color: "text-purple-400",
                },
              ].map(({ icon: Icon, label, value, unit, color }) => (
                <div
                  key={label}
                  className="glass-card rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-center gap-1.5 text-text-muted text-xs mb-2">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    {label}
                  </div>
                  <p className={`text-2xl font-mono font-bold ${color}`}>
                    {value}
                    <span className="text-base ml-1 text-text-muted">{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* chart */}
          <div className="glass-card rounded-xl border border-white/10 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-text-secondary">
              Evolución de densidad y temperatura
            </h3>
            {isLoading ? (
              <div className="h-60 animate-pulse bg-bg-elevated rounded-lg" />
            ) : points.length === 0 ? (
              <p className="text-text-muted text-sm py-12 text-center">
                Sin datos todavía. Conecta tu iSpindel o añade puntos manualmente.
              </p>
            ) : (
              <GravityChart data={points} height={260} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
