import type { CalendarEventItem } from './types'

const HOURS_PER_DAY = 24
const DEFAULT_HOURS = { first: 6, count: 16 }

/** Hour of day of a `YYYY-MM-DD HH:mm` time, rounded up for the end of an event. */
function hourOf (wallClock: string, roundUp: boolean): number {
  const hours = Number(wallClock.slice(11, 13))
  const minutes = Number(wallClock.slice(14, 16))
  return roundUp && minutes > 0 ? hours + 1 : hours
}

/**
 * The hours the week view has to show: only those in which something happens, one hour of margin around them.
 * An event that runs through midnight also occupies the morning hours of the following day.
 */
export function visibleHours (events: CalendarEventItem[]): { first: number, count: number } {
  const timed = events.filter(event => event.timed)
  if (timed.length === 0) {
    return DEFAULT_HOURS
  }

  let first = HOURS_PER_DAY
  let last = 0
  for (const event of timed) {
    const days = Math.round((Date.parse(event.end.slice(0, 10)) - Date.parse(event.start.slice(0, 10))) / 86_400_000)
    const endsAtMidnight = days === 1 && event.end.slice(11) === '00:00'
    if (days === 0 || endsAtMidnight) {
      first = Math.min(first, hourOf(event.start, false))
      last = Math.max(last, endsAtMidnight ? HOURS_PER_DAY : hourOf(event.end, true))
    } else if (days === 1) {
      first = 0
      last = Math.max(last, HOURS_PER_DAY, hourOf(event.end, true))
    } else {
      first = 0
      last = HOURS_PER_DAY
    }
  }
  const firstHour = Math.max(0, first - 1)
  return { first: firstHour, count: Math.min(HOURS_PER_DAY, last + 1) - firstHour }
}
