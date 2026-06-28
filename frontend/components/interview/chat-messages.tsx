"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Robot, User, CircleNotch } from "@phosphor-icons/react";
import { MarkdownRenderer } from "@/components/interview/markdown-renderer";

export interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  type?: "question" | "evaluation" | "summary" | "hint";
}

interface ChatMessagesProps {
  messages: Message[];
  isThinking: boolean;
}

export function ChatMessages({ messages, isThinking }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="flex-1 py-2 min-h-0">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "ai" && (
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border mt-0.5",
                msg.type === "hint"
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-purple-500/10 border-purple-500/20"
              )}>
                <Robot weight="duotone" className={cn("size-4", msg.type === "hint" ? "text-amber-400" : "text-purple-400")} />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3.5 py-2.5",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground text-sm leading-relaxed"
                  : msg.type === "hint"
                    ? "bg-amber-500/5 border border-amber-500/20"
                    : "bg-muted/50 border border-border/50"
              )}
            >
              {msg.role === "ai" ? (
                <MarkdownRenderer content={msg.content?.trim()} />
              ) : (
                <span>{msg.content}</span>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50 mt-0.5">
                <User weight="duotone" className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 mt-0.5">
              <Robot weight="duotone" className="size-4 text-purple-400" />
            </div>
            <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3 flex items-center gap-2">
              <CircleNotch className="size-4 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
