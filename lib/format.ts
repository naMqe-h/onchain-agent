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

export function formatCompactAmount(amount: string | number): string {
    const num =
        typeof amount === 'number'
            ? amount
            : Number(String(amount).replace(/\s/g, '').replace(/,/g, ''))

    if (!Number.isFinite(num)) {
        return typeof amount === 'string' ? amount : String(amount)
    }

    if (Math.abs(num) > 1) {
        return compactNumberFormatter.format(num)
    }

    return plainNumberFormatter.format(num)
}
