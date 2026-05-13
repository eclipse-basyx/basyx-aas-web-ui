import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TimeSeries from '@/components/Plugins/Submodels/TimeSeries_v1_1.vue'
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

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Content-Length: 0')
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

  it('warns when external request fails', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    getRequestMock.mockResolvedValue({ success: false })

    vm.selectedSegment = createTimeSeriesSubmodelData().submodelElements[0].value.find((segment: any) => segment.idShort === 'ExternalSegment')
    vm.timeVariable = { idShort: 'time' }
    vm.yVariables = [{ idShort: 'AirQuality' }]

    vm.fetchExternalData()
    await Promise.resolve()

    expect(dispatchSnackbarMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock.mock.calls[0][0].text).toContain('Fetching ExternalSegment data failed')
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
    expect(vm.timeSeriesValues).toEqual([])
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
      data: '   ',
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
