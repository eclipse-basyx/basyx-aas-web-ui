import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const token = ['e30', btoa(JSON.stringify({ iss: 'https://idp', sub: 'pairwise' })), 'sig'].join('.')
const state = vi.hoisted(() => ({ getPrincipal: vi.fn(), auth: {} as Record<string, unknown> }))

vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => ({ getPrincipal: state.getPrincipal }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({
  getSelectedInfrastructure: { id: 'infra', auth: state.auth },
  getHasAuthenticationCredentials: true,
  supportsResourceAccess: (component: string) => component === 'SubmodelRepo',
}) }))

async function load () {
  vi.resetModules()
  const { useCurrentPrincipal } = await import('@/composables/Auth/CurrentPrincipal')
  return useCurrentPrincipal()
}

describe('useCurrentPrincipal', () => {
  beforeEach(() => {
    state.getPrincipal.mockReset()
    state.auth = { securityType: 'Bearer Token', bearerToken: { token } }
  })

  it('uses the identity reported by ReBAC, which may come from another claim than sub', async () => {
    let answer: (value: unknown) => void = () => undefined
    state.getPrincipal.mockReturnValue(new Promise(resolve => {
      answer = resolve
    }))
    const { currentPrincipal, isAdministrator } = await load()
    expect(currentPrincipal.value?.subject).toBe('pairwise')
    answer({ ok: true, data: { issuer: 'https://idp', subject: 'object-id', groups: [], administrator: true } })
    await flushPromises()
    expect(state.getPrincipal).toHaveBeenCalledWith('SubmodelRepo')
    expect(currentPrincipal.value).toEqual({ type: 'user', issuer: 'https://idp', subject: 'object-id' })
    expect(isAdministrator.value).toBe(true)
  })

  it('falls back to the token when the server does not answer', async () => {
    state.getPrincipal.mockResolvedValue({ ok: false, status: 503 })
    const { currentPrincipal, isAdministrator } = await load()
    await flushPromises()
    expect(currentPrincipal.value).toEqual({ type: 'user', issuer: 'https://idp', subject: 'pairwise' })
    expect(isAdministrator.value).toBe(false)
  })

  it('discovers the principal for custom header authentication', async () => {
    state.auth = { securityType: 'Custom Header', customHeader: { name: 'Authorization', value: `Bearer ${token}` } }
    state.getPrincipal.mockResolvedValue({ ok: true, data: { issuer: 'https://idp', subject: 'object-id', groups: [], administrator: false } })
    const { currentPrincipal } = await load()
    await flushPromises()
    expect(state.getPrincipal).toHaveBeenCalledWith('SubmodelRepo')
    expect(currentPrincipal.value?.subject).toBe('object-id')
  })

  it('asks the server even when the credentials carry no readable token', async () => {
    state.auth = { securityType: 'Custom Header', customHeader: { name: 'X-API-KEY', value: 'secret' } }
    state.getPrincipal.mockResolvedValue({ ok: true, data: { issuer: 'https://idp', subject: 'service', groups: [], administrator: false } })
    const { currentPrincipal } = await load()
    await flushPromises()
    expect(currentPrincipal.value?.subject).toBe('service')
  })
})
