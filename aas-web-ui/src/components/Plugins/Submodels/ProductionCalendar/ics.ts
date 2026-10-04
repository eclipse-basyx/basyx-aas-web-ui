import type { CalendarEventItem, ParsedCalendar } from './types'
import ICAL from 'ical.js'
import { KIND_STYLES, resolveKind } from './categories'

/** Upper bound of occurrences evaluated per event, protects against runaway recurrence rules. */
const MAX_OCCURRENCES_PER_EVENT = 20_000
const DEFAULT_NAME = 'Production calendar'
const FALLBACK_TIME_ZONE = 'UTC'

const formatters = new Map<string, Intl.DateTimeFormat>()

function isValidTimeZone (timeZone: string): boolean {
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

/** Formats a point in time as naive `YYYY-MM-DD HH:mm` wall-clock time of the given time zone. */
function toWallClock (time: ICAL.Time, timeZone: string): string {
  if (time.isDate) {
    return time.toString()
  }
  // Floating times carry no zone, their fields already are the wall-clock time.
  const zone = time.zone === ICAL.Timezone.localTimezone ? 'UTC' : timeZone
  const parts: Record<string, string> = {}
  for (const part of getFormatter(zone).formatToParts(time.toUnixTime() * 1000)) {
    parts[part.type] = part.value
  }
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

function resolveTimeZone (root: ICAL.Component): string {
  const candidates = [
    root.getFirstPropertyValue('x-wr-timezone'),
    root.getFirstSubcomponent('vtimezone')?.getFirstPropertyValue('tzid'),
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isValidTimeZone(candidate)) {
      return candidate
    }
  }
  return FALLBACK_TIME_ZONE
}

function getCategories (event: ICAL.Event): string[] {
  return event.component
    .getAllProperties('categories')
    .flatMap(property => property.getValues())
    .map(value => String(value).trim())
    .filter(Boolean)
}

function getXProperties (event: ICAL.Event): string[] {
  return event.component
    .getAllProperties()
    .filter(property => property.name.startsWith('x-') && String(property.getFirstValue()).toUpperCase() !== 'FALSE')
    .map(property => property.name.toUpperCase())
}

/**
 * Parses iCalendar (RFC 5545) text. Throws if the text is not a valid VCALENDAR.
 * Recurrence exceptions (RECURRENCE-ID) are attached to their master event.
 */
export function parseCalendar (text: string): ParsedCalendar {
  const root = new ICAL.Component(ICAL.parse(text))
  if (root.name !== 'vcalendar') {
    throw new Error('Not an iCalendar document')
  }

  for (const timezone of root.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(timezone)
  }

  const events = root.getAllSubcomponents('vevent').map(component => new ICAL.Event(component))
  const masters = events.filter(event => !event.recurrenceId)
  for (const exception of events.filter(event => event.recurrenceId)) {
    const master = masters.find(event => event.uid === exception.uid)
    if (master) {
      master.relateException(exception)
    } else {
      masters.push(exception)
    }
  }

  const name = root.getFirstPropertyValue('x-wr-calname')
  return {
    name: typeof name === 'string' && name.trim() ? name.trim() : DEFAULT_NAME,
    timeZone: resolveTimeZone(root),
    events: masters,
    xProperties: [...new Set(masters.flatMap(event => getXProperties(event)))],
  }
}

function* occurrenceDetails (event: ICAL.Event, rangeEndMs: number) {
  if (!event.isRecurring()) {
    yield { item: event, startDate: event.startDate, endDate: event.endDate }
    return
  }
  // DTSTART is the first instance of the recurrence set, ical.js only expands it together with an RRULE.
  const hasRule = event.component.hasProperty('rrule')
  if (!hasRule) {
    yield { item: event, startDate: event.startDate, endDate: event.endDate }
  }
  const iterator = event.iterator()
  for (let count = 0; count < MAX_OCCURRENCES_PER_EVENT; count++) {
    const next = iterator.next()
    if (!next || next.toUnixTime() * 1000 >= rangeEndMs) {
      return
    }
    if (hasRule || next.compare(event.startDate) !== 0) {
      yield event.getOccurrenceDetails(next)
    }
  }
}

/** Expands all events (including recurrences) overlapping `[rangeStart, rangeEnd)`. */
export function expandEvents (calendar: ParsedCalendar, rangeStart: Date, rangeEnd: Date): CalendarEventItem[] {
  const items: CalendarEventItem[] = []
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()

  for (const event of calendar.events) {
    const categories = getCategories(event)
    const xProperties = getXProperties(event)
    const kind = resolveKind(categories, xProperties)

    for (const { item, startDate, endDate } of occurrenceDetails(event, rangeEndMs)) {
      if (!startDate || startDate.toUnixTime() * 1000 >= rangeEndMs) {
        continue
      }
      const end = endDate ?? startDate
      if (end.toUnixTime() * 1000 <= rangeStartMs) {
        continue
      }
      const timed = !startDate.isDate
      // DTEND of all-day events is exclusive, v-calendar expects the last day itself.
      const lastDay = end.clone()
      if (!timed && end.compare(startDate) > 0) {
        lastDay.adjust(-1, 0, 0, 0)
      }
      const start = toWallClock(startDate, calendar.timeZone)
      items.push({
        key: `${event.uid}-${start}`,
        uid: event.uid,
        name: item.summary || KIND_STYLES[kind].label,
        description: item.description,
        location: item.location,
        start,
        end: toWallClock(timed ? end : lastDay, calendar.timeZone),
        timed,
        categories,
        xProperties,
        kind,
        color: KIND_STYLES[kind].color,
      })
    }
  }

  return items.toSorted((left, right) => left.start.localeCompare(right.start))
}
