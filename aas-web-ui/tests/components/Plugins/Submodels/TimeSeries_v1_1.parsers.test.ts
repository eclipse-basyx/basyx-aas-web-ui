import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TimeSeries from '@/components/Plugins/Submodels/TimeSeries_v1_1.vue'
import {
  INFLUX_LINKED_AIR_QUALITY_MULTI_TABLE,
  INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE,
} from './fixtures/influxdb-samples'
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
    getEnvInfluxdbToken: 'token-from-env',
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

describe('TimeSeries_v1_1.vue parser and linked fetch behavior', () => {
  beforeEach(() => {
    fetchCdsMock.mockReset()
    getRequestMock.mockReset()
    postRequestMock.mockReset()
    dispatchSnackbarMock.mockReset()

    fetchCdsMock.mockResolvedValue(undefined)
    getRequestMock.mockResolvedValue({ success: true, data: '' })
    postRequestMock.mockResolvedValue({ success: true, data: INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE })
  })

  it('parses plain CSV headers and trims CRLF headers', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const result = vm.parseCSV(' time,AirQuality\r\n2026-01-01T00:00:00Z,398.9\r\n')

    expect(result.headers).toEqual(['time', 'AirQuality'])
    expect(result.data).toEqual([['2026-01-01T00:00:00Z', '398.9']])
  })

  it('keeps parsing linked Influx CSV after header row and preserves first row per table', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.convertInfluxCSVtoArray(INFLUX_LINKED_AIR_QUALITY_MULTI_TABLE)

    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toHaveLength(4)
    expect(vm.timeSeriesValues[0][0].time).toBe('2026-05-13T19:15:53.340582794Z')
    expect(vm.timeSeriesValues[0][0].value).toBeCloseTo(398.98591876151926)
  })

  it('warns when selected y-variable is not present in linked data keys', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.yVariables = [{ idShort: 'rpm' }]
    vm.convertInfluxCSVtoArray(INFLUX_LINKED_AIR_QUALITY_SINGLE_TABLE)

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('y-values "rpm" not available in LinkedSegment Data!')
    expect(vm.timeSeriesValues).toEqual([])
  })

  it('builds linked request with token header and replaced y-value placeholder', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'LinkedSegment')
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.apiToken = 'test-token'

    vm.fetchLinkedData()
    await Promise.resolve()

    expect(postRequestMock).toHaveBeenCalledTimes(1)

    const [path, query, headers, context, disableMessage, allowRaw] = postRequestMock.mock.calls[0]
    expect(path).toBe('http://localhost:8086/api/v2/query?org=basyx')
    expect(query).toContain('AirQuality')
    expect(query).not.toContain('{{y-value}}')
    expect(headers.get('Authorization')).toBe('Token test-token')
    expect(headers.get('Accept')).toBe('application/csv')
    expect(headers.get('Content-Type')).toBe('application/vnd.flux')
    expect(context).toBe('fetching data from Time Series Database')
    expect(disableMessage).toBe(false)
    expect(allowRaw).toBe(true)
  })

  it('returns early and warns when linked fetch is triggered without selected segment', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vm.selectedSegment = null
    vm.fetchLinkedData()

    expect(postRequestMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith('No Segment selected')

    warnSpy.mockRestore()
  })

  it('handles pre-header/short lines and maps non-value _field directly', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const csv = [
      '#datatype,string,long,dateTime:RFC3339,dateTime:RFC3339,dateTime:RFC3339,double,string,string,string,string',
      ',result,table,_start,_stop,_time,_value,_field,_measurement,host,topic',
      ',_result,0,2026-05-13T19:09:21.938241085Z,2026-05-13T19:19:21.938241085Z,2026-05-13T19:15:53.340582794Z,123.4,pressure,machine_metric,basyx_host,Machine/Pressure',
    ].join('\n')

    vm.yVariables = [{ idShort: 'pressure' }]
    vm.convertInfluxCSVtoArray(csv)

    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toEqual([
      { time: '2026-05-13T19:15:53.340582794Z', value: 123.4 },
    ])
  })

  it('returns null key for missing required indices and empty dataset lines', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const missingValueIndex = vm.finalizeDataset(',result,table,_time,_field,topic', [
      ',_result,0,2026-05-13T19:15:53.340582794Z,value,EnvironmentalSensor/AirQuality',
    ])
    expect(missingValueIndex).toEqual({ key: null, series: [] })

    const emptyDataset = vm.finalizeDataset(',result,table,_time,_value,_field,topic', [])
    expect(emptyDataset).toEqual({ key: null, series: [] })
  })

  it('returns null key when _field is empty and topic is unavailable', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    const finalized = vm.finalizeDataset(',result,table,_time,_value,_field', [
      ',_result,0,2026-05-13T19:15:53.340582794Z,42.1,',
    ])

    expect(finalized.key).toBeNull()
    expect(finalized.series).toEqual([
      { time: '2026-05-13T19:15:53.340582794Z', value: 42.1 },
    ])
  })
})
