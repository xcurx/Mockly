"use client";

import { INTERACTION_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InteractionTypeSelectorProps {
  selectedType: string;
  onSelectType: (typeId: string) => void;
}

export function InteractionTypeSelector({
  selectedType,
  onSelectType,
}: InteractionTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Interaction Type</h3>
      <div className="grid grid-cols-3 gap-3">
        {INTERACTION_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectType(type.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                isSelected
                  ? "border-purple-500/50 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                  : "border-border/50 bg-card hover:border-border hover:bg-muted/50"
              )}
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-xs font-medium">{type.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {type.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
