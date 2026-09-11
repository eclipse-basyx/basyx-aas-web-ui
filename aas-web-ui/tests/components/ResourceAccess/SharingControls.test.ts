import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PrincipalInput from '@/components/ResourceAccess/PrincipalInput.vue'
import SharingPeopleList from '@/components/ResourceAccess/SharingPeopleList.vue'
import SharingRolePicker from '@/components/ResourceAccess/SharingRolePicker.vue'

const principal = { issuer: 'https://issuer', subject: 'alex' }

describe('Sharing controls', () => {
  it('defaults to the signed-in provider and keeps provider settings collapsed', () => {
    const wrapper = shallowMount(PrincipalInput, { props: { currentPrincipal: principal } })
    const vm = wrapper.vm as any
    expect(vm.issuer).toBe(principal.issuer)
    expect(vm.providerPanel).toBeUndefined()
    vm.subject = 'reader'
    vm.add()
    expect(wrapper.emitted('add')?.[0]).toEqual([{ issuer: principal.issuer, subject: 'reader' }])
  })

  it('switches to group sharing without reusing the previous person ID', async () => {
    const wrapper = shallowMount(PrincipalInput, { props: { currentPrincipal: principal } })
    const vm = wrapper.vm as any
    vm.subject = 'alex'
    vm.recipientType = 'group'
    await wrapper.vm.$nextTick()
    expect(vm.subject).toBe('')
    vm.subject = '/Engineering/Bridge Inspectors'
    vm.add()
    expect(wrapper.emitted('add')?.[0]).toEqual([{ type: 'group', issuer: principal.issuer, subject: '/Engineering/Bridge Inspectors' }])
  })

  it('does not label a same-named group as the current user or merge it with them', () => {
    const group = { ...principal, type: 'group' as const }
    const wrapper = shallowMount(SharingPeopleList, { props: {
      currentPrincipal: principal, owners: [principal, group], managers: [{ ...principal, type: 'user' }], grants: [],
    } })
    expect((wrapper.vm as any).people).toHaveLength(2)
    expect((wrapper.vm as any).isMe(group)).toBe(false)
    expect((wrapper.vm as any).isMe(principal)).toBe(true)
  })

  it('shows provider input when no authenticated identity is available', () => {
    const wrapper = shallowMount(PrincipalInput)
    const vm = wrapper.vm as any
    expect(vm.providerPanel).toBe(0)
    vm.subject = 'reader'
    vm.add()
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('groups overlapping assignments by issuer and subject, preserving separate providers', () => {
    const wrapper = shallowMount(SharingPeopleList, { props: {
      owners: [principal], managers: [principal], grants: [
        { id: 'one', principal, rights: ['READ'] },
        { id: 'two', principal: { ...principal, issuer: 'https://other' }, rights: ['UPDATE'] },
      ],
    } })
    const people = (wrapper.vm as any).people
    expect(people).toHaveLength(2)
    expect(people[0].roles).toEqual(['Owner', 'Access manager'])
    expect(people[0].grants).toHaveLength(1)
  })

  it('preserves custom permissions until the user explicitly selects a preset', () => {
    const wrapper = shallowMount(SharingRolePicker, { props: { modelValue: ['READ', 'DELETE', 'EXECUTE'] } })
    const vm = wrapper.vm as any
    expect(vm.role).toBe('custom')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    vm.role = 'edit'
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['READ', 'UPDATE']])
  })
})
