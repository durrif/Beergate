// src/components/shop/price-alert-badge.tsx
import { Bell, BellRing } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PriceAlert } from "@/lib/types";

interface PriceAlertBadgeProps {
  alert: PriceAlert;
  onDelete?: (id: number) => void;
  className?: string;
}

export function PriceAlertBadge({ alert, onDelete, className }: PriceAlertBadgeProps) {
  const triggered = !!alert.last_triggered_at;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "inline-flex items-center gap-1.5 cursor-default text-xs",
            triggered
              ? "border-amber-500 text-amber-400 animate-pulse"
              : "border-zinc-600 text-zinc-400",
            className
          )}
        >
          {triggered ? (
            <BellRing className="w-3 h-3" />
          ) : (
            <Bell className="w-3 h-3" />
          )}
          {alert.ingredient_name}
          {alert.threshold_price != null && ` ≤ ${alert.threshold_price.toFixed(2)} €`}
          {onDelete && (
            <button
              onClick={() => onDelete(alert.id)}
              className="ml-1 hover:text-red-400 transition-colors"
              aria-label="Eliminar alerta"
            >
              ×
            </button>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {triggered
          ? `¡Precio por debajo de ${alert.threshold_price?.toFixed(2) ?? '?'} €!`
          : `Alerta cuando baje de ${alert.threshold_price?.toFixed(2) ?? '?'} €`}
        {alert.last_triggered_at && (
          <span className="block text-xs text-zinc-400 mt-0.5">
            Disparada: {new Date(alert.last_triggered_at).toLocaleString("es-ES")}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
