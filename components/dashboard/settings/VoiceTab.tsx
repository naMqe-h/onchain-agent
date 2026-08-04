import { useState, useEffect } from 'react'
import { FiChevronDown, FiCheck } from 'react-icons/fi'
import { useVoiceStore } from '../../../hooks/useVoiceStore'

const LANGUAGE_OPTIONS = [
    { code: 'en-US', label: 'English - US (en-US)' },
    { code: 'en-GB', label: 'English - UK (en-GB)' }
]

export default function VoiceTab() {
    const {
        autoRead,
        language,
        selectedVoiceURI,
        voices,
        isSpeaking,
        setAutoRead,
        setLanguage,
        setSelectedVoiceURI,
        loadVoices,
        speakText,
        stopSpeaking
    } = useVoiceStore()

    const [isLangOpen, setIsLangOpen] = useState(false)
    const [isVoiceOpen, setIsVoiceOpen] = useState(false)

    useEffect(() => {
        loadVoices()
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                loadVoices()
            }
        }
    }, [loadVoices])

    const handleTestVoice = () => {
        if (isSpeaking) {
            stopSpeaking()
        } else {
            const sampleText = 'Welcome to Onchain Agent. The voice interface is configured successfully.'
            speakText(sampleText, 'test-voice')
        }
    }

    const selectedLangOption = LANGUAGE_OPTIONS.find(opt => opt.code === language) || LANGUAGE_OPTIONS[0]
    const englishVoices = voices.filter(v => v.lang.startsWith('en'))
    const selectedVoice = englishVoices.find(v => v.voiceURI === selectedVoiceURI)

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Voice & Speech</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Configure speech synthesis preferences and voice command recognition.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6 pr-1">
                <div className="bg-[#1c1c1f]/40 border border-white/5 rounded-2xl p-4.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-semibold text-zinc-200">
                                Auto-read agent responses
                            </span>
                            <span className="text-xs text-zinc-500">
                                Agent will automatically read its responses aloud once generated.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAutoRead(!autoRead)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoRead ? 'bg-indigo-600' : 'bg-zinc-800'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${autoRead ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="bg-[#1c1c1f]/40 border border-white/5 rounded-2xl p-4.5 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Dictation & Speech Language
                        </h3>
                        <p className="text-xs text-zinc-500">
                            Select the primary language used for microphone dictation and speech output.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Dictation Language
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLangOpen(!isLangOpen)
                                    setIsVoiceOpen(false)
                                }}
                                className="w-full flex items-center justify-between bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                            >
                                <span>{selectedLangOption.label}</span>
                                <FiChevronDown className={`transition-transform duration-200 text-zinc-400 ${isLangOpen ? 'rotate-180' : ''}`} size={16} />
                            </button>

                            {isLangOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-60 overflow-y-auto">
                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                                            App Languages
                                        </div>
                                        {LANGUAGE_OPTIONS.map(option => {
                                            const isSelected = language === option.code
                                            return (
                                                <button
                                                    key={option.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setLanguage(option.code)
                                                        setIsLangOpen(false)
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                                        isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                                    }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {isSelected && <FiCheck size={14} className="text-purple-400 shrink-0" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1c1c1f]/40 border border-white/5 rounded-2xl p-4.5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Speech Synthesis (TTS) Voice
                        </h3>
                        <p className="text-xs text-zinc-500">
                            Select the voice engine used for reading agent responses aloud.
                        </p>
                    </div>

                    {englishVoices.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Synthesizer Voice</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsVoiceOpen(!isVoiceOpen)
                                        setIsLangOpen(false)
                                    }}
                                    className="w-full flex items-center justify-between bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                                >
                                    <span className="truncate">
                                        {selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : `System Default Voice (${language})`}
                                    </span>
                                    <FiChevronDown className={`transition-transform duration-200 text-zinc-400 shrink-0 ${isVoiceOpen ? 'rotate-180' : ''}`} size={16} />
                                </button>

                                {isVoiceOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsVoiceOpen(false)} />
                                        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-60 overflow-y-auto">
                                            <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                                                Available Voices
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVoiceURI(null)
                                                    setIsVoiceOpen(false)
                                                }}
                                                className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                                    !selectedVoiceURI ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                                }`}
                                            >
                                                <span>System Default Voice ({language})</span>
                                                {!selectedVoiceURI && <FiCheck size={14} className="text-purple-400 shrink-0" />}
                                            </button>
                                            {englishVoices.map(v => {
                                                const isSelected = selectedVoiceURI === v.voiceURI
                                                return (
                                                    <button
                                                        key={v.voiceURI}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedVoiceURI(v.voiceURI)
                                                            setIsVoiceOpen(false)
                                                        }}
                                                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                                            isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                                        }`}
                                                    >
                                                        <span className="truncate">{v.name} ({v.lang})</span>
                                                        {isSelected && <FiCheck size={14} className="text-purple-400 shrink-0 ml-2" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleTestVoice}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-sm"
                        >
                            {isSpeaking ? 'Stop playback' : 'Test voice'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
