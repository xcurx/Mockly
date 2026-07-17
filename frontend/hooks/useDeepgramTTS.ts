"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBrowserTTS } from "./useBrowserTTS";

interface UseDeepgramTTSOptions {
  onEnd?: () => void;
  lang?: string;
  rate?: number;
  pitch?: number;
}

type TTSProvider = "deepgram" | "browser" | "none";

const DEEPGRAM_VOICES = [
  "aura-asteria-en",
  "aura-luna-en",
  "aura-stella-en",
  "aura-athena-en", 
  "aura-hera-en", 
  "aura-orion-en",
  "aura-arcas-en",
  "aura-perseus-en",
  "aura-angus-en", 
  "aura-orpheus-en",
  "aura-helios-en", 
  "aura-zeus-en", 
];

export function useDeepgramTTS(options: UseDeepgramTTSOptions = {}) {
  const { onEnd, lang = "en-US", rate = 1, pitch = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [provider, setProvider] = useState<TTSProvider>("none");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // browser fallback always initialized
  const {
    isSpeaking: browserIsSpeaking,
    speak: browserSpeak,
    cancel: browserCancel,
  } = useBrowserTTS({ onEnd, lang, rate, pitch });

  // random voicek
  const selectedVoice = useMemo(() => {
    const idx = Math.floor(Math.random() * DEEPGRAM_VOICES.length);
    const voice = DEEPGRAM_VOICES[idx];
    return voice;
  }, []);

  // clean markdown before sending to TTS
  const cleanText = (text: string): string =>
    text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#`]/g, "")
      .trim();

  const speakWithDeepgram = useCallback(
    async (text: string): Promise<boolean> => {
      const cleaned = cleanText(text);
      if (!cleaned) return false;

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/deepgram/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleaned, model: selectedVoice }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          console.warn("Deepgram TTS failed:", res.status);
          return false;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setProvider("deepgram");
        };

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          onEnd?.();
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          onEnd?.();
        };

        await audio.play();
        return true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return true; // intentional cancel
        }
        console.warn("Deepgram TTS error:", err);
        return false;
      }
    },
    [selectedVoice, onEnd]
  );

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    browserCancel();
    setIsSpeaking(false);
  }, [browserCancel]);

  const speak = useCallback(
    async (text: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      const ok = await speakWithDeepgram(text);
      if (!ok) {
        console.info("Deepgram TTS unavailable, falling back to browser TTS");
        setProvider("browser");
        browserSpeak(text);
      }
    },
    [speakWithDeepgram, browserSpeak]
  );

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const speaking = provider === "browser" ? browserIsSpeaking : isSpeaking;

  return {
    isSpeaking: speaking,
    speak,
    cancel,
    provider,
    selectedVoice,
  };
}
