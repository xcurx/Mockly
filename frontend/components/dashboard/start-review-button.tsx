"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function StartReviewButton({ questions }: { questions: string[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      questions.forEach((q) => formData.append("questions[]", q));

      const res = await fetch("/api/interview/start-review", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to start review session");
      }

      const data = await res.json();
      
      // store session data for the interview page
      sessionStorage.setItem(`interview-${data.interviewId}`, JSON.stringify({
        interviewId: data.interviewId,
        questionNumber: 1,
        interviewState: data.interviewState,
        currentQuestion: data.question,
        timeLimitSeconds: null,
      }));

      router.push(`/dashboard/interview/${data.interviewId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to start review session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStart}
      disabled={loading}
      className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 hover:opacity-90"
    >
      {loading ? (
        <CircleNotch className="size-4 animate-spin" />
      ) : (
        <Target weight="fill" className="size-4" />
      )}
      {loading ? "Preparing Session..." : "Start Review Session"}
    </Button>
  );
}
