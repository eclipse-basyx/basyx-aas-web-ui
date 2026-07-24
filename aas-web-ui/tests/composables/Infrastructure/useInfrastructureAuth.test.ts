import type { InfrastructureConfig } from '@/types/Infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfrastructureAuth } from '@/composables/Infrastructure/useInfrastructureAuth'

const mocks = vi.hoisted(() => ({
  discoverOpenIdConfiguration: vi.fn(),
  refreshOAuth2Token: vi.fn(),
}))

vi.mock('@/composables/Auth/OpenIdConnect', () => ({
  discoverOpenIdConfiguration: mocks.discoverOpenIdConfiguration,
}))

vi.mock('@/composables/Auth/OAuth2Auth', () => ({
  refreshOAuth2Token: mocks.refreshOAuth2Token,
}))

function infrastructure (): InfrastructureConfig {
  return {
    id: 'secured',
    name: 'Secured',
    template: 'mono-all',
    isAuthenticated: true,
    auth: {
      securityType: 'OAuth2',
      oauth2: {
        host: 'https://idp.example',
        clientId: 'web-ui',
        authFlow: 'auth-code',
      },
    },
    token: {
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 1000,
    },
    components: {} as InfrastructureConfig['components'],
  }
}

describe('useInfrastructureAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.discoverOpenIdConfiguration.mockResolvedValue({
      token_endpoint: 'https://idp.example/token',
    })
  })

  it('invalidates authentication after a failed refresh without a transient invalid state', async () => {
    let rejectRefresh!: (error: Error) => void
    mocks.refreshOAuth2Token.mockImplementation(() => new Promise((_resolve, reject) => {
      rejectRefresh = reject
    }))
    const selected = infrastructure()
    const { refreshInfrastructureTokens } = useInfrastructureAuth()

    const pendingRefresh = refreshInfrastructureTokens([selected])
    await vi.waitFor(() => expect(mocks.refreshOAuth2Token).toHaveBeenCalledOnce())
    expect(selected.isAuthenticated).toBe(true)

    rejectRefresh(new Error('identity provider unavailable'))
    const failures = await pendingRefresh

    expect(selected.isAuthenticated).toBe(false)
    expect(selected.token?.refreshToken).toBe('refresh-token')
    expect(failures).toEqual([
      expect.objectContaining({ infraId: 'secured', error: 'identity provider unavailable' }),
    ])
  })
})
