import type { CalendarEventItem, EventKind } from './types'
import { KIND_STYLES } from './categories'
import { wallClockMinutes } from './dates'

const MINUTES_PER_DAY = 1440
const MINUTES_PER_HOUR = 60

/** A bar on the timeline. Start and end are minutes on the common scale of `wallClockMinutes`. */
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
    start: wallClockMinutes(event.start),
    end: wallClockMinutes(event.end),
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

/** Lays out everything that belongs to the production day `date` (`YYYY-MM-DD`). */
export function buildDayTimeline (events: CalendarEventItem[], date: string): DayTimeline {
  const own = events.filter(event => event.timed && event.productionDate === date)
  const rows: TimelineRow[] = own
    .filter(event => !event.parentKey)
    .map(event => ({
      key: event.key,
      label: event.name,
      bars: [toBar(event), ...own.filter(nested => nested.parentKey === event.key).map(nested => toBar(nested))],
    }))
    .toSorted((left, right) => (left.bars[0]?.start ?? 0) - (right.bars[0]?.start ?? 0))

  const bars = rows.flatMap(row => row.bars)
  const dayStart = wallClockMinutes(date)
  const start = Math.floor(Math.min(dayStart, ...bars.map(bar => bar.start)) / MINUTES_PER_HOUR) * MINUTES_PER_HOUR
  const end = Math.ceil(Math.max(dayStart + MINUTES_PER_DAY, ...bars.map(bar => bar.end)) / MINUTES_PER_HOUR) * MINUTES_PER_HOUR

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
export function timelineTicks (timeline: DayTimeline): TimelineTick[] {
  const hours = (timeline.end - timeline.start) / MINUTES_PER_HOUR
  const step = (hours <= 14 ? 1 : (hours <= 30 ? 2 : 3)) * MINUTES_PER_HOUR
  const ticks: TimelineTick[] = []
  for (let minute = timeline.start; minute <= timeline.end; minute += step) {
    const minuteOfDay = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
    ticks.push({
      minute,
      label: String(minuteOfDay / MINUTES_PER_HOUR).padStart(2, '0'),
      midnight: minuteOfDay === 0,
    })
  }
  return ticks
}
