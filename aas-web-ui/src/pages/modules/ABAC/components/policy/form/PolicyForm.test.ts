import type { JsonObject } from '../../../types/json'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_DEFINITION, EMPTY_RULE } from '../../../constants/json'
import CollapsibleList from '../../shared/list/CollapsibleList.vue'
import PolicyForm from './PolicyForm.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key, i18nData: () => ({}) }) }))

function mountPolicyForm (doc: JsonObject, errorPaths?: string[][]) {
  return shallowMount(PolicyForm, {
    props: { doc, errorPaths },
    global: {
      renderStubDefaultSlot: true,
      stubs: { CollapsibleList: false, DraggableList: false, VueDraggable: false, VExpansionPanels: true, VBtn: true, VTextField: { name: 'VTextField', props: ['prefix'], template: '<input />' }, VIcon: true, RuleForm: { name: 'RuleForm', props: ['doc', 'errorPaths', 'warningPaths'], emits: ['update:doc'], template: '<input aria-label="local rule draft" />' } },
    },
  })
}

describe('policy form row expansion', () => {
  it('adds the first rule to a policy without a rules property and opens its editor', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: {} })
    try {
      expect(wrapper.emitted('update:doc')).toBeUndefined()
      wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === 'forms.policy.addRule')!.vm.$emit('click')
      const doc = wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject
      expect(doc).toEqual({ AllAccessPermissionRules: { rules: [EMPTY_RULE] } })
      await wrapper.setProps({ doc })
      expect(wrapper.findComponent({ name: 'RuleForm' }).exists()).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['attributes', 'acls', 'objects', 'formulas', 'rules'] as const)('opens only the explicitly added %s row, including identical entries', async kind => {
    const kinds = ['attributes', 'acls', 'objects', 'formulas', 'rules'] as const
    const keys = { attributes: 'DEFATTRIBUTES', acls: 'DEFACLS', objects: 'DEFOBJECTS', formulas: 'DEFFORMULAS', rules: 'rules' }
    const entry = kind === 'rules' ? EMPTY_RULE : EMPTY_DEFINITION[kind]
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { rules: [], [keys[kind]]: [structuredClone(entry), structuredClone(entry)] } })
    const list = () => wrapper.findAllComponents(CollapsibleList)[kinds.indexOf(kind)]!
    const expanded = () => list().findAll('.abac-sortable-header > div:first-child > button').map(button => button.attributes('aria-expanded'))
    try {
      expect(expanded()).toEqual(['false', 'false'])
      await list().findAll('.abac-sortable-header > div:first-child > button')[1]!.trigger('click')
      const add = wrapper.findAllComponents({ name: 'VBtn' }).filter(button => button.text() === (kind === 'rules' ? 'forms.policy.addRule' : 'forms.policy.addDefinition'))
      add[kind === 'rules' ? 0 : kinds.indexOf(kind)]!.vm.$emit('click')
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject })
      expect(expanded()).toEqual(['false', 'true', 'true'])
      await list().findAll('.abac-sortable-header > div:first-child > button')[2]!.trigger('click')
      const serializedDraft = JSON.stringify(wrapper.props('doc'))
      await wrapper.setProps({ doc: JSON.parse(serializedDraft) })
      expect(expanded()).toEqual(['false', 'true', 'false'])
    } finally {
      wrapper.unmount()
    }
  })

  it('preserves a duplicate rule editor through parent decoding, edits, and reordering', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { rules: [structuredClone(EMPTY_RULE), structuredClone(EMPTY_RULE)] } })
    const list = () => wrapper.findAllComponents(CollapsibleList).at(-1)!
    const titles = () => list().findAll('.abac-sortable-header > div:first-child > button')
    const commit = async () => {
      const serialized = JSON.stringify(wrapper.emitted('update:doc')!.at(-1)![0])
      await wrapper.setProps({ doc: JSON.parse(serialized) as JsonObject })
    }
    try {
      await titles()[0]!.trigger('click')
      const draft = wrapper.get('input[aria-label="local rule draft"]').element
      await wrapper.get('input[aria-label="local rule draft"]').setValue('nested draft')
      const editor = wrapper.findComponent({ name: 'RuleForm' })
      editor.vm.$emit('update:doc', { ...editor.props('doc'), USEFORMULA: 'edited' })
      await commit()
      expect(titles().map(button => button.attributes('aria-expanded'))).toEqual(['true', 'false'])
      await list().get('.abac-drag-handle').trigger('keydown.down')
      await commit()
      expect(titles().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true'])
      await titles()[1]!.trigger('click')
      await titles()[1]!.trigger('click')
      expect(wrapper.get('input[aria-label="local rule draft"]').element).toBe(draft)
      expect((draft as HTMLInputElement).value).toBe('nested draft')
    } finally {
      wrapper.unmount()
    }
  })

  it('shows advisories and errors on a policy definition name', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { DEFATTRIBUTES: [{ name: 'name', attributes: [] }], rules: [] } })
    try {
      await wrapper.get('button[aria-expanded]').trigger('click')
      await wrapper.setProps({ warningPaths: [['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'name']] })
      const name = () => wrapper.findComponent({ name: 'VTextField' })
      expect(name().attributes('basecolor')).toBe('warning')
      expect(name().attributes('messages')).toBe('forms.validation.fieldWarning')
      await wrapper.setProps({ errorPaths: [['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'name']] })
      expect(name().attributes('aria-invalid')).toBe('true')
      expect(name().attributes('messages')).toBe('forms.validation.fieldError')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps bulk-loaded rule and definition rows collapsed after an earlier Add', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { rules: [] } })
    try {
      wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === 'forms.policy.addRule')!.vm.$emit('click')
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject })
      await wrapper.setProps({ doc: { AllAccessPermissionRules: { rules: [] } } })
      await wrapper.setProps({ doc: { AllAccessPermissionRules: {
        DEFATTRIBUTES: [structuredClone(EMPTY_DEFINITION.attributes), structuredClone(EMPTY_DEFINITION.attributes)],
        rules: [structuredClone(EMPTY_RULE), structuredClone(EMPTY_RULE), structuredClone(EMPTY_RULE)],
      } } })
      expect(wrapper.findAll('.abac-sortable-header > div:first-child > button').map(button => button.attributes('aria-expanded')))
        .toEqual(['false', 'false', 'false', 'false', 'false'])
      expect(wrapper.findComponent({ name: 'RuleForm' }).exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('opens an added definition and retains an existing editor across index shifts', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { DEFACLS: [{ name: 'acl', acl: {} }], rules: [] } })
    try {
      await wrapper.get('button').trigger('click')
      expect(wrapper.findComponent({ name: 'DefinitionForm' }).exists()).toBe(true)
      const addAttribute = wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === 'forms.policy.addDefinition')!
      addAttribute.vm.$emit('click')
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')![0]![0] as JsonObject })
      expect(wrapper.findAllComponents({ name: 'DefinitionForm' })).toHaveLength(2)
    } finally {
      wrapper.unmount()
    }
  })

  it('retains the active editor when deleting an earlier row shifts its index', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: { DEFATTRIBUTES: [
      { name: 'first', attributes: [] }, { name: 'second', attributes: [] },
    ], rules: [] } })
    try {
      await wrapper.findAll('button').find(button => button.text() === 'second')!.trigger('click')
      expect(wrapper.findComponent({ name: 'DefinitionForm' }).exists()).toBe(true)
      const removeFirst = wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.attributes('aria-label') === 'forms.list.remove')!
      removeFirst.vm.$emit('click')
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')![0]![0] as JsonObject })
      expect(wrapper.findComponent({ name: 'DefinitionForm' }).props('doc')).toMatchObject({ name: 'second' })
    } finally {
      wrapper.unmount()
    }
  })
})

describe('policy form validation indicators', () => {
  it('keeps schema advisory indicators separate from errors and forwards warning paths to rules', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: {
      DEFATTRIBUTES: [{ name: 'claims', attributes: [] }],
      rules: [{ USEACL: 'acl' }],
    } })
    try {
      await wrapper.setProps({ warningPaths: [
        ['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'attributes'],
        ['AllAccessPermissionRules', 'rules', '0', 'FORMULA'],
      ] })
      const groups = wrapper.findAllComponents({ name: 'FormGroup' })
      expect(groups.every(group => !group.props('error'))).toBe(true)
      expect(groups.map(group => group.props('warning'))).toEqual([true, false, false, false, true])
      expect(wrapper.findAll('.abac-sortable-header .text-warning')).toHaveLength(2)
      await wrapper.findAll('button').findLast(button => button.text() === 'forms.policy.ruleIndex')!.trigger('click')
      expect(wrapper.findComponent({ name: 'RuleForm' }).props('warningPaths')).toEqual([['FORMULA']])
      expect(wrapper.findComponent({ name: 'RuleForm' }).props('errorPaths')).toEqual([])
    } finally {
      wrapper.unmount()
    }
  })

  it('shows the specific required-name error beneath a blank definition name', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: {
      DEFATTRIBUTES: [{ name: '', attributes: [] }], rules: [],
    } }, [['AllAccessPermissionRules', 'DEFATTRIBUTES', '0', 'name']])
    try {
      await wrapper.find('.abac-sortable-header button[aria-expanded]').trigger('click')
      expect(wrapper.findComponent({ name: 'VTextField' }).attributes('error-messages')).toBe('definitions.definitionDialog.errors.requiredName')
    } finally {
      wrapper.unmount()
    }
  })

  it('maps category-local indexes and passes relative paths to nested rule editors', async () => {
    const wrapper = mountPolicyForm({ AllAccessPermissionRules: {
      DEFATTRIBUTES: [{ name: 'claims', attributes: [] }],
      DEFACLS: [{ name: 'acl', acl: {} }],
      rules: [{ USEACL: 'acl' }, { USEACL: 'acl' }],
    } }, [
      ['AllAccessPermissionRules', 'DEFACLS', '0', 'name'],
      ['AllAccessPermissionRules', 'rules', '1', 'FILTER', 'FRAGMENT'],
    ])
    try {
      const groups = wrapper.findAllComponents({ name: 'FormGroup' })
      expect(groups.map(group => group.props('error'))).toEqual([false, true, false, false, true])
      expect(wrapper.findAll('.abac-sortable-header .text-error')).toHaveLength(2)
      const aclButton = wrapper.findAll('button').find(button => button.text() === 'acl')!
      await aclButton.trigger('click')
      expect(wrapper.findComponent({ name: 'VTextField' }).attributes('error')).toBe('true')
      await wrapper.findAll('button').findLast(button => button.text() === 'forms.policy.ruleIndex')!.trigger('click')
      expect(wrapper.findComponent({ name: 'RuleForm' }).props('errorPaths')).toEqual([['FILTER', 'FRAGMENT']])
      await wrapper.setProps({ errorPaths: [['AllAccessPermissionRules']] })
      expect(groups.every(group => !group.props('error'))).toBe(true)
      expect(wrapper.findAll('.abac-sortable-header .text-error')).toHaveLength(0)
    } finally {
      wrapper.unmount()
    }
  })
})
