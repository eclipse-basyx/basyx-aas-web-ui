import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MultiLanguageProperty from '@/components/SubmodelElements/MultiLanguageProperty.vue'

const patchRequestMock = vi.fn()
const fetchAndDispatchSmeMock = vi.fn()

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
    getSelectedNode: { path: 'https://example.test/submodels/sm/submodel-elements/mlp-b' },
  }),
}))

describe('MultiLanguageProperty.vue', () => {
  beforeEach(() => {
    patchRequestMock.mockReset()
    fetchAndDispatchSmeMock.mockReset()
    patchRequestMock.mockResolvedValue({ success: true })
  })

  it('uses the current prop path after switching selected MLP', async () => {
    const wrapper = mount(MultiLanguageProperty, {
      props: {
        isEditable: true,
        multiLanguagePropertyObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/mlp-a',
          modelType: 'MultiLanguageProperty',
          idShort: 'MlpA',
          value: [{ language: 'en', text: 'A' }],
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
          'v-chip': true,
          'v-icon': true,
          'v-menu': true,
          'v-btn': true,
          'v-alert': true,
          'v-divider': true,
        },
      },
    })

    await wrapper.setProps({
      multiLanguagePropertyObject: {
        path: 'https://example.test/submodels/sm/submodel-elements/mlp-b',
        modelType: 'MultiLanguageProperty',
        idShort: 'MlpB',
        value: [{ language: 'en', text: 'B' }],
      },
    })

    await (wrapper.vm as any).updateMLP()

    expect(patchRequestMock).toHaveBeenCalledTimes(1)
    expect(patchRequestMock.mock.calls[0][0]).toBe(
      'https://example.test/submodels/sm/submodel-elements/mlp-b/$value',
    )
  })

  it('refreshes selected node after a successful update', async () => {
    const wrapper = mount(MultiLanguageProperty, {
      props: {
        isEditable: true,
        multiLanguagePropertyObject: {
          path: 'https://example.test/submodels/sm/submodel-elements/mlp-b',
          modelType: 'MultiLanguageProperty',
          idShort: 'MlpB',
          value: [{ language: 'en', text: 'B' }],
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
          'v-chip': true,
          'v-icon': true,
          'v-menu': true,
          'v-btn': true,
          'v-alert': true,
          'v-divider': true,
        },
      },
    })

    await (wrapper.vm as any).updateMLP()

    expect(fetchAndDispatchSmeMock).toHaveBeenCalledWith(
      'https://example.test/submodels/sm/submodel-elements/mlp-b',
      false,
    )
  })
})
