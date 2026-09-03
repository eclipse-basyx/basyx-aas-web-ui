import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import CodeEditor from '@/components/Code/CodeEditor.vue'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createModel: vi.fn(),
  configure: vi.fn(),
  language: vi.fn(),
  theme: { global: { current: { value: { dark: false } } } },
}))

vi.mock('vuetify', () => ({ useTheme: () => mocks.theme }))
vi.mock('@/components/Code/monacoRuntime', () => ({
  configureJsonDiagnostics: mocks.configure,
  monaco: {
    Uri: { parse: (uri: string) => uri },
    editor: { create: mocks.create, createModel: mocks.createModel, setModelLanguage: mocks.language },
  },
}))

function createModel (initial: string) {
  let text = initial
  let listener: (() => void) | undefined
  const subscription = { dispose: vi.fn() }
  return {
    getValue: () => text,
    setValue: vi.fn((value: string) => {
      text = value
      listener?.()
    }),
    onDidChangeContent: vi.fn((callback: () => void) => {
      listener = callback
      return subscription
    }),
    dispose: vi.fn(),
    subscription,
  }
}

const stubs = { VProgressLinear: true, VAlert: { template: '<div role="alert"><slot /></div>' } }

describe('CodeEditor lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.theme = reactive({ global: { current: { value: { dark: false } } } })
    mocks.createModel.mockImplementation(createModel)
    mocks.create.mockImplementation(() => ({
      updateOptions: vi.fn(), dispose: vi.fn(), focus: vi.fn(), getAction: vi.fn(() => ({ run: vi.fn() })),
    }))
  })

  it('synchronizes user and external edits without emitting an external value back', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '{}', accessibleLabel: 'JSON' }, global: { stubs } })
    await vi.dynamicImportSettled()
    await flushPromises()
    const model = mocks.createModel.mock.results[0].value
    model.setValue('{"a":1}')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['{"a":1}'])
    await wrapper.setProps({ modelValue: '{"b":2}' })
    expect(model.getValue()).toBe('{"b":2}')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('content-change')).toHaveLength(2)
    wrapper.unmount()
    expect(model.dispose).toHaveBeenCalledOnce()
    expect(model.subscription.dispose).toHaveBeenCalledOnce()
    expect(mocks.create.mock.results[0].value.dispose).toHaveBeenCalledOnce()
  })

  it('updates theme, language, options and read-only state without replacing the model', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '{}', accessibleLabel: 'JSON' }, global: { stubs } })
    await vi.dynamicImportSettled()
    await flushPromises()
    mocks.theme.global.current.value.dark = true
    await wrapper.setProps({ readOnly: true, language: 'xml', options: { wordWrap: 'on', readOnly: false } })
    expect(mocks.create.mock.results[0].value.updateOptions).toHaveBeenLastCalledWith(expect.objectContaining({
      theme: 'vs-dark', readOnly: true, domReadOnly: true, renderValidationDecorations: 'off', wordWrap: 'on',
    }))
    expect(mocks.language).toHaveBeenCalledWith(mocks.createModel.mock.results[0].value, 'xml')
    expect(mocks.createModel).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('gives simultaneous editors independent models and URIs', async () => {
    const first = mount(CodeEditor, { props: { modelValue: '1', accessibleLabel: 'First' }, global: { stubs } })
    await vi.dynamicImportSettled()
    await flushPromises()
    const second = mount(CodeEditor, { props: { modelValue: '2', accessibleLabel: 'Second' }, global: { stubs } })
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(mocks.createModel.mock.calls, first.html() + second.html()).toHaveLength(2)
    expect(mocks.createModel.mock.calls[0][2]).not.toBe(mocks.createModel.mock.calls[1][2])
    first.unmount()
    expect(mocks.createModel.mock.results[1].value.dispose).not.toHaveBeenCalled()
    second.unmount()
  })

  it('does not create an editor after unmounting during lazy initialization', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: '{}', accessibleLabel: 'JSON' }, global: { stubs } })
    wrapper.unmount()
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('reports initialization failure and disposes a partially created model', async () => {
    mocks.create.mockImplementation(() => {
      throw new Error('Editor unavailable')
    })
    const wrapper = mount(CodeEditor, { props: { modelValue: '{}', accessibleLabel: 'JSON' }, global: { stubs } })
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Editor unavailable')
    expect(wrapper.emitted('load-error')).toHaveLength(1)
    expect(mocks.createModel.mock.results[0].value.dispose).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
