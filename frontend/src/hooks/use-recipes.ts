// src/hooks/use-recipes.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Recipe, CanBrewResult } from "@/lib/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRecipes(search?: string) {
  const brewery = useAuthStore((s) => s.brewery);
  const url = search
    ? `/v1/recipes?search=${encodeURIComponent(search)}`
    : "/v1/recipes";
  return useQuery({
    queryKey: ["recipes", brewery?.id, search],
    queryFn: () => apiClient.get<Recipe[]>(url),
    enabled: !!brewery,
    staleTime: 30_000,
  });
}

export function useRecipe(id: number | null) {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: () => apiClient.get<Recipe>(`/v1/recipes/${id}`),
    enabled: !!id,
  });
}

export function useCheckCanBrew(recipeId: number | null) {
  return useQuery({
    queryKey: ["can-brew", recipeId],
    queryFn: () => apiClient.get<CanBrewResult>(`/v1/recipes/${recipeId}/can-brew`),
    enabled: !!recipeId,
    staleTime: 60_000, // depends on inventory — refresh when inventory changes
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Recipe>) => apiClient.post<Recipe>("/v1/recipes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Recipe> }) =>
      apiClient.put<Recipe>(`/v1/recipes/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["recipe", id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/v1/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

// ─── BeerXML import ───────────────────────────────────────────────────────────

export function useImportBeerXML() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.postForm<Recipe[]>("/v1/recipes/import/beerxml", form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

// ─── Brewer's Friend sync ─────────────────────────────────────────────────────

export interface BFRecipePreview {
  id: string;
  name: string;
  style: string;
  batch_size: number;
}

export function useListBrewersFriendRecipes(apiKey: string) {
  return useQuery({
    queryKey: ["bf-recipes", apiKey],
    queryFn: () =>
      apiClient.get<BFRecipePreview[]>(`/v1/recipes/brewers-friend/list?api_key=${encodeURIComponent(apiKey)}`),
    enabled: !!apiKey && apiKey.length > 10,
    staleTime: 2 * 60_000,
  });
}

export function useSyncBrewersFriendRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiKey, recipeId }: { apiKey: string; recipeId: string }) =>
      apiClient.post<Recipe>("/v1/recipes/brewers-friend/sync", { api_key: apiKey, recipe_id: recipeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

// ─── Brew session from recipe ─────────────────────────────────────────────────

export function useStartBrewFromRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) =>
      apiClient.post<{ session_id: number }>(`/v1/recipes/${recipeId}/brew`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brew-sessions"] }),
  });
}
