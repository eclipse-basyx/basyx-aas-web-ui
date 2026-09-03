import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

const editor = defineComponent({
  props: ['modelValue', 'modelNamespace', 'schemas'],
  template: '<div data-test="editor" />',
})
const stubs = {
  CodeEditor: editor,
  VProgressLinear: { template: '<div role="progressbar" />' },
  VAlert: { template: '<div role="alert"><slot /></div>' },
}

async function mountPendingEditor () {
  const integration = {
    createAasEditorSchema: vi.fn((root: string) => ({ uri: `schema:${root}` })),
    getAasEditorNamespace: (root: string) => `aas-${root}`,
  }
  let resolve!: (value: typeof integration) => void
  let reject!: (error: Error) => void
  const promise = new Promise<typeof integration>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  const loading = { promise, resolve, reject }
  vi.doMock('@/schemas/aas/aasEditorSchema', () => loading.promise)
  const { default: AasJsonEditor } = await import('@/components/Code/AasJsonEditor.vue')
  const wrapper = mount(AasJsonEditor, {
    props: { modelValue: '{}', root: 'Submodel' },
    global: { stubs },
  })
  return { wrapper, integration, loading }
}

describe('AasJsonEditor schema loading', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('waits for the schema and uses the latest root when loading finishes', async () => {
    const { wrapper, integration, loading } = await mountPendingEditor()
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    await wrapper.setProps({ root: 'SubmodelElement' })
    loading.resolve(integration)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.getComponent(editor).props()).toEqual({
      modelValue: '{}',
      modelNamespace: 'aas-SubmodelElement',
      schemas: [{ uri: 'schema:SubmodelElement' }],
    })
    wrapper.unmount()
  })

  it('shows a schema-loading failure and stops the loading indicator', async () => {
    const { wrapper, loading } = await mountPendingEditor()
    loading.reject(new Error('Unable to fetch schema chunk'))
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load the AAS editor schema.')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    wrapper.unmount()
  })

  it.each(['success', 'failure'])('ignores late loading %s after unmount', async outcome => {
    const { wrapper, integration, loading } = await mountPendingEditor()
    const element = wrapper.element
    wrapper.unmount()
    if (outcome === 'success') {
      loading.resolve(integration)
    } else {
      loading.reject(new Error('Unable to fetch schema chunk'))
    }
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(integration.createAasEditorSchema).not.toHaveBeenCalled()
    expect(element.querySelector('[data-test="editor"]')).toBeNull()
    expect(element.querySelector('[role="alert"]')).toBeNull()
  })
})
