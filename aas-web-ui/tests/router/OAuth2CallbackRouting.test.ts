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
  },
  exchangeOAuth2AuthorizationCode: vi.fn(),
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
}))

describe('OAuth2 callback routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas')

    mockDeps.infrastructureStore.getInfrastructures = [mockDeps.infrastructure]
    mockDeps.infrastructureStore.getSelectedInfrastructure = mockDeps.infrastructure
    mockDeps.infrastructureStore.waitForInitialization.mockResolvedValue(undefined)
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
      json: vi.fn().mockResolvedValue({ token_endpoint: 'https://idp.example/token' }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('returns to the selected AAS after a query-free authorization callback', async () => {
    const { state } = startAuthorizationTransaction('infrastructure-1')
    const router = await createAppRouter()

    await router.push(`/aasviewer?code=authorization-code&state=${state}`)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).toMatchObject({ aas: 'urn:example:aas' })
    expect(router.currentRoute.value.query).not.toHaveProperty('code')
    expect(router.currentRoute.value.query).not.toHaveProperty('state')
    expect(mockDeps.exchangeOAuth2AuthorizationCode).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'web-ui',
      redirectUri: `${window.location.origin}/aasviewer`,
      state,
    }))
    expect(mockDeps.infrastructureStore.setAuthenticationStatusForInfrastructure).toHaveBeenCalledWith('infrastructure-1', true)
  })

  it('returns to the selected route after a query-free logout callback without refetching protected data', async () => {
    window.history.replaceState({}, '', '/aasviewer?aas=urn%3Aexample%3Aaas&path=%2Fsubmodels%2F0')
    const { callbackPath } = startLogoutTransaction()
    const router = await createAppRouter()

    await router.push(callbackPath)

    expect(router.currentRoute.value.name).toBe('AASViewer')
    expect(router.currentRoute.value.query).toMatchObject({ aas: 'urn:example:aas' })
    expect(router.currentRoute.value.query).toMatchObject({ path: '/submodels/0' })
    expect(mockDeps.navigationStore.dispatchSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        baseError: 'Authentication required!',
        actionText: 'Login',
      }),
    )
    expect(mockDeps.aasByEndpointHasSmeByPath).not.toHaveBeenCalled()
    expect(mockDeps.fetchAndDispatchAas).not.toHaveBeenCalled()
    expect(mockDeps.fetchAndDispatchSme).not.toHaveBeenCalled()
  })
})
