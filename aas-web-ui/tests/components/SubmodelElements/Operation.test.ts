import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Operation from '@/components/SubmodelElements/Operation.vue'

const postRequestMock = vi.fn()
const errorHandlerMock = vi.fn()
const dispatchSnackbarMock = vi.fn()
const dispatchTriggerAASListReloadMock = vi.fn()
const dispatchTriggerTreeviewReloadMock = vi.fn()

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    postRequest: postRequestMock,
    errorHandler: errorHandlerMock,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: dispatchSnackbarMock,
    dispatchTriggerAASListReload: dispatchTriggerAASListReloadMock,
    dispatchTriggerTreeviewReload: dispatchTriggerTreeviewReloadMock,
  }),
}))

describe('Operation.vue', () => {
  beforeEach(() => {
    postRequestMock.mockReset()
    errorHandlerMock.mockReset()
    dispatchSnackbarMock.mockReset()
    dispatchTriggerAASListReloadMock.mockReset()
    dispatchTriggerTreeviewReloadMock.mockReset()

    postRequestMock.mockResolvedValue({ success: true, data: {} })
  })

  it('uses the current operation path after switching selection', async () => {
    const wrapper = mount(Operation, {
      props: {
        isEditable: true,
        operationObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/op-a',
          modelType: 'Operation',
          idShort: 'OpA',
          inputVariables: [],
          inoutputVariables: [],
          outputVariables: [],
        },
      },
      global: {
        stubs: {
          'v-container': true,
          'v-card': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-title': true,
          'v-btn': true,
          'v-divider': true,
          'v-alert': true,
          'Property': true,
          'ReferenceElement': true,
          'InvalidElement': true,
          'DescriptionElement': true,
        },
      },
    })

    await wrapper.setProps({
      operationObject: {
        path: 'https://example.test/submodels/sm/submodel-elements/op-b',
        modelType: 'Operation',
        idShort: 'OpB',
        inputVariables: [],
        inoutputVariables: [],
        outputVariables: [],
      },
    })

    await (wrapper.vm as any).executeOperation()
    await Promise.resolve()

    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(postRequestMock.mock.calls[0][0]).toBe(
      'https://example.test/submodels/sm/submodel-elements/op-b/invoke?async=true',
    )
  })

  it('sends Boolean operation arguments as AAS strings', async () => {
    const booleanProperty = {
      modelType: 'Property',
      idShort: 'Enabled',
      valueType: 'xs:boolean',
      value: 'false',
    }
    const wrapper = mount(Operation, {
      props: {
        isEditable: true,
        operationObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/boolean-op',
          modelType: 'Operation',
          idShort: 'BooleanOperation',
          inputVariables: [{ value: booleanProperty }],
          inoutputVariables: [],
          outputVariables: [],
        },
      },
      global: {
        stubs: {
          'v-container': true,
          'v-card': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-title': true,
          'v-btn': true,
          'v-divider': true,
          'v-alert': true,
          'Property': true,
          'ReferenceElement': true,
          'InvalidElement': true,
          'DescriptionElement': true,
        },
      },
    })

    ;(wrapper.vm as any).updateOperationVariable(true, booleanProperty)
    await (wrapper.vm as any).executeOperation()
    await Promise.resolve()

    const requestBody = JSON.parse(postRequestMock.mock.calls[0][1])
    expect(requestBody.inputArguments[0].value.value).toBe('true')
    expect(typeof requestBody.inputArguments[0].value.value).toBe('string')
  })

  it('renders nested Operation variables as read-only when invocation is unavailable', async () => {
    const wrapper = mount(Operation, {
      props: {
        isEditable: true,
        invocationAvailable: false,
        operationObject: {
          modelType: 'Operation',
          idShort: 'Nested',
          inputVariables: [{
            value: { modelType: 'Property', idShort: 'input', valueType: 'xs:string', value: 'value' },
          }],
          inoutputVariables: [],
          outputVariables: [],
        },
      },
      global: {
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          'v-list-item-title': { template: '<div><slot /></div>' },
          'v-divider': true,
          'v-alert': { template: '<div><slot /></div>' },
          'DescriptionElement': true,
          'ReferenceElement': true,
          'SubmodelElementSummary': true,
          'Property': {
            props: ['isEditable'],
            template: '<span data-test="property-editable">{{ String(isEditable) }}</span>',
          },
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-test="property-editable"]').text()).toBe('false')
  })
})
