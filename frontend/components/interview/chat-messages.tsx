"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Robot, User, CircleNotch } from "@phosphor-icons/react";

export interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  type?: "question" | "evaluation" | "summary";
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
    <ScrollArea className="flex-1 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "ai" && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 mt-0.5">
                <Robot weight="duotone" className="size-4 text-purple-400" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 border border-border/50"
              )}
            >
              <MessageContent content={msg.content} />
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

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for bold and code blocks
  const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*|\n)/g);

  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^\w+\n/, "");
          return (
            <pre
              key={i}
              className="bg-background/50 border border-border/50 rounded-md p-2.5 overflow-x-auto text-xs font-mono mt-2 mb-1"
            >
              <code>{code}</code>
            </pre>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
