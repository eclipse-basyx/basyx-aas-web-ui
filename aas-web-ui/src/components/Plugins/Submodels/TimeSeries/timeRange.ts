export type RelativeTimeUnit
  = | 'milliseconds'
    | 'seconds'
    | 'minutes'
    | 'hours'
    | 'days'
    | 'weeks'
    | 'months'
    | 'years'

export type TimeRangeSelection
  = | {
    mode: 'relative'
    value: number
    unit: RelativeTimeUnit
  }
  | {
    mode: 'absolute'
    start: string
    stop: string
  }

export type ResolvedTimeRange = {
  mode: TimeRangeSelection['mode']
  start: string
  stop: string
  startMs: number
  stopMs: number
  durationMs: number
}

export type TimeSeriesDataPoint = {
  time: string
  value: unknown
}

export const DEFAULT_TIME_RANGE: TimeRangeSelection = {
  mode: 'relative',
  value: 1,
  unit: 'minutes',
}

export const DESIRED_POINTS_PER_GRAPH = 360

const MILLISECONDS_PER_UNIT: Partial<Record<RelativeTimeUnit, number>> = {
  milliseconds: 1,
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
}

const RELATIVE_TIME_UNITS = new Set<RelativeTimeUnit>([
  'milliseconds',
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'years',
])

const LOCAL_DATE_TIME_PATTERN
  = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/
const RFC_3339_PATTERN
  = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

export function cloneTimeRangeSelection (selection: TimeRangeSelection): TimeRangeSelection {
  return { ...selection }
}

export function validateTimeRangeSelection (selection: unknown): string | null {
  if (!selection || typeof selection !== 'object') {
    return 'Enter a valid time range.'
  }

  const candidate = selection as Record<string, unknown>
  if (candidate.mode !== 'relative' && candidate.mode !== 'absolute') {
    return 'Select a valid time range mode.'
  }

  if (candidate.mode === 'relative') {
    if (typeof candidate.value !== 'number' || !Number.isFinite(candidate.value) || candidate.value <= 0) {
      return 'Enter a time range greater than zero.'
    }

    if (typeof candidate.unit !== 'string' || !RELATIVE_TIME_UNITS.has(candidate.unit as RelativeTimeUnit)) {
      return 'Select a supported time unit.'
    }

    if ((candidate.unit === 'months' || candidate.unit === 'years') && !Number.isInteger(candidate.value)) {
      return 'Months and years must be whole numbers.'
    }

    const stop = new Date()
    const start = subtractRelativeTime(stop, candidate.value, candidate.unit as RelativeTimeUnit)
    if (!isFiniteOrderedRange(start, stop)) {
      return 'Enter a time range within the supported date range.'
    }

    return null
  }

  if (typeof candidate.start !== 'string' || typeof candidate.stop !== 'string' || !candidate.start || !candidate.stop) {
    return 'Enter both a start and an end date.'
  }

  const startDate = parseAbsoluteDate(candidate.start)
  const stopDate = parseAbsoluteDate(candidate.stop)
  if (!startDate || !stopDate) {
    return 'Enter valid start and end dates.'
  }

  const startMs = startDate.getTime()
  const stopMs = stopDate.getTime()
  if (startMs >= stopMs) {
    return 'The start date must be before the end date.'
  }

  return null
}

export function resolveTimeRange (
  selection: TimeRangeSelection,
  relativeStop: Date = new Date(),
): ResolvedTimeRange {
  const validationError = validateTimeRangeSelection(selection)
  if (validationError) {
    throw new RangeError(validationError)
  }

  let startDate: Date
  let stopDate: Date

  if (selection.mode === 'absolute') {
    startDate = parseAbsoluteDate(selection.start) as Date
    stopDate = parseAbsoluteDate(selection.stop) as Date
  } else {
    stopDate = new Date(relativeStop)
    startDate = subtractRelativeTime(stopDate, selection.value, selection.unit)
  }

  const startMs = startDate.getTime()
  const stopMs = stopDate.getTime()
  const durationMs = stopMs - startMs

  if (!Number.isFinite(startMs) || !Number.isFinite(stopMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError('Enter a time range within the supported date range.')
  }

  return {
    mode: selection.mode,
    start: startDate.toISOString(),
    stop: stopDate.toISOString(),
    startMs,
    stopMs,
    durationMs,
  }
}

export function findLatestTimestamp (datasets: TimeSeriesDataPoint[][]): Date | null {
  let latestTimestamp = Number.NEGATIVE_INFINITY

  for (const dataset of datasets) {
    for (const point of dataset) {
      const timestamp = new Date(point.time).getTime()
      if (Number.isFinite(timestamp) && timestamp > latestTimestamp) {
        latestTimestamp = timestamp
      }
    }
  }

  return Number.isFinite(latestTimestamp) ? new Date(latestTimestamp) : null
}

export function filterTimeSeriesData<T extends TimeSeriesDataPoint> (
  datasets: T[][],
  range: ResolvedTimeRange,
): T[][] {
  return datasets.map(dataset => dataset.filter(point => {
    const timestamp = new Date(point.time).getTime()
    return Number.isFinite(timestamp) && timestamp >= range.startMs && timestamp <= range.stopMs
  }))
}

export function interpolateFluxTimeRange (query: string, range: ResolvedTimeRange): string {
  const windowPeriodMs = Math.max(1, Math.round(range.durationMs / DESIRED_POINTS_PER_GRAPH))

  return query
    .replace(/\bv\.timeRangeStart\b/g, range.start)
    .replace(/\bv\.timeRangeStop\b/g, range.stop)
    .replace(/\bv\.windowPeriod\b/g, `${windowPeriodMs}ms`)
}

export function toApexTimeRange (range: ResolvedTimeRange | null): {
  range?: number
  min?: number
  max?: number
} {
  if (!range) {
    return { range: 60_000 }
  }

  return {
    range: undefined,
    min: range.startMs,
    max: range.stopMs,
  }
}

function parseAbsoluteDate (value: string): Date | null {
  const localMatch = LOCAL_DATE_TIME_PATTERN.exec(value)
  if (localMatch) {
    const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0', fractionText = '0'] = localMatch
    const year = Number(yearText)
    const month = Number(monthText) - 1
    const day = Number(dayText)
    const hour = Number(hourText)
    const minute = Number(minuteText)
    const second = Number(secondText)
    const millisecond = Number(fractionText.padEnd(3, '0'))
    const date = new Date(year, month, day, hour, minute, second, millisecond)

    if (
      date.getFullYear() !== year
      || date.getMonth() !== month
      || date.getDate() !== day
      || date.getHours() !== hour
      || date.getMinutes() !== minute
      || date.getSeconds() !== second
      || date.getMilliseconds() !== millisecond
    ) {
      return null
    }

    return date
  }

  const rfcMatch = RFC_3339_PATTERN.exec(value)
  if (!rfcMatch) {
    return null
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = rfcMatch
  if (!isValidDateTimeComponents(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
    Number(hourText),
    Number(minuteText),
    Number(secondText),
  )) {
    return null
  }

  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function isValidDateTimeComponents (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): boolean {
  return month >= 0
    && month <= 11
    && day >= 1
    && day <= daysInMonth(year, month)
    && hour >= 0
    && hour <= 23
    && minute >= 0
    && minute <= 59
    && second >= 0
    && second <= 59
}

function isFiniteOrderedRange (start: Date, stop: Date): boolean {
  const startMs = start.getTime()
  const stopMs = stop.getTime()
  return Number.isFinite(startMs) && Number.isFinite(stopMs) && startMs < stopMs
}

function subtractRelativeTime (stop: Date, value: number, unit: RelativeTimeUnit): Date {
  const start = new Date(stop)

  if (unit === 'months') {
    const originalDay = start.getDate()
    start.setDate(1)
    start.setMonth(start.getMonth() - value)
    start.setDate(Math.min(originalDay, daysInMonth(start.getFullYear(), start.getMonth())))
    return start
  }

  if (unit === 'years') {
    const originalMonth = start.getMonth()
    const originalDay = start.getDate()
    start.setDate(1)
    start.setFullYear(start.getFullYear() - value)
    start.setMonth(originalMonth)
    start.setDate(Math.min(originalDay, daysInMonth(start.getFullYear(), originalMonth)))
    return start
  }

  const unitMilliseconds = MILLISECONDS_PER_UNIT[unit]
  if (!unitMilliseconds) {
    throw new RangeError(`Unsupported relative time unit: ${unit}`)
  }

  return new Date(stop.getTime() - value * unitMilliseconds)
}

function daysInMonth (year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}
