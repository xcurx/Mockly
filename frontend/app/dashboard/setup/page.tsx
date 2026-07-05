"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TopicSelector } from "@/components/setup/topic-selector";
import { ModeSelector } from "@/components/setup/mode-selector";
import { InteractionTypeSelector } from "@/components/setup/interaction-type-selector";
import { DifficultySelector } from "@/components/setup/difficulty-selector";
import { RoleSelector } from "@/components/setup/role-selector";
import { QuestionCountSlider } from "@/components/setup/question-count-slider";
import { TimerSelector } from "@/components/setup/timer-selector";
import { ResumeUpload } from "@/components/setup/resume-upload";
import { Rocket, SpinnerGap, Warning } from "@phosphor-icons/react";

export default function SetupPage() {
  const router = useRouter();

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [mode, setMode] = useState("TRAINING");
  const [interactionType, setInteractionType] = useState("TEXT");
  const [difficultyMode, setDifficultyMode] = useState("ADAPTIVE");
  const [manualDifficulty, setManualDifficulty] = useState(3);
  const [role, setRole] = useState<string | null>(null);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

  const handleResumeUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setResumeId(data.resumeId);
      setResumeData(data.parsedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = async () => {
    if (selectedTopics.length === 0 && customTopics.length === 0) {
      setError("Select at least one topic to begin");
      return;
    }

    setIsStarting(true);
    setError("");

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selectedTopics,
          customTopics,
          mode,
          interactionType,
          difficultyMode: mode === "REVIEW" ? "ADAPTIVE" : difficultyMode,
          manualDifficulty: difficultyMode === "MANUAL" ? manualDifficulty : null,
          role: role || null,
          maxQuestions,
          timeLimitSeconds,
          resumeId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start interview");
      }

      const data = await res.json();

      sessionStorage.setItem(
        `interview-${data.interviewId}`,
        JSON.stringify({
          interviewState: data.interviewState,
          currentQuestion: {
            question: data.question,
            difficulty: data.questionDifficulty || null,
          },
          questionNumber: 1,
          timeLimitSeconds,
        })
      );

      router.push(`/dashboard/interview/${data.interviewId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start";
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  const hasTopics = selectedTopics.length > 0 || customTopics.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Configure Your Interview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick your topics, mode, and interaction style
        </p>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-center gap-2 p-3 text-red-400 text-sm">
            <Warning weight="fill" className="size-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6">
          <TopicSelector
            selectedTopics={selectedTopics}
            onToggleTopic={toggleTopic}
            customTopics={customTopics}
            onAddCustomTopic={(t) => setCustomTopics((prev) => [...prev, t])}
            onRemoveCustomTopic={(t) =>
              setCustomTopics((prev) => prev.filter((ct) => ct !== t))
            }
            mode={mode}
          />

          <Separator className="opacity-50" />

          <ModeSelector selectedMode={mode} onSelectMode={(m) => {
            setMode(m);
            setSelectedTopics([]);
            setCustomTopics([]);
          }} />

          <Separator className="opacity-50" />

          <InteractionTypeSelector
            selectedType={interactionType}
            onSelectType={setInteractionType}
          />

          {mode !== "REVIEW" && (
            <>
              <Separator className="opacity-50" />

              <DifficultySelector
                difficultyMode={difficultyMode}
                onSelectMode={setDifficultyMode}
                manualDifficulty={manualDifficulty}
                onSelectLevel={setManualDifficulty}
              />

              <Separator className="opacity-50" />

              <RoleSelector
                selectedRole={role}
                onSelectRole={setRole}
              />
            </>
          )}

          <Separator className="opacity-50" />

          <QuestionCountSlider value={maxQuestions} onChange={setMaxQuestions} />

          <Separator className="opacity-50" />

          <TimerSelector value={timeLimitSeconds} onChange={setTimeLimitSeconds} />

          <Separator className="opacity-50" />

          <ResumeUpload
            onUploadComplete={(id, data) => {
              setResumeId(id);
              setResumeData(data);
            }}
            resumeId={resumeId}
            parsedData={resumeData}
            isUploading={isUploading}
            error={uploadError}
            onFileSelect={handleResumeUpload}
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleStart}
        disabled={!hasTopics || isStarting}
        className="w-full gap-2 h-11 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 hover:opacity-90 text-sm disabled:opacity-40"
      >
        {isStarting ? (
          <>
            <SpinnerGap className="size-4 animate-spin" />
            Starting Interview...
          </>
        ) : (
          <>
            <Rocket weight="fill" className="size-4" />
            Begin Interview
          </>
        )}
      </Button>
    </div>
  );
}
