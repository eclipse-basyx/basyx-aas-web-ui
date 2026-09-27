import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, reactive } from 'vue'

const token = ['e30', btoa(JSON.stringify({ iss: 'https://idp', sub: 'pairwise' })), 'sig'].join('.')
const state = vi.hoisted(() => ({ getPrincipal: vi.fn() }))
const store = reactive({
  getSelectedInfrastructure: { id: 'infra', auth: {} as Record<string, unknown> },
  getHasAuthenticationCredentials: true,
  supportsResourceAccess: (component: string) => component === 'SubmodelRepo',
})

vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => ({ getPrincipal: state.getPrincipal }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => store }))

function deferred () {
  let resolve: (value: unknown) => void = () => undefined
  const promise = new Promise(done => {
    resolve = done
  })
  return { promise, resolve }
}

let scope = effectScope()

async function load () {
  vi.resetModules()
  const { useCurrentPrincipal } = await import('@/composables/Auth/CurrentPrincipal')
  return scope.run(() => useCurrentPrincipal())!
}

describe('useCurrentPrincipal', () => {
  afterEach(() => {
    scope.stop()
    scope = effectScope()
  })

  beforeEach(() => {
    state.getPrincipal.mockReset()
    store.getSelectedInfrastructure.auth = { securityType: 'Bearer Token', bearerToken: { token } }
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
    store.getSelectedInfrastructure.auth = { securityType: 'Custom Header', customHeader: { name: 'Authorization', value: `Bearer ${token}` } }
    state.getPrincipal.mockResolvedValue({ ok: true, data: { issuer: 'https://idp', subject: 'object-id', groups: [], administrator: false } })
    const { currentPrincipal } = await load()
    await flushPromises()
    expect(state.getPrincipal).toHaveBeenCalledWith('SubmodelRepo')
    expect(currentPrincipal.value?.subject).toBe('object-id')
  })

  it('never lets a late response for earlier credentials replace the current identity', async () => {
    const first = deferred()
    const second = deferred()
    state.getPrincipal.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { currentPrincipal } = await load()
    store.getSelectedInfrastructure.auth = { securityType: 'Custom Header', customHeader: { name: 'X-API-KEY', value: 'second' } }
    await flushPromises()
    expect(state.getPrincipal).toHaveBeenCalledTimes(2)
    second.resolve({ ok: true, data: { issuer: 'https://idp', subject: 'second', groups: [], administrator: false } })
    await flushPromises()
    first.resolve({ ok: true, data: { issuer: 'https://idp', subject: 'first', groups: [], administrator: false } })
    await flushPromises()
    expect(currentPrincipal.value?.subject).toBe('second')
  })

  it('asks the server even when the credentials carry no readable token', async () => {
    store.getSelectedInfrastructure.auth = { securityType: 'Custom Header', customHeader: { name: 'X-API-KEY', value: 'secret' } }
    state.getPrincipal.mockResolvedValue({ ok: true, data: { issuer: 'https://idp', subject: 'service', groups: [], administrator: false } })
    const { currentPrincipal } = await load()
    await flushPromises()
    expect(currentPrincipal.value?.subject).toBe('service')
  })
})
