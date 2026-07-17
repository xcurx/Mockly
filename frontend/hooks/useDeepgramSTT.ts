"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserSTT } from "./useBrowserSTT";

interface UseDeepgramSTTOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

type STTProvider = "deepgram" | "browser" | "none";

export function useDeepgramSTT(options: UseDeepgramSTTOptions = {}) {
  const { lang = "en-US", continuous = true, interimResults = true } = options;

  const [dgListening, setDgListening] = useState(false);
  const [dgTranscript, setDgTranscript] = useState("");
  const [dgInterim, setDgInterim] = useState("");
  const [provider, setProvider] = useState<STTProvider>("none");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const shouldBeListeningRef = useRef(false);

  // browser fallback always initialized
  const {
    isListening: browserIsListening,
    transcript: browserTranscript,
    interimTranscript: browserInterim,
    startListening: browserStart,
    stopListening: browserStop,
    resetTranscript: browserReset,
  } = useBrowserSTT({ lang, continuous, interimResults });

  const getTemporaryToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/deepgram/token", { method: "POST" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.token || null;
    } catch {
      return null;
    }
  };

  const cleanupDeepgram = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(new Uint8Array(0)); // close signal
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const startDeepgram = useCallback(async (): Promise<boolean> => {
    const token = await getTemporaryToken();
    if (!token) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const params = new URLSearchParams({
        model: "nova-2",
        language: lang.split("-")[0],
        smart_format: "true",
        interim_results: interimResults ? "true" : "false",
        utterance_end_ms: "1500",
        vad_events: "true",
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",
      });

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params.toString()}`,
        ["token", token]
      );

      ws.onopen = async () => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        // load the AudioWorklet module from public/
        await audioContext.audioWorklet.addModule("/audio-processor.js");

        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(
          audioContext,
          "audio-processor"
        );
        workletNodeRef.current = workletNode;

        // receive Int16 PCM buffers from the worklet and send to deepgram
        workletNode.port.onmessage = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "UtteranceEnd") {
          setDgInterim("");
          return;
        }

        if (data.channel?.alternatives?.[0]) {
          const text = data.channel.alternatives[0].transcript || "";
          if (!text) return;

          if (data.is_final) {
            setDgTranscript((prev) => (prev ? `${prev} ${text}` : text));
            setDgInterim("");
          } else {
            setDgInterim(text);
          }
        }
      };

      ws.onerror = () => {
        console.warn("Deepgram WS error — falling back to browser STT");
        cleanupDeepgram();
        if (shouldBeListeningRef.current) {
          setProvider("browser");
          browserStart();
        }
      };

      ws.onclose = (event) => {
        if (event.code !== 1000 && shouldBeListeningRef.current) {
          console.warn("Deepgram WS closed unexpectedly:", event.code);
          setProvider("browser");
          browserStart();
        }
      };

      wsRef.current = ws;
      return true;
    } catch (err) {
      console.warn("Failed to start Deepgram STT:", err);
      return false;
    }
  }, [lang, interimResults, cleanupDeepgram, browserStart]);

  const startListening = useCallback(async () => {
    setDgTranscript("");
    setDgInterim("");
    shouldBeListeningRef.current = true;
    setDgListening(true);

    const deepgramOk = await startDeepgram();
    if (deepgramOk) {
      setProvider("deepgram");
    } else {
      console.info("Deepgram unavailable, using browser STT");
      setProvider("browser");
      browserStart();
    }
  }, [startDeepgram, browserStart]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    setDgInterim("");

    if (provider === "deepgram") {
      cleanupDeepgram();
    } else if (provider === "browser") {
      browserStop();
    }

    setDgListening(false);
    setProvider("none");
  }, [provider, cleanupDeepgram, browserStop]);

  const resetTranscript = useCallback(() => {
    setDgTranscript("");
    setDgInterim("");
    browserReset();
  }, [browserReset]);

  useEffect(() => {
    return () => {
      cleanupDeepgram();
    };
  }, [cleanupDeepgram]);


  const isListening = provider === "deepgram" ? dgListening : browserIsListening;

  const transcript = provider === "deepgram" ? dgTranscript : browserTranscript;

  const interimTranscript = provider === "deepgram" ? dgInterim : browserInterim;

  return {
    isSupported: true,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    provider,
  };
}
