"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperPlaneRight, Microphone, StopCircle } from "@phosphor-icons/react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  interactionType?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your answer...",
  interactionType = "TEXT",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const handleSendText = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // auto focus text area when enabled only if we're not using voice exclusively
  useEffect(() => {
    if (!disabled && interactionType !== "SPEECH_TO_SPEECH") {
      textareaRef.current?.focus();
    }
  }, [disabled, interactionType]);

  // if user stops speaking automatically send the transcript
  const previousIsListening = useRef(isListening);
  useEffect(() => {
    if (previousIsListening.current === true && isListening === false) {
      if (transcript.trim()) {
        onSend(transcript.trim());
        resetTranscript();
      }
    }
    previousIsListening.current = isListening;
  }, [isListening, transcript, onSend, resetTranscript]);

  const toggleMic = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isVoiceOnly = interactionType === "SPEECH_TO_SPEECH";

  // if voice only mode and unsupported fallback to text mode
  if (isVoiceOnly && !isSupported) {
    return (
      <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 text-center">
        <p className="text-sm text-red-400 mb-2">Speech recognition is not supported in this browser. Please use Chrome or Edge.</p>
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
          />
          <Button
            onClick={handleSendText}
            disabled={disabled || !value.trim()}
            size="icon"
            className="shrink-0 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 hover:opacity-90 size-10"
          >
            <PaperPlaneRight weight="fill" className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // voice Interface Mode
  if (isVoiceOnly) {
    return (
      <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm py-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
          <div className="text-sm min-h-[40px] text-center w-full px-4 italic text-muted-foreground flex items-center justify-center">
             {isListening ? (
               <span className="text-foreground not-italic">{interimTranscript || "Listening..."}</span>
             ) : (
               <span>{disabled ? "Wait for your turn..." : "Tap the microphone to speak"}</span>
             )}
          </div>
          
          <Button
            onClick={toggleMic}
            disabled={disabled}
            size="icon"
            className={`rounded-full size-16 transition-all duration-300 ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse" 
                : "bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90"
            }`}
          >
            {isListening ? (
              <StopCircle weight="fill" className="size-8 text-white" />
            ) : (
              <Microphone weight="fill" className="size-8 text-white" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // text / hybrid Mode
  return (
    <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm py-3">
      <div className="max-w-2xl mx-auto flex gap-2 items-end px-4 md:px-0">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
        />
        <Button
          onClick={handleSendText}
          disabled={disabled || !value.trim()}
          size="icon"
          className="shrink-0 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 hover:opacity-90 size-10"
        >
          <PaperPlaneRight weight="fill" className="size-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5 hidden md:block">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
