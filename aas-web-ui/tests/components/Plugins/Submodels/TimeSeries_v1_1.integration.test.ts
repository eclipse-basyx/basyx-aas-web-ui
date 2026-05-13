import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TimeSeries from '@/components/Plugins/Submodels/TimeSeries_v1_1.vue'
import { INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE } from './fixtures/influxdb-samples'
import { createTimeSeriesSubmodelData } from './fixtures/timeseries-sample-data'

const fetchCdsMock = vi.fn()
const getRequestMock = vi.fn()
const postRequestMock = vi.fn()
const dispatchSnackbarMock = vi.fn()

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({
    fetchCds: fetchCdsMock,
  }),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({
    valueUrl: () => ({ url: '/attachment.csv' }),
  }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    checkIdShort: (smc: any, idShort: string) => smc?.idShort === idShort,
    descriptionToDisplay: () => '',
    nameToDisplay: () => 'Time Series Data',
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: getRequestMock,
    postRequest: postRequestMock,
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getEnvInfluxdbToken: '',
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: dispatchSnackbarMock,
  }),
}))

function createWrapper () {
  return mount(TimeSeries, {
    props: {
      submodelElementData: createTimeSeriesSubmodelData(),
    },
    global: {
      stubs: {
        'v-container': true,
        'v-card': true,
        'v-card-title': true,
        'v-card-text': true,
        'v-list': true,
        'v-list-item': true,
        'v-divider': true,
        'v-select': true,
        'v-row': true,
        'v-col': true,
        'v-text-field': true,
        'v-btn': true,
        LineChart: true,
        AreaChart: true,
        ScatterChart: true,
        Histogram: true,
        Gauge: true,
        DisplayField: true,
      },
    },
  })
}

describe('TimeSeries_v1_1.vue integration-style flows', () => {
  beforeEach(() => {
    fetchCdsMock.mockReset()
    getRequestMock.mockReset()
    postRequestMock.mockReset()
    dispatchSnackbarMock.mockReset()

    fetchCdsMock.mockResolvedValue(undefined)
    getRequestMock.mockResolvedValue({ success: true, data: '' })
    postRequestMock.mockResolvedValue({ success: true, data: INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE })
  })

  it('runs full linked flow and fills chart data for selected y variable', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const linkedSegment = vm.segments.find((segment: any) => segment.idShort === 'LinkedSegment')

    vm.selectedSegment = linkedSegment
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.apiToken = 'integration-token'

    vm.fetchLinkedData()
    await Promise.resolve()

    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toHaveLength(2)
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
  })

  it('runs full external flow and parses CSV into chart data', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: [
        'time,AirQuality',
        '2026-05-13T19:15:53.340582794Z,398.98591876151926',
        '2026-05-13T19:15:54.345702712Z,264.02277354502803',
      ].join('\n'),
      raw: {
        headers: new Headers({ 'Content-Type': 'text/csv' }),
        redirected: false,
      },
    })

    const externalSegment = vm.segments.find((segment: any) => segment.idShort === 'ExternalSegment')

    vm.selectedSegment = externalSegment
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(getRequestMock).toHaveBeenCalledTimes(1)
    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toHaveLength(2)
  })

  it('runs full internal flow and emits chart options update', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const internalSegment = vm.segments.find((segment: any) => segment.idShort === 'InternalSegment')

    vm.selectedSegment = internalSegment
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchInternalData()
    vm.getChartOptions({ xaxis: { type: 'datetime' } })

    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(wrapper.emitted('new-options')).toBeTruthy()
    expect(wrapper.emitted('new-options')?.at(-1)?.[0]).toEqual({
      chartOptions: { xaxis: { type: 'datetime' } },
    })
  })
})
