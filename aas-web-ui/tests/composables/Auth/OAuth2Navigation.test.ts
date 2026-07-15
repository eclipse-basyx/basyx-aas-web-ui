import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  consumeAuthorizationTransaction,
  consumeLogoutTransaction,
  getAuthorizationTransaction,
  startAuthorizationTransaction,
  startLogoutTransaction,
} from '@/composables/Auth/OAuth2Navigation'

describe('OAuth2 navigation transactions', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubEnv('BASE_URL', '/')
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas&path=%2Fsubmodels%2F0&view=one&view=two#details')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    sessionStorage.clear()
  })

  it('keeps the deep link locally while sending a query-free authorization callback URI', () => {
    const { redirectUri, state } = startAuthorizationTransaction('infrastructure-1')

    expect(state).not.toBe('infrastructure-1')
    expect(redirectUri).toBe(`${window.location.origin}/`)
    expect(getAuthorizationTransaction(state)).toEqual({
      infrastructureId: 'infrastructure-1',
      returnLocation: {
        path: '/aasviewer',
        query: {
          aas: 'urn:example:aas',
          path: '/submodels/0',
          view: ['one', 'two'],
        },
        hash: '#details',
      },
    })

    expect(consumeAuthorizationTransaction(state)?.returnLocation.query.aas).toBe('urn:example:aas')
    expect(getAuthorizationTransaction(state)).toBeNull()
  })

  it('restores a deep link after a query-free logout callback', () => {
    const { callbackPath, redirectUri } = startLogoutTransaction()

    expect(callbackPath).toBe('/')
    expect(redirectUri).toBe(`${window.location.origin}/`)
    expect(consumeLogoutTransaction(callbackPath)).toEqual({
      path: '/aasviewer',
      query: {
        aas: 'urn:example:aas',
        path: '/submodels/0',
        view: ['one', 'two'],
      },
      hash: '#details',
    })
    expect(consumeLogoutTransaction(callbackPath)).toBeNull()
  })

  it('uses application-relative paths for deployments below a base path', () => {
    vi.stubEnv('BASE_URL', '/ui/')
    window.history.replaceState({}, '', '/ui/aasviewer?aas=urn%3Aexample%3Aaas')

    const { redirectUri, state } = startAuthorizationTransaction('infrastructure-1')

    expect(redirectUri).toBe(`${window.location.origin}/ui/`)
    expect(getAuthorizationTransaction(state)?.returnLocation).toEqual({
      path: '/aasviewer',
      query: { aas: 'urn:example:aas' },
      hash: '',
    })
  })

  it('rejects a stored authorization transaction that would leave the application origin', () => {
    sessionStorage.setItem('oauth2_authorization_transaction_untrusted', JSON.stringify({
      infrastructureId: 'infrastructure-1',
      returnUrl: 'https://attacker.example/redirect',
    }))

    expect(getAuthorizationTransaction('untrusted')).toBeNull()
  })
})
