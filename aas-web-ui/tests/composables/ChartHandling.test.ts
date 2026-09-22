import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChartHandling } from '@/composables/ChartHandling'

const { unitSuffixMock } = vi.hoisted(() => ({
  unitSuffixMock: vi.fn(),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({
    unitSuffix: unitSuffixMock,
  }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (element: any) => element.idShort,
  }),
}))

describe('useChartHandling', () => {
  beforeEach(() => {
    unitSuffixMock.mockReset()
    unitSuffixMock.mockImplementation((element: any) => element.unit || '')
  })

  it('creates synchronous tooltip formatters with the matching series units', () => {
    const { prepareYValueTooltip } = useChartHandling()
    const tooltips = prepareYValueTooltip([[], []], [
      { idShort: 'Temperature', unit: '°C' },
      { idShort: 'Ratio' },
    ])

    expect(tooltips[0]).not.toBeInstanceOf(Promise)
    expect(tooltips[0].formatter('21.50')).toBe('21.50 °C')
    expect(tooltips[1].formatter('0.75')).toBe('0.75')
  })
})
