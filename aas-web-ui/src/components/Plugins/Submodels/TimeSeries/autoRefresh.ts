export type AutoRefreshUnit = 'seconds' | 'minutes' | 'hours'

export type AutoRefreshSelection = {
  enabled: boolean
  value: number
  unit: AutoRefreshUnit
}

export const DEFAULT_AUTO_REFRESH: AutoRefreshSelection = {
  enabled: false,
  value: 30,
  unit: 'seconds',
}

const MILLISECONDS_PER_UNIT: Record<AutoRefreshUnit, number> = {
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
}

const MAX_TIMER_INTERVAL_MS = 2_147_483_647

export function cloneAutoRefreshSelection (selection: AutoRefreshSelection): AutoRefreshSelection {
  return { ...selection }
}

export function validateAutoRefreshSelection (selection: unknown): string | null {
  if (!isAutoRefreshSelection(selection)) {
    return 'Enter a valid auto-refresh interval.'
  }

  if (!selection.enabled) {
    return null
  }

  if (!Number.isFinite(selection.value) || selection.value <= 0) {
    return 'Enter an auto-refresh interval greater than zero.'
  }

  const intervalMs = selection.value * MILLISECONDS_PER_UNIT[selection.unit]
  if (!Number.isFinite(intervalMs) || intervalMs < 1000 || intervalMs > MAX_TIMER_INTERVAL_MS) {
    return 'Use an auto-refresh interval between 1 second and 24 days.'
  }

  return null
}

export function autoRefreshIntervalMs (selection: AutoRefreshSelection): number {
  const validationError = validateAutoRefreshSelection(selection)
  if (validationError) {
    throw new RangeError(validationError)
  }

  return selection.value * MILLISECONDS_PER_UNIT[selection.unit]
}

export function isAutoRefreshSelection (selection: unknown): selection is AutoRefreshSelection {
  if (!selection || typeof selection !== 'object') {
    return false
  }

  const candidate = selection as Partial<AutoRefreshSelection>
  return typeof candidate.enabled === 'boolean'
    && typeof candidate.value === 'number'
    && ['seconds', 'minutes', 'hours'].includes(candidate.unit || '')
}
