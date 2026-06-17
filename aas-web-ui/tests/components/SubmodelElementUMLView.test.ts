import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubmodelElementUMLView from '@/components/SubmodelElementUMLView.vue'

const writeTextMock = vi.fn()

const mocks = vi.hoisted(() => ({
  renderPlantUmlToSvg: vi.fn(),
  selectedNode: {
    modelType: 'Submodel',
    idShort: 'Nameplate',
    path: 'https://example.test/submodels/nameplate',
    submodelElements: [
      {
        modelType: 'Property',
        idShort: 'ManufacturerName',
        valueType: 'xs:string',
        value: 'BaSyx',
      },
    ],
  } as Record<string, unknown>,
}))

vi.mock('@/utils/AAS/PlantUMLRenderer', () => ({
  renderPlantUmlToSvg: mocks.renderPlantUmlToSvg,
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedNode: mocks.selectedNode,
  }),
}))

const slotStub = {
  template: '<div><slot /></div>',
}

const tooltipStub = {
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
}

const buttonStub = {
  props: ['disabled', 'icon'],
  emits: ['click'],
  template: '<button :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
}

function mountComponent () {
  return mount(SubmodelElementUMLView, {
    global: {
      stubs: {
        'v-alert': slotStub,
        'VAlert': slotStub,
        'v-card': slotStub,
        'VCard': slotStub,
        'v-card-text': slotStub,
        'VCardText': slotStub,
        'v-chip': slotStub,
        'VChip': slotStub,
        'v-container': slotStub,
        'VContainer': slotStub,
        'v-divider': true,
        'VDivider': true,
        'v-empty-state': slotStub,
        'VEmptyState': slotStub,
        'v-expand-transition': slotStub,
        'VExpandTransition': slotStub,
        'v-icon': slotStub,
        'VIcon': slotStub,
        'v-progress-circular': true,
        'VProgressCircular': true,
        'v-spacer': true,
        'VSpacer': true,
        'v-toolbar': slotStub,
        'VToolbar': slotStub,
        'v-toolbar-title': slotStub,
        'VToolbarTitle': slotStub,
        'v-tooltip': tooltipStub,
        'VTooltip': tooltipStub,
        'v-btn': buttonStub,
        'VBtn': buttonStub,
      },
    },
  })
}

describe('SubmodelElementUMLView', () => {
  beforeEach(() => {
    mocks.renderPlantUmlToSvg.mockReset()
    mocks.renderPlantUmlToSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"><text>Rendered UML</text></svg>')
    writeTextMock.mockReset()
    writeTextMock.mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    })
  })

  it('renders SVG from generated PlantUML source', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    expect(mocks.renderPlantUmlToSvg).toHaveBeenCalledTimes(1)
    expect(mocks.renderPlantUmlToSvg.mock.calls[0][0]).toContain('@startuml')
    expect(mocks.renderPlantUmlToSvg.mock.calls[0][0]).toContain('class "Nameplate"')
    expect(wrapper.html()).toContain('Rendered UML')
    expect(wrapper.html()).toContain('font-size: 13px')
  })

  it('strips external SVG links and event handlers before rendering', async () => {
    mocks.renderPlantUmlToSvg.mockResolvedValue(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <path id="local-path" d="M 0 0 L 1 1" />
        </defs>
        <a href="https://example.test/external" xlink:href="javascript:alert(1)" onclick="alert(1)">
          <text>External link</text>
        </a>
        <use href="#local-path" xlink:href="#local-path" />
      </svg>
    `)

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.html()).toContain('External link')
    expect(wrapper.html()).not.toContain('https://example.test/external')
    expect(wrapper.html()).not.toContain('javascript:alert')
    expect(wrapper.html()).not.toContain('onclick')
    expect(wrapper.html()).toContain('href="#local-path"')
  })

  it('copies the generated PlantUML source', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('[data-icon="mdi-content-copy"]').trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock.mock.calls[0][0]).toContain('@startuml')
    expect(writeTextMock.mock.calls[0][0]).toContain('ManufacturerName')
  })

  it('uses an available MDI icon for the SVG download action', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const svgButton = wrapper.find('[data-icon="mdi-svg"]')

    expect(svgButton.exists()).toBe(true)
    expect(svgButton.attributes('disabled')).toBeUndefined()
  })

  it('keeps PlantUML source available when rendering fails', async () => {
    mocks.renderPlantUmlToSvg.mockRejectedValue(new Error('PlantUML rendering timed out.'))

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('PlantUML rendering timed out.')

    const copyButton = wrapper.find('[data-icon="mdi-content-copy"]')
    expect(copyButton.attributes('disabled')).toBeUndefined()

    await copyButton.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock.mock.calls[0][0]).toContain('@startuml')
  })
})
