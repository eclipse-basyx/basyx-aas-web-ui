import { describe, expect, it } from 'vitest'
import {
  autoRefreshIntervalMs,
  validateAutoRefreshSelection,
} from '@/components/Plugins/Submodels/TimeSeries/autoRefresh'

describe('auto refresh utilities', () => {
  it('converts supported intervals to milliseconds', () => {
    expect(autoRefreshIntervalMs({ enabled: true, value: 5, unit: 'seconds' })).toBe(5000)
    expect(autoRefreshIntervalMs({ enabled: true, value: 2, unit: 'minutes' })).toBe(120_000)
    expect(autoRefreshIntervalMs({ enabled: true, value: 1, unit: 'hours' })).toBe(3_600_000)
  })

  it('allows a disabled default without scheduling it', () => {
    expect(validateAutoRefreshSelection({ enabled: false, value: 30, unit: 'seconds' })).toBeNull()
  })

  it.each([
    undefined,
    { enabled: true, value: 0, unit: 'seconds' },
    { enabled: true, value: -1, unit: 'minutes' },
    { enabled: true, value: 500, unit: 'milliseconds' },
    { enabled: true, value: Number.POSITIVE_INFINITY, unit: 'hours' },
  ])('rejects invalid interval %#', selection => {
    expect(validateAutoRefreshSelection(selection)).not.toBeNull()
  })

  it('rejects intervals outside the JavaScript timer limit', () => {
    const selection = { enabled: true, value: 600, unit: 'hours' } as const
    expect(validateAutoRefreshSelection(selection)).toContain('24 days')
    expect(() => autoRefreshIntervalMs(selection)).toThrow(RangeError)
  })
})
