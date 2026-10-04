import { describe, expect, it } from 'vitest'
import { KIND_STYLES, kindFromCategories } from '@/components/Plugins/Submodels/ProductionCalendar/categories'

describe('kindFromCategories', () => {
  it.each([
    [['PRODUCTION'], 'production'],
    [['Shift'], 'production'],
    [['BREAK'], 'break'],
    [['Maintenance'], 'maintenance'],
    [['Holiday'], undefined],
    [[], undefined],
  ] as const)('%j -> %s', (categories, expected) => {
    expect(kindFromCategories([...categories])).toBe(expected)
  })

  it('has a style for every kind', () => {
    for (const kind of ['production', 'break', 'maintenance', 'other'] as const) {
      expect(KIND_STYLES[kind].kind).toBe(kind)
    }
  })
})
