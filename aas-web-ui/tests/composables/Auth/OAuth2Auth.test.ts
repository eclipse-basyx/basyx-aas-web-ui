import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  exchangeOAuth2AuthorizationCode,
} from '@/composables/Auth/OAuth2Auth'

describe('OAuth2 authorization-code state', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('removes the PKCE verifier after a failed token exchange', async () => {
    const state = 'opaque-state'
    sessionStorage.setItem(`oauth2_code_verifier_${state}`, 'verifier')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('invalid_grant'),
    }))

    await expect(exchangeOAuth2AuthorizationCode({
      tokenEndpoint: 'https://idp.example/oauth/token',
      clientId: 'web-ui',
      redirectUri: `${window.location.origin}/`,
      code: 'invalid-code',
      state,
    })).rejects.toThrow('Token exchange error')

    expect(sessionStorage.getItem(`oauth2_code_verifier_${state}`)).toBeNull()
  })
})
