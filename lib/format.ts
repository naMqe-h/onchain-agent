import moment from 'moment'

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
})

const plainNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'standard',
    maximumFractionDigits: 18,
    useGrouping: false,
})

const standardAmountFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    useGrouping: false,
})

export const usdStandardFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const usdCompactFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
})

export const EMPTY_VALUE = '-'

function isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === ''
}

function toNumber(amount: string | number): number {
    return typeof amount === 'number'
        ? amount
        : Number(String(amount).replace(/\s/g, '').replace(/,/g, ''))
}

export function formatCompactAmount(amount: string | number): string {
    const num = toNumber(amount)

    if (!Number.isFinite(num)) {
        return typeof amount === 'string' ? amount : String(amount)
    }

    if (Math.abs(num) > 1) {
        return compactNumberFormatter.format(num)
    }

    return plainNumberFormatter.format(num)
}

export function formatBalance(balance: string | number | null | undefined): string {
    if (isEmpty(balance)) return EMPTY_VALUE
    const num = toNumber(balance as string | number)
    if (!Number.isFinite(num)) return String(balance)

    if (Math.abs(num) < 1) {
        return Number(num.toFixed(4)).toString()
    }

    if (Math.abs(num) >= 1000) {
        return compactNumberFormatter.format(num)
    }

    return standardAmountFormatter.format(num)
}

export function formatUsd(value: number | null | undefined): string {
    if (isEmpty(value) || !Number.isFinite(value as number)) return EMPTY_VALUE
    const n = value as number
    if (n === 0) return '$0.00'
    if (n > 0 && n < 1) {
        if (n < 0.000001) return `$${n.toFixed(10)}`
        if (n < 0.0001) return `$${n.toFixed(8)}`
        if (n < 0.01) return `$${n.toFixed(6)}`
        return `$${n.toFixed(4)}`
    }
    if (Math.abs(n) >= 1000) {
        return usdCompactFormatter.format(n)
    }
    return usdStandardFormatter.format(n)
}

export function formatUsdCompact(value: number | null | undefined): string {
    if (isEmpty(value) || !Number.isFinite(value as number)) return EMPTY_VALUE
    return usdCompactFormatter.format(value as number)
}

export function formatDisplayText(value: string | null | undefined): string {
    if (isEmpty(value)) return EMPTY_VALUE
    return String(value)
}

export function formatPercent(percent: number | null | undefined): string {
    if (isEmpty(percent) || !Number.isFinite(percent as number)) return EMPTY_VALUE
    const p = percent as number
    const sign = p > 0 ? '+' : ''
    return `${sign}${p.toFixed(2)}%`
}

export function formatShortAddress(addr: string | null | undefined): string {
    if (!addr || addr.length < 12) return addr || EMPTY_VALUE
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatRelativeTime(date: Date | string | number): string {
    const m = moment(date)
    if (!m.isValid()) return EMPTY_VALUE
    return m.fromNow()
}

export function formatTokens(n: number): string {
    if (!Number.isFinite(n) || n < 0) return '0'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 10_000) return `${Math.round(n / 1000)}k`
    return n.toLocaleString()
}

export function formatGasFee(gasFee: string | number | null | undefined): string {
    if (isEmpty(gasFee)) return EMPTY_VALUE
    const num = toNumber(gasFee as string | number)
    if (!Number.isFinite(num)) return String(gasFee)
    if (num === 0) return '0'

    const abs = Math.abs(num)

    if (abs < 0.0001) {
        if (abs < 0.000001) {
            return '< 0.000001'
        }
        return num.toFixed(6).replace(/\.?0+$/, '')
    }

    if (abs >= 1000) {
        return compactNumberFormatter.format(num)
    }

    return num.toFixed(4).replace(/\.?0+$/, '')
}

