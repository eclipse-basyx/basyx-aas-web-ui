import type { InfrastructureConfig } from '@/types/Infrastructure'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

const mocks = vi.hoisted(() => ({
  appliedOverrides: [] as unknown[],
  getRequest: vi.fn(),
  dispatchSnackbar: vi.fn(),
  loadInfrastructuresFromStorage: vi.fn(),
  saveInfrastructuresToStorage: vi.fn(),
  refreshInfrastructureTokens: vi.fn().mockResolvedValue([]),
  mappings: JSON.stringify([
    { target: 'features', mode: 'list', sources: ['/basyx_features'] },
  ]),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getEnvAASDiscoveryPath: '',
    getEnvAASRegistryPath: '',
    getEnvSubmodelRegistryPath: '',
    getEnvAASRepoPath: '',
    getEnvSubmodelRepoPath: '',
    getEnvConceptDescriptionRepoPath: '',
    getEnvCompanyLookupPath: '',
    getKeycloakActive: false,
    getKeycloakUrl: '',
    getKeycloakRealm: '',
    getKeycloakClientId: '',
    getOidcActive: false,
    getOidcUrl: '',
    getOidcScope: '',
    getOidcClientId: '',
    getPreconfiguredAuth: false,
    getPreconfiguredAuthClientSecret: '',
    getDeploymentEndpointConfigAvailable: true,
    getEndpointConfigAvailable: true,
    getAllowLogout: true,
    getFeatureControlClaimMappings: mocks.mappings,
    setFeatureControlOverrides: (overrides: unknown) => mocks.appliedOverrides.push(overrides),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mocks.dispatchSnackbar,
    dispatchDismissInfrastructureSnackbar: vi.fn(),
    dispatchClearAASList: vi.fn(),
    dispatchClearTreeview: vi.fn(),
  }),
}))

vi.mock('@/composables/Infrastructure/useInfrastructureStorage', () => ({
  useInfrastructureStorage: () => ({
    createEmptyInfrastructure: vi.fn(),
    loadInfrastructuresFromStorage: mocks.loadInfrastructuresFromStorage,
    saveInfrastructuresToStorage: mocks.saveInfrastructuresToStorage,
  }),
}))

vi.mock('@/composables/Infrastructure/useInfrastructureAuth', () => ({
  useInfrastructureAuth: () => ({
    refreshInfrastructureTokens: mocks.refreshInfrastructureTokens,
    setAuthenticationStatusForInfrastructure: (
      infrastructures: InfrastructureConfig[],
      infrastructureId: string,
      state: boolean,
    ) => {
      const infrastructure = infrastructures.find(candidate => candidate.id === infrastructureId)
      if (infrastructure) {
        infrastructure.isAuthenticated = state
      }
    },
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mocks.getRequest,
  }),
}))

function token (features: string[]): string {
  return `${base64Encode('{}')}.${base64Encode(JSON.stringify({ basyx_features: features }))}.signature`
}

function infrastructure (id: string, features: string[]): InfrastructureConfig {
  return {
    id,
    name: id,
    template: 'mono-all',
    isAuthenticated: true,
    auth: {
      securityType: 'OAuth2',
      oauth2: { host: 'https://idp.example', clientId: 'ui', authFlow: 'auth-code' },
    },
    token: {
      accessToken: token(features),
      expiresAt: Date.now() + 60_000,
    },
    components: {
      AASDiscovery: { url: '' },
      AASRegistry: { url: '' },
      SubmodelRegistry: { url: '' },
      AASRepo: { url: '' },
      SubmodelRepo: { url: '' },
      ConceptDescriptionRepo: { url: '' },
      CompanyLookup: { url: '' },
    },
  }
}

async function configuredAASRepository (url = 'https://aas.example/shells') {
  const store = useInfrastructureStore()
  await store.waitForInitialization()
  store.dispatchComponentURL('AASRepo', url)
  mocks.getRequest.mockClear()
  return { store, component: store.getBasyxComponents.AASRepo }
}

describe('InfrastructureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.appliedOverrides.length = 0
    mocks.getRequest.mockReset()
    mocks.getRequest.mockResolvedValue({ success: true, data: { profiles: ['test-profile'] } })
    setActivePinia(createPinia())
    mocks.loadInfrastructuresFromStorage.mockResolvedValue({
      selectedInfrastructureId: 'viewer',
      infrastructures: [
        infrastructure('viewer', ['forbid-editing']),
        infrastructure('editor', ['allow-editing', 'allow-uploading']),
      ],
    })
  })

  it('enables ReBAC only for the current service with an exact advertised profile', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    const selected = store.getSelectedInfrastructure!
    selected.template = 'full'
    selected.components.AASRepo.url = 'https://aas.example'
    selected.components.SubmodelRepo.url = 'https://sm.example'
    store.getBasyxComponents.AASRepo.url = 'https://aas.example'
    store.getBasyxComponents.SubmodelRepo.url = 'https://sm.example'
    mocks.getRequest.mockImplementation(async path => ({ success: true, data: { profiles: path === 'https://aas.example/description'
      ? ['https://basyx.org/aas/API/3/2/RelationshipBasedAccessControl/1.0']
      : ['other-profile'] } }))
    await store.connectComponent('AASRepo')
    await store.connectComponent('SubmodelRepo')
    expect(store.supportsResourceAccess('AASRepo')).toBe(true)
    expect(store.supportsResourceAccess('SubmodelRepo')).toBe(false)
    expect(store.supportsResourceAccessEndpoint('https://aas.example/shells/YWFz/submodels/c20')).toBe(true)
    expect(store.supportsResourceAccess('AASRepo', 'https://other.example/shells/YWFz')).toBe(false)
    selected.components.AASRepo.url = 'https://new.example'
    expect(store.supportsResourceAccess('AASRepo')).toBe(false)
    selected.components.AASRepo.url = 'https://aas.example'
    mocks.getRequest.mockResolvedValue({ success: false })
    await store.connectComponent('AASRepo')
    expect(store.supportsResourceAccess('AASRepo')).toBe(false)
  })

  it('follows restoration, infrastructure switching, refresh, invalidation, and token removal', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    await nextTick()
    expect(mocks.appliedOverrides.at(-1)).toEqual({ allowEditing: false })

    await store.dispatchSelectInfrastructure('editor', false)
    await nextTick()
    expect(mocks.appliedOverrides.at(-1)).toEqual({ allowEditing: true, allowUploading: true })

    store.getSelectedInfrastructure!.token = {
      accessToken: token(['forbid-uploading']),
      expiresAt: Date.now() + 60_000,
    }
    await nextTick()
    expect(mocks.appliedOverrides.at(-1)).toEqual({ allowUploading: false })

    store.setAuthenticationStatusForInfrastructure('editor', false)
    await nextTick()
    expect(mocks.appliedOverrides.at(-1)).toBeNull()

    store.dispatchUpdateInfrastructure({ ...store.getSelectedInfrastructure!, token: undefined })
    await nextTick()
    expect(mocks.appliedOverrides.at(-1)).toBeNull()
  })

  it('derives authentication from credentials for the active security type only', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()

    const selectedInfrastructure = store.getSelectedInfrastructure!
    const scenarios: Array<{
      name: string
      auth: InfrastructureConfig['auth']
      token?: InfrastructureConfig['token']
      isAuthenticated?: boolean
      expected: boolean
    }> = [
      {
        name: 'no authentication ignores stale credentials and state',
        auth: {
          securityType: 'No Authentication',
          basicAuth: { username: 'stale-user', password: 'stale-password' },
        },
        token: { accessToken: 'stale-token' },
        isAuthenticated: true,
        expected: false,
      },
      {
        name: 'basic authentication accepts configured credentials',
        auth: {
          securityType: 'Basic Authentication',
          basicAuth: { username: 'user', password: '' },
        },
        expected: true,
      },
      {
        name: 'basic authentication rejects empty credentials',
        auth: {
          securityType: 'Basic Authentication',
          basicAuth: { username: '', password: '' },
        },
        expected: false,
      },
      {
        name: 'bearer authentication accepts a configured token',
        auth: {
          securityType: 'Bearer Token',
          bearerToken: { token: 'static-token' },
        },
        expected: true,
      },
      {
        name: 'bearer authentication ignores stale basic credentials',
        auth: {
          securityType: 'Bearer Token',
          basicAuth: { username: 'stale-user', password: 'stale-password' },
          bearerToken: { token: ' '.repeat(3) },
        },
        expected: false,
      },
      {
        name: 'custom header accepts configured credentials without an OAuth2 token',
        auth: {
          securityType: 'Custom Header',
          customHeader: { name: ' X-API-KEY ', value: 'static-key' },
        },
        expected: true,
      },
      {
        name: 'custom header ignores stale credentials when configuration is absent',
        auth: {
          securityType: 'Custom Header',
          bearerToken: { token: 'stale-token' },
        },
        token: { accessToken: 'stale-oauth-token' },
        isAuthenticated: true,
        expected: false,
      },
      {
        name: 'custom header rejects a blank name',
        auth: {
          securityType: 'Custom Header',
          customHeader: { name: ' '.repeat(3), value: 'static-key' },
        },
        expected: false,
      },
      {
        name: 'custom header rejects a blank value',
        auth: {
          securityType: 'Custom Header',
          customHeader: { name: 'X-API-KEY', value: ' '.repeat(3) },
        },
        expected: false,
      },
      {
        name: 'custom header rejects an invalid header name',
        auth: {
          securityType: 'Custom Header',
          customHeader: { name: 'X API KEY', value: 'static-key' },
        },
        expected: false,
      },
      {
        name: 'custom header rejects an invalid header value',
        auth: {
          securityType: 'Custom Header',
          customHeader: { name: 'X-API-KEY', value: 'static\r\nkey' },
        },
        expected: false,
      },
      {
        name: 'OAuth2 accepts a valid runtime token',
        auth: {
          securityType: 'OAuth2',
          oauth2: { host: 'https://idp.example', clientId: 'ui' },
        },
        token: { accessToken: 'oauth-token' },
        expected: true,
      },
      {
        name: 'OAuth2 rejects an invalidated runtime token',
        auth: {
          securityType: 'OAuth2',
          oauth2: { host: 'https://idp.example', clientId: 'ui' },
        },
        token: { accessToken: 'oauth-token' },
        isAuthenticated: false,
        expected: false,
      },
      {
        name: 'OAuth2 ignores stale credentials and authentication state without a token',
        auth: {
          securityType: 'OAuth2',
          basicAuth: { username: 'stale-user', password: 'stale-password' },
          oauth2: { host: 'https://idp.example', clientId: 'ui' },
        },
        isAuthenticated: true,
        expected: false,
      },
    ]

    for (const scenario of scenarios) {
      store.dispatchUpdateInfrastructure({
        ...selectedInfrastructure,
        auth: scenario.auth,
        token: scenario.token,
        isAuthenticated: scenario.isAuthenticated,
      })

      expect(store.getHasAuthenticationCredentials, scenario.name).toBe(scenario.expected)
    }
  })

  it('stores description profiles and clears them when only the fallback endpoint connects', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    const component = store.getBasyxComponents.AASRepo
    component.url = 'https://example.com/shells'

    const description = {
      profiles: [
        'https://basyx.org/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-001',
      ],
    }
    mocks.getRequest.mockResolvedValueOnce({ success: true, data: description })
    await store.connectComponent('AASRepo')
    expect(component.description).toEqual(description)

    mocks.getRequest
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true, data: { result: [] } })
    await store.connectComponent('AASRepo')
    expect(component.description).toBeNull()
  })

  it('keeps a component loading until its fallback connection check finishes', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    const component = store.getBasyxComponents.AASRepo
    component.url = 'https://example.com/shells'
    let resolveFallback!: (response: { success: boolean }) => void
    mocks.getRequest
      .mockResolvedValueOnce({ success: false })
      .mockReturnValueOnce(new Promise(resolve => {
        resolveFallback = resolve
      }))

    const connection = store.connectComponent('AASRepo')
    await vi.waitFor(() => expect(mocks.getRequest).toHaveBeenCalledWith(
      'https://example.com/shells?limit=1',
      'Connecting to AAS Repository URL',
      false,
      expect.any(Headers),
      {},
      'auto',
      undefined,
    ))
    expect(component.loading).toBe(true)

    resolveFallback({ success: false })
    await connection
    expect(component.loading).toBe(false)
    expect(component.connected).toBe(false)
  })

  it('forwards an explicit infrastructure context when testing a component connection', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    const component = store.getBasyxComponents.AASRepo
    component.url = 'https://draft.example/shells'
    const draftInfrastructure = {
      ...infrastructure('draft', []),
      auth: {
        securityType: 'Bearer Token' as const,
        bearerToken: { token: 'draft-token' },
      },
      components: {
        ...infrastructure('draft', []).components,
        AASRepo: { url: 'https://draft.example/shells' },
      },
    }

    await store.connectComponent('AASRepo', draftInfrastructure)

    expect(mocks.getRequest).toHaveBeenCalledWith(
      'https://draft.example/description',
      'Connecting to AAS Repository URL',
      true,
      expect.any(Headers),
      {},
      'auto',
      { infrastructure: draftInfrastructure, isolateAuthenticationFailures: true },
    )
  })

  it.each([true, false])('keeps saved connection results while testing an unsaved infrastructure (explicit context: %s)', async explicitContext => {
    const savedUrl = 'https://aas.example/shells'
    const { store, component } = await configuredAASRepository(savedUrl)
    await store.connectComponent('AASRepo')
    const savedResult = { ...store.getComponentConnectionResults.AASRepo }
    expect(savedResult).toEqual({ state: 'connected', infrastructureId: 'viewer', url: savedUrl })

    const draftInfrastructure = infrastructure('draft', [])
    draftInfrastructure.components.AASRepo.url = 'https://draft.example/shells'
    component.url = draftInfrastructure.components.AASRepo.url
    let resolveDescription!: (response: unknown) => void
    mocks.getRequest
      .mockResolvedValue({ success: false, failureKind: 'network' })
      .mockReturnValueOnce(new Promise(resolve => {
        resolveDescription = resolve
      }))

    store.dispatchIsTestingConnections(!explicitContext)
    const draftCheck = store.connectComponent('AASRepo', explicitContext ? draftInfrastructure : undefined)
    expect(component.loading).toBe(true)
    expect(store.getComponentConnectionResults.AASRepo).toEqual(savedResult)

    resolveDescription({ success: false, failureKind: 'network' })
    await draftCheck
    store.dispatchIsTestingConnections(false)
    expect(component.loading).toBe(false)
    expect(component.connected).toBe(false)
    expect(store.getComponentConnectionResults.AASRepo).toEqual(savedResult)

    component.url = savedUrl
    expect(store.getSelectedInfrastructure!.components.AASRepo.url).toBe(savedUrl)
    expect(store.getComponentConnectionResults.AASRepo).toEqual(savedResult)
  })

  it('discards a description response from a superseded component URL', async () => {
    const store = useInfrastructureStore()
    await store.waitForInitialization()
    const component = store.getBasyxComponents.AASRepo
    let resolveOldRequest!: (response: unknown) => void

    component.url = 'https://old.example/shells'
    mocks.getRequest.mockReturnValueOnce(new Promise(resolve => {
      resolveOldRequest = resolve
    }))
    const oldConnection = store.connectComponent('AASRepo')

    component.url = 'https://new.example/shells'
    const currentDescription = {
      profiles: ['https://basyx.org/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-001'],
    }
    mocks.getRequest.mockResolvedValueOnce({ success: true, data: currentDescription })
    await store.connectComponent('AASRepo')

    resolveOldRequest({
      success: true,
      data: { profiles: ['https://basyx.org/aas/API/3/2/obsolete'] },
    })
    await oldConnection

    expect(component.description).toEqual(currentDescription)
    expect(component.connected).toBe(true)
  })

  it('records a valid service description without requesting the fallback endpoint', async () => {
    const { store, component } = await configuredAASRepository('https://aas.example/shells///')
    mocks.getRequest.mockResolvedValueOnce({ success: true, data: { profiles: ['test-profile'] } })

    await store.connectComponent('AASRepo')

    expect(mocks.getRequest).toHaveBeenCalledOnce()
    expect(component.connected).toBe(true)
    expect(store.getComponentConnectionResults.AASRepo).toEqual({
      state: 'connected', infrastructureId: 'viewer', url: 'https://aas.example/shells',
    })
  })

  it.each([
    ['unreachable', { success: false, failureKind: 'network' }],
    ['authentication-required', { success: false, status: 401 }],
    ['access-denied', { success: false, status: 403 }],
    ['server-error', { success: false, status: 500 }],
    ['server-error', { success: false, status: 400 }],
    ['invalid-response', { success: false, failureKind: 'invalid-response' }],
    ['configuration-error', { success: false, failureKind: 'configuration' }],
    ['configuration-error', { success: false, blocked: true }],
  ])('records %s for a failed fallback check', async (state, fallback) => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest
      .mockResolvedValueOnce({ success: false, status: 404 })
      .mockResolvedValueOnce(fallback)

    await store.connectComponent('AASRepo')

    expect(component.connected).toBe(false)
    expect(component.loading).toBe(false)
    expect(store.getComponentConnectionResults.AASRepo).toEqual({
      state, infrastructureId: 'viewer', url: 'https://aas.example/shells',
    })
  })

  it.each([
    ['authentication-required', { success: false, status: 401 }],
    ['access-denied', { success: false, status: 403 }],
    ['server-error', { success: false, status: 500 }],
    ['server-error', { success: false, status: 400 }],
    ['configuration-error', { success: false, failureKind: 'configuration' }],
    ['invalid-response', { success: true, data: '<html>Sign in</html>' }],
  ])('preserves a description %s when the fallback has a network failure', async (state, description) => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest
      .mockResolvedValueOnce(description)
      .mockResolvedValueOnce({ success: false, failureKind: 'network' })

    await store.connectComponent('AASRepo')

    expect(component.connected).toBe(false)
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe(state)
  })

  it.each([404, 405])('allows a missing description (%s) to fall back to an unreachable endpoint', async status => {
    const { store } = await configuredAASRepository()
    mocks.getRequest
      .mockResolvedValueOnce({ success: false, status })
      .mockResolvedValueOnce({ success: false, failureKind: 'network' })

    await store.connectComponent('AASRepo')

    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('unreachable')
  })

  it.each([
    '<html>Reverse proxy sign-in page</html>',
    new Blob(['<html>Reverse proxy sign-in page</html>'], { type: 'text/html' }),
    { message: 'This is another service' },
    { result: [{}] },
  ])('rejects successful HTTP responses without an AAS payload: %s', async data => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest.mockResolvedValue({ success: true, data })

    await store.connectComponent('AASRepo')

    expect(component.connected).toBe(false)
    expect(component.description).toBeNull()
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('invalid-response')
    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'Unexpected AAS server response',
      extendedError: expect.stringContaining('AAS Repository URL'),
    }))
  })

  it.each([
    { success: false, status: 404 },
    { success: false, status: 401 },
    { success: false, failureKind: 'network' },
    { success: true, data: { profiles: [] } },
  ])('connects through a valid empty fallback list after a failed description: %s', async description => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest
      .mockResolvedValueOnce(description)
      .mockResolvedValueOnce({ success: true, data: { result: [] } })

    await store.connectComponent('AASRepo')

    expect(component.connected).toBe(true)
    expect(component.description).toBeNull()
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('connected')
  })

  it('keeps a pending fallback in the checking state', async () => {
    const { store, component } = await configuredAASRepository()
    let resolveFallback!: (response: unknown) => void
    mocks.getRequest
      .mockResolvedValueOnce({ success: false, status: 404 })
      .mockReturnValueOnce(new Promise(resolve => {
        resolveFallback = resolve
      }))

    const connection = store.connectComponent('AASRepo')
    await vi.waitFor(() => expect(mocks.getRequest).toHaveBeenCalledTimes(2))
    expect(component.loading).toBe(true)
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('checking')

    resolveFallback({ success: true, data: { result: [] } })
    await connection
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('connected')
  })

  it('does not turn an aborted connection check into an unreachable service', async () => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest.mockResolvedValue({ success: false, aborted: true })

    await store.connectComponent('AASRepo')

    expect(component.connected).toBe(false)
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('configuration-error')
  })

  it('does not overwrite the current result with a late failed response from an old URL', async () => {
    const { store, component } = await configuredAASRepository('https://old.example/shells')
    let resolveOldRequest!: (response: unknown) => void
    mocks.getRequest.mockReturnValueOnce(new Promise(resolve => {
      resolveOldRequest = resolve
    }))
    const oldConnection = store.connectComponent('AASRepo')

    store.dispatchComponentURL('AASRepo', 'https://new.example/shells')
    mocks.getRequest.mockResolvedValueOnce({ success: true, data: { profiles: ['test-profile'] } })
    await store.connectComponent('AASRepo')
    const currentResult = { ...store.getComponentConnectionResults.AASRepo }

    resolveOldRequest({ success: false, failureKind: 'network' })
    await oldConnection

    expect(component.connected).toBe(true)
    expect(store.getComponentConnectionResults.AASRepo).toEqual(currentResult)
    expect(currentResult).toEqual({
      state: 'connected', infrastructureId: 'viewer', url: 'https://new.example/shells',
    })
  })

  it('ignores a late check from a previously selected infrastructure', async () => {
    const { store } = await configuredAASRepository()
    let resolveOldRequest!: (response: unknown) => void
    mocks.getRequest.mockReturnValueOnce(new Promise(resolve => {
      resolveOldRequest = resolve
    }))
    const oldConnection = store.connectComponent('AASRepo')

    store.getInfrastructures.find(infra => infra.id === 'editor')!.components.AASRepo.url = 'https://editor.example/shells'
    await store.dispatchSelectInfrastructure('editor', false)
    await nextTick()
    mocks.getRequest.mockResolvedValueOnce({ success: true, data: { profiles: ['test-profile'] } })
    await store.connectComponent('AASRepo')
    const currentResult = { ...store.getComponentConnectionResults.AASRepo }

    resolveOldRequest({ success: false, failureKind: 'network' })
    await oldConnection

    expect(store.getComponentConnectionResults.AASRepo).toEqual(currentResult)
    expect(currentResult).toEqual({
      state: 'connected', infrastructureId: 'editor', url: 'https://editor.example/shells',
    })
  })

  it('resets an old failure to not-configured when the URL is cleared', async () => {
    const { store, component } = await configuredAASRepository()
    mocks.getRequest.mockResolvedValue({ success: false, failureKind: 'network' })
    await store.connectComponent('AASRepo')
    expect(store.getComponentConnectionResults.AASRepo?.state).toBe('unreachable')

    store.dispatchComponentURL('AASRepo', ' '.repeat(3))
    mocks.getRequest.mockClear()
    await store.connectComponent('AASRepo')

    expect(mocks.getRequest).not.toHaveBeenCalled()
    expect(component.connected).toBe(false)
    expect(component.loading).toBe(false)
    expect(store.getComponentConnectionResults.AASRepo).toEqual({
      state: 'not-configured', infrastructureId: 'viewer', url: '',
    })
  })
})
