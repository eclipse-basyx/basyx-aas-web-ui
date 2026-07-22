import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  startAuthorizationTransaction,
  startLogoutTransaction,
} from '@/composables/Auth/OAuth2Navigation'
import { createAppRouter } from '@/router'

const mockDeps = vi.hoisted(() => ({
  aasStore: {
    getSelectedAAS: {},
    getSelectedNode: {},
    dispatchSelectedAAS: vi.fn(),
    dispatchSelectedNode: vi.fn(),
  },
  envStore: {
    getAllowEditing: true,
    getSingleAas: true,
    getSingleAasRedirect: undefined,
    getSingleSm: false,
    getSingleSmRedirect: undefined,
    getSmViewerEditor: true,
    getStartPageRouteName: '',
  },
  infrastructure: {
    id: 'infrastructure-1',
    template: 'full',
    auth: {
      securityType: 'OAuth2',
      oauth2: {
        host: 'https://idp.example',
        clientId: 'web-ui',
        authFlow: 'auth-code',
      },
    },
  },
  infrastructureStore: {
    getInfrastructures: [] as Array<any>,
    getSelectedInfrastructure: null as any,
    getIsLoginAvailable: true,
    waitForInitialization: vi.fn(),
    dispatchUpdateInfrastructure: vi.fn(),
    setAuthenticationStatusForInfrastructure: vi.fn(),
  },
  navigationStore: {
    dispatchModuleRoutes: vi.fn(),
    dispatchSnackbar: vi.fn(),
    getSnackbar: { status: false },
    dispatchUrlQuery: vi.fn(),
    filterQueryParams: vi.fn(() => ({ filteredQuery: {}, removedParams: [] })),
    getIsMobile: false,
    getUrlQuery: {},
    getRouteTransition: null as string | null,
  },
  exchangeOAuth2AuthorizationCode: vi.fn(),
  clearOAuth2AuthorizationCodeState: vi.fn(),
  aasByEndpointHasSmeByPath: vi.fn(),
  fetchAndDispatchAas: vi.fn(),
  fetchAndDispatchSme: vi.fn(),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => mockDeps.aasStore,
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => mockDeps.envStore,
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => mockDeps.infrastructureStore,
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => mockDeps.navigationStore,
}))

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({
    fetchAndDispatchAas: mockDeps.fetchAndDispatchAas,
    aasByEndpointHasSmeByPath: mockDeps.aasByEndpointHasSmeByPath,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    fetchAndDispatchSme: mockDeps.fetchAndDispatchSme,
  }),
}))

vi.mock('@/composables/routeHandling', () => ({
  useRouteHandling: () => ({
    idRedirectHandled: vi.fn().mockResolvedValue(null),
  }),
}))

vi.mock('@/composables/Auth/OAuth2Auth', () => ({
  exchangeOAuth2AuthorizationCode: mockDeps.exchangeOAuth2AuthorizationCode,
  clearOAuth2AuthorizationCodeState: mockDeps.clearOAuth2AuthorizationCodeState,
}))

describe('OAuth2 callback routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas')

    mockDeps.infrastructureStore.getInfrastructures = [mockDeps.infrastructure]
    mockDeps.infrastructureStore.getSelectedInfrastructure = mockDeps.infrastructure
    mockDeps.infrastructure.auth.oauth2.host = 'https://idp.example'
    mockDeps.infrastructureStore.waitForInitialization.mockResolvedValue(undefined)
    mockDeps.aasStore.getSelectedAAS = {}
    mockDeps.aasStore.getSelectedNode = {}
    mockDeps.navigationStore.getRouteTransition = null
    mockDeps.envStore.getSingleAas = true
    mockDeps.envStore.getSingleSm = false
    mockDeps.exchangeOAuth2AuthorizationCode.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      idToken: 'id-token',
      expiresAt: 123,
      tokenType: 'Bearer',
    })
    mockDeps.fetchAndDispatchAas.mockResolvedValue({ id: 'aas' })
    mockDeps.aasByEndpointHasSmeByPath.mockResolvedValue(true)
    mockDeps.fetchAndDispatchSme.mockResolvedValue({ idShort: 'submodel' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        issuer: 'https://idp.example',
        token_endpoint: 'https://idp.example/token',
      }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('returns to the selected AAS after a query-free authorization callback', async () => {
    const { state } = startAuthorizationTransaction('infrastructure-1')
    const router = await createAppRouter()

    await router.push(`/?code=authorization-code&state=${state}&iss=${encodeURIComponent('https://idp.example')}`)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).toMatchObject({ aas: 'urn:example:aas' })
    expect(router.currentRoute.value.query).not.toHaveProperty('code')
    expect(router.currentRoute.value.query).not.toHaveProperty('state')
    expect(mockDeps.exchangeOAuth2AuthorizationCode).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'web-ui',
      redirectUri: `${window.location.origin}/`,
      state,
    }))
    expect(mockDeps.infrastructureStore.setAuthenticationStatusForInfrastructure).toHaveBeenCalledWith('infrastructure-1', true)
  })

  it('rehydrates a public AAS and Submodel after returning from logout', async () => {
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas&path=%2Fsubmodels%2F0')
    const { callbackPath } = startLogoutTransaction()
    const router = await createAppRouter()

    await router.push(callbackPath)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).toMatchObject({ aas: 'urn:example:aas' })
    expect(router.currentRoute.value.query).toMatchObject({ path: '/submodels/0' })
    expect(mockDeps.navigationStore.dispatchSnackbar).not.toHaveBeenCalledWith(
      expect.objectContaining({ baseError: 'Authentication required!' }),
    )
    expect(mockDeps.aasByEndpointHasSmeByPath).toHaveBeenCalled()
    expect(mockDeps.fetchAndDispatchAas).toHaveBeenCalled()
    expect(mockDeps.fetchAndDispatchSme).toHaveBeenCalled()
  })

  it('rehydrates a public Submodel in single-Submodel mode after logout', async () => {
    mockDeps.envStore.getSingleAas = false
    mockDeps.envStore.getSingleSm = true
    window.history.replaceState({}, '', '/smviewer?path=https%3A%2F%2Finfra.example%2Fsubmodels%2Fnameplate')
    const { callbackPath } = startLogoutTransaction()
    const router = await createAppRouter()

    await router.push(callbackPath)

    expect(router.currentRoute.value.name).toBe('SMViewer')
    expect(router.currentRoute.value.query).toMatchObject({
      path: 'https://infra.example/submodels/nameplate',
    })
    expect(mockDeps.fetchAndDispatchSme).toHaveBeenCalledWith(
      'https://infra.example/submodels/nameplate',
      true,
      undefined,
    )
    expect(mockDeps.navigationStore.dispatchSnackbar).not.toHaveBeenCalledWith(
      expect.objectContaining({ baseError: 'Authentication required!' }),
    )
  })

  it('clears an AAS and Submodel which are no longer visible after logout', async () => {
    mockDeps.envStore.getSingleAas = false
    mockDeps.aasStore.getSelectedAAS = { id: 'protected-aas' }
    mockDeps.aasStore.getSelectedNode = { id: 'protected-submodel' }
    mockDeps.fetchAndDispatchAas.mockResolvedValueOnce({})
    window.history.replaceState({}, '', '/aasviewer?aas=protected-aas&path=protected-submodel')
    const { callbackPath } = startLogoutTransaction()
    const router = await createAppRouter()

    await router.push(callbackPath)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).not.toHaveProperty('aas')
    expect(router.currentRoute.value.query).not.toHaveProperty('path')
    expect(mockDeps.aasStore.dispatchSelectedAAS).toHaveBeenCalledWith({})
    expect(mockDeps.aasStore.dispatchSelectedNode).toHaveBeenCalledWith({})
    expect(mockDeps.aasByEndpointHasSmeByPath).not.toHaveBeenCalled()
    expect(mockDeps.fetchAndDispatchSme).not.toHaveBeenCalled()
    expect(mockDeps.navigationStore.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('allows an infrastructure switch to clear a single-AAS route without redirecting', async () => {
    mockDeps.navigationStore.getRouteTransition = 'infrastructure-switch'
    const router = await createAppRouter()

    await router.push('/aasviewer')

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).not.toHaveProperty('aas')
  })

  it('allows an infrastructure switch to clear a single-Submodel route without redirecting', async () => {
    mockDeps.envStore.getSingleAas = false
    mockDeps.envStore.getSingleSm = true
    mockDeps.navigationStore.getRouteTransition = 'infrastructure-switch'
    const router = await createAppRouter()

    await router.push('/smviewer')

    expect(router.currentRoute.value.name).toBe('SMViewer')
    expect(router.currentRoute.value.query).not.toHaveProperty('path')
  })

  it('rejects an issuer injected into the authorization response', async () => {
    const { state } = startAuthorizationTransaction('infrastructure-1')
    const router = await createAppRouter()

    await router.push(`/?code=authorization-code&state=${state}&iss=${encodeURIComponent('https://attacker.example')}`)

    expect(mockDeps.exchangeOAuth2AuthorizationCode).not.toHaveBeenCalled()
    expect(mockDeps.clearOAuth2AuthorizationCodeState).toHaveBeenCalledWith(state)
    expect(mockDeps.navigationStore.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'OAuth2 authentication failed',
        extendedError: expect.stringContaining('issuer'),
      }),
    )
  })

  it('accepts an Entra tenant issuer returned for tenant-independent metadata', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        issuer: 'https://login.microsoftonline.com/{tenantid}/v2.0',
        token_endpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      }),
    } as any)
    mockDeps.infrastructure.auth.oauth2.host = 'https://login.microsoftonline.com/common/v2.0'
    const { state } = startAuthorizationTransaction('infrastructure-1')
    const router = await createAppRouter()
    const callbackIssuer = 'https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0'

    await router.push(`/?code=authorization-code&state=${state}&iss=${encodeURIComponent(callbackIssuer)}`)

    expect(mockDeps.exchangeOAuth2AuthorizationCode).toHaveBeenCalledOnce()
    expect(mockDeps.navigationStore.dispatchSnackbar).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: 'OAuth2 authentication failed' }),
    )
  })

  it('consumes a denied authorization response and restores the prior route', async () => {
    const { state } = startAuthorizationTransaction('infrastructure-1')
    const router = await createAppRouter()

    await router.push(`/?error=access_denied&error_description=Login%20cancelled&state=${state}`)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).toMatchObject({ aas: 'urn:example:aas' })
    expect(router.currentRoute.value.query).not.toHaveProperty('error')
    expect(mockDeps.exchangeOAuth2AuthorizationCode).not.toHaveBeenCalled()
    expect(mockDeps.clearOAuth2AuthorizationCodeState).toHaveBeenCalledWith(state)
  })
})
