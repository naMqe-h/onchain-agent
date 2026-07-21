'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import {
    getMyUsageSummary,
} from '../../../app/actions/usage/usage'
import { type UsageSummary } from '@/types'
import { useModelsStore } from '../../../hooks/useModelsStore'
import { formatTokens } from '../../../lib/format'

function StatCard({
    label,
    value,
    sub,
    exceeded = false,
}: {
    label: string
    value: string
    sub?: string
    exceeded?: boolean
}) {
    return (
        <div
            className={`relative rounded-xl border px-3 py-3 ${exceeded
                ? 'border-rose-500/25 bg-rose-500/8'
                : 'border-white/10 bg-white/3'
                }`}
        >
            {exceeded ? (
                <span
                    className="absolute right-2 top-2 text-rose-400/90"
                    title="Daily limit reached"
                    aria-label="Daily limit reached"
                >
                    <FiAlertTriangle size={13} />
                </span>
            ) : null}
            <p
                className={`text-[11px] uppercase tracking-wide pr-5 ${exceeded ? 'text-rose-300/70' : 'text-zinc-500'
                    }`}
            >
                {label}
            </p>
            <p
                className={`mt-1 text-lg font-medium tabular-nums ${exceeded ? 'text-rose-100' : 'text-zinc-100'
                    }`}
            >
                {value}
            </p>
            {sub ? (
                <p className={`mt-0.5 text-xs ${exceeded ? 'text-rose-300/55' : 'text-zinc-500'}`}>
                    {sub}
                </p>
            ) : null}
        </div>
    )
}

export default function UsageTab() {
    const [summary, setSummary] = useState<UsageSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const catalog = useModelsStore((s) => s.models)
    const loadModels = useModelsStore((s) => s.loadModels)

    const modelNameById = useCallback(
        (modelId: string) => {
            const found = catalog.find((m) => m.id === modelId)
            return found?.name || found?.shortName || modelId
        },
        [catalog]
    )

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const timeZone =
                typeof Intl !== 'undefined'
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : undefined
            const data = await getMyUsageSummary(timeZone)
            setSummary(data)
        } catch (err) {
            console.error('Failed to load usage summary:', err)
            setError('Could not load usage. Try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
        void loadModels()
    }, [load, loadModels])

    const quota = summary?.quota
    const tokenPct =
        quota && quota.usage.tokensPerDayLimit > 0
            ? Math.min(100, Math.round((quota.usage.tokensToday / quota.usage.tokensPerDayLimit) * 100))
            : 0

    const tokensExceeded = Boolean(
        quota && quota.usage.tokensToday >= quota.usage.tokensPerDayLimit
    )
    const requestsExceeded = Boolean(
        quota && quota.usage.requestsToday >= quota.usage.requestsPerDayLimit
    )

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-medium text-zinc-100">Usage</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        How much AI you&apos;ve used on your account today and over the last week.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh"
                >
                    <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-5">
                {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        {error}
                    </div>
                ) : null}

                {loading && !summary ? (
                    <p className="text-sm text-zinc-500">Loading usage…</p>
                ) : summary ? (
                    <>
                        <div>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-medium text-zinc-200">Today</h3>
                                <p className="text-[11px] text-zinc-500 text-right shrink-0">
                                    {quota?.dayResetsInLabel ?? 'Resets at midnight.'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <StatCard
                                    label="Total tokens"
                                    value={formatTokens(summary.today.totalTokens)}
                                    sub={`of ${formatTokens(quota?.usage.tokensPerDayLimit ?? 0)} / day`}
                                    exceeded={tokensExceeded}
                                />
                                <StatCard
                                    label="AI messages"
                                    value={summary.today.requests.toLocaleString()}
                                    sub={`of ${quota?.usage.requestsPerDayLimit.toLocaleString() ?? '—'} / day`}
                                    exceeded={requestsExceeded}
                                />
                            </div>
                            {quota ? (
                                <div className="mt-3">
                                    <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                                        <span>Daily AI usage</span>
                                        <span className="tabular-nums">
                                            {formatTokens(quota.usage.tokensToday)} /{' '}
                                            {formatTokens(quota.usage.tokensPerDayLimit)} ({tokenPct}%)
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${tokensExceeded
                                                ? 'bg-rose-500'
                                                : quota.level === 'soft'
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${tokenPct}%` }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-zinc-200 mb-2">Last 7 days</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <StatCard
                                    label="Total tokens"
                                    value={formatTokens(summary.last7Days.totalTokens)}
                                />
                                <StatCard
                                    label="AI messages"
                                    value={summary.last7Days.requests.toLocaleString()}
                                />
                            </div>
                        </div>

                        {summary.byModel.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-medium text-zinc-200 mb-2">By model (7 days)</h3>
                                <div className="rounded-xl border border-white/10 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-zinc-500 border-b border-white/5 bg-white/2">
                                                <th className="px-3 py-2 font-medium">Model</th>
                                                <th className="px-3 py-2 font-medium text-right">Reqs</th>
                                                <th className="px-3 py-2 font-medium text-right">In/Out</th>
                                                <th className="px-3 py-2 font-medium text-right">Cached</th>
                                                <th className="px-3 py-2 font-medium text-right">Tokens</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.byModel.map((row) => (
                                                <tr
                                                    key={`${row.provider}:${row.model}`}
                                                    className="border-b border-white/5 last:border-0"
                                                >
                                                    <td className="px-3 py-2 text-zinc-200 truncate max-w-40">
                                                        {modelNameById(row.model)}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-400 text-right tabular-nums">
                                                        {row.requests}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-400 text-right tabular-nums">
                                                        {formatTokens(row.inputTokens)}/{formatTokens(row.outputTokens)}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-400 text-right tabular-nums">
                                                        {formatTokens(row.cacheReadTokens)}
                                                    </td>
                                                    <td className="px-3 py-2 text-zinc-200 text-right tabular-nums">
                                                        {formatTokens(row.totalTokens)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500">
                                No AI usage recorded yet. Send a chat message to start tracking.
                            </p>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    )
}
