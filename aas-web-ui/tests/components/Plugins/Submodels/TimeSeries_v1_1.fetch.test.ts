import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TimeSeries from '@/components/Plugins/Submodels/TimeSeries_v1_1.vue'
import { createTimeSeriesSubmodelData } from './fixtures/timeseries-sample-data'

const {
  fetchCdsMock,
  getRequestMock,
  postRequestMock,
  dispatchSnackbarMock,
} = vi.hoisted(() => ({
  fetchCdsMock: vi.fn(),
  getRequestMock: vi.fn(),
  postRequestMock: vi.fn(),
  dispatchSnackbarMock: vi.fn(),
}))

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
        'v-empty-state': true,
        'AutoRefreshSelector': true,
        'TimeRangeSelector': true,
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

function deferred<T> () {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('TimeSeries_v1_1.vue fetch behavior', () => {
  beforeEach(() => {
    fetchCdsMock.mockReset()
    getRequestMock.mockReset()
    postRequestMock.mockReset()
    dispatchSnackbarMock.mockReset()

    fetchCdsMock.mockResolvedValue(undefined)
    getRequestMock.mockResolvedValue({ success: true, data: '' })
    postRequestMock.mockResolvedValue({ success: true, data: '' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('extracts InternalSegment values into chart datasets', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'InternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchInternalData()

    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toHaveLength(2)
    expect(vm.timeSeriesValues[0][0]).toEqual({
      time: '2026-05-13T19:15:53.340582794Z',
      value: '398.98',
    })
  })

  it('returns early for InternalSegment fetch when mandatory selections are missing', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = null
    vm.timeVariable = null
    vm.yVariables = []
    vm.timeSeriesValues = [{ time: 'existing', value: '1' }]

    vm.fetchInternalData()

    expect(vm.timeSeriesValues).toEqual([{ time: 'existing', value: '1' }])
  })

  it('anchors a relative InternalSegment range to the latest record', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'InternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.timeRangeSelection = { mode: 'relative', value: 500, unit: 'milliseconds' }

    vm.fetchInternalData()

    expect(vm.timeSeriesValues).toEqual([[
      {
        time: '2026-05-13T19:15:54.345702712Z',
        value: '264.02',
      },
    ]])
    expect(vm.resolvedTimeRange.stop).toBe('2026-05-13T19:15:54.345Z')
  })

  it('commits an empty absolute range and emits its selection', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'InternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.timeRangeSelection = {
      mode: 'absolute',
      start: '2026-05-14T00:00:00.000Z',
      stop: '2026-05-14T01:00:00.000Z',
    }

    vm.fetchInternalData()

    expect(vm.hasFetched).toBe(true)
    expect(vm.hasTimeSeriesValues).toBe(false)
    expect(vm.timeSeriesValues).toEqual([[]])
    expect(wrapper.emitted('new-options')?.at(-1)?.[0]).toEqual({
      timeRange: vm.timeRangeSelection,
    })
  })

  it('warns for HTML payload on ExternalSegment fetch', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: '<html>sign-in</html>',
      raw: {
        headers: new Headers({ 'Content-Type': 'text/html' }),
        redirected: true,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Received HTML instead of CSV')
  })

  it('warns for empty attachment payload on ExternalSegment fetch', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: '',
      raw: {
        headers: new Headers({
          'Content-Type': 'text/csv',
          'Content-Length': '0',
        }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.timeSeriesValues = [[{ time: '2026-05-13T19:15:00Z', value: 100 }]]
    vm.hasFetched = true

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Content-Length: 0')
    expect(vm.timeSeriesValues).toEqual([[]])
    expect(vm.hasTimeSeriesValues).toBe(false)
  })

  it('ignores an older ExternalSegment response and preserves each click-time range', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any
    const firstRequest = deferred<any>()
    const secondRequest = deferred<any>()

    getRequestMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.timeRangeSelection = {
      mode: 'absolute',
      start: '2026-05-13T19:00:00.000Z',
      stop: '2026-05-13T20:00:00.000Z',
    }
    vm.fetchExternalData()

    vm.timeRangeSelection = {
      mode: 'absolute',
      start: '2026-05-13T20:00:00.000Z',
      stop: '2026-05-13T21:00:00.000Z',
    }
    vm.fetchExternalData()

    secondRequest.resolve({
      success: true,
      data: 'time,AirQuality\n2026-05-13T20:15:00.000Z,2',
      raw: { headers: new Headers({ 'Content-Type': 'text/csv' }), redirected: false },
    })
    await vi.waitFor(() => expect(vm.timeSeriesValues[0]?.[0]?.value).toBe(2))

    firstRequest.resolve({
      success: true,
      data: 'time,AirQuality\n2026-05-13T19:15:00.000Z,1',
      raw: { headers: new Headers({ 'Content-Type': 'text/csv' }), redirected: false },
    })
    await Promise.resolve()

    expect(vm.timeSeriesValues[0][0].value).toBe(2)
    expect(wrapper.emitted('new-options')?.at(-1)?.[0]).toEqual({
      timeRange: {
        mode: 'absolute',
        start: '2026-05-13T20:00:00.000Z',
        stop: '2026-05-13T21:00:00.000Z',
      },
    })
  })

  it('does not commit a Blob after its ExternalSegment request is invalidated', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any
    const blobText = deferred<string>()
    const responseBlob = new Blob([])
    const textSpy = vi.spyOn(responseBlob, 'text').mockReturnValue(blobText.promise)

    getRequestMock.mockResolvedValue({
      success: true,
      data: responseBlob,
      raw: { headers: new Headers({ 'Content-Type': 'text/csv' }), redirected: false },
    })
    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.timeSeriesValues = [[{ time: '2026-05-13T19:10:00.000Z', value: 99 }]]

    vm.fetchExternalData()
    await vi.waitFor(() => expect(textSpy).toHaveBeenCalledOnce())

    vm.yVariables = [{ idShort: 'Temperature' }]
    blobText.resolve('time,AirQuality\n2026-05-13T19:15:00.000Z,1')
    await blobText.promise
    await Promise.resolve()

    expect(vm.timeSeriesValues).toEqual([[
      { time: '2026-05-13T19:10:00.000Z', value: 99 },
    ]])
  })

  it('skips auto-refresh ticks while an asynchronous fetch is running', async () => {
    vi.useFakeTimers()
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    postRequestMock.mockImplementation(() => new Promise(() => {}))
    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'LinkedSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.autoRefreshSelection = { enabled: true, value: 1, unit: 'seconds' }
    await nextTick()

    await vi.advanceTimersByTimeAsync(1000)
    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(vm.isFetching).toBe(true)

    await vi.advanceTimersByTimeAsync(3000)
    expect(postRequestMock).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    vi.useRealTimers()
  })

  it('stops auto refresh when the component unmounts', async () => {
    vi.useFakeTimers()
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'LinkedSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]
    vm.autoRefreshSelection = { enabled: true, value: 1, unit: 'seconds' }
    await nextTick()

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(3000)

    expect(postRequestMock).not.toHaveBeenCalled()
  })

  it('converts ExternalSegment CSV payload into chart datasets', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: 'time,AirQuality\n2026-05-13T19:15:53.340582794Z,398.98591876151926\n',
      raw: {
        headers: new Headers({ 'Content-Type': 'text/csv' }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(vm.timeSeriesValues).toHaveLength(1)
    expect(vm.timeSeriesValues[0]).toEqual([
      {
        time: '2026-05-13T19:15:53.340582794Z',
        value: Number.parseFloat('398.98591876151926'),
      },
    ])
  })

  it('builds attachment path from absolute Data value when File URL is unavailable', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = {
      idShort: 'ExternalSegment',
      value: [
        {
          idShort: 'Data',
          modelType: 'Blob',
          value: '/external.csv',
        },
      ],
    }
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    getRequestMock.mockResolvedValue({ success: false })

    vm.fetchExternalData()
    await Promise.resolve()

    expect(getRequestMock).toHaveBeenCalledTimes(1)
    expect(getRequestMock.mock.calls[0][0]).toBe('/submodels/time-series/submodel-elements/Segments.ExternalSegment.Data/attachment')
  })

  it('warns when redirected response is not CSV or plain text', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: 'redirected payload',
      raw: {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        redirected: true,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Request was redirected and did not return CSV/Text payload')
  })

  it('warns when no valid external file path is available', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedSegment = {
      idShort: 'ExternalSegment',
      value: [
        {
          idShort: 'Data',
          modelType: 'Blob',
          value: '',
        },
      ],
    }
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()

    expect(getRequestMock).not.toHaveBeenCalled()
    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('No valid file path available for ExternalSegment Data')
  })

  it('does not replace request-handler details when an external request fails', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({ success: false })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
  })

  it('warns when time column is missing in external CSV', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: 'timestamp,AirQuality\n2026-05-13T19:15:53.340582794Z,398.98591876151926\n',
      raw: {
        headers: new Headers({ 'Content-Type': 'text/csv' }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('time-value time not available in ExternalSegment Data')
  })

  it('warns when y-value column is missing in external CSV', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: 'time,temperature\n2026-05-13T19:15:53.340582794Z,21.1\n',
      raw: {
        headers: new Headers({ 'Content-Type': 'text/csv' }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('y-value AirQuality not available in ExternalSegment Data')
    expect(vm.timeSeriesValues).toEqual([[]])
  })

  it('handles Blob external CSV payload', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    await vm.convertPlainCSVtoArray(new Blob([
      'time,AirQuality\n2026-05-13T19:15:53.340582794Z,398.98\n',
    ], { type: 'text/csv' }))

    expect(vm.timeSeriesValues).toEqual([
      [{ time: '2026-05-13T19:15:53.340582794Z', value: 398.98 }],
    ])
  })

  it('warns when external payload has empty CSV body', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: ' '.repeat(3),
      raw: {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('No CSV data available in ExternalSegment response')
  })

  it('warns when external response body is HTML despite text payload header', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({
      success: true,
      data: '<html><body>login</body></html>',
      raw: {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        redirected: false,
      },
    })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Received HTML response instead of CSV')
  })
})
