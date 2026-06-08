"use client";

import { Slider } from "@/components/ui/slider";

interface QuestionCountSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function QuestionCountSlider({ value, onChange }: QuestionCountSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Number of Questions</h3>
        <span className="text-sm font-bold text-cyan-400 tabular-nums">{value}</span>
      </div>
      <Slider
        min={5}
        max={25}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>5</span>
        <span>25</span>
      </div>
    </div>
  );
}
