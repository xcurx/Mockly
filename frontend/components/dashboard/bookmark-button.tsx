"use client";

import { useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
  interviewId: string;
  exchangeId: string;
  initialBookmarked: boolean;
}

export function BookmarkButton({
  interviewId,
  exchangeId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const toggleBookmark = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/interview/${interviewId}/exchange/${exchangeId}/bookmark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookmarked: !bookmarked }),
        }
      );
      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
      onClick={toggleBookmark}
      disabled={isLoading}
    >
      <BookmarkSimple
        weight={bookmarked ? "fill" : "regular"}
        className={`size-4 ${bookmarked ? "text-primary" : ""}`}
      />
      {bookmarked ? "Saved" : "Save Question"}
    </Button>
  );
}
