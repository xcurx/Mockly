"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBrowserSTTOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useBrowserSTT(options: UseBrowserSTTOptions = {}) {
  const { lang = "en-US", continuous = true, interimResults = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldBeListeningRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // create recognition instance
  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText = result[0].transcript;
        } else {
          interimText = result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      shouldBeListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      recognition.abort();
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setInterimTranscript("");
    shouldBeListeningRef.current = true;
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldBeListeningRef.current = false;
    setInterimTranscript("");
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
