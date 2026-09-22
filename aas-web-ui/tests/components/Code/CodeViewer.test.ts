import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import CodeViewer from '@/components/Code/CodeViewer.vue'
import { hotkeyStub } from '../../helpers/vuetifyStubs'

const editor = defineComponent({
  props: { modelValue: String, readOnly: Boolean, options: Object },
  setup (_props, { expose }) {
    expose({ find: vi.fn() })
  },
  template: '<div />',
})
const slot = { template: '<div><slot /></div>' }
const stubs = {
  CodeEditor: editor,
  VBtn: { template: '<button><slot /></button>' },
  VCard: slot, VCardTitle: slot, VCardText: slot, VIcon: slot,
  VSpacer: true, VDivider: true, VProgressLinear: true, VEmptyState: true,
  VAlert: { template: '<div role="alert"><slot /></div>' },
  VTooltip: { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
  VHotkey: hotkeyStub,
}

describe('CodeViewer controls', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses source text for copy/download, and keeps the editor read-only', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:preview')
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const wrapper = mount(CodeViewer, { props: {
      text: '{\n  "a": 1\n}', exportText: '{"a":1}', fileName: 'original.json',
    }, global: { stubs } })
    expect(wrapper.getComponent(editor).props('readOnly')).toBe(true)
    await wrapper.get('button[aria-label="Copy to clipboard"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('{"a":1}')
    await wrapper.get('button[aria-label="Download"]').trigger('click')
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    expect(blob.size).toBe('{"a":1}'.length)
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('original.json')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    wrapper.unmount()
  })

  it('delegates Find and toggles wrapping and line numbers', async () => {
    const wrapper = mount(CodeViewer, { props: { text: '{}' }, global: { stubs } })
    await wrapper.get('button[aria-label="Search"]').trigger('click')
    expect((wrapper.getComponent(editor).vm as unknown as { find: () => void }).find).toHaveBeenCalledOnce()
    await wrapper.get('button[aria-label="Disable word wrap"]').trigger('click')
    await wrapper.get('button[aria-label="Hide line numbers"]').trigger('click')
    expect(wrapper.getComponent(editor).props('options')).toEqual({ wordWrap: 'off', lineNumbers: 'off' })
    wrapper.unmount()
  })

  it('reports clipboard failures', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const wrapper = mount(CodeViewer, { props: { text: '{}' }, global: { stubs } })
    await wrapper.get('button[aria-label="Copy to clipboard"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to copy')
    wrapper.unmount()
  })
})
