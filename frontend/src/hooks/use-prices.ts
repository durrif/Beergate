// src/hooks/use-prices.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { PriceResult, PriceAlert } from "@/lib/types";

// ─── Price search ─────────────────────────────────────────────────────────────

export function usePriceSearch(query: string) {
  return useQuery({
    queryKey: ["prices-search", query],
    queryFn: () => apiClient.get<PriceResult[]>(`/v1/prices/search?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length > 2,
    staleTime: 5 * 60_000, // 5 min - prices don't change that often
  });
}

// ─── Recipe price comparison ──────────────────────────────────────────────────

export interface RecipePriceComparison {
  ingredient_name: string;
  cheapest_price: number | null;
  cheapest_shop: string | null;
  all_offers: PriceResult[];
}

export function useRecipePrices(recipeId: number | null) {
  return useQuery({
    queryKey: ["recipe-prices", recipeId],
    queryFn: () => apiClient.get<RecipePriceComparison[]>(`/v1/prices/compare-recipe/${recipeId}`),
    enabled: !!recipeId,
    staleTime: 10 * 60_000,
  });
}

// ─── Trigger background scrape ────────────────────────────────────────────────

export function useTriggerScrape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) =>
      apiClient.post<{ task_id: string }>(`/v1/prices/scrape-recipe/${recipeId}`, {}),
    onSuccess: (_data, recipeId) => {
      // After a short delay, refresh the recipe prices to show updated results
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["recipe-prices", recipeId] });
      }, 5_000);
    },
  });
}

// ─── Price alerts ─────────────────────────────────────────────────────────────

export function usePriceAlerts() {
  return useQuery({
    queryKey: ["price-alerts"],
    queryFn: () => apiClient.get<PriceAlert[]>("/v1/prices/alerts"),
    refetchInterval: 5 * 60_000,
  });
}

export function useCreatePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ingredient_name: string; alert_type?: string; threshold_price?: number }) =>
      apiClient.post<PriceAlert>("/v1/prices/alerts", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-alerts"] }),
  });
}

export function useDeletePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/v1/prices/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-alerts"] }),
  });
}

// ─── Latest prices for a given ingredient name ───────────────────────────────

export function useIngredientPriceHistory(name: string) {
  return useQuery({
    queryKey: ["ingredient-price-history", name],
    queryFn: () =>
      apiClient.get<Array<{ scraped_at: string; price: number; shop: string }>>(
        `/v1/prices/history?name=${encodeURIComponent(name)}`
      ),
    enabled: !!name,
    staleTime: 10 * 60_000,
  });
}
