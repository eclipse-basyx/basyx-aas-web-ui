import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import File from '@/components/SubmodelElements/File.vue'

const patchRequestMock = vi.fn()
const fetchAndDispatchSmeMock = vi.fn()
const valueBlobMock = vi.fn()
const determineContentTypeMock = vi.fn()
const putAttachmentFileMock = vi.fn()
const putSubmodelElementMock = vi.fn()
const fetchSmeMock = vi.fn()

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

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({
    valueBlob: valueBlobMock,
    determineContentType: determineContentTypeMock,
  }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    putAttachmentFile: putAttachmentFileMock,
    putSubmodelElement: putSubmodelElementMock,
    fetchSme: fetchSmeMock,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedNode: { path: 'https://example.test/submodels/sm/submodel-elements/file-selected' },
  }),
}))

describe('File.vue', () => {
  beforeEach(() => {
    patchRequestMock.mockReset()
    fetchAndDispatchSmeMock.mockReset()
    valueBlobMock.mockReset()
    determineContentTypeMock.mockReset()
    putAttachmentFileMock.mockReset()
    putSubmodelElementMock.mockReset()
    fetchSmeMock.mockReset()

    patchRequestMock.mockResolvedValue({ success: true })
    valueBlobMock.mockResolvedValue('')
  })

  it('uses the current file path after switching selection', async () => {
    const wrapper = mount(File, {
      props: {
        isEditable: true,
        fileObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/file-a',
          modelType: 'File',
          idShort: 'FileA',
          value: 'file:/a.txt',
          contentType: 'text/plain',
        },
      },
      global: {
        stubs: {
          'v-container': true,
          'v-card': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-title': true,
          'v-text-field': true,
          'v-btn': true,
          'v-icon': true,
          'v-divider': true,
          'v-file-input': true,
          'v-chip': true,
        },
      },
    })

    await wrapper.setProps({
      fileObject: {
        path: 'https://example.test/submodels/sm/submodel-elements/file-b',
        modelType: 'File',
        idShort: 'FileB',
        value: 'file:/b.txt',
        contentType: 'text/plain',
      },
    })

    await (wrapper.vm as any).updatePath()

    expect(patchRequestMock).toHaveBeenCalledTimes(1)
    expect(patchRequestMock.mock.calls[0][0]).toBe(
      'https://example.test/submodels/sm/submodel-elements/file-b/$value',
    )
  })
})
