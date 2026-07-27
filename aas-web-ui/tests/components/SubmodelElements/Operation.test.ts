import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Operation from '@/components/SubmodelElements/Operation.vue'

const postRequestMock = vi.fn()
const getRequestMock = vi.fn()
const errorHandlerMock = vi.fn()
const dispatchSnackbarMock = vi.fn()
const dispatchTriggerAASListReloadMock = vi.fn()
const dispatchTriggerTreeviewReloadMock = vi.fn()

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    postRequest: postRequestMock,
    getRequest: getRequestMock,
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

const defaultOperation = {
  path: 'https://example.test/submodels/sm/submodel-elements/op-a',
  modelType: 'Operation',
  idShort: 'OpA',
  inputVariables: [],
  inoutputVariables: [],
  outputVariables: [],
}

const shallowStubs = {
  'v-container': true,
  'v-card': true,
  'v-list': true,
  'v-list-item': true,
  'v-list-item-title': true,
  'v-switch': true,
  'v-btn': true,
  'v-divider': true,
  'v-alert': true,
  'Property': true,
  'ReferenceElement': true,
  'SubmodelElementSummary': true,
  'DescriptionElement': true,
}

function acceptedResponse (location = '/operation-status/handle-1') {
  return {
    success: true,
    status: 202,
    raw: {
      headers: new Headers({ Location: location }),
      url: 'https://example.test/submodels/sm/submodel-elements/op-a/invoke-async',
    },
  }
}

function mountOperation (operationObject: Record<string, any> = defaultOperation) {
  return mount(Operation, {
    props: {
      isEditable: true,
      operationObject,
    },
    global: { stubs: shallowStubs },
  })
}

describe('Operation.vue', () => {
  beforeEach(() => {
    postRequestMock.mockReset()
    getRequestMock.mockReset()
    errorHandlerMock.mockReset()
    dispatchSnackbarMock.mockReset()
    dispatchTriggerAASListReloadMock.mockReset()
    dispatchTriggerTreeviewReloadMock.mockReset()

    postRequestMock.mockResolvedValue(acceptedResponse())
    getRequestMock.mockResolvedValue({
      success: true,
      status: 200,
      data: { executionState: 'Completed', success: true },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses the V3.2 async endpoint and follows its Location header after switching selection', async () => {
    const wrapper = mountOperation()

    await wrapper.setProps({
      operationObject: {
        ...defaultOperation,
        path: 'https://example.test/submodels/sm/submodel-elements/op-b',
        idShort: 'OpB',
      },
    })

    await (wrapper.vm as any).executeOperation()

    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(postRequestMock.mock.calls[0][0]).toBe(
      'https://example.test/submodels/sm/submodel-elements/op-b/invoke-async',
    )
    expect(getRequestMock.mock.calls[0][0]).toBe('https://example.test/operation-status/handle-1')
  })

  it('invokes synchronously without probing the async endpoint when selected', async () => {
    const wrapper = mountOperation()
    postRequestMock.mockResolvedValue({
      success: true,
      status: 200,
      data: { executionState: 'Completed', success: true },
    })
    ;(wrapper.vm as any).invokeAsynchronously = false

    await (wrapper.vm as any).executeOperation()

    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(postRequestMock.mock.calls[0][0]).toBe(`${defaultOperation.path}/invoke`)
    expect(getRequestMock).not.toHaveBeenCalled()
    expect(dispatchSnackbarMock).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('sends Boolean operation arguments as AAS strings', async () => {
    const booleanProperty = {
      modelType: 'Property',
      idShort: 'Enabled',
      valueType: 'xs:boolean',
      value: 'false',
    }
    const wrapper = mountOperation({
      ...defaultOperation,
      path: 'https://example.test/submodels/sm/submodel-elements/boolean-op',
      idShort: 'BooleanOperation',
      inputVariables: [{ value: booleanProperty }],
    })

    const localBooleanProperty = (wrapper.vm as any).localOperationObject.inputVariables[0].value
    ;(wrapper.vm as any).updateOperationVariable(true, localBooleanProperty)
    await (wrapper.vm as any).executeOperation()

    const requestBody = JSON.parse(postRequestMock.mock.calls[0][1])
    expect(requestBody.inputArguments[0].value.value).toBe('true')
    expect(typeof requestBody.inputArguments[0].value.value).toBe('string')
  })

  it('polls Initiated and Running states before applying the completed result', async () => {
    vi.useFakeTimers()
    const wrapper = mountOperation()
    getRequestMock
      .mockResolvedValueOnce({ success: true, data: { executionState: 'Initiated', success: true } })
      .mockResolvedValueOnce({ success: true, data: { executionState: 'Running', success: true } })
      .mockResolvedValueOnce({
        success: true,
        data: {
          executionState: 'Completed',
          success: true,
          inoutputArguments: [{ value: { modelType: 'Property', value: 'updated' } }],
          outputArguments: [{ value: { modelType: 'Property', value: 'result' } }],
        },
      })

    const invocation = (wrapper.vm as any).executeOperation()
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(200)
    await invocation

    expect(getRequestMock).toHaveBeenCalledTimes(3)
    expect((wrapper.vm as any).localOperationObject.inoutputVariables[0].value.value).toBe('updated')
    expect((wrapper.vm as any).localOperationObject.outputVariables[0].value.value).toBe('result')
    expect(dispatchSnackbarMock).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
    expect((wrapper.vm as any).loading).toBe(false)
  })

  it.each(['Canceled', 'Failed', 'Timeout'])(
    'reports the %s terminal state as an error',
    async executionState => {
      const wrapper = mountOperation()
      getRequestMock.mockResolvedValue({
        success: true,
        data: { executionState, success: executionState !== 'Failed', messages: [{ text: executionState }] },
      })

      await (wrapper.vm as any).executeOperation()

      expect(errorHandlerMock).toHaveBeenCalledOnce()
      expect(dispatchSnackbarMock).not.toHaveBeenCalled()
      expect((wrapper.vm as any).loading).toBe(false)
    },
  )

  it('reports a top-level unsuccessful OperationResult even when its state is Completed', async () => {
    const wrapper = mountOperation()
    getRequestMock.mockResolvedValue({
      success: true,
      data: { executionState: 'Completed', success: false, messages: [{ text: 'delegate failed' }] },
    })

    await (wrapper.vm as any).executeOperation()

    expect(errorHandlerMock).toHaveBeenCalledWith([{ text: 'delegate failed' }], expect.any(String))
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
  })

  it('does not read data or report success after a failed status request', async () => {
    const wrapper = mountOperation()
    getRequestMock.mockResolvedValue({ success: false, status: 500 })

    await (wrapper.vm as any).executeOperation()

    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
    expect((wrapper.vm as any).loading).toBe(false)
  })

  it.each([404, 405, 501])(
    'falls back to synchronous V3.2 invocation when async invocation returns %s',
    async status => {
      const wrapper = mountOperation()
      postRequestMock
        .mockResolvedValueOnce({ success: false, status })
        .mockResolvedValueOnce({
          success: true,
          status: 200,
          data: { executionState: 'Completed', success: true },
        })

      await (wrapper.vm as any).executeOperation()

      expect(postRequestMock.mock.calls.map(call => call[0])).toEqual([
        `${defaultOperation.path}/invoke-async`,
        `${defaultOperation.path}/invoke`,
      ])
      expect(dispatchSnackbarMock).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
      expect((wrapper.vm as any).loading).toBe(false)
    },
  )

  it('does not fall back for an ordinary invocation failure', async () => {
    const wrapper = mountOperation()
    postRequestMock.mockResolvedValue({ success: false, status: 500 })

    await (wrapper.vm as any).executeOperation()

    expect(postRequestMock).toHaveBeenCalledTimes(1)
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
    expect((wrapper.vm as any).loading).toBe(false)
  })

  it('reports a malformed async response without a Location header', async () => {
    const wrapper = mountOperation()
    postRequestMock.mockResolvedValue({
      success: true,
      status: 202,
      raw: { headers: new Headers(), url: `${defaultOperation.path}/invoke-async` },
    })

    await (wrapper.vm as any).executeOperation()

    expect(errorHandlerMock).toHaveBeenCalledWith(
      'The asynchronous invocation response did not include a Location header.',
      expect.any(String),
    )
    expect(getRequestMock).not.toHaveBeenCalled()
  })

  it('aborts and ignores an old invocation when the selected operation changes', async () => {
    let resolveStatus!: (value: unknown) => void
    getRequestMock.mockReturnValue(new Promise(resolve => {
      resolveStatus = resolve
    }))
    const wrapper = mountOperation()

    const invocation = (wrapper.vm as any).executeOperation()
    await vi.waitFor(() => expect(getRequestMock).toHaveBeenCalledOnce())
    const signal = getRequestMock.mock.calls[0][4].signal as AbortSignal

    await wrapper.setProps({
      operationObject: {
        ...defaultOperation,
        path: 'https://example.test/submodels/sm/submodel-elements/op-b',
        idShort: 'OpB',
      },
    })
    resolveStatus({
      success: true,
      data: { executionState: 'Completed', success: true },
    })
    await invocation

    expect(signal.aborted).toBe(true)
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
    expect((wrapper.vm as any).loading).toBe(false)
  })

  it('aborts polling when the component unmounts', async () => {
    let resolveStatus!: (value: unknown) => void
    getRequestMock.mockReturnValue(new Promise(resolve => {
      resolveStatus = resolve
    }))
    const wrapper = mountOperation()

    const invocation = (wrapper.vm as any).executeOperation()
    await vi.waitFor(() => expect(getRequestMock).toHaveBeenCalledOnce())
    const signal = getRequestMock.mock.calls[0][4].signal as AbortSignal
    wrapper.unmount()
    resolveStatus({ success: false, aborted: true })
    await invocation

    expect(signal.aborted).toBe(true)
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
  })

  it('uses a true elapsed timeout and aborts an in-flight status request', async () => {
    vi.useFakeTimers()
    let statusSignal: AbortSignal | undefined
    getRequestMock.mockImplementation((_path, _context, _disable, _headers, options) => {
      statusSignal = options.signal
      return new Promise(resolve => {
        options.signal.addEventListener('abort', () => resolve({ success: false, aborted: true }))
      })
    })
    const wrapper = mountOperation()

    const invocation = (wrapper.vm as any).executeOperation()
    await vi.advanceTimersByTimeAsync(60_000)
    await invocation

    expect(statusSignal?.aborted).toBe(true)
    expect(errorHandlerMock).toHaveBeenCalledWith('Timeout exceeded (60s)', expect.any(String))
    expect(dispatchSnackbarMock).not.toHaveBeenCalled()
    expect((wrapper.vm as any).loading).toBe(false)
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
