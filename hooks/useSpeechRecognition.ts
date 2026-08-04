import { useState, useEffect, useRef, useCallback } from 'react'
import { useVoiceStore } from './useVoiceStore'

export interface UseSpeechRecognitionOptions {
    onResult?: (transcript: string) => void
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
    const [isSupported, setIsSupported] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const recognitionRef = useRef<any>(null)

    const isListening = useVoiceStore(s => s.isListening)
    const setIsListening = useVoiceStore(s => s.setIsListening)
    const language = useVoiceStore(s => s.language)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognitionClass) {
                setIsSupported(true)
            }
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch { }
        }
        setIsListening(false)
    }, [setIsListening])

    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognitionClass) {
            setError('Speech recognition is not supported in this browser.')
            return
        }

        setError(null)
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort()
            } catch { }
        }

        const recognition = new SpeechRecognitionClass()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            let currentTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                currentTranscript += result[0].transcript
            }
            setTranscript(currentTranscript)
            if (options?.onResult && currentTranscript.trim()) {
                options.onResult(currentTranscript)
            }
        }

        recognition.onerror = (event: any) => {
            const err = event?.error
            if (err === 'no-speech' || err === 'aborted') {
                setIsListening(false)
                return
            }
            let userFriendlyMsg = err
            if (err === 'network') {
                userFriendlyMsg = 'Speech recognition network service unavailable.'
            } else if (err === 'not-allowed') {
                userFriendlyMsg = 'Microphone permission denied.'
            } else if (err === 'audio-capture') {
                userFriendlyMsg = 'No microphone was found.'
            }
            setError(userFriendlyMsg)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        try {
            recognition.start()
        } catch (err: any) {
            setError(err?.message || 'Could not start microphone')
            setIsListening(false)
        }
    }, [language, options, setIsListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
    }, [])

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort()
                } catch { }
            }
        }
    }, [])

    return {
        isSupported,
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript
    }
}
