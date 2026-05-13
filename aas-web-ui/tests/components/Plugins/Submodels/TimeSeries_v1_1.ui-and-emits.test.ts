import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TimeSeries from '@/components/Plugins/Submodels/TimeSeries_v1_1.vue'
import {
  createTimeSeriesSubmodelData,
  EXTERNAL_SEGMENT_SEMANTIC_ID,
  INTERNAL_SEGMENT_SEMANTIC_ID,
  LINKED_SEGMENT_SEMANTIC_ID,
} from './fixtures/timeseries-sample-data'

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
    getEnvInfluxdbToken: 'env-token',
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: dispatchSnackbarMock,
  }),
}))

function createWrapper (props?: Record<string, unknown>) {
  return mount(TimeSeries, {
    props: {
      submodelElementData: createTimeSeriesSubmodelData(),
      ...props,
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
        'LineChart': true,
        'AreaChart': true,
        'ScatterChart': true,
        'Histogram': true,
        'Gauge': true,
        'DisplayField': true,
      },
    },
  })
}

describe('TimeSeries_v1_1.vue UI and emits contract', () => {
  beforeEach(() => {
    fetchCdsMock.mockReset()
    getRequestMock.mockReset()
    postRequestMock.mockReset()
    dispatchSnackbarMock.mockReset()

    fetchCdsMock.mockResolvedValue(undefined)
    getRequestMock.mockResolvedValue({ success: true, data: '' })
    postRequestMock.mockResolvedValue({ success: true, data: '' })
  })

  it('initializes apiToken from env store and hides token input', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    expect(vm.apiToken).toBe('env-token')
    expect(vm.showTokenInput).toBe(false)
  })

  it('detects segment type from semantic ids', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = {
      semanticId: { keys: [{ value: INTERNAL_SEGMENT_SEMANTIC_ID }] },
    }
    expect(vm.segmentType).toBe('InternalSegment')

    vm.selectedSegment = {
      semanticId: { keys: [{ value: LINKED_SEGMENT_SEMANTIC_ID }] },
    }
    expect(vm.segmentType).toBe('LinkedSegment')

    vm.selectedSegment = {
      semanticId: { keys: [{ value: EXTERNAL_SEGMENT_SEMANTIC_ID }] },
    }
    expect(vm.segmentType).toBe('ExternalSegment')
  })

  it('resets chart options and emits new-options on chart type clear/update', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.chartOptions = { markerSize: 5 }
    vm.clearChartOptions({ id: 1, name: 'Line Chart' })

    expect(vm.chartOptions).toEqual({})
    expect(wrapper.emitted('new-options')).toBeTruthy()
    expect(wrapper.emitted('new-options')?.at(-1)?.[0]).toEqual({
      chartType: { id: 1, name: 'Line Chart' },
    })
  })

  it('emits chart options payload via getChartOptions', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.getChartOptions({ toolbar: { show: false } })

    expect(wrapper.emitted('new-options')).toBeTruthy()
    expect(wrapper.emitted('new-options')?.at(-1)?.[0]).toEqual({
      chartOptions: { toolbar: { show: false } },
    })
  })

  it('emits segment, time, and y-value payloads via helper emitters', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.emitSegment({ idShort: 'LinkedSegment' })
    vm.emitTimeValue({ idShort: 'time' })
    vm.emitYValue([{ idShort: 'AirQuality' }])

    const emitted = wrapper.emitted('new-options')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0][0]).toEqual({ segment: { idShort: 'LinkedSegment' } })
    expect(emitted?.[1][0]).toEqual({ timeVal: { idShort: 'time' } })
    expect(emitted?.[2][0]).toEqual({ yvals: [{ idShort: 'AirQuality' }] })
  })

  it('re-initializes data when loadTrigger prop changes', async () => {
    const wrapper = createWrapper({ loadTrigger: 0 })
    const vm = wrapper.vm as any

    expect(vm.segments).toHaveLength(3)

    await wrapper.setProps({
      submodelElementData: {},
      loadTrigger: 1,
    })

    expect(vm.timeSeriesData).toEqual({})
  })
})
