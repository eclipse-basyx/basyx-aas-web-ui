import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import InvitationManager from '@/components/ResourceAccess/InvitationManager.vue'
import { accessRoles } from '@/utils/AccessRoles'

const client = vi.hoisted(() => ({ listInvitations: vi.fn(), createInvitation: vi.fn(), revokeInvitation: vi.fn() }))
vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => client }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({
  getSelectedInfrastructure: { components: { SubmodelRepo: { url: 'https://host/submodels' } } },
}) }))

const target = { kind: 'submodel' as const, label: 'Submodel', endpoint: 'https://host/submodels/c20', componentKey: 'SubmodelRepo' as const }

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  })
})

function mountManager (currentPrincipal?: { type: 'user', issuer: string, subject: string }) {
  return mount(InvitationManager, {
    props: { target, roles: accessRoles.filter(role => role.value !== 'owner'), currentPrincipal },
    global: { plugins: [createVuetify()] },
  })
}

describe('InvitationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.listInvitations.mockResolvedValue({ ok: true, data: [] })
    client.createInvitation.mockResolvedValue({ ok: true, data: { id: 'i', token: 'a'.repeat(43) } })
  })

  it('never creates an unrestricted link when the recipient is incomplete', async () => {
    const wrapper = mountManager()
    const vm = wrapper.vm as any
    vm.restricted = true
    vm.expectedSubject = 'bob'
    await vm.create()
    expect(client.createInvitation).not.toHaveBeenCalled()
    expect(wrapper.emitted('message')?.[0]?.[1]).toBe('error')
  })

  it('restricts the link to the recipient and its identity provider', async () => {
    const wrapper = mountManager({ type: 'user', issuer: 'https://idp', subject: 'alice' })
    await flushPromises()
    const vm = wrapper.vm as any
    vm.restricted = true
    vm.expectedSubject = ' bob '
    await vm.create()
    expect(client.createInvitation).toHaveBeenCalledWith(target, expect.objectContaining({
      expectedPrincipal: { issuer: 'https://idp', subject: 'bob' },
    }))
  })
})
