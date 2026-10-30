import { NewPackaging, type ReadWriteSeeker } from 'aas-package3-typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAASXImport } from '@/composables/AAS/AASXImport'

const smEndpoint = 'https://sm.test/submodels/encoded-submodel-id'

const mocks = vi.hoisted(() => ({
  putAttachmentFile: vi.fn(),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ determineContentType: () => 'image/jpeg' }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({
    postAas: vi.fn().mockResolvedValue(true),
    putAas: vi.fn(),
    putThumbnail: vi.fn(),
    getAasEndpointById: vi.fn(),
  }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    postSubmodel: vi.fn().mockResolvedValue(true),
    putSubmodel: vi.fn(),
    putAttachmentFile: mocks.putAttachmentFile,
    getSmEndpointById: () => smEndpoint,
  }),
}))

vi.mock('@/composables/Client/CDRepositoryClient', () => ({
  useCDRepositoryClient: () => ({
    postConceptDescription: vi.fn(),
    putConceptDescription: vi.fn(),
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSelectedInfrastructure: { template: 'full' },
  }),
}))

class MemoryStream implements ReadWriteSeeker {
  private bytes = new Uint8Array()

  readAll (): Uint8Array {
    return this.bytes.slice()
  }

  writeAll (data: Uint8Array): void {
    this.bytes = data.slice()
  }
}

function fileElement (idShort: string | undefined, value: string): Record<string, unknown> {
  return {
    modelType: 'File',
    ...(idShort ? { idShort } : {}),
    contentType: 'image/jpeg',
    value,
  }
}

const environment = {
  assetAdministrationShells: [{
    modelType: 'AssetAdministrationShell',
    id: 'urn:aas:test',
    assetInformation: { assetKind: 'Instance' },
  }],
  submodels: [{
    modelType: 'Submodel',
    id: 'urn:sm:test',
    submodelElements: [
      {
        modelType: 'SubmodelElementList',
        idShort: 'Model3D',
        typeValueListElement: 'SubmodelElementCollection',
        value: [{
          modelType: 'SubmodelElementCollection',
          value: [{
            modelType: 'SubmodelElementCollection',
            idShort: 'File',
            value: [{
              modelType: 'SubmodelElementList',
              idShort: 'FileVersion',
              typeValueListElement: 'SubmodelElementCollection',
              value: [{
                modelType: 'SubmodelElementCollection',
                idShort: 'asd',
                value: [fileElement('DigitalFile', '/aasx-suppl/model.jpg')],
              }],
            }],
          }],
        }],
      },
      {
        modelType: 'SubmodelElementList',
        idShort: 'Previews',
        typeValueListElement: 'File',
        value: [
          fileElement(undefined, '/aasx-suppl/first.jpg'),
          fileElement('SecondPreview', '/aasx-suppl/second.jpg'),
        ],
      },
    ],
  }],
}

async function aasxFileWithAttachments (): Promise<File> {
  const pkg = await NewPackaging().CreateInStream(new MemoryStream())
  const spec = await pkg.PutPart(
    new URL('https://package.local/aasx/environment.json'),
    'application/json',
    new TextEncoder().encode(JSON.stringify(environment)),
  )
  await pkg.MakeSpec(spec)

  for (const name of ['model.jpg', 'first.jpg', 'second.jpg']) {
    const part = await pkg.PutPart(
      new URL(`https://package.local/aasx-suppl/${name}`),
      'image/jpeg',
      new TextEncoder().encode(name),
    )
    await pkg.RelateSupplementaryToSpec(part, spec)
  }

  const bytes = await pkg.Flush()
  pkg.Close()
  return {
    name: 'environment.aasx',
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
  } as File
}

function uploadedAttachmentPaths (): string[] {
  return mocks.putAttachmentFile.mock.calls.map(([, path]) => path as string)
}

describe('client-side AASX attachment import', () => {
  beforeEach(() => {
    mocks.putAttachmentFile.mockReset().mockResolvedValue(true)
  })

  it('addresses SubmodelElementList entries by index even when they carry an idShort', async () => {
    const result = await useAASXImport().importAasxFileClient(await aasxFileWithAttachments())

    expect(result.warnings).toEqual([])
    expect(uploadedAttachmentPaths()).toEqual([
      `${smEndpoint}/submodel-elements/Model3D%5B0%5D.File.FileVersion%5B0%5D.DigitalFile`,
      `${smEndpoint}/submodel-elements/Previews%5B0%5D`,
      `${smEndpoint}/submodel-elements/Previews%5B1%5D`,
    ])
  })
})
