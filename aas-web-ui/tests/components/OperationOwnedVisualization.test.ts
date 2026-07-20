import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SubmodelElementVisualization from '@/components/SubmodelElementVisualization.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'AASEditor' }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: { id: 'aas' },
    getSelectedNode: {
      modelType: 'File',
      idShort: 'owned-file',
      value: 'file:/document.json',
      contentType: 'application/json',
      path: '/operations/op#/inputVariables/0/value',
      persistence: {
        kind: 'operation',
        operationPath: '/operations/op',
        fragment: '/inputVariables/0/value',
      },
    },
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({ getAASRegistryURL: '', getSubmodelRegistryURL: '' }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getPlugins: [] }),
}))

describe('Operation-owned File visualization', () => {
  it('does not mount an attachment preview for a synthetic File node', async () => {
    const wrapper = mount(SubmodelElementVisualization, {
      global: {
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-alert': { template: '<div><slot /></div>' },
          'v-empty-state': true,
          'ImagePreview': { template: '<div data-test="attachment-preview" />' },
          'PDFPreview': { template: '<div data-test="attachment-preview" />' },
          'CADPreview': { template: '<div data-test="attachment-preview" />' },
          'XMLPreview': { template: '<div data-test="attachment-preview" />' },
          'JSONPreview': { template: '<div data-test="attachment-preview" />' },
          'IfcPreview': { template: '<div data-test="attachment-preview" />' },
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-test="attachment-preview"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('no attachment endpoint')
  })
})
