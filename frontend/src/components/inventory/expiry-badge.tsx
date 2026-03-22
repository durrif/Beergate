// src/components/inventory/expiry-badge.tsx
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ExpiryStatus = "ok" | "soon" | "expired" | "none";

interface ExpiryBadgeProps {
  daysLeft: number | null;
  className?: string;
}

function getStatus(daysLeft: number | null): ExpiryStatus {
  if (daysLeft === null) return "none";
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "soon";
  return "ok";
}

export function ExpiryBadge({ daysLeft, className }: ExpiryBadgeProps) {
  const status = getStatus(daysLeft);

  if (status === "none") return null;

  const configs = {
    ok: {
      icon: CheckCircle,
      label: `${daysLeft}d`,
      classes: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      pulse: false,
    },
    soon: {
      icon: Clock,
      label: `${daysLeft}d`,
      classes: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      pulse: true,
    },
    expired: {
      icon: AlertTriangle,
      label: "Vencido",
      classes: "bg-red-500/20 text-red-400 border-red-500/30",
      pulse: true,
    },
  } as const;

  const cfg = configs[status as keyof typeof configs];
  const Icon = cfg.icon;

  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
        cfg.classes,
        className
      )}
      animate={cfg.pulse ? { opacity: [1, 0.5, 1] } : {}}
      transition={cfg.pulse ? { duration: 1.8, repeat: Infinity } : {}}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </motion.span>
  );
}
