import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import JSONPreview from '@/components/Plugins/JSONPreview.vue'
import XMLPreview from '@/components/Plugins/XMLPreview.vue'

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock('@/composables/Client/SMRepositoryClient', () => ({ useSMRepositoryClient: () => ({ fetchAttachmentFile: mocks.fetch }) }))
const viewer = defineComponent({
  props: ['text', 'exportText', 'error', 'loading', 'fileName'],
  template: '<div>{{ text }}{{ error }}</div>',
})
const global = { stubs: { CodeViewer: viewer } }

describe('attachment previews', () => {
  beforeEach(() => {
    mocks.fetch.mockReset()
  })

  it('prefers direct JSON, keeps source exports, and reacts to content changes', async () => {
    const wrapper = mount(JSONPreview, { props: {
      jsonContent: '{"a":1}', submodelElementData: { path: '/file', idShort: 'Attachment' }, downloadFileName: 'descriptor',
    }, global })
    await flushPromises()
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(wrapper.getComponent(viewer).props()).toMatchObject({
      text: '{\n  "a": 1\n}', exportText: '{"a":1}', fileName: 'descriptor.json',
    })
    await wrapper.setProps({ jsonContent: false })
    expect(wrapper.getComponent(viewer).props('text')).toBe('false')
    await wrapper.setProps({ jsonContent: '{malformed' })
    expect(wrapper.getComponent(viewer).props('text')).toBe('{malformed')
    wrapper.unmount()
  })

  it('ignores an older attachment response after switching to direct content', async () => {
    let resolve!: (value: string) => void
    mocks.fetch.mockReturnValue(new Promise(r => {
      resolve = r
    }))
    const wrapper = mount(JSONPreview, { props: { submodelElementData: { path: '/old' } }, global })
    await wrapper.setProps({ jsonContent: { newest: true } })
    resolve('old')
    await flushPromises()
    expect(wrapper.getComponent(viewer).props('text')).toContain('"newest": true')
    expect(wrapper.getComponent(viewer).props('loading')).toBe(false)
    wrapper.unmount()
  })

  it('keeps XML source exports while formatting the displayed attachment', async () => {
    const file = new Blob(['<root><child/></root>'])
    file.text = async () => '<root><child/></root>'
    mocks.fetch.mockResolvedValue(file)
    const wrapper = mount(XMLPreview, { props: { submodelElementData: { path: '/xml', idShort: 'document' } }, global })
    await flushPromises()
    expect(wrapper.getComponent(viewer).props()).toMatchObject({
      exportText: '<root><child/></root>', text: '<root>\n  <child/>\n</root>', fileName: 'document.xml',
    })
    wrapper.unmount()
  })

  it('shows an attachment error and clears it when a new source arrives', async () => {
    mocks.fetch.mockResolvedValue(undefined)
    const wrapper = mount(JSONPreview, { props: { submodelElementData: { path: '/missing' } }, global })
    await flushPromises()
    expect(wrapper.getComponent(viewer).props('error')).toContain('Failed to load JSON file')
    await wrapper.setProps({ jsonContent: {} })
    expect(wrapper.getComponent(viewer).props('error')).toBeNull()
    wrapper.unmount()
  })
})
