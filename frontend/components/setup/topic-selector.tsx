"use client";

import { CURATED_TOPICS, BEHAVIORAL_CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopicSelectorProps {
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  customTopics: string[];
  onAddCustomTopic: (topic: string) => void;
  onRemoveCustomTopic: (topic: string) => void;
  mode?: string;
}

export function TopicSelector({
  selectedTopics,
  onToggleTopic,
  customTopics,
  onAddCustomTopic,
  onRemoveCustomTopic,
  mode = "TRAINING",
}: TopicSelectorProps) {
  const [customInput, setCustomInput] = useState("");

  const handleAdd = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customTopics.includes(trimmed)) {
      onAddCustomTopic(trimmed);
      setCustomInput("");
    }
  };

  const isBehavioral = mode === "BEHAVIORAL";
  const topics = isBehavioral ? BEHAVIORAL_CATEGORIES : CURATED_TOPICS;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">
          {isBehavioral ? "Select Focus Areas" : "Select Topics"}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {topics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onToggleTopic(topic.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all",
                  isSelected
                    ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                    : "border-border/50 bg-card hover:border-border hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="text-lg">{topic.emoji}</span>
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom topic input — only for non-behavioral modes */}
      {!isBehavioral && (
        <>
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom topic..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="h-8 text-xs"
            />
            <Button variant="outline" size="sm" onClick={handleAdd} className="shrink-0 gap-1">
              <Plus weight="bold" className="size-3" />
              Add
            </Button>
          </div>

          {/* Custom topic pills */}
          {customTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customTopics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => onRemoveCustomTopic(topic)}
                    className="rounded-full hover:bg-foreground/10 p-0.5"
                  >
                    <X weight="bold" className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
