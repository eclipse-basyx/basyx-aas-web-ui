import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import DisplayField from '@/components/Widgets/DisplayField.vue'
import Gauge from '@/components/Widgets/Gauge.vue'

const { apexInstances } = vi.hoisted(() => ({
  apexInstances: [] as Array<{
    options: any
    render: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    updateOptions: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('apexcharts', () => ({
  default: class ApexChartsMock {
    options: any
    render = vi.fn()
    destroy = vi.fn()
    updateOptions = vi.fn()

    constructor (_element: HTMLElement, options: any) {
      this.options = options
      apexInstances.push(this)
    }
  },
}))

vi.mock('vuetify', () => ({
  useTheme: () => ({
    global: {
      current: { value: { dark: false } },
    },
  }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({
    unitSuffix: (element: any) => element?.unit || '',
  }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (element: any) => element?.idShort || 'Value',
  }),
}))

const slotStubs = {
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card-subtitle': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
}

describe('Gauge', () => {
  beforeEach(() => {
    apexInstances.length = 0
  })

  it('skips empty series and keeps every remaining label, value, and unit visible', async () => {
    const wrapper = mount(Gauge, {
      props: {
        chartData: [
          [],
          [{ time: '2026-01-01T00:00:00Z', value: '12.345' }],
          [],
          [{ time: '2026-01-01T00:00:00Z', value: 'not-a-number' }],
          [{ time: '2026-01-01T00:00:00Z', value: '0' }],
        ],
        chartOptionsExternal: null,
        timeVariable: { idShort: 'time' },
        yVariables: [
          { idShort: 'Empty' },
          { idShort: 'Pressure', unit: 'bar' },
          { idShort: 'AlsoEmpty' },
          { idShort: 'Invalid' },
          { idShort: 'Voltage', unit: 'V' },
        ],
      },
      global: { stubs: slotStubs },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Pressure')
    expect(wrapper.text()).toContain('Voltage')
    expect(wrapper.text()).not.toContain('AlsoEmpty')
    expect(wrapper.findAll('[role="group"]').map(element => element.attributes('aria-label'))).toEqual([
      'Pressure: 12.35 bar',
      'Voltage: 0.00 V',
    ])
    expect(apexInstances).toHaveLength(2)
    expect(apexInstances.map(instance => instance.options.series)).toEqual([[12.345], [0]])
    expect(apexInstances.map(instance => instance.options.labels)).toEqual([['Pressure'], ['Voltage']])
  })
})

describe('DisplayField', () => {
  it('formats integer and fractional numeric values with exactly two decimals', async () => {
    const wrapper = mount(DisplayField, {
      props: {
        chartData: [
          [{ time: '2026-01-01T00:00:00Z', value: 12 }],
          [{ time: '2026-01-01T00:00:00Z', value: '12.345' }],
          [{ time: '2026-01-01T00:00:00Z', value: 'active' }],
        ],
        yVariables: [
          { idShort: 'Count', unit: 'pcs' },
          { idShort: 'Temperature', unit: '°C' },
          { idShort: 'State' },
        ] as any,
      },
      global: { stubs: slotStubs },
    })
    await nextTick()

    expect(wrapper.text()).toContain('12.00')
    expect(wrapper.text()).toContain('12.35')
    expect(wrapper.text()).toContain('active')
  })
})
