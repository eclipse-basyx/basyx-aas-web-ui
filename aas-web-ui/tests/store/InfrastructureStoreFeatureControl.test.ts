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

describe('InfrastructureStore feature-control lifecycle', () => {
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
})
