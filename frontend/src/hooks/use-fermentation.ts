// src/hooks/use-fermentation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { FermentationPoint, ISpindelReading } from "@/lib/types";

// ─── Fermentation data ───────────────────────────────────────────────────────

export function useFermentationData(sessionId: number | null) {
  return useQuery({
    queryKey: ["fermentation", sessionId],
    queryFn: () =>
      apiClient.get<FermentationPoint[]>(`/v1/fermentation/${sessionId}/data`),
    enabled: !!sessionId,
    refetchInterval: 60_000, // refresh every minute if not using WebSocket
  });
}

export function useAddFermentationPoint(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FermentationPoint>) =>
      apiClient.post<FermentationPoint>(`/v1/fermentation/${sessionId}/data`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["fermentation", sessionId] }),
  });
}

// ─── iSpindel live WebSocket ─────────────────────────────────────────────────

export function useFermentationWebSocket(
  sessionId: number | null,
  onReading: (reading: ISpindelReading) => void
) {
  const token = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId || !token) return;

    const base = ((import.meta.env.VITE_WS_URL as string | undefined) ?? window.location.origin.replace(/^http/, "ws"));
    const url = `${base}/api/v1/fermentation/ws/${sessionId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const data: ISpindelReading = JSON.parse(evt.data);
        onReading(data);
        qc.invalidateQueries({ queryKey: ["fermentation", sessionId] });
      } catch {
        // non-JSON frame, ignore
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, token, onReading, qc]);

  const send = (payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  return { send };
}

// ─── Active fermentation sessions ────────────────────────────────────────────

export function useActiveFermentations() {
  const brewery = useAuthStore((s) => s.brewery);
  return useQuery({
    queryKey: ["fermentations-active", brewery?.id],
    queryFn: () => apiClient.get<{ id: number; brew_session_name: string; started_at: string }[]>("/v1/brewing?phase_filter=fermenting"),
    enabled: !!brewery,
    refetchInterval: 30_000,
  });
}

export function useLatestISpindelReading(sessionId: number | null) {
  return useQuery({
    queryKey: ["ispindel-latest", sessionId],
    queryFn: () => apiClient.get<ISpindelReading>(`/v1/fermentation/${sessionId}/data?limit=1`),
    enabled: !!sessionId,
    refetchInterval: 30_000,
  });
}
