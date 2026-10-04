const MINUTES_PER_MS = 1 / 60_000

/** Adds days to a `YYYY-MM-DD` date. */
export function addDays (date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

/** Minutes of a naive wall-clock time (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm`), counted from an arbitrary common origin. */
export function wallClockMinutes (wallClock: string): number {
  const [date = '', time = '00:00'] = wallClock.split(' ')
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  return Date.UTC(year, month - 1, day, hour, minute) * MINUTES_PER_MS
}

/** Formats minutes as `7 h 30 min`, `8 h` or `45 min`. */
export function formatDuration (minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  if (hours === 0) {
    return `${rest} min`
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

const MINUTES_PER_DAY = 1440

/** Formats minutes on the common scale of `wallClockMinutes` as `HH:mm`. */
export function formatClock (minutes: number): string {
  const minuteOfDay = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(minuteOfDay / 60)
  return `${String(hours).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`
}

/** `YYYY-MM-DD` of the local date fields of a Date. */
export function toDateString (date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Local midnight of a `YYYY-MM-DD` date. */
export function fromDateString (date: string): Date {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}
