// src/components/brewing/step-card.tsx
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Thermometer, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BrewStep } from "@/lib/types";

interface StepCardProps {
  step: BrewStep;
  index: number;
  isActive?: boolean;
  onComplete?: (stepId: string) => void;
}

export function StepCard({ step, index, isActive = false, onComplete }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card
        className={cn(
          "border transition-colors",
          step.completed
            ? "bg-zinc-900/40 border-zinc-800 opacity-60"
            : isActive
              ? "bg-zinc-900/80 border-amber-500/60 ring-1 ring-amber-500/20"
              : "bg-zinc-900/80 border-zinc-700"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : isActive ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Circle className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </motion.div>
              ) : (
                <Circle className="w-5 h-5 text-zinc-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className={cn(
                  "font-medium text-sm",
                  step.completed ? "line-through text-zinc-500" : ""
                )}>
                  {step.name}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {step.temp_c && (
                    <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs gap-1">
                      <Thermometer className="w-3 h-3" />
                      {step.temp_c} °C
                    </Badge>
                  )}
                  {step.duration_min && (
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {step.duration_min} min
                    </Badge>
                  )}
                </div>
              </div>

              {step.description && (
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {step.description}
                </p>
              )}

              {step.notes && (
                <p className="text-xs text-zinc-500 mt-1 italic">
                  {step.notes}
                </p>
              )}
            </div>

            {/* Complete button */}
            {isActive && !step.completed && onComplete && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500 text-amber-400 hover:bg-amber-500/10 shrink-0"
                onClick={() => onComplete(step.id)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
