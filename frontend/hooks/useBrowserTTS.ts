"use client";

import { useCallback, useEffect, useState } from "react";

interface UseBrowserTTSOptions {
  onEnd?: () => void;
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function useBrowserTTS(options: UseBrowserTTSOptions = {}) {
  const { onEnd, lang = "en-US", rate = 1, pitch = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSupported =
    typeof window !== "undefined" && !!window.speechSynthesis;

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[*_#`]/g, "")
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      if (voices.length > 0) {
        const preferred =
          voices.find((v) => v.name.includes("Google US English")) ||
          voices.find((v) => v.lang === "en-US" && v.localService) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [voices, lang, rate, pitch, onEnd]
  );

  const cancel = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel,
  };
}
