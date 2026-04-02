import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Blob from '@/components/SubmodelElements/Blob.vue'

const {
  putRequestMock,
  fetchAndDispatchSmeMock,
  extractEndpointHrefMock,
} = vi.hoisted(() => ({
  putRequestMock: vi.fn(),
  fetchAndDispatchSmeMock: vi.fn(),
  extractEndpointHrefMock: vi.fn(),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    putRequest: putRequestMock,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    fetchAndDispatchSme: fetchAndDispatchSmeMock,
  }),
}))

vi.mock('@/utils/AAS/DescriptorUtils', () => ({
  extractEndpointHref: extractEndpointHrefMock,
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: { id: 'aas-1' },
    getSelectedNode: {
      path: 'submodels/sm/submodel-elements/blob-b',
      idShort: 'BlobB',
    },
  }),
}))

describe('Blob.vue', () => {
  beforeEach(() => {
    putRequestMock.mockReset()
    fetchAndDispatchSmeMock.mockReset()
    extractEndpointHrefMock.mockReset()

    putRequestMock.mockResolvedValue({ success: true })
    extractEndpointHrefMock.mockReturnValue('https://example.test/aas/shell-1')
  })

  it('targets selected node path when updating blob value', async () => {
    const wrapper = mount(Blob, {
      props: {
        isEditable: true,
        blobObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/blob-a',
          modelType: 'Blob',
          idShort: 'BlobA',
          contentType: 'text/plain',
          value: btoa('hello'),
        },
      },
      global: {
        stubs: {
          'v-container': true,
          'v-list-item': true,
          'v-list-item-title': true,
          'v-card': true,
          'v-list': true,
          'v-chip': true,
          'v-btn': true,
          'v-textarea': true,
          'v-icon': true,
        },
      },
    })

    await (wrapper.vm as any).updateBlob()
    await Promise.resolve()

    expect(putRequestMock).toHaveBeenCalledTimes(1)
    expect(putRequestMock.mock.calls[0][0]).toBe(
      'https://example.test/aas/shell-1/submodels/sm/submodel-elements/blob-b/value',
    )
  })
})
