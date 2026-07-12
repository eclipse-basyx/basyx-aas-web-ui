import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BooleanType from '@/components/SubmodelElements/ValueTypes/BooleanType.vue'

const requestMocks = vi.hoisted(() => ({
  fetchAndDispatchSme: vi.fn(),
  patchRequest: vi.fn(),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ patchRequest: requestMocks.patchRequest }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({ fetchAndDispatchSme: requestMocks.fetchAndDispatchSme }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({ getSelectedNode: {} }),
}))

function mountBooleanType (
  booleanValue: Record<string, any>,
  isOperationVariable = true,
  variableType = 'inputVariables',
  isEditable = true,
) {
  return mount(BooleanType, {
    props: { booleanValue, isEditable, isOperationVariable, variableType },
    global: {
      stubs: {
        'v-list-item': true,
        'v-btn': true,
        'v-chip': true,
        'v-icon': true,
        'v-progress-circular': true,
        'v-switch': true,
      },
    },
  })
}

describe('BooleanType', () => {
  beforeEach(() => {
    vi.useRealTimers()
    requestMocks.fetchAndDispatchSme.mockReset().mockResolvedValue(undefined)
    requestMocks.patchRequest.mockReset().mockResolvedValue({ success: true })
  })

  it('uses the display name when one is available', () => {
    const wrapper = mountBooleanType({
      idShort: 'enableMachine',
      displayName: [{ language: 'en', text: 'Enable machine' }],
      value: false,
    })

    expect((wrapper.vm as any).displayLabel).toBe('Enable machine')
  })

  it('falls back to idShort', () => {
    const wrapper = mountBooleanType({ idShort: 'enableMachine', value: false })

    expect((wrapper.vm as any).displayLabel).toBe('enableMachine')
  })

  it.each([
    [true, 'True'],
    [false, 'False'],
  ])('shows the current operation value explicitly for %s', (value, expectedLabel) => {
    const wrapper = mountBooleanType({ idShort: 'enableMachine', value })

    expect((wrapper.vm as any).booleanStateLabel).toBe(expectedLabel)
  })

  it('keeps the value label for regular properties', () => {
    const wrapper = mountBooleanType({ idShort: 'enabled', value: true }, false)

    expect((wrapper.vm as any).displayLabel).toBe('Boolean value')
    expect((wrapper.vm as any).booleanStateLabel).toBe('True')
    expect((wrapper.vm as any).helperText).toBe('Changes save automatically')
  })

  it('identifies a read-only regular property as a server value', () => {
    const wrapper = mountBooleanType({ idShort: 'enabled', value: true }, false, 'inputVariables', false)

    expect((wrapper.vm as any).helperText).toBe('Stored in the AAS')
  })

  it('does not add redundant hints to operation variables', () => {
    const input = mountBooleanType({ idShort: 'enabled', value: true })
    const output = mountBooleanType({ idShort: 'result', value: false }, true, 'outputVariables')

    expect((input.vm as any).helperText).toBe('')
    expect((output.vm as any).helperText).toBe('')
  })

  it('shows the server value while a regular property has an unsaved change', async () => {
    const wrapper = mountBooleanType({ idShort: 'enabled', value: false }, false)

    ;(wrapper.vm as any).newBooleanValue = true
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).hasChanges).toBe(true)
    expect((wrapper.vm as any).helperText).toBe('Not saved')
  })

  it('saves an editable regular property immediately when toggled', async () => {
    const wrapper = mountBooleanType({
      idShort: 'enabled',
      modelType: 'Property',
      path: 'https://example.test/properties/enabled',
      value: false,
    }, false)

    ;(wrapper.vm as any).newBooleanValue = true
    ;(wrapper.vm as any).changeState()
    await flushPromises()

    expect(requestMocks.patchRequest).toHaveBeenCalledOnce()
    expect(requestMocks.patchRequest.mock.calls[0][0]).toBe('https://example.test/properties/enabled/$value')
    expect(requestMocks.patchRequest.mock.calls[0][1]).toBe('"true"')
    expect((wrapper.vm as any).saveStatus).toBe('saved')
  })

  it('returns to neutral helper text after briefly confirming a save', async () => {
    vi.useFakeTimers()
    const wrapper = mountBooleanType({
      idShort: 'enabled',
      modelType: 'Property',
      path: 'https://example.test/properties/enabled',
      value: false,
    }, false)

    ;(wrapper.vm as any).newBooleanValue = true
    ;(wrapper.vm as any).changeState()
    await flushPromises()

    expect((wrapper.vm as any).helperText).toBe('Saved to the AAS')

    vi.advanceTimersByTime(2500)
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).saveStatus).toBe('idle')
    expect((wrapper.vm as any).helperText).toBe('Changes save automatically')
    vi.useRealTimers()
  })
})
