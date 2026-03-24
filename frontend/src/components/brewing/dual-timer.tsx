// src/components/brewing/dual-timer.tsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next'
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimerProps {
  label: string;
  colorClass: string;
  durationMinutes?: number;
}

function useTimer(initialSeconds: number = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggle = () => setIsRunning((r) => !r);
  const reset = () => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return { seconds, isRunning, toggle, reset, fmt };
}

function SingleTimer({
  label,
  colorClass,
  durationMinutes,
}: TimerProps) {
  const start = durationMinutes ? durationMinutes * 60 : 0;
  const { seconds, isRunning, toggle, reset, fmt } = useTimer(
    durationMinutes ? start : 0
  );
  const remaining = durationMinutes ? Math.max(0, start - seconds) : seconds;
  const progress = durationMinutes
    ? Math.min(100, (seconds / start) * 100)
    : 0;
  const done = durationMinutes ? seconds >= start : false;

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 flex flex-col gap-3 border",
        done ? "border-emerald-500/40" : "border-white/10"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
          <Clock className={cn("h-3.5 w-3.5", colorClass)} />
          {label}
        </span>
        {done && (
          <span className="text-xs text-emerald-400 font-semibold animate-pulse">
            ✅ Listo
          </span>
        )}
      </div>

      {/* circular display */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
            />
            {durationMinutes && (
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={done ? "#10b981" : "#D4A04A"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                done ? "text-emerald-400" : colorClass
              )}
            >
              {fmt(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className={cn("h-8 w-8 border-white/10", isRunning && "border-amber-500/50")}
          onClick={toggle}
          disabled={done}
        >
          {isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-white/10"
          onClick={reset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface DualTimerProps {
  mashDurationMinutes?: number;
  boilDurationMinutes?: number;
}

export function DualTimer({
  mashDurationMinutes = 60,
  boilDurationMinutes = 60,
}: DualTimerProps) {
  const { t } = useTranslation('common')
  return (
    <div className="grid grid-cols-2 gap-3">
      <SingleTimer
        label={t('brew_day.mashing')}
        colorClass="text-amber-400"
        durationMinutes={mashDurationMinutes}
      />
      <SingleTimer
        label={t('brew_day.boiling')}
        colorClass="text-orange-400"
        durationMinutes={boilDurationMinutes}
      />
    </div>
  );
}
