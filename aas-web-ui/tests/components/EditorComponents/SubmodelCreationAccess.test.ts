import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JsonInsert from '@/components/EditorComponents/JsonInsert.vue'
import SubmodelForm from '@/components/EditorComponents/SubmodelForm.vue'

const mocks = vi.hoisted(() => ({
  capability: vi.fn(), post: vi.fn(), putAas: vi.fn(), descriptor: vi.fn(), snackbar: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'AASEditor', query: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => ({ getSelectedAAS: { id: 'urn:aas' } }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({ supportsResourceAccess: () => true, getAASRepoURL: 'https://example.test/shells', getSelectedInfrastructure: null }) }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: mocks.snackbar }) }))
vi.mock('@/composables/Client/AASRepositoryClient', () => ({ useAASRepositoryClient: () => ({ fetchAasUpdateCapability: mocks.capability, putAas: mocks.putAas }) }))
vi.mock('@/composables/Client/SMRepositoryClient', () => ({ useSMRepositoryClient: () => ({
  postSubmodel: mocks.post,
  consumeLastRequestFailureStatus: () => 500,
  consumeLastRequestFailureDetails: () => '',
}) }))
vi.mock('@/composables/Client/SMRegistryClient', () => ({ useSMRegistryClient: () => ({ postSubmodelDescriptor: mocks.descriptor }) }))
vi.mock('@/composables/AAS/SMHandling', () => ({ useSMHandling: () => ({}) }))
vi.mock('@/composables/IDUtils', () => ({ useIDUtils: () => ({ generateUUID: () => 'urn:new-submodel' }) }))

// Keep the dialogs' children out of these persistence-boundary tests.
const global = { stubs: { VDialog: true } }

describe('AAS editor submodel creation access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.post.mockResolvedValue(false)
  })

  for (const mode of ['form', 'json']) {
    it.each([false, undefined])(`blocks ${mode} creation without verified UPDATE and preserves the draft (%s)`, async capability => {
      mocks.capability.mockResolvedValue(capability)
      const wrapper = mode === 'form'
        ? shallowMount(SubmodelForm, { props: { modelValue: true, newSm: true }, global })
        : shallowMount(JsonInsert, { props: { modelValue: true, type: 'Submodel' }, global })
      const vm = wrapper.vm as any
      if (mode === 'form') {
        await vm.saveSubmodel()
        expect(vm.submodelId).toBe('urn:new-submodel')
      } else {
        vm.jsonInput = JSON.stringify({ modelType: 'Submodel', id: 'urn:new-submodel' })
        vm.insertJson()
        await flushPromises()
        expect(vm.jsonInput).toContain('urn:new-submodel')
      }
      expect(mocks.capability).toHaveBeenCalledWith('urn:aas')
      expect(mocks.post).not.toHaveBeenCalled()
      expect(mocks.putAas).not.toHaveBeenCalled()
      expect(mocks.descriptor).not.toHaveBeenCalled()
      expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({ color: 'warning' }))
      wrapper.unmount()
    })

    it(`waits for an affirmative capability before the first ${mode} write`, async () => {
      let resolve!: (value: boolean) => void
      mocks.capability.mockReturnValue(new Promise<boolean>(done => {
        resolve = done
      }))
      const wrapper = mode === 'form'
        ? shallowMount(SubmodelForm, { props: { modelValue: true, newSm: true }, global })
        : shallowMount(JsonInsert, { props: { modelValue: true, type: 'Submodel' }, global })
      const vm = wrapper.vm as any
      if (mode === 'form') {
        void vm.saveSubmodel()
      } else {
        vm.jsonInput = JSON.stringify({ modelType: 'Submodel', id: 'urn:new-submodel' })
        vm.insertJson()
      }
      await flushPromises()
      expect(mocks.post).not.toHaveBeenCalled()
      resolve(true)
      await flushPromises()
      expect(mocks.post).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })
  }
})
