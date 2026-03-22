// src/components/inventory/inventory-filters.tsx
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SortField = "name" | "quantity" | "expiry_date" | "category";
export type SortDir = "asc" | "desc";

export interface InventoryFilters {
  search: string;
  category: string;
  lowStockOnly: boolean;
  expiringDays: number | null;
  sortField: SortField;
  sortDir: SortDir;
}

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "malta_base", label: "Malta base" },
  { value: "malta_especial", label: "Malta especial" },
  { value: "lupulo", label: "Lúpulo" },
  { value: "levadura", label: "Levadura" },
  { value: "adjunto", label: "Adjunto" },
  { value: "otro", label: "Otro" },
];

interface InventoryFiltersProps {
  filters: InventoryFilters;
  onChange: (filters: InventoryFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export function InventoryFiltersBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: InventoryFiltersProps) {
  const set = (patch: Partial<InventoryFilters>) =>
    onChange({ ...filters, ...patch });

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.lowStockOnly ? 1 : 0) +
    (filters.expiringDays !== null ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* search + filter count */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Buscar ingrediente..."
            className="pl-9 bg-bg-card border-white/10"
          />
          {filters.search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              onClick={() => set({ search: "" })}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "border-white/10",
            activeFilterCount > 0 && "border-amber-500/50 text-amber-400"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => set({ category: value })}
            className={cn(
              "px-3 py-1 rounded-full text-xs border transition-colors",
              filters.category === value
                ? "bg-accent-amber/20 border-accent-amber text-accent-amber"
                : "bg-bg-card border-white/10 text-text-muted hover:border-white/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* quick-filter badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => set({ lowStockOnly: !filters.lowStockOnly })}
          className={cn(
            "px-2.5 py-0.5 rounded-full text-xs border transition-colors",
            filters.lowStockOnly
              ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
              : "bg-bg-card border-white/10 text-text-muted hover:border-amber-500/40"
          )}
        >
          ⚠ Stock bajo
        </button>
        <button
          onClick={() =>
            set({ expiringDays: filters.expiringDays === null ? 30 : null })
          }
          className={cn(
            "px-2.5 py-0.5 rounded-full text-xs border transition-colors",
            filters.expiringDays !== null
              ? "bg-red-500/20 border-red-500/60 text-red-400"
              : "bg-bg-card border-white/10 text-text-muted hover:border-red-500/40"
          )}
        >
          ⏰ Próximos a vencer
        </button>

        <span className="ml-auto text-xs text-text-muted">
          {filteredCount === totalCount
            ? `${totalCount} ingredientes`
            : `${filteredCount} / ${totalCount}`}
        </span>
      </div>
    </div>
  );
}
