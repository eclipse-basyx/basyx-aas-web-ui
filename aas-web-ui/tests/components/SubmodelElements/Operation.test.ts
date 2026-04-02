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
})
