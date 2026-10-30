import { wallClockMinutes } from './dates'

const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60

const formatters = new Map<string, Intl.DateTimeFormat>()

export function isValidTimeZone (timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

function getFormatter (timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

/** Naive wall-clock time (`YYYY-MM-DD HH:mm`) of a point in time in the given time zone. */
export function formatInstant (milliseconds: number, timeZone: string): string {
  const parts: Record<string, string> = {}
  for (const part of getFormatter(timeZone).formatToParts(milliseconds)) {
    parts[part.type] = part.value
  }
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

/** Current wall-clock time (`YYYY-MM-DD HH:mm`) in the time zone of the calendar. */
export function nowInTimeZone (timeZone: string): string {
  return formatInstant(Date.now(), timeZone)
}

/** Absolute minutes (since the epoch) of a point in time. All durations are calculated with these. */
export function absoluteMinutes (milliseconds: number): number {
  return Math.floor(milliseconds / MS_PER_MINUTE)
}

/** Absolute minutes of a naive wall-clock time (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm`) in the given time zone. */
export function zonedToAbsolute (wallClock: string, timeZone: string): number {
  const naive = wallClockMinutes(wallClock)
  let absolute = naive
  // The offset depends on the result, so converge in two steps (also correct next to a change of the offset)
  for (let step = 0; step < 2; step++) {
    absolute += naive - wallClockMinutes(formatInstant(absolute * MS_PER_MINUTE, timeZone))
  }
  return absolute
}

/** `HH:mm` wall-clock time of absolute minutes. */
export function clockAt (minutes: number, timeZone: string): string {
  return formatInstant(minutes * MS_PER_MINUTE, timeZone).slice(11)
}

/** Distance in minutes from the start of the local hour. Not zero for zones with offsets like +05:30. */
function minutesIntoLocalHour (minutes: number, timeZone: string): number {
  return Number(clockAt(minutes, timeZone).slice(3))
}

export function floorToLocalHour (minutes: number, timeZone: string): number {
  return minutes - minutesIntoLocalHour(minutes, timeZone)
}

export function ceilToLocalHour (minutes: number, timeZone: string): number {
  const into = minutesIntoLocalHour(minutes, timeZone)
  return into === 0 ? minutes : minutes + MINUTES_PER_HOUR - into
}
