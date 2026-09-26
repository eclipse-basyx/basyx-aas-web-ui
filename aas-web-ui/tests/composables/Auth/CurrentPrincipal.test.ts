import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ getPrincipal: vi.fn() }))

vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => ({ getPrincipal: state.getPrincipal }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({
  getSelectedInfrastructure: { id: 'infra', auth: { bearerToken: { token: ['e30', btoa(JSON.stringify({ iss: 'https://idp', sub: 'pairwise' })), 'sig'].join('.') } } },
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
})
