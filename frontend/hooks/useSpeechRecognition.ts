"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseSpeechRecognitionOptions {
    lang?: string
    continuous?: boolean
    interimResults?: boolean   
}

export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions = {} 
) {
    const { lang = "en-US", continuous = true, interimResults = true } = options

    const [isSupported, setIsSupported] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const shouldBeListeningRef = useRef(false)

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        setIsSupported(!!SR)
    }, [])

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return

        const recognition = new SR()
        recognition.lang = lang
        recognition.continuous = continuous
        recognition.interimResults = interimResults

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalText = ""
            let interimText = ""

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalText = result[0].transcript
                } else {
                    interimText = result[0].transcript
                }
            }

            if (finalText) {
                setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText))
            }
            setInterimTranscript(interimText)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === "aborted") return // intentional stop

            if (event.error === "no-speech") return // silence

            shouldBeListeningRef.current = false;
            setIsListening(false)
        }

        recognition.onend = () => {
            if (shouldBeListeningRef.current) {
                recognition.start()
            } else {
                setIsListening(false)
            }
        }

        recognitionRef.current = recognition
        return () => {
            shouldBeListeningRef.current = false
            recognition.abort()
        }
    }, [lang, continuous, interimResults])

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return
        setTranscript("")
        setInterimTranscript("")
        shouldBeListeningRef.current = true
        recognitionRef.current.start()
        setIsListening(true)
    }, [])

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return
        shouldBeListeningRef.current = false
        setInterimTranscript("")
        recognitionRef.current.stop()
        setIsListening(false)
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript("")
        setInterimTranscript("")
    }, [])

    return {
        isSupported,
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript
    }
}