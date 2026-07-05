"use client";

import { DIFFICULTY_MODES, DIFFICULTY_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  difficultyMode: string;
  onSelectMode: (mode: string) => void;
  manualDifficulty: number;
  onSelectLevel: (level: number) => void;
}

export function DifficultySelector({
  difficultyMode,
  onSelectMode,
  manualDifficulty,
  onSelectLevel,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Difficulty</h3>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        {DIFFICULTY_MODES.map((mode) => {
          const isSelected = difficultyMode === mode.id;
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

      {/* Manual difficulty level selector */}
      {difficultyMode === "MANUAL" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Difficulty Level</span>
            <span className="text-xs font-medium text-purple-400">
              {DIFFICULTY_LEVELS[manualDifficulty - 1]?.label ?? "Advanced"}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = manualDifficulty === level.level;
              return (
                <button
                  key={level.level}
                  type="button"
                  onClick={() => onSelectLevel(level.level)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all",
                    isSelected
                      ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                      : "border-border/50 bg-card hover:border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-sm font-bold">{level.level}</span>
                  <span className="text-[10px] leading-tight">{level.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            {DIFFICULTY_LEVELS[manualDifficulty - 1]?.description}
          </p>
        </div>
      )}
    </div>
  );
}
