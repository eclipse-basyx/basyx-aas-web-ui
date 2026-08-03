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

export function cloneTimeRangeSelection (selection: TimeRangeSelection): TimeRangeSelection {
  return { ...selection }
}

export function validateTimeRangeSelection (selection: TimeRangeSelection): string | null {
  if (selection.mode === 'relative') {
    if (!Number.isFinite(selection.value) || selection.value <= 0) {
      return 'Enter a time range greater than zero.'
    }

    if ((selection.unit === 'months' || selection.unit === 'years') && !Number.isInteger(selection.value)) {
      return 'Months and years must be whole numbers.'
    }

    return null
  }

  if (!selection.start || !selection.stop) {
    return 'Enter both a start and an end date.'
  }

  const startMs = new Date(selection.start).getTime()
  const stopMs = new Date(selection.stop).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(stopMs)) {
    return 'Enter valid start and end dates.'
  }

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
    startDate = new Date(selection.start)
    stopDate = new Date(selection.stop)
  } else {
    stopDate = new Date(relativeStop)
    startDate = subtractRelativeTime(stopDate, selection.value, selection.unit)
  }

  const startMs = startDate.getTime()
  const stopMs = stopDate.getTime()
  const durationMs = stopMs - startMs

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
  const timestamps = datasets
    .flat()
    .map(point => new Date(point.time).getTime())
    .filter(timestamp => Number.isFinite(timestamp))

  if (timestamps.length === 0) {
    return null
  }

  return new Date(Math.max(...timestamps))
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

  if (range.mode === 'absolute') {
    return {
      range: undefined,
      min: range.startMs,
      max: range.stopMs,
    }
  }

  return {
    range: range.durationMs,
    min: undefined,
    max: undefined,
  }
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
