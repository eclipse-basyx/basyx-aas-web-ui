import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UserIdControl from '@/components/AppNavigation/UserIdControl.vue'

const writeText = vi.fn()
const global = { stubs: {
  VBtn: { template: '<button><slot /></button>' },
  VListItem: { template: '<div><slot name="prepend" /><slot /><slot name="append" /></div>' },
  VListItemTitle: { template: '<span><slot /></span>' },
  VIcon: true,
} }

describe('User ID control', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the ID out of the visible DOM until requested and hides it again', async () => {
    const wrapper = mount(UserIdControl, { props: { userId: 'private-subject' }, global })
    expect(wrapper.text()).not.toContain('private-subject')
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.text()).toContain('private-subject')
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.text()).not.toContain('private-subject')
  })

  it('copies only the ID without revealing it', async () => {
    const wrapper = mount(UserIdControl, { props: { userId: 'private-subject' }, global })
    await wrapper.get('[aria-label="Copy user ID"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('private-subject')
    expect(wrapper.text()).toContain('User ID copied.')
    expect(wrapper.text()).not.toContain('private-subject')
  })

  it('keeps clipboard failures private and allows a retry', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'))
    const wrapper = mount(UserIdControl, { props: { userId: 'private-subject' }, global })
    await wrapper.get('[aria-label="Copy user ID"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Could not copy')
    expect(wrapper.text()).not.toContain('private-subject')
    await wrapper.get('[aria-label="Copy user ID"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('User ID copied.')
  })

  it('hides the ID when the account changes', async () => {
    const wrapper = mount(UserIdControl, { props: { userId: 'old-subject' }, global })
    await wrapper.findAll('button')[0].trigger('click')
    await wrapper.setProps({ userId: 'new-subject' })
    expect(wrapper.text()).not.toContain('old-subject')
    expect(wrapper.text()).not.toContain('new-subject')
  })
})
