import { create } from 'zustand'

function stripMarkdown(text: string): string {
    if (!text) return ''
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~#]/g, '')
        .replace(/^[>\-\+\*]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
}

interface VoiceStore {
    isListening: boolean
    isSpeaking: boolean
    speakingMessageId: string | null
    autoRead: boolean
    language: string
    selectedVoiceURI: string | null
    voices: SpeechSynthesisVoice[]
    rate: number
    pitch: number
    setIsListening: (isListening: boolean) => void
    setAutoRead: (autoRead: boolean) => void
    setLanguage: (language: string) => void
    setSelectedVoiceURI: (uri: string | null) => void
    setRate: (rate: number) => void
    setPitch: (pitch: number) => void
    loadVoices: () => void
    speakText: (text: string, messageId?: string) => void
    stopSpeaking: () => void
    toggleSpeak: (text: string, messageId: string) => void
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
    isListening: false,
    isSpeaking: false,
    speakingMessageId: null,
    autoRead: false,
    language: 'en-US',
    selectedVoiceURI: null,
    voices: [],
    rate: 1.0,
    pitch: 1.0,

    setIsListening: (isListening) => set({ isListening }),
    setAutoRead: (autoRead) => set({ autoRead }),
    setLanguage: (language) => set({ language }),
    setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
    setRate: (rate) => set({ rate }),
    setPitch: (pitch) => set({ pitch }),

    loadVoices: () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
        set({ voices: availableVoices })
    },

    speakText: (text: string, messageId?: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

        const cleaned = stripMarkdown(text)
        if (!cleaned) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(cleaned)
        const { language, selectedVoiceURI, voices, rate, pitch } = get()

        utterance.lang = language
        utterance.rate = rate
        utterance.pitch = pitch

        if (selectedVoiceURI && voices.length > 0) {
            const voiceMatch = voices.find(v => v.voiceURI === selectedVoiceURI)
            if (voiceMatch) utterance.voice = voiceMatch
        } else if (voices.length > 0) {
            const langMatch = voices.find(v => v.lang.startsWith(language) || v.lang.startsWith(language.slice(0, 2)))
            if (langMatch) utterance.voice = langMatch
        }

        utterance.onstart = () => {
            set({ isSpeaking: true, speakingMessageId: messageId || null })
        }

        utterance.onend = () => {
            set({ isSpeaking: false, speakingMessageId: null })
        }

        utterance.onerror = () => {
            set({ isSpeaking: false, speakingMessageId: null })
        }

        window.speechSynthesis.speak(utterance)
    },

    stopSpeaking: () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        window.speechSynthesis.cancel()
        set({ isSpeaking: false, speakingMessageId: null })
    },

    toggleSpeak: (text: string, messageId: string) => {
        const { isSpeaking, speakingMessageId, stopSpeaking, speakText } = get()
        if (isSpeaking && speakingMessageId === messageId) {
            stopSpeaking()
        } else {
            speakText(text, messageId)
        }
    }
}))
