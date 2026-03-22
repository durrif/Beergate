// src/components/inventory/ingredient-card.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Edit2, Trash2, Plus, Minus, Package } from "lucide-react";
import { cn, daysUntilExpiry, categoryColor, stockStatus } from "@/lib/utils";
import { ExpiryBadge } from "./expiry-badge";
import { LiquidProgress } from "./liquid-progress";
import type { Ingredient } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit?: (ingredient: Ingredient) => void;
  onDelete?: (ingredient: Ingredient) => void;
  onAdjust?: (ingredient: Ingredient, delta: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  malta_base: "Malta base",
  malta_especial: "Malta especial",
  otra: "Otra malta",
  lupulo: "Lúpulo",
  levadura: "Levadura",
  adjunto: "Adjunto",
  otro: "Otro",
};

export function IngredientCard({
  ingredient,
  onEdit,
  onDelete,
  onAdjust,
}: IngredientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = daysUntilExpiry(ingredient.expiry_date ?? "");
  const stock = stockStatus(ingredient.quantity, ingredient.min_stock ?? 0);
  const catColor = categoryColor(ingredient.category);

  return (
    <motion.div
      layout
      className={cn(
        "glass-card rounded-xl border overflow-hidden cursor-pointer transition-colors",
        stock === "danger" && "border-red-500/40",
        stock === "warning" && "border-amber-500/40",
        stock === "ok" && "border-white/10",
      )}
      whileHover={{ y: -2 }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* top strip */}
      <div className={cn("h-0.5 w-full", catColor)} />

      <div className="p-4">
        {/* header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Package className={cn("h-4 w-4 shrink-0", catColor.replace("bg-", "text-"))} />
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{ingredient.name}</p>
              <p className="text-xs text-text-muted">
                {CATEGORY_LABELS[ingredient.category] ?? ingredient.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpiryBadge daysLeft={daysLeft} />
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </motion.div>
          </div>
        </div>

        {/* stock bar */}
        <div className="mt-3">
          <LiquidProgress
            value={ingredient.quantity}
            max={Math.max(ingredient.quantity, (ingredient.min_stock ?? 0) * 3)}
            low={ingredient.min_stock}
            unit={ingredient.unit}
          />
        </div>
      </div>

      {/* expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* meta */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {ingredient.supplier && (
                  <>
                    <span className="text-text-muted">Proveedor</span>
                    <span className="text-text-secondary">{ingredient.supplier}</span>
                  </>
                )}
                {ingredient.purchase_price !== undefined && ingredient.purchase_price > 0 && (
                  <>
                    <span className="text-text-muted">Precio</span>
                    <span className="text-text-secondary">
                      {ingredient.purchase_price.toFixed(2)} €/{ingredient.unit}
                    </span>
                  </>
                )}
                <span className="text-text-muted">Stock mín.</span>
                <span className="text-text-secondary">
                  {ingredient.min_stock} {ingredient.unit}
                </span>
              </div>

              {ingredient.notes && (
                <p className="text-xs text-text-muted italic">{ingredient.notes}</p>
              )}

              {/* quick-adjust */}
              {onAdjust && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted mr-auto">Ajuste rápido</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onAdjust(ingredient, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-mono w-14 text-center text-text-primary">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onAdjust(ingredient, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* actions */}
              <div className="flex justify-end gap-2 pt-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onEdit(ingredient)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-400 hover:text-red-300"
                    onClick={() => onDelete(ingredient)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
