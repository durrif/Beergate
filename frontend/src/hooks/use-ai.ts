// src/hooks/use-ai.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { AIMessage, AIConversation } from "@/lib/types";

// ─── Conversation CRUD ───────────────────────────────────────────────────────

export function useConversations() {
  const brewery = useAuthStore((s) => s.brewery);
  return useQuery({
    queryKey: ["conversations", brewery?.id],
    queryFn: () => api.get<AIConversation[]>("/v1/ai/conversations"),
    enabled: !!brewery,
  });
}

export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => api.get<AIMessage[]>(`/v1/ai/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/v1/ai/conversations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ─── Streaming chat ──────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UseChatOptions {
  contextPage?: string;
  contextData?: Record<string, unknown>;
}

export function useAIChat(opts: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Add empty assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const payload = {
        messages: [{ role: "user" as const, content }],
        conversation_id: conversationId,
        context_page: opts.contextPage,
        context_data: opts.contextData,
        max_tokens: 2048,
      };

      const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
      const resp = await fetch(
        `${baseUrl}/api/v1/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.error) {
                throw new Error(evt.error);
              }
              if (evt.conversation_id != null) {
                setConversationId(evt.conversation_id);
              }
              if (evt.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1] as ChatMessage | undefined;
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = { role: "assistant" as const, content: last.content + (evt.text as string) };
                  }
                  return updated;
                });
              }
              if (evt.done) {
                break;
              }
            } catch {
              // non-JSON SSE line, ignore
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1] as ChatMessage | undefined;
          if (last && last.role === "assistant" && !last.content) {
            updated[updated.length - 1] = { role: "assistant" as const, content: "⚠️ Error al conectar con el asistente. Inténtalo de nuevo." };
          }
          return updated;
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  const stopStreaming = () => abortRef.current?.abort();

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return { messages, streaming, conversationId, sendMessage, stopStreaming, clearChat };
}
