import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ProductionPlan from '@/components/Plugins/Submodels/ProductionPlan_v1_0.vue'

const { jumpToAasByIdMock } = vi.hoisted(() => ({
  jumpToAasByIdMock: vi.fn(),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    checkIdShort: (sme: any, idShort: string, startsWith = false) => {
      if (!sme?.idShort) {
        return false
      }
      if (startsWith) {
        return (
          sme.idShort.toLowerCase() === idShort.toLowerCase()
          || sme.idShort.startsWith(idShort + '{')
          || sme.idShort.startsWith(idShort + '__')
        )
      }
      return sme.idShort === idShort
    },
    descriptionToDisplay: () => '',
    nameToDisplay: (_sme: any, _lang: string, fallback: string) => fallback,
  }),
}))

vi.mock('@/composables/JumpHandling', () => ({
  useJumpHandling: () => ({
    jumpToAasById: jumpToAasByIdMock,
  }),
}))

const MACHINE_AAS_ID = 'https://aas.dev.chesco.de/ids/aas/machine/AN16'

// Stubs that pass through slot content so nested template logic is testable
const slotStub = { template: '<slot />' }

const globalStubs = {
  'v-container': slotStub,
  'v-card': slotStub,
  'v-card-title': slotStub,
  'v-card-subtitle': true,
  'v-card-text': slotStub,
  'v-sheet': true,
  'v-skeleton-loader': true,
  'v-alert': true,
  'v-stepper-vertical': slotStub,
  'v-stepper-vertical-item': slotStub,
  'v-list': slotStub,
  'v-list-item': slotStub,
  'v-list-item-title': slotStub,
  'v-list-item-subtitle': slotStub,
  'v-chip': true,
  'v-spacer': true,
  'v-btn': { template: '<v-btn-stub><slot /></v-btn-stub>' },
  'v-icon': true,
}

function makeActionElement (withMachineRef: boolean): any {
  const children: any[] = [
    {
      modelType: 'Property',
      idShort: 'ActionTitle',
      semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/ActionTitle' }] },
      value: 'Weld Chassis',
    },
    {
      modelType: 'Property',
      idShort: 'MachineName',
      semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/MachineName' }] },
      value: 'Welding Robot AN16',
    },
    {
      modelType: 'Property',
      idShort: 'Status',
      semanticId: { keys: [{ value: 'https://smartfactory.de/concept-descriptions/2e477e2e-7b9a-41e3-8c36-6fea108bab08' }] },
      value: 'done',
    },
  ]

  if (withMachineRef) {
    children.push({
      modelType: 'ReferenceElement',
      idShort: 'MachineRef',
      semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/MachineRef' }] },
      value: {
        keys: [{ type: 'AssetAdministrationShell', value: MACHINE_AAS_ID }],
        type: 'ModelReference',
      },
    })
  }

  return {
    modelType: 'SubmodelElementCollection',
    idShort: 'Action1',
    semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action' }] },
    value: children,
  }
}

function createSubmodelData (withMachineRef: boolean): any {
  return {
    id: 'urn:test:production-plan',
    path: '/submodels/production-plan',
    submodelElements: [
      {
        modelType: 'SubmodelElementCollection',
        idShort: 'Step1',
        semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step' }] },
        value: [
          {
            modelType: 'Property',
            idShort: 'StepTitle',
            semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/StepTitle' }] },
            value: 'Assembly Step 1',
          },
          {
            modelType: 'Property',
            idShort: 'Status',
            semanticId: { keys: [{ value: 'https://smartfactory.de/concept-descriptions/2e477e2e-7b9a-41e3-8c36-6fea108bab08' }] },
            value: 'done',
          },
          {
            modelType: 'SubmodelElementCollection',
            idShort: 'Actions',
            semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions' }] },
            value: [makeActionElement(withMachineRef)],
          },
        ],
      },
    ],
  }
}

function createWrapper (submodelElementData: any) {
  return mount(ProductionPlan, {
    props: { submodelElementData },
    global: { stubs: globalStubs },
  })
}

describe('ProductionPlan_v1_0.vue – MachineRef navigation', () => {
  beforeEach(() => {
    jumpToAasByIdMock.mockReset()
  })

  describe('machineRefAasId parsing', () => {
    it('is undefined when no MachineRef element is present', () => {
      const wrapper = createWrapper(createSubmodelData(false))
      const vm = wrapper.vm as any

      expect(vm.steps[0].actions[0].machineRefAasId).toBeUndefined()
    })

    it('is the AAS ID from a valid MachineRef ReferenceElement', () => {
      const wrapper = createWrapper(createSubmodelData(true))
      const vm = wrapper.vm as any

      expect(vm.steps[0].actions[0].machineRefAasId).toBe(MACHINE_AAS_ID)
    })

    it('is undefined when MachineRef has wrong modelType', () => {
      const data = createSubmodelData(false)
      // Push a Property named MachineRef — wrong modelType
      data.submodelElements[0].value[2].value[0].value.push({
        modelType: 'Property',
        idShort: 'MachineRef',
        semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/MachineRef' }] },
        value: MACHINE_AAS_ID,
      })
      const wrapper = createWrapper(data)
      const vm = wrapper.vm as any

      expect(vm.steps[0].actions[0].machineRefAasId).toBeUndefined()
    })

    it('is undefined when MachineRef contains no AssetAdministrationShell key', () => {
      const data = createSubmodelData(false)
      data.submodelElements[0].value[2].value[0].value.push({
        modelType: 'ReferenceElement',
        idShort: 'MachineRef',
        semanticId: { keys: [{ value: 'https://smartfactory.de/semantics/submodel-element/Step/Actions/Action/MachineRef' }] },
        value: {
          keys: [{ type: 'Submodel', value: 'https://example.com/submodels/sm1' }],
          type: 'ModelReference',
        },
      })
      const wrapper = createWrapper(data)
      const vm = wrapper.vm as any

      expect(vm.steps[0].actions[0].machineRefAasId).toBeUndefined()
    })
  })

  describe('machine name rendering', () => {
    it('renders machine name as plain text when no MachineRef is present', async () => {
      const wrapper = createWrapper(createSubmodelData(false))
      await nextTick()

      expect(wrapper.find('v-btn-stub').exists()).toBe(false)
      expect(wrapper.text()).toContain('Welding Robot AN16')
    })

    it('renders machine name inside a button when MachineRef is present', async () => {
      const wrapper = createWrapper(createSubmodelData(true))
      await nextTick()

      expect(wrapper.find('v-btn-stub').exists()).toBe(true)
      expect(wrapper.find('v-btn-stub').text()).toContain('Welding Robot AN16')
    })
  })

  describe('navigation', () => {
    it('calls jumpToAasById with the machine AAS ID', async () => {
      const wrapper = createWrapper(createSubmodelData(true))
      const vm = wrapper.vm as any

      await vm.navigateToMachine(MACHINE_AAS_ID)

      expect(jumpToAasByIdMock).toHaveBeenCalledOnce()
      expect(jumpToAasByIdMock).toHaveBeenCalledWith(MACHINE_AAS_ID)
    })
  })
})
