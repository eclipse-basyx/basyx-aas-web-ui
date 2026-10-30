import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Blob from '@/components/SubmodelElements/Blob.vue'

const { patchRequestMock, fetchAndDispatchSmeMock } = vi.hoisted(() => ({
  patchRequestMock: vi.fn(),
  fetchAndDispatchSmeMock: vi.fn(),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    patchRequest: patchRequestMock,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    fetchAndDispatchSme: fetchAndDispatchSmeMock,
  }),
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
    patchRequestMock.mockReset()
    fetchAndDispatchSmeMock.mockReset()

    patchRequestMock.mockResolvedValue({ success: true })
  })

  it('PATCHes the blob value-only payload to the SME own $value endpoint', async () => {
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

    expect(patchRequestMock).toHaveBeenCalledTimes(1)
    const [url, body] = patchRequestMock.mock.calls[0]
    // Must not be prefixed with an AAS endpoint, the SME path is already a full URL
    expect(url).toBe('https://example.test/submodels/sm/submodel-elements/blob-a/$value')
    expect(JSON.parse(body)).toEqual({ contentType: 'text/plain', value: btoa('hello') })
    expect(fetchAndDispatchSmeMock).toHaveBeenCalledWith('submodels/sm/submodel-elements/blob-b', false)
  })
})
