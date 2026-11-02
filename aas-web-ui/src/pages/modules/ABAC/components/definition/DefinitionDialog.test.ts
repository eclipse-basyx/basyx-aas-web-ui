import { flushPromises, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../../i18n/locales'
import DefinitionDialog from './DefinitionDialog.vue'

vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: vi.fn() }) }))
vi.mock('../../hooks/navigation/useAbacNavigation', () => ({ useAbacNavigation: () => ({ selectedPolicyVersion: ref('7'), onSelectDefinition: vi.fn() }) }))
vi.mock('../../api/definition/useCreateDefinition', () => ({ useCreateDefinition: () => ({ mutateAsync: vi.fn(), isPending: ref(false) }) }))
vi.mock('../../api/definition/useUpdateDefinition', () => ({ useUpdateDefinition: () => ({ mutateAsync: vi.fn(), isPending: ref(false) }) }))
const diagnostics = vi.hoisted(() => ({ advisory: null as null | { title: string, paths: string[][] } }))
vi.mock('../../hooks/validations/useLiveValidation', () => ({ useLiveValidation: () => ({ error: ref(null), errorPaths: ref([]), advisory: ref(diagnostics.advisory), saveError: ref(null), validateNow: vi.fn() }) }))
vi.mock('../../i18n/useAbacI18n', () => ({
  useAbacI18n: () => ({
    t: (key: string) => key,
    tm: (key: string) => key === 'validation' ? en.validation : en.definitions.definitionDialog.errors,
    i18nData: () => ({}),
  }),
}))

describe('definition dialog sessions', () => {
  it('marks the content section for root-level definition advisories', async () => {
    diagnostics.advisory = { title: 'Alternatives advisory', paths: [[]] }
    const wrapper = shallowMount(DefinitionDialog, {
      global: { renderStubDefaultSlot: true, stubs: { AbacDialog: { template: '<div><slot name="form" /></div>' } } },
    })
    try {
      wrapper.vm.open({ mode: 'create', kind: 'attributes' })
      await flushPromises()
      const groups = wrapper.findAllComponents({ name: 'FormGroup' })
      expect(groups.find(group => group.props('value') === 'content')!.props('warning')).toBe(true)
      expect(groups.find(group => group.props('value') === 'details')!.props('warning')).toBe(false)
    } finally {
      wrapper.unmount()
      diagnostics.advisory = null
    }
  })

  it('keeps expansion within a session and restores defaults when reopened for another definition', async () => {
    const wrapper = shallowMount(DefinitionDialog, {
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          AbacDialog: { name: 'AbacDialog', props: ['modelValue', 'editorMode'], template: '<div><slot name="form" /><slot name="json" /></div>' },
          VExpansionPanels: { name: 'VExpansionPanels', props: ['modelValue'], emits: ['update:modelValue'], template: '<div><slot /></div>' },
        },
      },
    })
    try {
      wrapper.vm.open({ mode: 'create', kind: 'attributes' })
      await flushPromises()
      const panels = wrapper.findComponent({ name: 'VExpansionPanels' })
      const kindFields = () => wrapper.findAllComponents({ name: 'VSelect' })
      expect(kindFields()).toHaveLength(2)
      expect(kindFields().every(field => field.attributes('label') === 'definitions.definitionDialog.kind *')).toBe(true)
      expect(kindFields().every(field => field.attributes('aria-required') === 'true')).toBe(true)
      expect(panels.props('modelValue')).toEqual(['details', 'content'])
      panels.vm.$emit('update:modelValue', [])
      await flushPromises()
      expect(panels.props('modelValue')).toEqual([])
      const dialog = wrapper.findComponent({ name: 'AbacDialog' })
      dialog.vm.$emit('switch', 'json')
      await flushPromises()
      dialog.vm.$emit('switch', 'form')
      await flushPromises()
      expect(panels.props('modelValue')).toEqual([])
      dialog.vm.$emit('update:modelValue', false)
      await flushPromises()
      wrapper.vm.open({ mode: 'update', kind: 'attributes', definition: { name: 'another', attributes: [{ CLAIM: 'role' }] } })
      await flushPromises()
      expect(panels.props('modelValue')).toEqual(['details', 'content'])
      expect(kindFields().every(field => field.attributes('label') === 'definitions.definitionDialog.kind')).toBe(true)
      expect(kindFields().every(field => field.attributes('aria-required') === 'false')).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })
})
