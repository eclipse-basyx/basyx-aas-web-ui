import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DefinitionForm from './DefinitionForm.vue'

vi.mock('../../../hooks/forms/useDefinitionNames', () => ({ useDefinitionNames: () => [] }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('definition form decoded-state fallback', () => {
  it('fills either missing object source using the existing controls', async () => {
    const wrapper = shallowMount(DefinitionForm, {
      props: { kind: 'objects', doc: { name: 'pending' } },
      global: { stubs: { VCombobox: { name: 'VCombobox', props: ['modelValue'], inheritAttrs: false, template: '<div />' } } },
    })
    try {
      expect(wrapper.emitted('update:doc')).toBeUndefined()
      const entries = wrapper.findComponent({ name: 'ObjectListEditor' })
      expect(entries.props('modelValue')).toEqual([])
      entries.vm.$emit('update:modelValue', [{ kind: 'ROUTE', value: '/shells' }])
      expect(wrapper.emitted('update:doc')?.at(-1)).toEqual([{ name: 'pending', objects: [{ ROUTE: '/shells' }] }])
      await wrapper.setProps({ doc: { name: 'pending', objects: [{ ROUTE: '/shells' }] } })
      wrapper.findComponent({ name: 'VCombobox' }).vm.$emit('update:modelValue', ['shared'])
      expect(wrapper.emitted('update:doc')?.at(-1)).toEqual([{ name: 'pending', objects: [{ ROUTE: '/shells' }], USEOBJECTS: ['shared'] }])
    } finally {
      wrapper.unmount()
    }
  })

  it.each([
    { kind: 'attributes', doc: { attributes: [{ CLAIM: 'role' }] }, field: 'attributes', editor: 'AttributeListEditor' },
    { kind: 'objects', doc: { objects: [{ ROUTE: '/shells' }] }, field: 'objects', editor: 'ObjectListEditor' },
  ] as const)('routes $kind diagnostics to its entry list', ({ kind, doc, field, editor }) => {
    const wrapper = shallowMount(DefinitionForm, {
      props: { kind, doc, warningPaths: [[field, '0', 'value']], errorPaths: [['name']] },
    })
    try {
      expect(wrapper.findComponent({ name: editor }).props('warningPaths')).toEqual([['0', 'value']])
      expect(wrapper.findComponent({ name: editor }).props('errorPaths')).toEqual([])
    } finally {
      wrapper.unmount()
    }
  })

  it('edits object entries and references together without a source selector', async () => {
    const doc = { name: 'routes', objects: [{ ROUTE: '/shells' }], USEOBJECTS: ['other'] }
    const wrapper = shallowMount(DefinitionForm, {
      props: { kind: 'objects', doc },
      global: { stubs: { VCombobox: { name: 'VCombobox', props: ['modelValue'], inheritAttrs: false, template: '<div />' } } },
    })
    try {
      expect(wrapper.find('v-select-stub').exists()).toBe(false)
      const entries = wrapper.findComponent({ name: 'ObjectListEditor' })
      expect(entries.props('modelValue')).toEqual([{ kind: 'ROUTE', value: '/shells' }])
      entries.vm.$emit('update:modelValue', [{ kind: 'ROUTE', value: '/submodels' }])
      expect(wrapper.emitted('update:doc')?.at(-1)).toEqual([{ ...doc, objects: [{ ROUTE: '/submodels' }] }])
      await wrapper.setProps({ doc: { ...doc, objects: [{ ROUTE: '/submodels' }] } })
      const references = wrapper.findComponent({ name: 'VCombobox' })
      references.vm.$emit('update:modelValue', [])
      expect(wrapper.emitted('update:doc')?.at(-1)).toEqual([{ name: 'routes', objects: [{ ROUTE: '/submodels' }] }])
    } finally {
      wrapper.unmount()
    }
  })

  it('retains the last supported draft during unsupported input and resumes on valid input', async () => {
    const wrapper = shallowMount(DefinitionForm, { props: { kind: 'acls', doc: { acl: { ACCESS: 'ALLOW' } } } })
    try {
      expect(wrapper.findComponent({ name: 'AclForm' }).props('modelValue')).toEqual({ access: 'ALLOW' })
      await wrapper.setProps({ doc: { acl: 'unsupported' } })
      expect(wrapper.findComponent({ name: 'AclForm' }).props('modelValue')).toEqual({ access: 'ALLOW' })
      await wrapper.setProps({ doc: { acl: { ACCESS: 'DISABLED' } } })
      expect(wrapper.findComponent({ name: 'AclForm' }).props('modelValue')).toEqual({ access: 'DISABLED' })
      expect(wrapper.emitted('update:doc')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })
})
