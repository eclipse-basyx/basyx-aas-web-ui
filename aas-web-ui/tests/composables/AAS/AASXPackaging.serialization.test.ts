import { NewPackaging } from 'aas-package3-typescript'
import { describe, expect, it, vi } from 'vitest'
import { useAASXPackaging } from '@/composables/AAS/AASXPackaging'

const attachmentBytes = new TextEncoder().encode('model-bytes')

const aas = {
  modelType: 'AssetAdministrationShell',
  id: 'urn:aas:test',
  assetInformation: { assetKind: 'Instance' },
  submodels: [{ type: 'ModelReference', keys: [{ type: 'Submodel', value: 'urn:sm:test' }] }],
}

const submodel = {
  modelType: 'Submodel',
  id: 'urn:sm:test',
  submodelElements: [{
    modelType: 'File',
    idShort: 'DigitalFile',
    contentType: 'image/jpeg',
    value: '/aasx/files/managed-token/model.jpg',
    path: 'https://sm.test/submodels/encoded/submodel-elements/DigitalFile',
  }],
}

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({
    fetchAasById: vi.fn().mockResolvedValue(aas),
    getAasEndpointById: vi.fn(),
  }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({
    fetchSmById: vi.fn().mockResolvedValue(submodel),
  }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ fetchCdById: vi.fn() }),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ determineContentType: () => 'image/jpeg' }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    fetchAttachmentFile: vi.fn().mockResolvedValue(new Blob([attachmentBytes], { type: 'image/jpeg' })),
  }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({ fetchAssetInformation: vi.fn() }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ getRequest: vi.fn() }),
}))

async function readPackagedSpecAndParts (blob: Blob): Promise<{ specText: string, partPaths: string[] }> {
  const pkg = await NewPackaging().OpenReadFromBytes(new Uint8Array(await blob.arrayBuffer()))
  try {
    const [spec] = await pkg.Specs()
    const parts = await pkg.SupplementariesFor(spec!)
    return {
      specText: spec!.ReadAllText(),
      partPaths: parts.map(part => part.URI.pathname),
    }
  } finally {
    pkg.Close()
  }
}

describe('client-side AASX serialization', () => {
  it.each(['aasx-json', 'aasx-xml'] as const)(
    'references packaged attachments by their package path in %s',
    async format => {
      const { blob, warnings } = await useAASXPackaging().createClientSerialization({
        aasId: 'urn:aas:test',
        selectedSubmodelIds: ['urn:sm:test'],
        includeConceptDescriptions: false,
        format,
      })

      const { specText, partPaths } = await readPackagedSpecAndParts(blob)

      expect(warnings).toEqual([])
      expect(partPaths).toEqual(['/aasx-suppl/model.jpg'])
      expect(specText).toContain('/aasx-suppl/model.jpg')
      expect(specText).not.toContain('/aasx/files/managed-token/model.jpg')
    },
  )
})
