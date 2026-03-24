// src/hooks/use-recipes.ts
import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  parseBeerXMLFile,
  parseBeerXMLZip,
  type BulkImportProgress,
} from "@/lib/beerxml-parser";
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

// ─── BeerXML import (client-side + server fallback) ───────────────────────────

/**
 * Import a single BeerXML file. Parses client-side first,
 * then sends parsed recipes to backend /v1/recipes for storage.
 * Falls back to direct FormData upload if server supports it.
 */
export function useImportBeerXML() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<Partial<Recipe>[]> => {
      // Client-side parse
      const parsed = await parseBeerXMLFile(file);
      // Try to persist each recipe on backend
      const stored: Partial<Recipe>[] = [];
      for (const recipe of parsed) {
        try {
          const saved = await apiClient.post<Recipe>("/v1/recipes", recipe);
          stored.push(saved);
        } catch {
          // If backend fails, still return parsed data
          stored.push(recipe);
        }
      }
      return stored;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

/**
 * Bulk import from a .zip file containing multiple BeerXML files.
 * Returns progress updates via the onProgress callback.
 */
export function useBulkImportBeerXML() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<BulkImportProgress> => {
      const isZip =
        file.name.toLowerCase().endsWith(".zip") ||
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed";

      let result: BulkImportProgress;

      if (isZip) {
        result = await parseBeerXMLZip(file, (p) => setProgress({ ...p }));
      } else {
        // Single XML file
        setProgress({
          total: 1,
          processed: 0,
          succeeded: 0,
          failed: 0,
          currentFile: file.name,
          errors: [],
          recipes: [],
        });
        try {
          const recipes = await parseBeerXMLFile(file);
          result = {
            total: 1,
            processed: 1,
            succeeded: 1,
            failed: 0,
            currentFile: file.name,
            errors: [],
            recipes,
          };
        } catch (err) {
          result = {
            total: 1,
            processed: 1,
            succeeded: 0,
            failed: 1,
            currentFile: file.name,
            errors: [
              {
                file: file.name,
                error: err instanceof Error ? err.message : "Parse error",
              },
            ],
            recipes: [],
          };
        }
      }

      // Try to persist all parsed recipes on backend
      for (const recipe of result.recipes) {
        try {
          await apiClient.post<Recipe>("/v1/recipes", recipe);
        } catch {
          // Silent — recipes are still in local state
        }
      }

      setProgress(result);
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const reset = useCallback(() => setProgress(null), []);

  return { ...mutation, progress, resetProgress: reset };
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
