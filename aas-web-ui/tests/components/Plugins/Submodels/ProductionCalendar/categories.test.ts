import { describe, expect, it } from 'vitest'
import { KIND_STYLES, resolveKind } from '@/components/Plugins/Submodels/ProductionCalendar/categories'

describe('resolveKind', () => {
  it.each([
    [['PRODUCTION'], [], 'production'],
    [['Shift'], [], 'production'],
    [['BREAK'], [], 'break'],
    [['Maintenance'], [], 'maintenance'],
    [[], ['X-BREAK'], 'break'],
    [[], ['X-MAINTENANCE'], 'maintenance'],
    [[], ['X-PRODUCTION-DAY'], 'production'],
    [['BREAK'], ['X-PRODUCTION-DAY'], 'break'],
    [['Holiday'], [], 'other'],
    [[], [], 'other'],
  ] as const)('%j + %j -> %s', (categories, xProperties, expected) => {
    expect(resolveKind([...categories], [...xProperties])).toBe(expected)
  })

  it('has a style for every kind', () => {
    for (const kind of ['production', 'break', 'maintenance', 'other'] as const) {
      expect(KIND_STYLES[kind].kind).toBe(kind)
    }
  })
})
