import { TbBrain } from 'react-icons/tb'
import { FiX } from 'react-icons/fi'

interface AgentAnalysisPanelProps {
    activeMessage: any
    onClose: () => void
    agentEvents: readonly any[] | undefined
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

export default function AgentAnalysisPanel({ activeMessage, onClose, agentEvents }: AgentAnalysisPanelProps) {
    return (
        <div className="w-80 md:w-96 shrink-0 border-l border-zinc-800 bg-[#171719] h-full flex flex-col text-zinc-300">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2 font-semibold text-zinc-100">
                    <TbBrain size={18} className="text-purple-400" />
                    <span>Agent Analysis</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                    <FiX size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {activeMessage.parts?.map((p: any, i: number) => {
                    if (p.type === 'reasoning') {
                        const stepMetrics = p.metrics || getStepMetrics(p.stepIndex, agentEvents)
                        return (
                            <div key={i} className="space-y-2">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Thought Process</h4>
                                <div className="text-[14px] leading-relaxed text-zinc-300 whitespace-pre-wrap bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 wrap-break-words">
                                    {p.text}
                                </div>
                                {stepMetrics && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-mono px-1">
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
                    if (p.type === 'dynamic-tool') {
                        const toolMetrics = p.metrics || getToolMetrics(p.toolCallId, agentEvents)
                        return (
                            <div key={i} className="space-y-2">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tool Execution</h4>
                                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-sm font-semibold text-purple-300 break-all">{p.toolName}</span>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${p.state === 'output-available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                p.state === 'output-error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                    p.state === 'output-denied' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {p.state}
                                        </span>
                                    </div>

                                    {p.input && (
                                        <div className="space-y-1">
                                            <span className="text-[11px] text-zinc-500 font-medium">Arguments:</span>
                                            <pre className="text-xs bg-[#1a1a1c] p-2.5 rounded-lg border border-zinc-800/80 overflow-x-auto text-zinc-300 font-mono whitespace-pre-wrap break-all">
                                                {JSON.stringify(p.input, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {p.output && (
                                        <div className="space-y-1">
                                            <span className="text-[11px] text-zinc-500 font-medium">Result:</span>
                                            <pre className="text-xs bg-[#1a1a1c] p-2.5 rounded-lg border border-zinc-800/80 overflow-x-auto text-zinc-300 font-mono whitespace-pre-wrap break-all">
                                                {typeof p.output === 'object' ? JSON.stringify(p.output, null, 2) : String(p.output)}
                                            </pre>
                                        </div>
                                    )}

                                    {p.errorText && (
                                        <div className="space-y-1">
                                            <span className="text-[11px] text-rose-400 font-medium">Error:</span>
                                            <pre className="text-xs bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg overflow-x-auto text-rose-300 font-mono whitespace-pre-wrap break-all">
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
        </div>
    )
}
