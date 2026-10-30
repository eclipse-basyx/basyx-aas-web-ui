import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductionCalendar from '@/components/Plugins/Submodels/ProductionCalendar_v1_0.vue'
import line01 from './fixtures/production-calendar-line01.ics?raw'

const { fetchFileTextMock, setDataMock } = vi.hoisted(() => ({
  fetchFileTextMock: vi.fn(),
  setDataMock: vi.fn(),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    checkIdShort: (sme: any, idShort: string) => sme?.idShort === idShort,
    nameToDisplay: (_sme: any, _lang: string, fallback: string) => fallback,
  }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ setData: setDataMock }),
}))

vi.mock('@/components/Plugins/Submodels/ProductionCalendar/composables/useFileText', () => ({
  useFileText: () => ({ fetchFileText: fetchFileTextMock }),
}))

const slotStub = { template: '<div><slot /></div>' }

const globalStubs = {
  'v-container': slotStub,
  'v-card': slotStub,
  'v-alert': slotStub,
  'v-chip': slotStub,
  'v-icon': true,
  'v-divider': true,
  'v-spacer': true,
  'v-skeleton-loader': { template: '<div data-test="loading" />' },
  'LastSync': { props: ['timestamp'], template: '<div data-test="last-sync">{{ timestamp }}</div>' },
  'CalendarView': { props: ['calendar'], template: '<div data-test="calendar-view">{{ calendar.name }}</div>' },
  'VariableSpecifications': {
    props: ['specifications', 'xProperties'],
    template: '<div data-test="specs">{{ specifications.map(s => s.name).join(",") }}|{{ xProperties.join(",") }}</div>',
  },
}

function createSubmodel (overrides: Record<string, any> = {}): any {
  return {
    id: 'urn:test:production-calendar',
    path: '/submodels/production-calendar',
    submodelElements: [
      { modelType: 'File', idShort: 'calendar', contentType: 'text/calendar', value: '/aasx/files/line01.ics' },
      {
        modelType: 'SubmodelElementList',
        idShort: 'specificationExtensionVariables',
        value: [
          {
            modelType: 'SubmodelElementCollection',
            value: [
              { modelType: 'Property', idShort: 'variableName', value: 'X-BREAK' },
              { modelType: 'File', idShort: 'variableSpecification', value: '/aasx/files/x-break.txt' },
            ],
          },
          { modelType: 'SubmodelElementCollection', value: [{ modelType: 'Property', idShort: 'variableName', value: '' }] },
        ],
      },
    ],
    ...overrides,
  }
}

function mountPlugin (submodel: any) {
  return mount(ProductionCalendar, {
    props: { submodelElementData: submodel },
    global: { stubs: globalStubs },
  })
}

describe('ProductionCalendar_v1_0', () => {
  beforeEach(() => {
    fetchFileTextMock.mockReset()
    // Like the real setData: assigns the attachment path of the elements, which the File value alone does not provide
    setDataMock.mockReset().mockImplementation(async (submodel: any, path: string, _cd: boolean, timestamp: string) => {
      for (const sme of submodel.submodelElements) {
        sme.path = `${path}/submodel-elements/${sme.idShort}`
      }
      return { ...submodel, path, timestamp: timestamp || 'now' }
    })
  })

  it('declares the ProductionCalendar 1.0 semantic id', () => {
    expect((ProductionCalendar as any).semanticId).toBe(
      'https://admin-shell.io/idta/SubmodelTemplate/ProductionCalendar/1/0',
    )
  })

  it('loads and parses the calendar file and passes the specifications on', async () => {
    fetchFileTextMock.mockResolvedValue(line01)

    const wrapper = mountPlugin(createSubmodel({ timestamp: '2026-10-04 17:11:18' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
    await flushPromises()

    expect(setDataMock).toHaveBeenCalledWith(expect.anything(), '/submodels/production-calendar', false, '2026-10-04 17:11:18')
    expect(fetchFileTextMock).toHaveBeenCalledWith(expect.objectContaining({
      idShort: 'calendar',
      path: '/submodels/production-calendar/submodel-elements/calendar',
    }))
    expect(wrapper.get('[data-test="calendar-view"]').text()).toBe('LINE01 production calendar')
    expect(wrapper.text()).toContain('Europe/Berlin')
    expect(wrapper.get('[data-test="specs"]').text()).toBe('X-BREAK|X-PRODUCTION-DAY,X-BREAK,X-MAINTENANCE')
    expect(wrapper.get('[data-test="last-sync"]').text()).toBe('2026-10-04 17:11:18')
  })

  it('hides the specification panel when the Submodel has none', async () => {
    fetchFileTextMock.mockResolvedValue(line01)
    const submodel = createSubmodel()
    submodel.submodelElements.pop()

    const wrapper = mountPlugin(submodel)
    await flushPromises()

    expect(wrapper.find('[data-test="calendar-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="specs"]').exists()).toBe(false)
  })

  it('shows an error when the Submodel has no calendar file', async () => {
    const submodel = createSubmodel()
    submodel.submodelElements.shift()

    const wrapper = mountPlugin(submodel)
    await flushPromises()

    expect(fetchFileTextMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('no calendar file')
    expect(wrapper.find('[data-test="calendar-view"]').exists()).toBe(false)
  })

  it('shows an error when the file cannot be fetched', async () => {
    fetchFileTextMock.mockRejectedValue(new Error('Request failed with status 404'))

    const wrapper = mountPlugin(createSubmodel())
    await flushPromises()

    expect(wrapper.text()).toContain('The calendar could not be loaded: Request failed with status 404')
  })

  it('shows an error when the file is not an iCalendar document', async () => {
    fetchFileTextMock.mockResolvedValue('<html>login</html>')

    const wrapper = mountPlugin(createSubmodel())
    await flushPromises()

    expect(wrapper.text()).toContain('The calendar could not be loaded')
    expect(wrapper.find('[data-test="calendar-view"]').exists()).toBe(false)
  })

  it('reloads when the Submodel timestamp changes', async () => {
    fetchFileTextMock.mockResolvedValue(line01)

    const wrapper = mountPlugin(createSubmodel({ timestamp: '1' }))
    await flushPromises()
    await wrapper.setProps({ submodelElementData: createSubmodel({ timestamp: '2' }) })
    await flushPromises()

    expect(fetchFileTextMock).toHaveBeenCalledTimes(2)
  })

  it('ignores the result of an outdated load', async () => {
    let resolveFirst: (text: string) => void = () => {}
    fetchFileTextMock
      .mockImplementationOnce(() => new Promise<string>(resolve => {
        resolveFirst = resolve
      }))
      .mockResolvedValueOnce(line01)

    const wrapper = mountPlugin(createSubmodel({ timestamp: '1' }))
    await flushPromises()
    await wrapper.setProps({ submodelElementData: createSubmodel({ timestamp: '2' }) })
    await flushPromises()
    resolveFirst('not a calendar')
    await flushPromises()

    expect(wrapper.find('[data-test="calendar-view"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('could not be loaded')
  })
})
