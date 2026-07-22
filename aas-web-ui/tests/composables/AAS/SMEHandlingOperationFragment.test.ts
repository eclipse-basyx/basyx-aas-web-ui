import { describe, expect, it, vi } from 'vitest'

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

describe('SMEHandling Operation fragments', () => {
  it('fetches the owning Operation endpoint and resolves the fragment locally', async () => {
    mocks.fetchSme.mockResolvedValue({
      modelType: 'Operation',
      inputVariables: [{
        value: { modelType: 'Property', idShort: 'input', valueType: 'xs:string', value: 'ok' },
      }],
    })
    const endpoint = '/submodels/c20/submodel-elements/operation'
    const fragment = '/inputVariables/0/value'
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    const result = await useSMEHandling().fetchSme(endpoint, false, fragment)

    expect(mocks.fetchSme).toHaveBeenCalledOnce()
    expect(mocks.fetchSme).toHaveBeenCalledWith(endpoint)
    expect(mocks.fetchSm).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      modelType: 'Property',
      selectionKey: `${endpoint}#${fragment}`,
      persistence: { operationPath: endpoint, fragment },
    })
  })

  it('never submits a malformed fragment as a repository endpoint', async () => {
    mocks.fetchSme.mockResolvedValue({ modelType: 'Operation', inputVariables: [] })
    const endpoint = '/submodels/c20/submodel-elements/operation'
    const { useSMEHandling } = await import('@/composables/AAS/SMEHandling')

    const result = await useSMEHandling().fetchSme(endpoint, false, '/inputVariables/0/constructor')

    expect(result).toEqual({})
    expect(mocks.fetchSme).toHaveBeenCalledWith(endpoint)
    expect(mocks.fetchSme).not.toHaveBeenCalledWith(expect.stringContaining('constructor'))
  })
})
