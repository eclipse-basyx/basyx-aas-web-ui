import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import GrantManager from '@/components/ResourceAccess/GrantManager.vue'
import PolicyManager from '@/components/ResourceAccess/PolicyManager.vue'
import PrincipalManager from '@/components/ResourceAccess/PrincipalManager.vue'

const stubs = {
  VAlert: { template: '<div><slot /><slot name="append" /></div>' },
  VBtn: { emits: ['click'], props: ['disabled'], template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>' },
  VCard: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VCardSubtitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VChip: { template: '<span><slot /></span>' },
  VList: { template: '<div><slot /></div>' },
  VListItem: { template: '<div><slot /><slot name="append" /></div>' },
  VListItemSubtitle: { template: '<div><slot /></div>' },
  VListItemTitle: { template: '<div><slot /></div>' },
  VSheet: { template: '<div><slot /></div>' },
  VSpacer: true,
  VSelect: true,
  CodeEditor: { props: ['modelValue', 'error'], emits: ['update:modelValue'], template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
  PrincipalInput: true,
  SharingRolePicker: true,
  SharingPeopleList: true,
}

describe('Resource access components', () => {
  it('does not remove the final owner', async () => {
    const owner = { issuer: 'https://issuer', subject: 'owner' }
    const wrapper = mount(PrincipalManager, {
      props: { modelValue: [owner], title: 'Owners', description: 'Owners', required: true },
      global: { stubs },
    })
    ;(wrapper.vm as any).remove(0)
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('owner')
  })

  it('adds, de-duplicates, and removes manager principals', async () => {
    const manager = { issuer: 'https://issuer', subject: 'manager' }
    const wrapper = mount(PrincipalManager, {
      props: { modelValue: [], title: 'Managers', description: 'Managers' },
      global: { stubs },
    })
    ;(wrapper.vm as any).add(manager)
    await wrapper.setProps({ modelValue: [manager] })
    ;(wrapper.vm as any).add(manager)
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[[manager]]])
    ;(wrapper.vm as any).remove(0)
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
  })

  it('keeps a person and group with the same name distinct and recognizes legacy users', async () => {
    const user = { issuer: 'https://issuer', subject: 'team' }
    const group = { ...user, type: 'group' as const }
    const wrapper = mount(PrincipalManager, {
      props: { modelValue: [user], title: 'Owners', description: '', required: true }, global: { stubs },
    })
    ;(wrapper.vm as any).add({ ...user, type: 'user' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    ;(wrapper.vm as any).add(group)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[user, group]])
    await wrapper.setProps({ modelValue: [group] })
    ;(wrapper.vm as any).remove(0)
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('lets users prepare sharing while access is inherited', async () => {
    const wrapper = mount(GrantManager, {
      props: { grants: [], hasLocalPolicy: false },
      global: { stubs },
    })
    await wrapper.findAll('button').find(button => button.text().includes('Share access'))?.trigger('click')
    ;(wrapper.vm as any).setPrincipal({ issuer: 'https://issuer', subject: 'reader' })
    ;(wrapper.vm as any).save()
    expect(wrapper.emitted('create')?.[0]?.[0]).toEqual({ principal: { issuer: 'https://issuer', subject: 'reader' }, rights: ['READ'] })
    expect((wrapper.vm as any).formOpen).toBe(true)
  })

  it('creates and edits grants with issuer, subject, and de-duplicated rights', () => {
    const wrapper = mount(GrantManager, {
      props: {
        grants: [{
          id: 'grant-1',
          principal: { issuer: 'https://issuer', subject: 'reader' },
          rights: ['READ'],
        }],
        hasLocalPolicy: true,
      },
      global: { stubs },
    })
    ;(wrapper.vm as any).setPrincipal({ issuer: 'https://issuer', subject: 'creator' })
    ;(wrapper.vm as any).rights = ['CREATE', 'CREATE']
    ;(wrapper.vm as any).save()
    expect(wrapper.emitted('create')?.[0]?.[0]).toEqual({
      principal: { issuer: 'https://issuer', subject: 'creator' },
      rights: ['CREATE'],
    })

    ;(wrapper.vm as any).edit(wrapper.props('grants')[0])
    ;(wrapper.vm as any).rights = ['READ', 'VIEW']
    ;(wrapper.vm as any).save()
    expect(wrapper.emitted('update')?.[0]).toEqual([
      'grant-1',
      { principal: { issuer: 'https://issuer', subject: 'reader' }, rights: ['READ', 'VIEW'] },
    ])
  })

  it('keeps the draft until the server confirms a successful save', async () => {
    const wrapper = mount(GrantManager, {
      props: { grants: [], hasLocalPolicy: true, savedVersion: 0 },
      global: { stubs },
    })
    ;(wrapper.vm as any).formOpen = true
    ;(wrapper.vm as any).setPrincipal({ issuer: 'https://issuer', subject: 'reader' })
    ;(wrapper.vm as any).save()
    await nextTick()
    expect((wrapper.vm as any).principal.subject).toBe('reader')
    expect((wrapper.vm as any).formOpen).toBe(true)
    await wrapper.setProps({ savedVersion: 1 })
    expect((wrapper.vm as any).principal).toBeUndefined()
    expect((wrapper.vm as any).formOpen).toBe(false)
  })

  it('prevents submissions while saving', () => {
    const wrapper = mount(GrantManager, {
      props: { grants: [], hasLocalPolicy: true, loading: true },
      global: { stubs },
    })
    ;(wrapper.vm as any).setPrincipal({ issuer: 'https://issuer', subject: 'reader' })
    ;(wrapper.vm as any).save()
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('validates RESOURCE before emitting an advanced policy', async () => {
    const resource = { IDENTIFIABLE: '$aas("urn:example")' } as const
    const wrapper = mount(PolicyManager, {
      props: { resource, localPolicy: { RESOURCE: resource, rules: [] }, effectivePolicy: null },
      global: {
        stubs: {
          ...stubs,
          VExpansionPanels: { template: '<div><slot /></div>' },
          VExpansionPanel: { template: '<div><slot /></div>' },
          VExpansionPanelText: { template: '<div><slot /></div>' },
          VTextarea: { template: '<textarea />' },
        },
      },
    })
    await wrapper.get('textarea').setValue(JSON.stringify({ RESOURCE: { ROUTE: '/shells' }, rules: [] }))
    ;(wrapper.vm as any).saveJson()
    await nextTick()
    expect(wrapper.emitted('save')).toBeUndefined()
    expect((wrapper.vm as any).validationMessage).toContain('exactly match')

    await wrapper.get('textarea').setValue(JSON.stringify({ RESOURCE: resource, rules: [] }))
    ;(wrapper.vm as any).saveJson()
    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual({ RESOURCE: resource, rules: [] })
  })

  it('distinguishes inherited and local policies and exposes explicit actions', async () => {
    const resource = { ROUTE: '/shells' } as const
    const effectivePolicy = { RESOURCE: resource, rules: [] }
    const inherited = mount(PolicyManager, {
      props: { resource, localPolicy: null, effectivePolicy },
      global: {
        stubs: {
          ...stubs,
          VExpansionPanels: { template: '<div><slot /></div>' },
          VExpansionPanel: { template: '<div><slot /></div>' },
          VExpansionPanelText: { template: '<div><slot /></div>' },
          VTextarea: true,
        },
      },
    })
    expect(inherited.text()).toContain('Inheriting rules')
    await inherited.findAll('button').find(button => button.text().includes('Do not inherit access rules'))?.trigger('click')
    expect(inherited.emitted('request-localize')).toHaveLength(1)

    await inherited.setProps({ localPolicy: effectivePolicy })
    expect(inherited.text()).toContain('Not inheriting rules')
    await inherited.findAll('button').find(button => button.text().includes('Inherit access rules'))?.trigger('click')
    expect(inherited.emitted('request-delete')).toHaveLength(1)
  })
})
