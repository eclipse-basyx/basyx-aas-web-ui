import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthorizationTransaction } from '@/composables/Auth/OAuth2Navigation'
import { useOAuth2Form } from '@/composables/Auth/useOAuth2Form'

const mockDeps = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn(),
  dispatchTriggerAASListReload: vi.fn(),
  dispatchTriggerTreeviewReload: vi.fn(),
  clearOAuth2AuthorizationCodeState: vi.fn(),
  initiateOAuth2AuthorizationCodeFlow: vi.fn(),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mockDeps.dispatchSnackbar,
    dispatchTriggerAASListReload: mockDeps.dispatchTriggerAASListReload,
    dispatchTriggerTreeviewReload: mockDeps.dispatchTriggerTreeviewReload,
  }),
}))

vi.mock('@/composables/Auth/OAuth2Auth', () => ({
  authenticateOAuth2ClientCredentials: vi.fn(),
  clearOAuth2AuthorizationCodeState: mockDeps.clearOAuth2AuthorizationCodeState,
  initiateOAuth2AuthorizationCodeFlow: mockDeps.initiateOAuth2AuthorizationCodeFlow,
}))

describe('useOAuth2Form authorization-code flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas&path=%2Fsubmodels%2F0#details')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ authorization_endpoint: 'https://idp.example/authorize' }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('keeps the selected AAS locally while initiating an IdP-agnostic authorization redirect', async () => {
    const oauth2Form = useOAuth2Form()
    oauth2Form.loadFromInfrastructure({
      id: 'infrastructure-1',
      auth: {
        securityType: 'OAuth2',
        oauth2: {
          host: 'https://idp.example',
          clientId: 'web-ui',
          authFlow: 'auth-code',
        },
      },
    } as any)

    await oauth2Form.authenticate('infrastructure-1')

    expect(mockDeps.initiateOAuth2AuthorizationCodeFlow).toHaveBeenCalledTimes(1)
    const [config] = mockDeps.initiateOAuth2AuthorizationCodeFlow.mock.calls[0]
    expect(config).toMatchObject({
      authorizationEndpoint: 'https://idp.example/authorize',
      clientId: 'web-ui',
      redirectUri: `${window.location.origin}/`,
      scope: 'openid profile email',
    })
    expect(config.state).not.toBe('infrastructure-1')
    expect(getAuthorizationTransaction(config.state)?.returnLocation).toEqual({
      path: '/aasviewer',
      query: {
        aas: 'urn:example:aas',
        path: '/submodels/0',
      },
      hash: '#details',
    })
  })

  it('cleans up the navigation and PKCE state when redirect initiation fails', async () => {
    mockDeps.initiateOAuth2AuthorizationCodeFlow.mockRejectedValueOnce(new Error('navigation failed'))
    const oauth2Form = useOAuth2Form()
    oauth2Form.loadFromInfrastructure({
      id: 'infrastructure-1',
      auth: {
        securityType: 'OAuth2',
        oauth2: {
          host: 'https://idp.example',
          clientId: 'web-ui',
          authFlow: 'auth-code',
        },
      },
    } as any)

    await oauth2Form.authenticate('infrastructure-1')

    const [{ state }] = mockDeps.initiateOAuth2AuthorizationCodeFlow.mock.calls[0]
    expect(getAuthorizationTransaction(state)).toBeNull()
    expect(mockDeps.clearOAuth2AuthorizationCodeState).toHaveBeenCalledWith(state)
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Failed to initiate OAuth2 authorization flow' }),
    )
  })
})
