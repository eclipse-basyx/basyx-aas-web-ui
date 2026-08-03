import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resolveTimeRange } from '@/components/Plugins/Submodels/TimeSeries/timeRange'
import AreaChart from '@/components/Widgets/AreaChart.vue'
import LineChart from '@/components/Widgets/LineChart.vue'
import ScatterChart from '@/components/Widgets/ScatterChart.vue'

const { apexInstances } = vi.hoisted(() => ({
  apexInstances: [] as Array<{
    options: any
    render: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    updateOptions: ReturnType<typeof vi.fn>
    updateSeries: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('apexcharts', () => ({
  default: class ApexChartsMock {
    options: any
    render = vi.fn()
    destroy = vi.fn()
    updateOptions = vi.fn()
    updateSeries = vi.fn()

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

vi.mock('@/composables/ChartHandling', () => ({
  useChartHandling: () => ({
    prepareSeriesValues: () => [],
    prepareYValueTooltip: () => [],
    prepareLegend: () => ({}),
  }),
}))

const charts = [
  ['LineChart', LineChart],
  ['AreaChart', AreaChart],
  ['ScatterChart', ScatterChart],
] as const

describe('temporal chart time ranges', () => {
  beforeEach(() => {
    apexInstances.length = 0
  })

  it.each(charts)('applies absolute and reactive relative ranges in %s', async (_name, component) => {
    const absoluteRange = resolveTimeRange({
      mode: 'absolute',
      start: '2026-05-13T18:00:00.000Z',
      stop: '2026-05-13T19:00:00.000Z',
    })
    const wrapper = mount(component, {
      props: {
        chartData: [[{ time: '2026-05-13T18:30:00.000Z', value: 1 }]],
        chartOptionsExternal: null,
        timeRange: absoluteRange,
        timeVariable: { idShort: 'time' },
        yVariables: [{ idShort: 'value' }],
      },
      global: {
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-list': true,
          'v-list-item': true,
          'v-row': true,
          'v-col': true,
          'v-select': true,
        },
      },
    })
    await nextTick()

    const instance = apexInstances[0]
    expect(instance.options.xaxis).toMatchObject({
      min: absoluteRange.startMs,
      max: absoluteRange.stopMs,
    })

    const relativeRange = resolveTimeRange(
      { mode: 'relative', value: 15, unit: 'minutes' },
      new Date('2026-05-13T19:00:00.000Z'),
    )
    await wrapper.setProps({ timeRange: relativeRange })

    expect(instance.updateOptions).toHaveBeenCalledWith({
      xaxis: {
        range: 900_000,
        min: undefined,
        max: undefined,
      },
    })
  })
})
