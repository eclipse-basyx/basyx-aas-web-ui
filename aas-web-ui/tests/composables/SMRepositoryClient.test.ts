import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  submodelRepoUrl: 'https://example.test/submodels',
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

describe('SMRepositoryClient.ts write guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.submodelRepoUrl = 'https://example.test/submodels'
  })

  it('throws when postSubmodelElement request result is not successful', async () => {
    mockDeps.postRequest.mockResolvedValueOnce({ success: false })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { postSubmodelElement } = useSMRepositoryClient()

    await expect(
      postSubmodelElement({ idShort: 'temperature', modelType: 'Property' } as any, 'submodel-id'),
    ).rejects.toThrow('Failed while creating Submodel Element.')
  })

  it('returns true when putSubmodelElement succeeds', async () => {
    mockDeps.putRequest.mockResolvedValueOnce({ success: true })

    const { useSMRepositoryClient } = await import('@/composables/Client/SMRepositoryClient')
    const { putSubmodelElement } = useSMRepositoryClient()

    await expect(
      putSubmodelElement({ idShort: 'temperature', modelType: 'Property' } as any, '/submodel-elements/temp'),
    ).resolves.toBe(true)
  })
})
