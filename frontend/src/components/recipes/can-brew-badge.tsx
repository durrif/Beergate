// src/components/recipes/can-brew-badge.tsx
import { useTranslation } from 'react-i18next'
import { useCheckCanBrew } from "@/hooks/use-recipes";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface CanBrewBadgeProps {
  recipeId: number;
  compact?: boolean;
}

export function CanBrewBadge({ recipeId, compact = false }: CanBrewBadgeProps) {
  const { t } = useTranslation('common')
  const { data, isLoading } = useCheckCanBrew(recipeId);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        {!compact && t('recipes.checking')}
      </span>
    );
  }

  if (!data) return null;

  const config = {
    ready: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: t('recipes.ready_to_brew'),
      variant: "default" as const,
      className: "bg-green-700/80 text-green-100 border-green-600",
    },
    partial: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: t('recipes.missing_ingredients', { count: data.missing.length }),
      variant: "outline" as const,
      className: "border-amber-500 text-amber-400",
    },
    missing: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: t('recipes.missing_ingredients', { count: data.missing.length }),
      variant: "outline" as const,
      className: "border-red-500 text-red-400",
    },
  }[data.status];

  const badge = (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1 text-xs ${config.className}`}
    >
      {config.icon}
      {!compact && config.label}
    </Badge>
  );

  if (compact || data.status === "ready") return badge;

  const missingList = [
    ...data.missing.map((m) => `${m.name}: ${t('recipes.need')} ${m.required} ${m.unit}`),
    ...data.low_stock.map((l) => `${l.name}: ${t('recipes.have')} ${l.available}/${l.required} ${l.unit}`),
  ];

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <ul className="text-xs space-y-1">
          {missingList.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
