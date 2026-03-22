// src/components/shop/price-card.tsx
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";
import type { PriceRecord } from "@/lib/types";

interface PriceCardProps {
  record: PriceRecord;
  isBest?: boolean;
  history?: Array<{ date: string; price: number }>;
}

function trendIcon(history: Array<{ price: number }>) {
  if (history.length < 2) return <Minus className="w-3 h-3 text-zinc-400" />;
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = (last?.price ?? 0) - (prev?.price ?? 0);
  if (delta < 0) return <TrendingDown className="w-3 h-3 text-green-400" />;
  if (delta > 0) return <TrendingUp className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-zinc-400" />;
}

export function PriceCard({ record, isBest = false, history = [] }: PriceCardProps) {
  return (
    <Card
      className={cn(
        "bg-zinc-900/80 border-zinc-700 transition-colors",
        isBest && "border-amber-500/60 ring-1 ring-amber-500/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{record.shop_name}</p>
            <p className="text-xs text-zinc-400 truncate">{record.ingredient_name}</p>
          </div>
          {isBest && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs shrink-0">
              Mejor precio
            </Badge>
          )}
        </div>

        {/* Price + trend */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1">
              {trendIcon(history)}
              <span className="text-2xl font-bold text-amber-400">
                {record.price.toFixed(2)} €
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              por {record.unit}
            </p>
          </div>

          {history.length > 1 && (
            <Sparkline
              data={history.map((h) => h.price)}
              className="w-20 h-10"
            />
          )}
        </div>

        {/* Stock + link */}
        <div className="flex items-center justify-between mt-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              record.in_stock
                ? "border-green-600 text-green-400"
                : "border-red-600 text-red-400"
            )}
          >
            {record.in_stock ? "En stock" : "Sin stock"}
          </Badge>

          <a
            href={record.product_url || record.shop_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            Ver tienda <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
