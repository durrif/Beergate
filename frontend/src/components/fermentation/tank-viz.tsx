// src/components/fermentation/tank-viz.tsx
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TankVizProps {
  gravityOriginal: number;
  gravityCurrent: number;
  gravityFinal: number;
  temperatureC: number;
  phase?: "active" | "done" | "idle";
  className?: string;
}

function fermProgress(og: number, cg: number, fg: number): number {
  if (og <= fg) return 0;
  return Math.min(100, Math.max(0, ((og - cg) / (og - fg)) * 100));
}

function tempColor(t: number) {
  if (t < 10) return "from-blue-400 to-blue-600";
  if (t < 18) return "from-cyan-400 to-teal-500";
  if (t < 22) return "from-amber-400 to-yellow-500";
  return "from-orange-500 to-red-500";
}

export function TankViz({
  gravityOriginal,
  gravityCurrent,
  gravityFinal,
  temperatureC,
  phase = "active",
  className,
}: TankVizProps) {
  const pct = fermProgress(gravityOriginal, gravityCurrent, gravityFinal);
  const attenuation = Math.round(pct);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Tank body */}
      <div className="relative w-28 h-48 flex flex-col items-center justify-end">
        {/* Tank outline */}
        <div className="absolute inset-0 rounded-b-3xl rounded-t-lg border-2 border-zinc-600 bg-zinc-900/60 overflow-hidden">
          {/* Liquid fill */}
          <motion.div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t opacity-80",
              tempColor(temperatureC)
            )}
            initial={{ height: "0%" }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Bubbling animation when active */}
          {phase === "active" && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
              {[0, 0.4, 0.8].map((delay) => (
                <motion.div
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-white/50"
                  animate={{ y: [0, -30], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Attenuation % overlay */}
        <span className="absolute top-2 text-xs font-bold text-white/80 z-10">
          {attenuation}%
        </span>

        {/* Valve at bottom */}
        <div className="absolute -bottom-2 w-4 h-4 rounded-full border-2 border-zinc-500 bg-zinc-800 z-10" />
      </div>

      {/* Stats below */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs w-full">
        <div>
          <p className="text-zinc-400">OG</p>
          <p className="font-semibold">{gravityOriginal.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-zinc-400">CG</p>
          <p className="font-semibold">{gravityCurrent.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-zinc-400">FG</p>
          <p className="font-semibold">{gravityFinal.toFixed(3)}</p>
        </div>
      </div>

      {/* Temperature */}
      <div className="text-sm font-medium">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-white text-xs",
          `bg-gradient-to-r ${tempColor(temperatureC)}`
        )}>
          {temperatureC.toFixed(1)} °C
        </span>
      </div>
    </div>
  );
}
