"use client"

import { useCallback, useEffect, useState } from "react"

interface UseSpeechSynthesisOptions {
    onEnd?: () => void
    lang?: string
    rate?: number
    pitch?: number
}
 
export function useSpeechSynthesis(
    options: UseSpeechSynthesisOptions = {}
) {
    const { onEnd, lang = "en-US", rate = 1, pitch = 1 } = options

    const [isSupported, setIsSupported] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    useEffect(() => {
        if (!window.speechSynthesis) {
            setIsSupported(false)
            return
        }
        setIsSupported(true)
        
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices())
        }
        loadVoices()       
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null
        }
    }, [])
    
    const speak = useCallback((text: string) => {
        if (!isSupported) return

        window.speechSynthesis.cancel() // cancel ongoing
        
        const cleanText = text
            .replace(/[*_#`]/g, "") // remove markdown symbols
            .replace(/```[\s\S]*?```/g, "") // remove code blocks
            .trim()

        if (!cleanText) return

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = lang
        utterance.rate = rate
        utterance.pitch = pitch

        if (voices.length > 0) {
            const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                            voices.find(v => v.lang === "en-US" && v.localService) ||
                            voices.find(v => v.lang.startsWith("en"))
                            
            if (preferredVoice) {
                utterance.voice = preferredVoice
            }
        }

        utterance.onstart = () => setIsSpeaking(true)

        utterance.onend = () => {
            setIsSpeaking(false)
            if (onEnd) onEnd()
        }

        utterance.onerror = (e) => {
            console.error("Speech Synthesis error", e)
            setIsSpeaking(false)
            if (onEnd) onEnd()
        }

        window.speechSynthesis.speak(utterance)
    }, [isSupported, voices, lang, rate, pitch, onEnd])

    const cancel = useCallback(() => {
        if (!isSupported) return
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
    }, [isSupported])

    return {
        isSupported,
        isSpeaking,
        speak,
        cancel,
        voices,
    }
}
    