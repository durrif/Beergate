// src/components/inventory/liquid-progress.tsx
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiquidProgressProps {
  value: number;       // current
  max: number;         // max / reference amount
  low?: number;        // threshold for "low stock" warning colour
  unit: string;
  className?: string;
  showLabel?: boolean;
}

export function LiquidProgress({
  value,
  max,
  low = 0,
  unit,
  className,
  showLabel = true,
}: LiquidProgressProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isLow = low > 0 && value <= low;
  const isEmpty = value <= 0;

  const barColor = isEmpty
    ? "bg-red-500"
    : isLow
    ? "bg-amber-500"
    : "bg-emerald-500";

  const glowColor = isEmpty
    ? "shadow-red-500/40"
    : isLow
    ? "shadow-amber-500/40"
    : "shadow-emerald-500/40";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-muted">
          <span>Stock</span>
          <span className={cn(isLow && "text-amber-400", isEmpty && "text-red-400")}>
            {value} {unit}
          </span>
        </div>
      )}
      <div className="relative h-2 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full shadow-sm", barColor, glowColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* liquid wave overlay */}
        {pct > 0 && pct < 100 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/10"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ width: "50%" }}
          />
        )}
      </div>
    </div>
  );
}
