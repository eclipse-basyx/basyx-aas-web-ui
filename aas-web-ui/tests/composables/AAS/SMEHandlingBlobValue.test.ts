import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchSme: vi.fn(),
  fetchSm: vi.fn(),
  dispatchSelectedNode: vi.fn(),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({ fetchSme: mocks.fetchSme, fetchSm: mocks.fetchSm }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ fetchCds: vi.fn().mockResolvedValue([]) }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({ dispatchSelectedNode: mocks.dispatchSelectedNode }),
}))

const endpoint = '/submodels/c20/submodel-elements/Header'

describe('SMEHandling Blob values', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('refetches a requested Blob with its value when the repository omitted it', async () => {
    mocks.fetchSme
      .mockResolvedValueOnce({ modelType: 'Blob', idShort: 'Header', contentType: 'text/markdown' })
      .mockResolvedValueOnce({ modelType: 'Blob', idShort: 'Header', contentType: 'text/markdown', value: 'SGk=' })
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    const result = await useSMEHandling().fetchAndDispatchSme(endpoint)

    expect(mocks.fetchSme).toHaveBeenNthCalledWith(1, endpoint)
    expect(mocks.fetchSme).toHaveBeenNthCalledWith(2, `${endpoint}?extent=withBlobValue`)
    expect(result).toMatchObject({ value: 'SGk=', path: endpoint })
    expect(mocks.dispatchSelectedNode).toHaveBeenCalledWith(expect.objectContaining({ value: 'SGk=' }))
  })

  it('does not request Blob values unless asked to', async () => {
    mocks.fetchSme.mockResolvedValue({ modelType: 'Blob', idShort: 'Header' })
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    await useSMEHandling().fetchSme(endpoint)

    expect(mocks.fetchSme).toHaveBeenCalledOnce()
  })

  it('does not refetch non-Blob elements, so nested Blobs of collections stay unloaded', async () => {
    mocks.fetchSme.mockResolvedValue({ modelType: 'SubmodelElementCollection', idShort: 'Coll', value: [] })
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    await useSMEHandling().fetchAndDispatchSme('/submodels/c20/submodel-elements/Coll')

    expect(mocks.fetchSme).toHaveBeenCalledOnce()
  })

  it('keeps the first response when the Blob refetch fails', async () => {
    mocks.fetchSme
      .mockResolvedValueOnce({ modelType: 'Blob', idShort: 'Header' })
      .mockResolvedValueOnce({})
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    const result = await useSMEHandling().fetchAndDispatchSme(endpoint)

    expect(result).toMatchObject({ modelType: 'Blob', idShort: 'Header' })
  })
})
