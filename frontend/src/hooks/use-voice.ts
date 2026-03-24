// src/hooks/use-voice.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceCommandPayload {
  text: string;
  context_page?: string;
}

export interface VoiceCommandResult {
  action: string;
  params: Record<string, unknown>;
  response_text: string;
  executed: boolean;
}

export interface VoiceCapabilities {
  commands: Array<{
    intent: string;
    description: string;
    example: string;
  }>;
  languages: string[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useVoiceCommand() {
  return useMutation({
    mutationFn: (payload: VoiceCommandPayload) =>
      apiClient.post<VoiceCommandResult>("/v1/voice/command", payload),
  });
}

export function useVoiceCapabilities() {
  return useQuery({
    queryKey: ["voice-capabilities"],
    queryFn: () => apiClient.get<VoiceCapabilities>("/v1/voice/capabilities"),
    staleTime: Infinity, // capabilities don't change at runtime
  });
}

// ─── Browser speech recognition helper ───────────────────────────────────────

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (err: string) => void;
}

// Loose interface matching both SpeechRecognition and webkitSpeechRecognition
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type WindowWithSpeech = {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions) {
  const getSpeechRecognition = (): SpeechRecognitionCtor | undefined => {
    if (typeof window === "undefined") return undefined;
    const w = window as unknown as WindowWithSpeech;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition;
  };

  const start = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      opts.onError?.("Speech recognition not supported in this browser.");
      return null;
    }

    const recognition = new Ctor();
    recognition.lang = opts.lang ?? "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (evt: Event) => {
      const se = evt as Event & { results: { [i: number]: { [j: number]: { transcript: string } } } };
      const transcript = se.results[0]?.[0]?.transcript ?? "";
      opts.onResult(transcript);
    };

    recognition.onerror = (evt: Event) => {
      const ee = evt as ErrorEvent;
      opts.onError?.(ee.message ?? "Speech error");
    };

    recognition.start();
    return recognition;
  };

  return { start, supported: !!getSpeechRecognition() };
}
