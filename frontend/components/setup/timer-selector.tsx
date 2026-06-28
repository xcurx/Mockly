"use client";

import { Badge } from "@/components/ui/badge";
import { Timer, Infinity as InfinityIcon } from "@phosphor-icons/react";

interface TimerSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const TIMER_OPTIONS = [
  { label: "No Limit", value: null, icon: InfinityIcon, description: "Take your time" },
  { label: "2 min", value: 120, icon: Timer, description: "Speed round" },
  { label: "5 min", value: 300, icon: Timer, description: "Standard" },
  { label: "10 min", value: 600, icon: Timer, description: "Deep thinking" },
] as const;

export function TimerSelector({ value, onChange }: TimerSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Time per Question</h3>
        <Badge variant="secondary" className="text-[10px]">
          {value ? `${value / 60} min` : "Unlimited"}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TIMER_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center cursor-pointer ${
                isSelected
                  ? "border-purple-500/50 bg-purple-500/10 text-foreground"
                  : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                weight={isSelected ? "fill" : "duotone"}
                className={`size-5 ${isSelected ? "text-purple-400" : ""}`}
              />
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
