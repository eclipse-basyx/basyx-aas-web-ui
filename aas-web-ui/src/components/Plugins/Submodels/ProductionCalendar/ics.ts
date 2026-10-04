import type { CalendarEventItem, EventKind, ParsedCalendar } from './types'
import ICAL from 'ical.js'
import { KIND_STYLES, kindFromCategories } from './categories'
import { addDays } from './dates'
import { absoluteMinutes, formatInstant, isValidTimeZone, zonedToAbsolute } from './timeZones'
import { normalizeVariableName } from './variables'

/** Upper bound of occurrences evaluated per event, protects against runaway recurrence rules. */
const MAX_OCCURRENCES_PER_EVENT = 20_000
const DEFAULT_NAME = 'Production calendar'
const FALLBACK_TIME_ZONE = 'UTC'
const INSTANT_PATTERN = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
const X_PROPERTY_PATTERN = /^x[-_]/i
const FLAG_PATTERN = /^(?:true|1|yes)$/i

/** A break or maintenance period of an event, relative to the start of the event it belongs to. */
interface NestedPeriod {
  startOffsetSeconds: number
  durationSeconds: number
}

interface EventSpec {
  categories: string[]
  xProperties: string[]
  kind: EventKind
  productionDay?: -1 | 0 | 1
  breaks: NestedPeriod[]
  maintenance: NestedPeriod[]
}

/** Formats a point in time as naive `YYYY-MM-DD HH:mm` wall-clock time of the given time zone. */
function toWallClock (time: ICAL.Time, timeZone: string): string {
  if (time.isDate) {
    return time.toString()
  }
  // Floating times carry no zone, their fields already are the wall-clock time.
  const zone = time.zone === ICAL.Timezone.localTimezone ? 'UTC' : timeZone
  return formatInstant(time.toUnixTime() * 1000, zone)
}

/** Absolute minutes of a point in time. All-day and floating times are taken as local time of the calendar. */
function toAbsolute (time: ICAL.Time, timeZone: string): number {
  if (time.isDate || time.zone === ICAL.Timezone.localTimezone) {
    return zonedToAbsolute(toWallClock(time, timeZone), timeZone)
  }
  return absoluteMinutes(time.toUnixTime() * 1000)
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

/** Values of all properties with the given (normalized) X- name, comma separated lists are flattened. */
function getXValues (event: ICAL.Event, variable: string): string[] {
  return event.component
    .getAllProperties()
    .filter(property => X_PROPERTY_PATTERN.test(property.name) && normalizeVariableName(property.name) === variable)
    .flatMap(property => property.getValues().flatMap(value => String(value).split(',')))
    .map(value => value.trim())
    .filter(Boolean)
}

function getXPropertyNames (event: ICAL.Event): string[] {
  return event.component
    .getAllProperties()
    .filter(property => X_PROPERTY_PATTERN.test(property.name) && String(property.getFirstValue()).toUpperCase() !== 'FALSE')
    .map(property => normalizeVariableName(property.name))
}

/** Parses `20240310T100000Z` (UTC) or `20240310T100000` (wall-clock) into milliseconds. */
function parseInstant (text: string): { milliseconds: number, absolute: boolean } | undefined {
  const match = INSTANT_PATTERN.exec(text)
  if (!match) {
    return undefined
  }
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number) as [number, number, number, number, number, number]
  return { milliseconds: Date.UTC(year, month - 1, day, hour, minute, second), absolute: match[7] === 'Z' }
}

/**
 * Parses periods like `20240310T100000Z/PT30M` or `20240310T100000Z/20240310T103000Z` (also with `-` as separator,
 * as used by the IDTA template examples) into offsets relative to the start of the event.
 */
function parsePeriods (values: string[], event: ICAL.Event): NestedPeriod[] {
  const base = event.startDate
  const baseAbsolute = base.toUnixTime() * 1000
  const baseWallClock = Date.UTC(base.year, base.month - 1, base.day, base.hour, base.minute, base.second)

  const periods: NestedPeriod[] = []
  for (const value of values) {
    const [startText, endText] = value.includes('/') ? value.split('/') : value.split(/(?<=[\dZ])-(?=\d{8}T)/)
    const start = parseInstant(startText ?? '')
    if (!start || !endText) {
      continue
    }
    let durationSeconds: number
    if (/^[+-]?P/.test(endText)) {
      durationSeconds = ICAL.Duration.fromString(endText).toSeconds()
    } else {
      const end = parseInstant(endText)
      if (!end) {
        continue
      }
      durationSeconds = (end.milliseconds - start.milliseconds) / 1000
    }
    if (durationSeconds > 0) {
      periods.push({
        startOffsetSeconds: (start.milliseconds - (start.absolute ? baseAbsolute : baseWallClock)) / 1000,
        durationSeconds,
      })
    }
  }
  return periods
}

function isProductionDay (value: number): value is -1 | 0 | 1 {
  return [-1, 0, 1].includes(value)
}

/**
 * Reads the meaning of an event or of a changed occurrence of it (which replaces all properties of the series). Following the IDTA template an event is a shift whose `X-BREAK` and
 * `X-MAINTENANCE` properties list periods inside of it. Calendars that mark whole events as break or
 * maintenance (`X-BREAK:TRUE` or a matching category) are accepted as well.
 */
const specs = new WeakMap<ICAL.Event, EventSpec>()

function describeEvent (event: ICAL.Event): EventSpec {
  const known = specs.get(event)
  if (known) {
    return known
  }
  const allDay = event.startDate.isDate
  const categories = getCategories(event)
  const breakValues = getXValues(event, 'X-BREAK')
  const maintenanceValues = getXValues(event, 'X-MAINTENANCE')
  const productionDay = Number(getXValues(event, 'X-PRODUCTION-DAY')[0])

  let kind: EventKind = kindFromCategories(categories) ?? (allDay ? 'other' : 'production')
  if (breakValues.some(value => FLAG_PATTERN.test(value))) {
    kind = 'break'
  } else if (maintenanceValues.some(value => FLAG_PATTERN.test(value))) {
    kind = 'maintenance'
  }

  const spec: EventSpec = {
    categories,
    xProperties: getXPropertyNames(event),
    kind,
    productionDay: isProductionDay(productionDay) ? productionDay : undefined,
    breaks: parsePeriods(breakValues, event),
    maintenance: parsePeriods(maintenanceValues, event),
  }
  specs.set(event, spec)
  return spec
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

  // ical.js would relate every changed occurrence of the calendar to every event, so relate them by UID below
  const events = root.getAllSubcomponents('vevent').map(component => new ICAL.Event(component, { exceptions: [] }))
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
    xProperties: [...new Set(masters.flatMap(event => getXPropertyNames(event)))],
  }
}

function isExcluded (event: ICAL.Event, time: ICAL.Time): boolean {
  return event.component
    .getAllProperties('exdate')
    .some(property => property.getValues().some(value => value instanceof ICAL.Time && value.compare(time) === 0))
}

function* occurrenceDetails (event: ICAL.Event, rangeEndMs: number) {
  if (!event.isRecurring()) {
    yield { item: event, startDate: event.startDate, endDate: event.endDate }
    return
  }
  // DTSTART is the first instance of the recurrence set, ical.js only expands it together with an RRULE.
  const hasRule = event.component.hasProperty('rrule')
  if (!hasRule && !isExcluded(event, event.startDate)) {
    yield { item: event, startDate: event.startDate, endDate: event.endDate }
  }

  const iterated = new Set<string>()
  const iterator = event.iterator()
  for (let count = 0; count < MAX_OCCURRENCES_PER_EVENT; count++) {
    const next = iterator.next()
    if (!next || next.toUnixTime() * 1000 >= rangeEndMs) {
      break
    }
    iterated.add(next.toString())
    iterated.add(next.convertToZone(ICAL.Timezone.utcTimezone).toString())
    if (hasRule || next.compare(event.startDate) !== 0) {
      yield event.getOccurrenceDetails(next)
    }
  }

  // The original date of a changed occurrence can lie behind the range although it was moved into it
  const exceptions = Object.entries(event.exceptions as unknown as Record<string, ICAL.Event>)
  for (const [id, exception] of exceptions) {
    if (!iterated.has(id)) {
      yield event.getOccurrenceDetails(exception.recurrenceId)
    }
  }
}

/**
 * The production day an event belongs to. `X-PRODUCTION-DAY` is relative to the calendar day the event ends on
 * (an event that ends at midnight still belongs to the day it lies in).
 */
function productionDateOf (start: string, end: string, timed: boolean, productionDay = 0): string {
  if (!timed) {
    return start
  }
  const endDate = end.slice(0, 10)
  const endsAtMidnight = end.slice(11) === '00:00' && end > start
  return addDays(endsAtMidnight ? addDays(endDate, -1) : endDate, productionDay)
}

function shift (time: ICAL.Time, seconds: number): ICAL.Time {
  const shifted = time.clone()
  shifted.addDuration(ICAL.Duration.fromSeconds(seconds))
  return shifted
}

/** Expands all events (including recurrences) overlapping `[rangeStart, rangeEnd)`. */
export function expandEvents (calendar: ParsedCalendar, rangeStart: Date, rangeEnd: Date): CalendarEventItem[] {
  const items: CalendarEventItem[] = []
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()

  for (const event of calendar.events) {
    for (const { item, startDate, endDate } of occurrenceDetails(event, rangeEndMs)) {
      if (!startDate) {
        continue
      }
      const end = endDate ?? startDate
      const startAt = toAbsolute(startDate, calendar.timeZone)
      const endAt = toAbsolute(end, calendar.timeZone)
      if (startAt * 60_000 >= rangeEndMs || endAt * 60_000 <= rangeStartMs) {
        continue
      }
      const spec = describeEvent(item)
      const timed = !startDate.isDate
      // DTEND of all-day events is exclusive, v-calendar expects the last day itself.
      const lastDay = end.clone()
      if (!timed && end.compare(startDate) > 0) {
        lastDay.adjust(-1, 0, 0, 0)
      }
      const start = toWallClock(startDate, calendar.timeZone)
      const endText = toWallClock(timed ? end : lastDay, calendar.timeZone)
      const productionDate = productionDateOf(start, endText, timed, spec.productionDay)
      const shiftItem: CalendarEventItem = {
        key: `${event.uid}-${start}`,
        uid: event.uid,
        name: item.summary || KIND_STYLES[spec.kind].label,
        description: item.description,
        location: item.location,
        start,
        end: endText,
        startAt,
        endAt,
        timed,
        categories: spec.categories,
        xProperties: spec.xProperties,
        kind: spec.kind,
        color: KIND_STYLES[spec.kind].color,
        productionDay: spec.productionDay,
        productionDate,
      }

      const nested: CalendarEventItem[] = []
      for (const [kind, label, variable, periods] of timed
        ? ([
            ['break', 'Break', 'X-BREAK', spec.breaks],
            ['maintenance', 'Maintenance', 'X-MAINTENANCE', spec.maintenance],
          ] as const)
        : []) {
        for (const [index, period] of periods.entries()) {
          const periodStart = shift(startDate, period.startOffsetSeconds)
          const periodEnd = shift(periodStart, period.durationSeconds)
          const periodStartAt = toAbsolute(periodStart, calendar.timeZone)
          const periodEndAt = toAbsolute(periodEnd, calendar.timeZone)
          // Periods are compared by absolute time, wall-clock times are ambiguous when the clocks change.
          // Periods can reach beyond an event that is shorter than the one they were written for.
          const fromAt = Math.max(periodStartAt, startAt)
          const toAt = Math.min(periodEndAt, endAt)
          if (fromAt >= toAt) {
            continue
          }
          nested.push({
            key: `${event.uid}-${start}-${kind}-${index}`,
            uid: event.uid,
            name: label,
            description: item.summary ? `During ${item.summary}` : '',
            location: item.location,
            start: fromAt === periodStartAt ? toWallClock(periodStart, calendar.timeZone) : start,
            end: toAt === periodEndAt ? toWallClock(periodEnd, calendar.timeZone) : endText,
            startAt: fromAt,
            endAt: toAt,
            timed: true,
            categories: spec.categories,
            xProperties: [variable],
            kind,
            color: KIND_STYLES[kind].color,
            productionDate,
            parentKey: shiftItem.key,
          })
        }
      }

      // A period that covers the whole event leaves no production time: show it as the one event it is
      const covering = nested.find(period => period.startAt <= startAt && period.endAt >= endAt)
      if (covering) {
        items.push({ ...shiftItem, kind: covering.kind, color: covering.color })
      } else {
        items.push(shiftItem, ...nested)
      }
    }
  }

  // Shifts first, so that nested breaks and maintenance periods are drawn on top of them.
  return items.toSorted((left, right) => {
    return left.startAt - right.startAt || Number(left.kind !== 'production') - Number(right.kind !== 'production')
  })
}
