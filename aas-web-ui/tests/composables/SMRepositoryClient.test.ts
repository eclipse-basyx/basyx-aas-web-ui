import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  submodelRepoUrl: 'https://example.test/submodels',
  aasRepoUrl: 'https://example.test/aas',
  selectedInfrastructure: { template: 'full' },
  selectedAAS: {},
}))

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
  generateUUIDFromString: vi.fn((value: string) => value),
  toJsonable: vi.fn((value: unknown) => value),
}))

vi.mock('@aas-core-works/aas-core3.1-typescript', () => ({
  jsonization: {
    toJsonable: mockDeps.toJsonable,
  },
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSubmodelRepoURL: mockState.submodelRepoUrl,
    getAASRepoURL: mockState.aasRepoUrl,
    getSelectedInfrastructure: mockState.selectedInfrastructure,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: mockState.selectedAAS,
  }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mockDeps.getRequest,
    postRequest: mockDeps.postRequest,
    putRequest: mockDeps.putRequest,
    deleteRequest: mockDeps.deleteRequest,
  }),
}))

vi.mock('@/composables/IDUtils', () => ({
  useIDUtils: () => ({
    generateUUIDFromString: mockDeps.generateUUIDFromString,
  }),
}))

describe('SMRepositoryClient.ts write contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.submodelRepoUrl = 'https://example.test/submodels'
    mockState.aasRepoUrl = 'https://example.test/aas'
    mockState.selectedInfrastructure = { template: 'full' }
    mockState.selectedAAS = {}
  })

  it('returns false when postSubmodelElement request result is not successful', async () => {
    mockDeps.postRequest.mockResolvedValueOnce({ success: false })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { postSubmodelElement } = useSMRepositoryClient()

    await expect(
      postSubmodelElement({ idShort: 'temperature', modelType: 'Property' } as any, 'submodel-id'),
    ).resolves.toBe(false)
  })

  it('returns true when putSubmodelElement succeeds', async () => {
    mockDeps.putRequest.mockResolvedValueOnce({ success: true })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { putSubmodelElement } = useSMRepositoryClient()

    await expect(
      putSubmodelElement({ idShort: 'temperature', modelType: 'Property' } as any, '/submodel-elements/temp'),
    ).resolves.toBe(true)
  })

  it('passes suppressRequestErrorMessage flag to putSubmodelElement request', async () => {
    mockDeps.putRequest.mockResolvedValueOnce({ success: false })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { putSubmodelElement } = useSMRepositoryClient()

    await putSubmodelElement(
      { idShort: 'temperature', modelType: 'Property' } as any,
      '/submodel-elements/temp',
      true,
    )

    expect(mockDeps.putRequest).toHaveBeenCalledWith(
      '/submodel-elements/temp',
      expect.any(String),
      expect.any(Headers),
      'updating Submodel Element',
      true,
    )
  })

  it('resolves identifiable Submodels through AAS superpath endpoints', async () => {
    mockState.selectedInfrastructure = { template: 'identifiable' }
    mockDeps.putRequest.mockResolvedValueOnce({ success: true })

    const { base64Encode } = await import('@/utils/EncodeDecodeUtils')
    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { getSmEndpointById, postSubmodel } = useSMRepositoryClient()

    const expectedPath = [
      'https://example.test/aas/shells',
      base64Encode('shell-id'),
      'submodels',
      base64Encode('submodel-id'),
    ].join('/')

    expect(getSmEndpointById('submodel-id', 'shell-id')).toBe(expectedPath)

    await expect(
      postSubmodel({ id: 'submodel-id' } as any, false, 'shell-id'),
    ).resolves.toBe(true)

    expect(mockDeps.postRequest).not.toHaveBeenCalled()
    expect(mockDeps.putRequest).toHaveBeenCalledWith(
      expectedPath,
      expect.any(String),
      expect.any(Headers),
      'creating Submodel via AAS superpath',
      false,
    )
  })
})
