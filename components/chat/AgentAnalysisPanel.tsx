import { TbBrain, TbTool } from 'react-icons/tb'
import { FiX } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { slideInRight } from '../../lib/motion'

export type AnalysisPanelMode = 'reasoning' | 'tools'

interface AgentAnalysisPanelProps {
    activeMessage: any
    onClose: () => void
    agentEvents: readonly any[] | undefined
    mode: AnalysisPanelMode
}

export const getStepMetrics = (stepIndex: number | undefined, agentEvents: readonly any[] | undefined) => {
    if (stepIndex === undefined || !agentEvents) return null

    const startedEvent = agentEvents.find(
        (e: any) => e.type === 'step.started' && e.data?.stepIndex === stepIndex
    )
    const completedEvent = agentEvents.find(
        (e: any) => e.type === 'step.completed' && e.data?.stepIndex === stepIndex
    )

    if (!startedEvent) return null

    const metrics: {
        durationMs?: number
        inputTokens?: number
        outputTokens?: number
        cacheReadTokens?: number
        cacheWriteTokens?: number
    } = {}

    const started = startedEvent as any
    const completed = completedEvent as any

    if (completedEvent) {
        if (completed.meta?.at && started.meta?.at) {
            metrics.durationMs = new Date(completed.meta.at).getTime() - new Date(started.meta.at).getTime()
        }
        if (completed.data?.usage) {
            metrics.inputTokens = completed.data.usage.inputTokens
            metrics.outputTokens = completed.data.usage.outputTokens
            metrics.cacheReadTokens = completed.data.usage.cacheReadTokens
            metrics.cacheWriteTokens = completed.data.usage.cacheWriteTokens
        }
    } else {
        if (started.meta?.at) {
            metrics.durationMs = new Date().getTime() - new Date(started.meta.at).getTime()
        }
    }

    return metrics
}

export const getToolMetrics = (toolCallId: string, agentEvents: readonly any[] | undefined) => {
    if (!agentEvents) return null

    const requestEvent = agentEvents.find(
        (e: any) => e.type === 'actions.requested' && e.data?.actions?.some((a: any) => a.callId === toolCallId)
    )
    const resultEvent = agentEvents.find(
        (e: any) => e.type === 'action.result' && e.data?.result?.callId === toolCallId
    )

    if (!requestEvent) return null

    const metrics: {
        durationMs?: number
    } = {}

    const req = requestEvent as any
    const res = resultEvent as any

    if (resultEvent) {
        if (res.meta?.at && req.meta?.at) {
            metrics.durationMs = new Date(res.meta.at).getTime() - new Date(req.meta.at).getTime()
        }
    } else {
        if (req.meta?.at) {
            metrics.durationMs = new Date().getTime() - new Date(req.meta.at).getTime()
        }
    }

    return metrics
}

export function messageHasReasoning(message: { parts?: readonly any[] } | null | undefined): boolean {
    return Boolean(message?.parts?.some(part => part.type === 'reasoning'))
}

export function messageHasTools(message: { parts?: readonly any[] } | null | undefined): boolean {
    return Boolean(
        message?.parts?.some(
            part => part.type === 'dynamic-tool' && part.toolName !== 'update_chat_title'
        )
    )
}

export default function AgentAnalysisPanel({ activeMessage, onClose, agentEvents, mode }: AgentAnalysisPanelProps) {
    const isReasoning = mode === 'reasoning'
    const title = isReasoning ? 'Reasoning' : 'Tools'
    const Icon = isReasoning ? TbBrain : TbTool
    const iconClass = isReasoning ? 'text-purple-400 shrink-0' : 'text-sky-400 shrink-0'

    return (
        <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-0 bottom-0 w-80 md:w-96 max-w-full border-l border-zinc-800 bg-[#171719]/95 backdrop-blur-md h-full flex flex-col text-zinc-300 z-30 shadow-2xl overflow-hidden min-w-0"
        >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0 min-w-0">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 min-w-0">
                    <Icon size={18} className={iconClass} />
                    <span className="truncate">{title}</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                    <FiX size={18} />
                </button>
            </div>
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-6">
                {activeMessage.parts?.map((p: any, i: number) => {
                    if (isReasoning && p.type === 'reasoning') {
                        const stepMetrics = p.metrics || getStepMetrics(p.stepIndex, agentEvents)
                        return (
                            <div key={i} className="space-y-2 min-w-0 max-w-full">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Thought Process</h4>
                                <div className="text-[14px] leading-relaxed text-zinc-300 whitespace-pre-wrap bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 min-w-0 max-w-full overflow-hidden wrap-break-words wrap-anywhere">
                                    {p.text}
                                </div>
                                {stepMetrics && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-mono px-1 min-w-0">
                                        {stepMetrics.durationMs !== undefined && (
                                            <span>Duration: {stepMetrics.durationMs < 1000 ? `${stepMetrics.durationMs}ms` : `${(stepMetrics.durationMs / 1000).toFixed(1)}s`}</span>
                                        )}
                                        {stepMetrics.inputTokens !== undefined && (
                                            <span>Prompt: {stepMetrics.inputTokens} tkn</span>
                                        )}
                                        {stepMetrics.outputTokens !== undefined && (
                                            <span>Completion: {stepMetrics.outputTokens} tkn</span>
                                        )}
                                        {stepMetrics.cacheReadTokens !== undefined && stepMetrics.cacheReadTokens > 0 && (
                                            <span>Cache Read: {stepMetrics.cacheReadTokens} tkn</span>
                                        )}
                                        {stepMetrics.cacheWriteTokens !== undefined && stepMetrics.cacheWriteTokens > 0 && (
                                            <span>Cache Write: {stepMetrics.cacheWriteTokens} tkn</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }
                    if (!isReasoning && p.type === 'dynamic-tool') {
                        if (p.toolName === 'update_chat_title') return null
                        const toolMetrics = p.metrics || getToolMetrics(p.toolCallId, agentEvents)
                        return (
                            <div key={i} className="space-y-2 min-w-0 max-w-full">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tool Execution</h4>
                                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 space-y-3 min-w-0 max-w-full overflow-hidden">
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <span className="font-mono text-sm font-semibold text-sky-300 min-w-0 break-all wrap-anywhere">{p.toolName}</span>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 max-w-[45%] truncate ${p.state === 'output-available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            p.state === 'output-error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                p.state === 'output-denied' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {p.state}
                                        </span>
                                    </div>

                                    {p.input && (
                                        <div className="space-y-1 min-w-0 max-w-full">
                                            <span className="text-[11px] text-zinc-500 font-medium">Arguments:</span>
                                            <pre className="text-xs bg-[#1a1a1c] p-2.5 rounded-lg border border-zinc-800/80 max-w-full min-w-0 overflow-x-auto text-zinc-300 font-mono whitespace-pre-wrap break-all wrap-anywhere">
                                                {JSON.stringify(p.input, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {p.output && (
                                        <div className="space-y-1 min-w-0 max-w-full">
                                            <span className="text-[11px] text-zinc-500 font-medium">Result:</span>
                                            <pre className="text-xs bg-[#1a1a1c] p-2.5 rounded-lg border border-zinc-800/80 max-w-full min-w-0 overflow-x-auto text-zinc-300 font-mono whitespace-pre-wrap break-all wrap-anywhere">
                                                {typeof p.output === 'object' ? JSON.stringify(p.output, null, 2) : String(p.output)}
                                            </pre>
                                        </div>
                                    )}

                                    {p.errorText && (
                                        <div className="space-y-1 min-w-0 max-w-full">
                                            <span className="text-[11px] text-rose-400 font-medium">Error:</span>
                                            <pre className="text-xs bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg max-w-full min-w-0 overflow-x-auto text-rose-300 font-mono whitespace-pre-wrap break-all wrap-anywhere">
                                                {p.errorText}
                                            </pre>
                                        </div>
                                    )}

                                    {toolMetrics && toolMetrics.durationMs !== undefined && (
                                        <div className="text-[11px] text-zinc-500 font-mono pt-1">
                                            <span>Duration: {toolMetrics.durationMs < 1000 ? `${toolMetrics.durationMs}ms` : `${(toolMetrics.durationMs / 1000).toFixed(1)}s`}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                    return null
                })}
            </div>
        </motion.div>
    )
}
