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
    resetSeries: ReturnType<typeof vi.fn>
    updateOptions: ReturnType<typeof vi.fn>
    updateSeries: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('apexcharts', () => ({
  default: class ApexChartsMock {
    options: any
    render = vi.fn()
    destroy = vi.fn()
    resetSeries = vi.fn()
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
        viewportResetKey: 'range-a',
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
    expect(instance.options.chart).toMatchObject({
      selection: { enabled: true, type: 'x' },
      toolbar: {
        show: true,
        autoSelected: 'zoom',
        tools: {
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
        allowMouseWheelZoom: false,
      },
    })

    const relativeRange = resolveTimeRange(
      { mode: 'relative', value: 15, unit: 'minutes' },
      new Date('2026-05-13T19:00:00.000Z'),
    )
    await wrapper.setProps({ timeRange: relativeRange })

    expect(instance.resetSeries).toHaveBeenCalledWith(false, true)
    expect(instance.updateOptions).toHaveBeenCalledWith({
      xaxis: {
        range: undefined,
        min: relativeRange.startMs,
        max: relativeRange.stopMs,
      },
    })

    instance.options.chart.events.zoomed()
    const autoRefreshedRange = resolveTimeRange(
      { mode: 'relative', value: 15, unit: 'minutes' },
      new Date('2026-05-13T19:01:00.000Z'),
    )
    const updateCountWhileZoomed = instance.updateOptions.mock.calls.length
    await wrapper.setProps({ timeRange: autoRefreshedRange })

    expect(instance.updateOptions).toHaveBeenCalledTimes(updateCountWhileZoomed)

    await wrapper.setProps({
      timeRange: autoRefreshedRange,
      viewportResetKey: 'range-b',
    })
    expect(instance.updateOptions).toHaveBeenLastCalledWith({
      xaxis: {
        range: undefined,
        min: autoRefreshedRange.startMs,
        max: autoRefreshedRange.stopMs,
      },
    })
  })

  it.each(charts)('keeps temporal controls when %s receives legacy chart options', async (_name, component) => {
    mount(component, {
      props: {
        chartData: [[{ time: '2026-05-13T18:30:00.000Z', value: 1 }]],
        chartOptionsExternal: {
          chart: {
            background: '#123456',
            toolbar: { tools: { download: false } },
            zoom: { enabled: false },
          },
        },
        timeRange: resolveTimeRange({
          mode: 'absolute',
          start: '2026-05-13T18:00:00.000Z',
          stop: '2026-05-13T19:00:00.000Z',
        }),
        timeVariable: { idShort: 'time' },
        viewportResetKey: 'range-a',
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

    const chart = apexInstances[0].options.chart
    expect(chart.background).toBe('#123456')
    expect(chart.events.beforeResetZoom).toEqual(expect.any(Function))
    expect(chart.events.scrolled).toEqual(expect.any(Function))
    expect(chart.events.zoomed).toEqual(expect.any(Function))
    expect(chart.selection).toMatchObject({ enabled: true, type: 'x' })
    expect(chart.toolbar).toMatchObject({
      show: true,
      autoSelected: 'zoom',
      tools: {
        download: false,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    })
    expect(chart.zoom).toMatchObject({
      enabled: true,
      type: 'x',
      autoScaleYaxis: true,
      allowMouseWheelZoom: false,
    })
  })
})
