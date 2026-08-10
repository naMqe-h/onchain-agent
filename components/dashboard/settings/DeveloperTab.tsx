'use client'

import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useDevModeStore } from '../../../hooks/useDevModeStore'

export default function DeveloperTab() {
    const isDevModeEnabled = useDevModeStore((s) => s.isDevModeEnabled)
    const toggleDevMode = useDevModeStore((s) => s.toggleDevMode)

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">
                    Developer Settings
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Configure developer features and advanced technical options across the app.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6">
                <div className="p-5 rounded-2xl bg-[#1c1c1f]/40 border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isDevModeEnabled ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-zinc-400'}`}>
                                {isDevModeEnabled ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">
                                    Developer Mode (Dev Mode)
                                </span>
                                <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                    Enable advanced inspection tools, AI agent thinking process & tool execution panels, execution time & token metrics, and custom model options.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={toggleDevMode}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDevModeEnabled ? 'bg-purple-600' : 'bg-zinc-700'}`}
                            role="switch"
                            aria-checked={isDevModeEnabled}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isDevModeEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Features controlled by Dev Mode
                        </span>

                        <ul className="flex flex-col gap-2 text-xs text-zinc-400 list-disc list-inside px-1">
                            <li>Agent Reasoning & Thinking process panel</li>
                            <li>Agent Tool Call execution logs & panel</li>
                            <li>Response duration & token usage metrics</li>
                            <li>Session IP address visibility & custom models form</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
