import moment from "moment"

const DEFAULT_TIME_ZONE = "UTC"

export function resolveTimeZone(timeZone?: string | null): string {
    const tz = typeof timeZone === "string" ? timeZone.trim() : ""
    if (!tz) return DEFAULT_TIME_ZONE
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz }).format()
        return tz
    } catch {
        return DEFAULT_TIME_ZONE
    }
}

export function calendarDateInTimeZone(
    date: Date = new Date(),
    timeZone?: string | null
): string {
    const tz = resolveTimeZone(timeZone)
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

export function dayKeyInTimeZone(
    date: Date = new Date(),
    timeZone?: string | null
): Date {
    const ymd = calendarDateInTimeZone(date, timeZone)
    const [y, m, d] = ymd.split("-").map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}

export function utcDayStart(date: Date = new Date()): Date {
    return dayKeyInTimeZone(date, "UTC")
}

export function nextMidnightInTimeZone(
    timeZone?: string | null,
    now: Date = new Date()
): Date {
    const tz = resolveTimeZone(timeZone)
    const today = calendarDateInTimeZone(now, tz)

    let lo = now.getTime()
    let hi = now.getTime() + 36 * 60 * 60 * 1000

    while (calendarDateInTimeZone(new Date(hi), tz) === today) {
        hi += 12 * 60 * 60 * 1000
    }

    while (hi - lo > 250) {
        const mid = Math.floor((lo + hi) / 2)
        if (calendarDateInTimeZone(new Date(mid), tz) === today) {
            lo = mid
        } else {
            hi = mid
        }
    }

    return new Date(hi)
}

export function nextUtcDayStart(date: Date = new Date()): Date {
    return nextMidnightInTimeZone("UTC", date)
}

export function daysAgoInTimeZone(
    days: number,
    timeZone?: string | null,
    from: Date = new Date()
): Date {
    const key = dayKeyInTimeZone(from, timeZone)
    key.setUTCDate(key.getUTCDate() - days)
    return key
}

export function daysAgoUtc(days: number, from: Date = new Date()): Date {
    return daysAgoInTimeZone(days, "UTC", from)
}

export function formatTimeUntil(target: Date, now: Date = new Date()): string {
    const ms = moment(target).diff(moment(now))
    if (ms <= 0) return "a moment"
    return moment.duration(ms).humanize()
}
