import type { CalendarEventItem, EventKind } from './types'
import { KIND_STYLES } from './categories'
import { addDays } from './dates'
import { ceilToLocalHour, clockAt, floorToLocalHour, zonedToAbsolute } from './timeZones'

const MINUTES_PER_HOUR = 60

/** A bar on the timeline. Start and end are absolute minutes (since the epoch), so durations stay right when the clocks change. */
export interface TimelineBar {
  key: string
  start: number
  end: number
  kind: EventKind
  color: string
  label: string
  item?: CalendarEventItem
}

export interface TimelineRow {
  key: string
  label: string
  /** The event itself first, followed by the breaks and maintenance periods inside of it */
  bars: TimelineBar[]
}

export interface TimelineTick {
  minute: number
  label: string
  midnight: boolean
}

export interface DayTimeline {
  date: string
  /** Visible window in whole hours, at least the calendar day and wide enough for shifts that start the evening before */
  start: number
  end: number
  rows: TimelineRow[]
  /** Planned production, breaks and maintenance of all rows combined, without overlaps */
  combined: TimelineBar[]
  /** Minutes of planned production time (union of all shifts) */
  operating: number
  breaks: number
  maintenance: number
  /** Planned operating time without breaks and maintenance (planned busy time, ISO 22400-2) */
  busy: number
}

function toBar (event: CalendarEventItem): TimelineBar {
  return {
    key: event.key,
    start: event.startAt,
    end: event.endAt,
    kind: event.kind,
    color: event.color,
    label: event.name,
    item: event,
  }
}

function covers (bars: TimelineBar[], minute: number): boolean {
  return bars.some(bar => bar.start <= minute && minute < bar.end)
}

function segmentKind (inShift: boolean, inBreak: boolean, inMaintenance: boolean): EventKind | undefined {
  if (inMaintenance) {
    return 'maintenance'
  }
  if (inBreak) {
    return 'break'
  }
  return inShift ? 'production' : undefined
}

/** Sweeps over all boundaries of the bars: maintenance wins over breaks, which win over production. */
function combine (shifts: TimelineBar[], breaks: TimelineBar[], maintenance: TimelineBar[]) {
  const boundaries = [...new Set([...shifts, ...breaks, ...maintenance].flatMap(bar => [bar.start, bar.end]))]
    .toSorted((left, right) => left - right)

  const combined: TimelineBar[] = []
  const totals = { operating: 0, breaks: 0, maintenance: 0, busy: 0 }
  for (const [index, start] of boundaries.slice(0, -1).entries()) {
    const end = boundaries[index + 1] as number
    const inShift = covers(shifts, start)
    const inBreak = covers(breaks, start)
    const inMaintenance = covers(maintenance, start)
    const length = end - start
    totals.operating += inShift ? length : 0
    totals.breaks += inBreak ? length : 0
    totals.maintenance += inMaintenance ? length : 0
    totals.busy += inShift && !inBreak && !inMaintenance ? length : 0

    const kind = segmentKind(inShift, inBreak, inMaintenance)
    if (!kind) {
      continue
    }
    const last = combined.at(-1)
    if (last && last.kind === kind && last.end === start) {
      last.end = end
    } else {
      combined.push({ key: `combined-${start}`, start, end, kind, color: KIND_STYLES[kind].color, label: KIND_STYLES[kind].label })
    }
  }
  return { combined, ...totals }
}

/** An all-day event covers the whole day, whatever the length of the day is. */
function toDayBar (event: CalendarEventItem, dayStart: number, dayEnd: number): TimelineBar {
  return { ...toBar(event), start: dayStart, end: dayEnd }
}

/**
 * Lays out everything that belongs to the production day `date` (`YYYY-MM-DD`): the timed events assigned to it
 * and the all-day events that cover it. `timeZone` is the time zone of the calendar.
 */
export function buildDayTimeline (events: CalendarEventItem[], date: string, timeZone: string): DayTimeline {
  const dayStart = zonedToAbsolute(date, timeZone)
  const dayEnd = zonedToAbsolute(addDays(date, 1), timeZone)

  const own = events.filter(event => event.timed && event.productionDate === date)
  const allDay = events.filter(event => !event.timed && event.start <= date && date <= event.end)
  const rows: TimelineRow[] = [
    ...own
      .filter(event => !event.parentKey)
      .map(event => ({
        key: event.key,
        label: event.name,
        bars: [toBar(event), ...own.filter(nested => nested.parentKey === event.key).map(nested => toBar(nested))],
      })),
    ...allDay.map(event => ({ key: `${event.key}-${date}`, label: event.name, bars: [toDayBar(event, dayStart, dayEnd)] })),
  ].toSorted((left, right) => (left.bars[0]?.start ?? 0) - (right.bars[0]?.start ?? 0))

  const bars = rows.flatMap(row => row.bars)
  const start = floorToLocalHour(Math.min(dayStart, ...bars.map(bar => bar.start)), timeZone)
  const end = ceilToLocalHour(Math.max(dayEnd, ...bars.map(bar => bar.end)), timeZone)

  const shifts = rows.map(row => row.bars[0]).filter((bar): bar is TimelineBar => bar?.kind === 'production')
  return {
    date,
    start,
    end,
    rows,
    ...combine(shifts, bars.filter(bar => bar.kind === 'break'), bars.filter(bar => bar.kind === 'maintenance')),
  }
}

/** Hour marks for the axis, sparser for long windows. */
export function timelineTicks (timeline: DayTimeline, timeZone: string): TimelineTick[] {
  const hours = (timeline.end - timeline.start) / MINUTES_PER_HOUR
  const step = (hours <= 14 ? 1 : (hours <= 30 ? 2 : 3)) * MINUTES_PER_HOUR
  const ticks: TimelineTick[] = []
  for (let minute = timeline.start; minute <= timeline.end; minute += step) {
    const clock = clockAt(minute, timeZone)
    ticks.push({ minute, label: clock.slice(0, 2), midnight: clock === '00:00' })
  }
  return ticks
}
