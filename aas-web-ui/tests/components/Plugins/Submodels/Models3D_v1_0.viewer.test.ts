import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Models3DViewerCard from '@/components/Plugins/Submodels/Models3D_v1_0/components/Models3DViewerCard.vue'
import { resolveCadFormat } from '@/utils/AAS/CadFormat'

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ downloadFile: vi.fn() }),
}))

const slotStub = { template: '<div><slot /></div>' }

function mountViewer (version: Record<string, unknown>) {
  return mount(Models3DViewerCard, {
    props: { title: 'Part', version: version as never },
    global: {
      stubs: {
        'v-sheet': slotStub,
        'v-chip': slotStub,
        'v-btn-group': slotStub,
        'v-btn': slotStub,
        'v-icon': true,
        'v-tooltip': true,
        'Models3DPreviewImage': true,
        'CADPreview': { name: 'CADPreview', props: ['submodelElementData', 'fill'], template: '<div data-test="cad" />' },
      },
    },
  })
}

const baseVersion = {
  key: 'v',
  format: { name: 'glTF', version: '2.0', qualifier: '' },
  previewFile: null,
  externalFiles: [],
}

describe('Models3DViewerCard', () => {
  it('passes the file name of the version to the viewer, keeping the attachment metadata', () => {
    const digitalFile = {
      modelType: 'File',
      idShort: 'DigitalFile',
      contentType: 'application/octet-stream',
      value: 'https://example.com/download/123',
      path: '/submodels/abc/submodel-elements/DigitalFile',
    }
    const wrapper = mountViewer({ ...baseVersion, fileName: 'part.glb', digitalFile })

    const passed = wrapper.getComponent({ name: 'CADPreview' }).props('submodelElementData')
    expect(passed).toMatchObject({ ...digitalFile, fileName: 'part.glb' })
    // the extensionless URL and the generic content type alone would not be recognized
    expect(resolveCadFormat(digitalFile)).toBeNull()
    expect(resolveCadFormat(passed)).toBe('gltf')
  })

  it('passes the File element unchanged if the version has no file name', () => {
    const digitalFile = { modelType: 'File', contentType: 'model/gltf-binary', value: '/a/b.glb' }
    const wrapper = mountViewer({ ...baseVersion, fileName: '', digitalFile })

    expect(wrapper.getComponent({ name: 'CADPreview' }).props('submodelElementData')).toEqual(digitalFile)
  })
})
