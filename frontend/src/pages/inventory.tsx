// frontend/src/pages/inventory.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

import { useUIStore } from "@/stores/ui-store";
import { useInventory, useAdjustStock, useDeleteIngredient } from "@/hooks/use-inventory";
import { IngredientCard } from "@/components/inventory/ingredient-card";
import {
  InventoryFiltersBar,
  type InventoryFilters,
} from "@/components/inventory/inventory-filters";
import { Button } from "@/components/ui/button";
import type { Ingredient } from "@/lib/types";

const DEFAULT_FILTERS: InventoryFilters = {
  search: "",
  category: "",
  lowStockOnly: false,
  expiringDays: null,
  sortField: "name",
  sortDir: "asc",
};

export default function InventoryPage() {
  const { setActivePage } = useUIStore();
  useEffect(() => setActivePage("inventory"), [setActivePage]);

  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useInventory({
    page,
    page_size: 24,
    category: filters.category || undefined,
    search: filters.search || undefined,
    low_stock_only: filters.lowStockOnly || undefined,
    expiring_days: filters.expiringDays ?? undefined,
  });

  const adjustStock = useAdjustStock();
  const deleteIngredient = useDeleteIngredient();

  const ingredients: Ingredient[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  const handleAdjust = (ingredient: Ingredient, delta: number) => {
    adjustStock.mutate(
      { id: ingredient.id, delta, reason: "quick_adjust" },
      {
        onError: () => toast.error("Error al ajustar stock"),
      }
    );
  };

  const handleDelete = (ingredient: Ingredient) => {
    if (!confirm(`¿Eliminar "${ingredient.name}"?`)) return;
    deleteIngredient.mutate(ingredient.id, {
      onSuccess: () => toast.success("Ingrediente eliminado"),
      onError: () => toast.error("Error al eliminar"),
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold amber-text">Inventario</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Gestiona tus ingredientes y stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className={isFetching ? "animate-spin" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="bg-accent-amber hover:bg-accent-amber-bright text-black font-semibold">
            <Plus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </div>
      </div>

      {/* filters */}
      <InventoryFiltersBar
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        totalCount={total}
        filteredCount={ingredients.length}
      />

      {/* content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-xl h-32 animate-pulse bg-bg-elevated"
            />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="h-12 w-12 text-text-muted" />
          <p className="text-text-muted text-lg">
            {filters.search || filters.category || filters.lowStockOnly
              ? "Sin resultados para los filtros activos"
              : "No hay ingredientes todavía"}
          </p>
          <Button
            variant="outline"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            layout
          >
            {ingredients.map((ing) => (
              <motion.div
                key={ing.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <IngredientCard
                  ingredient={ing}
                  onAdjust={handleAdjust}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-text-muted">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
