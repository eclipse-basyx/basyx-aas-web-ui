import type { InfrastructureConfig } from '@/types/Infrastructure'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { base64Encode } from '@/utils/EncodeDecodeUtils'

const mocks = vi.hoisted(() => ({
  appliedOverrides: [] as unknown[],
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
    getRequest: vi.fn().mockResolvedValue({ success: true }),
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

describe('InfrastructureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.appliedOverrides.length = 0
    setActivePinia(createPinia())
    mocks.loadInfrastructuresFromStorage.mockResolvedValue({
      selectedInfrastructureId: 'viewer',
      infrastructures: [
        infrastructure('viewer', ['forbid-editing']),
        infrastructure('editor', ['allow-editing', 'allow-uploading']),
      ],
    })
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
})
