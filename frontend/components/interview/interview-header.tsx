"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, SignOut, Hash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface InterviewHeaderProps {
  questionNumber: number;
  maxQuestions: number;
  mode: string;
  topics: string[];
  onEndInterview: () => void;
  isEnding: boolean;
}

export function InterviewHeader({
  questionNumber,
  maxQuestions,
  mode,
  topics,
  onEndInterview,
  isEnding,
}: InterviewHeaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const progressPercent = (questionNumber / maxQuestions) * 100;

  useEffect(() => {
    const interval = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
            <Hash weight="bold" className="size-3" />
            {questionNumber}/{maxQuestions}
          </Badge>

          <div className="flex gap-1 overflow-hidden">
            {topics.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] shrink-0">
                {t}
              </Badge>
            ))}
          </div>

          <Badge
            variant="outline"
            className="text-[10px] shrink-0"
          >
            {mode === "TRAINING" ? "📚 Training" : "💼 Realistic"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Timer weight="duotone" className="size-3.5" />
            {formatTime(elapsed)}
          </span>

          <Button
            variant="destructive"
            size="sm"
            onClick={onEndInterview}
            disabled={isEnding}
            className="gap-1 text-xs h-7"
          >
            <SignOut className="size-3" />
            End
          </Button>
        </div>
      </div>

      <Progress value={progressPercent} className="h-0.5 rounded-none" />
    </div>
  );
}
