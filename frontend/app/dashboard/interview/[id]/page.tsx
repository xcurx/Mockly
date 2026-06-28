"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMessages, type Message } from "@/components/interview/chat-messages";
import { ChatInput } from "@/components/interview/chat-input";
import { InterviewHeader } from "@/components/interview/interview-header";
import { CircleNotch } from "@phosphor-icons/react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface InterviewSessionData {
  interviewState: Record<string, unknown>;
  currentQuestion: {
    question: string;
    source?: string;
    difficulty?: string;
    topic?: string;
  };
  questionNumber: number;
  timeLimitSeconds?: number | null;
}

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [sessionData, setSessionData] = useState<InterviewSessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [mode, setMode] = useState("TRAINING");
  const [interactionType, setInteractionType] = useState("TEXT");
  const [topics, setTopics] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { speak, cancel, isSpeaking } = useSpeechSynthesis();
  const spokenMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem(`interview-${params.id}`);
    if (stored) {
      const data = JSON.parse(stored) as InterviewSessionData;
      setSessionData(data);
      if (data.timeLimitSeconds) {
        setTimeLimitSeconds(data.timeLimitSeconds);
        setTimeRemaining(data.timeLimitSeconds);
      }
    }

    loadFromApi();
    
    return () => {
      cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [params.id, cancel]);

  // countdown timer logic
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timeLimitSeconds == null || timeRemaining == null || isThinking) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLimitSeconds, timeRemaining === null, isThinking]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFromApi = async () => {
    try {
      const res = await fetch(`/api/interview/${params.id}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      const interview = data.interview;

      if (interview.status === "COMPLETED") {
        router.push(`/dashboard/results/${params.id}`);
        return;
      }

      setMaxQuestions(interview.maxQuestions);
      setMode(interview.mode);
      setInteractionType(interview.interactionType || "TEXT");
      setTopics(interview.topics);

      const msgs: Message[] = [];
      for (const exchange of interview.exchanges) {
        msgs.push({
          id: `q-${exchange.questionNumber}`,
          role: "ai",
          content: exchange.question,
          type: "question",
        });

        if (exchange.hints && Array.isArray(exchange.hints)) {
          exchange.hints.forEach((hint: string, index: number) => {
            msgs.push({
              id: `hint-${exchange.questionNumber}-${index + 1}`,
              role: "ai",
              content: hint,
              type: "hint",
            });
          });
        }

        if (exchange.userAnswer) {
          msgs.push({
            id: `a-${exchange.questionNumber}`,
            role: "user",
            content: exchange.userAnswer,
          });
        }
        if (exchange.evaluation) {
          const evalData = exchange.evaluation as Record<string, unknown>;
          const feedback =
            (evalData.feedback as string) ||
            (evalData.response as string) ||
            "";
          if (feedback) {
            msgs.push({
              id: `e-${exchange.questionNumber}`,
              role: "ai",
              content: feedback,
              type: "evaluation",
            });
          }
        }
      }

      setMessages(msgs);
      setQuestionNumber(interview.exchanges.length);
      
      const lastExchange = interview.exchanges[interview.exchanges.length - 1];
      if (lastExchange && lastExchange.hints && Array.isArray(lastExchange.hints)) {
        setHintsUsed(lastExchange.hints.length);
      } else {
        setHintsUsed(0);
      }

      setIsLoaded(true);
    } catch {
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    if (!isLoaded || messages.length === 0) return;
    
    if (interactionType === "SPEECH_TO_SPEECH" || interactionType === "SPEECH_TO_TEXT") {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.role === "ai" && !spokenMessagesRef.current.has(lastMessage.id)) {
        spokenMessagesRef.current.add(lastMessage.id);
        speak(lastMessage.content);
      }
    }
  }, [messages, isLoaded, interactionType, speak]);

  const handleRequestHint = useCallback(async () => {
    if (!sessionData || isThinking || hintsUsed >= 3) return;
    setIsThinking(true);
    
    try {
      const res = await fetch(`/api/interview/${params.id}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewState: sessionData.interviewState,
          hintsUsed,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get hint");
      }

      const data = await res.json();
      const hintText = data.hint?.hint || "Here is a hint for you to think about.";

      setMessages((prev) => [
        ...prev,
        { id: `hint-${questionNumber}-${hintsUsed + 1}`, role: "ai", content: hintText, type: "hint" },
      ]);
      setHintsUsed((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-hint-${Date.now()}`,
          role: "ai",
          content: `Error getting hint: ${message}. Please try again.`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [sessionData, isThinking, hintsUsed, params.id]);

  const handleSendAnswer = useCallback(
    async (answer: string) => {
      if (!sessionData || isThinking) return;
      
      cancel();

      // stop the timer and record time taken
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const userMsgId = `a-${questionNumber}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: answer },
      ]);
      setIsThinking(true);

      try {
        const res = await fetch(`/api/interview/${params.id}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAnswer: answer,
            interviewState: sessionData.interviewState,
            hintsUsed,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to process answer");
        }

        const data = await res.json();

        if (data.evaluation) {
          const toStr = (val: unknown): string => {
            if (val === null || val === undefined) return "";
            if (typeof val === "string") return val.trim();

            if (typeof val === "object" && !Array.isArray(val)) {
              return Object.entries(val)
                .map(([k, v]) => {
                  const formattedKey = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
                  const formattedVal = typeof v === 'string' ? v : JSON.stringify(v);
                  return `**${formattedKey}**: ${formattedVal}`;
                })
                .join('\n\n');
            }

            if (Array.isArray(val)) {
              return val.map(item => {
                const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
                return `- ${itemStr}`;
              }).join('\n');
            }

            return JSON.stringify(val, null, 2);
          };

          const evalText =
            toStr(data.evaluation.feedback) ||
            toStr(data.evaluation.response) ||
            toStr(data.evaluation);

          let fullEvalText = evalText;
          if (data.evaluation.ideal_answer) {
            fullEvalText += `\n\n**Ideal Answer:**\n${toStr(data.evaluation.ideal_answer)}`;
          }
          if (data.evaluation.follow_up) {
            fullEvalText += `\n\n${toStr(data.evaluation.follow_up)}`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `e-${questionNumber}`,
              role: "ai",
              content: fullEvalText,
              type: "evaluation",
            },
          ]);
        }

        if (data.interviewComplete) {
          setTimeout(() => {
            router.push(`/dashboard/results/${params.id}`);
          }, 4000);
          setMessages((prev) => [
            ...prev,
            {
              id: "complete",
              role: "ai",
              content: "Interview complete! Redirecting to your results now...",
              type: "summary",
            },
          ]);
        } else if (data.question) {
          const nextQNum = data.questionNumber || questionNumber + 1;
          const qText =
            typeof data.question === "string"
              ? data.question
              : data.question?.question || "Next question...";

          setMessages((prev) => [
            ...prev,
            { id: `q-${nextQNum}`, role: "ai", content: qText, type: "question" },
          ]);
          setQuestionNumber(nextQNum);
          setHintsUsed(0);

          setSessionData({
            interviewState: data.interviewState,
            currentQuestion: data.question,
            questionNumber: nextQNum,
            timeLimitSeconds,
          });
          sessionStorage.setItem(
            `interview-${params.id}`,
            JSON.stringify({
              interviewState: data.interviewState,
              currentQuestion: data.question,
              questionNumber: nextQNum,
              timeLimitSeconds,
            })
          );

          // reset the countdown for the next question
          if (timeLimitSeconds) {
            setTimeRemaining(timeLimitSeconds);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== userMsgId);
          return [
            ...filtered,
            {
              id: `err-${Date.now()}`,
              role: "ai",
              content: `Error: ${message}. Please try again.`,
            },
          ];
        });
      } finally {
        setIsThinking(false);
      }
    },
    [sessionData, isThinking, questionNumber, params.id, router, cancel, timeLimitSeconds, hintsUsed]
  );

  // auto-submit when timer expires
  useEffect(() => {
    if (timeRemaining === 0 && timeLimitSeconds && !isThinking && sessionData) {
      if (mode === "REALISTIC") {
        handleSendAnswer("(Time expired — no answer provided)");
      }
      // in Training mode, just stop the timer — don't force submit
    }
  }, [timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndInterview = useCallback(async () => {
    if (!sessionData || isEnding) return;
    setIsEnding(true);
    cancel();

    try {
      const res = await fetch(`/api/interview/${params.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewState: sessionData.interviewState }),
      });

      if (res.ok) {
        router.push(`/dashboard/results/${params.id}`);
      }
    } catch {
      setIsEnding(false);
    }
  }, [sessionData, isEnding, params.id, router, cancel]);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <CircleNotch className="size-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.6rem)] overflow-hidden">
      <InterviewHeader
        questionNumber={questionNumber}
        maxQuestions={maxQuestions}
        mode={mode}
        topics={topics}
        onEndInterview={handleEndInterview}
        isEnding={isEnding}
        timeRemaining={timeRemaining}
        timeLimitSeconds={timeLimitSeconds}
      />

      <ChatMessages messages={messages} isThinking={isThinking || isSpeaking} />

      <ChatInput
        onSend={handleSendAnswer}
        disabled={isThinking || isEnding || !isLoaded}
        placeholder={isSpeaking ? "Speaking..." : "Type your answer..."}
        interactionType={interactionType}
        onRequestHint={handleRequestHint}
        hintsUsed={hintsUsed}
        mode={mode}
      />
    </div>
  );
}
