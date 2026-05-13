import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AssetInformation from '@/components/UIComponents/AssetInformation.vue'

const getBlobUrlMock = vi.fn(async () => '')
const getProductImageUrlByAasIdMock = vi.fn(async () => ({ url: '', isExternal: false }))

vi.mock('@/composables/UrlUtils', () => ({
  useUrlUtils: () => ({
    getBlobUrl: getBlobUrlMock,
  }),
}))

vi.mock('@/composables/AAS/SubmodelTemplates/TechnicalData_v1_2Utils', () => ({
  useTechnicalData_v1_2Utils: () => ({
    getProductImageUrlByAasId: getProductImageUrlByAasIdMock,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: {
      id: 'aas-1',
    },
  }),
}))

describe('AssetInformation.vue QR visibility', () => {
  function mountAssetInformation (globalAssetId: string) {
    return mount(AssetInformation, {
      props: {
        assetObject: {
          assetKind: 'Instance',
          globalAssetId,
          specificAssetIds: [],
        },
      },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          'IdentificationElement': true,
          'SpecificAssetIds': true,
          'GlobalAssetQrCode': true,
          'v-container': true,
          'v-list': true,
          'v-divider': true,
          'v-expansion-panels': true,
          'v-expansion-panel': true,
          'v-expansion-panel-title': true,
          'v-expansion-panel-text': true,
          'v-icon': true,
          'v-img': true,
        },
      },
    })
  }

  it.each([
    ['url', 'https://example.com/asset/123'],
    ['urn', 'urn:uuid:550e8400-e29b-41d4-a716-446655440000'],
    ['iri', 'https://example.com/ids/aas/1000_2000_3000_4000'],
    ['irdi', '0173-1#02-BAF016#008'],
    ['generic', 'asset-id-plain-string'],
  ])('shows QR panel for %s global asset ID', (_label, globalAssetId) => {
    const wrapper = mountAssetInformation(globalAssetId)

    expect(wrapper.find('v-expansion-panels-stub').exists()).toBe(true)
  })

  it('hides QR panel for empty global asset ID', () => {
    const wrapper = mountAssetInformation('   ')

    expect(wrapper.find('v-expansion-panels-stub').exists()).toBe(false)
  })
})
