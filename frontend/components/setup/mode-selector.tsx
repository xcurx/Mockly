"use client";

import { INTERVIEW_MODES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  selectedMode: string;
  onSelectMode: (modeId: string) => void;
}

export function ModeSelector({ selectedMode, onSelectMode }: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Interview Mode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTERVIEW_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-purple-500/50 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                  : "border-border/50 bg-card hover:border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{mode.emoji}</span>
                <span className="text-sm font-medium">{mode.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
