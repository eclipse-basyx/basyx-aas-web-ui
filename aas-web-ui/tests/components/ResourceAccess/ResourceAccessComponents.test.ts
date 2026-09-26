import type { AccessGrant } from '@/types/ResourceAccess'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AccessGrantList from '@/components/ResourceAccess/AccessGrantList.vue'
import AccessPrincipalForm from '@/components/ResourceAccess/AccessPrincipalForm.vue'
import EffectiveAccess from '@/components/ResourceAccess/EffectiveAccess.vue'
import { accessRoles, rolesFor } from '@/utils/AccessRoles'

const slot = { template: '<div><slot /><slot name="prepend" /><slot name="append" /></div>' }
const stubs = {
  VAlert: { props: ['text'], template: '<div>{{ text }}</div>' },
  VAvatar: slot,
  VBtn: { props: ['text'], emits: ['click'], template: '<button @click="$emit(\'click\')">{{ text }}<slot /></button>' },
  VBtnToggle: slot,
  VChip: { props: ['text'], template: '<span>{{ text }}<slot /></span>' },
  VDivider: true,
  VExpandTransition: slot,
  VIcon: true,
  VList: slot,
  VListItem: slot,
  VListItemSubtitle: slot,
  VListItemTitle: slot,
  VSelect: true,
  VSheet: slot,
  VSpacer: true,
  VTextField: true,
  VTooltip: { template: '<div><slot name="activator" :props="{}" /></div>' },
}

function grant (relation: AccessGrant['relation'], subject: string): AccessGrant {
  return {
    relation, subjectType: 'user', issuer: 'https://issuer', subject,
  }
}

describe('Resource access components', () => {
  it('lists grants by role and marks the signed-in user', () => {
    const wrapper = mount(AccessGrantList, {
      props: {
        grants: [grant('viewer', 'bob'), grant('owner', 'alice'), grant('editor', 'carol')],
        roles: accessRoles,
        currentPrincipal: { type: 'user', issuer: 'https://issuer', subject: 'alice' },
      },
      global: { plugins: [createVuetify()], stubs },
    })
    const text = wrapper.text()
    expect(text.indexOf('alice')).toBeLessThan(text.indexOf('carol'))
    expect(text.indexOf('carol')).toBeLessThan(text.indexOf('bob'))
    expect(text).toContain('You')
  })

  it('shows an empty hint without grants', () => {
    const wrapper = mount(AccessGrantList, {
      props: { grants: [], roles: accessRoles, emptyText: 'Not shared with anyone yet.' },
      global: { plugins: [createVuetify()], stubs },
    })
    expect(wrapper.text()).toContain('Not shared with anyone yet.')
  })

  it('emits a principal of the signed-in issuer with the selected role', async () => {
    const wrapper = mount(AccessPrincipalForm, {
      props: { roles: accessRoles, currentPrincipal: { type: 'user', issuer: 'https://issuer', subject: 'alice' } },
      global: { plugins: [createVuetify()], stubs },
    })
    const vm = wrapper.vm as any
    vm.subject = ' bob '
    vm.submit()
    expect(wrapper.emitted('add')).toEqual([[{ type: 'user', issuer: 'https://issuer', subject: 'bob' }, 'viewer']])
    vm.submit()
    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('shows only granted effective rights', () => {
    const wrapper = mount(EffectiveAccess, {
      props: { rights: { object: { type: 'aas', id: 'aas' }, rights: [{ action: 'read', source: 'rebac' }, { action: 'delete', source: 'none' }] } },
      global: { plugins: [createVuetify()], stubs },
    })
    expect(wrapper.text()).toContain('View')
    expect(wrapper.text()).not.toContain('Delete')
  })

  it('offers operation execution only for shells, Submodels and elements', () => {
    expect(rolesFor('submodel-element').map(role => role.value)).toContain('executor')
    expect(rolesFor('aas-descriptor').map(role => role.value)).not.toContain('executor')
  })
})
