import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { NewPackaging, type ReadWriteSeeker } from 'aas-package3-typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAASXImport } from '@/composables/AAS/AASXImport'

const mocks = vi.hoisted(() => ({
  postAas: vi.fn(),
  postSubmodel: vi.fn(),
}))

vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ determineContentType: () => 'text/plain' }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({
    postAas: mocks.postAas,
    putAas: vi.fn(),
    putThumbnail: vi.fn(),
    getAasEndpointById: vi.fn(),
  }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    postSubmodel: mocks.postSubmodel,
    putSubmodel: vi.fn(),
    putAttachmentFile: vi.fn(),
    getSmEndpointById: vi.fn(),
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

const xmlEnvironment = `<?xml version="1.0" encoding="UTF-8"?>
<environment xmlns="https://admin-shell.io/aas/3/0">
  <assetAdministrationShells>
    <assetAdministrationShell>
      <id>urn:aas:test</id>
      <assetInformation><assetKind>Instance</assetKind></assetInformation>
    </assetAdministrationShell>
  </assetAdministrationShells>
  <submodels>
    <submodel>
      <id>urn:sm:test</id>
      <submodelElements>
        <blob><idShort>Top</idShort><contentType>text/plain</contentType><value>SGVsbG8=</value></blob>
        <submodelElementCollection>
          <idShort>Group</idShort>
          <value>
            <blob><idShort>Nested</idShort><contentType>text/plain</contentType><value>V29ybGQ=</value></blob>
          </value>
        </submodelElementCollection>
        <submodelElementList>
          <idShort>Items</idShort>
          <typeValueListElement>Blob</typeValueListElement>
          <value>
            <blob><contentType>text/plain</contentType><value>TGlzdA==</value></blob>
          </value>
        </submodelElementList>
        <blob><idShort>Empty</idShort><contentType>text/plain</contentType></blob>
        <file><idShort>Attachment</idShort><contentType>text/plain</contentType><value>/file.txt</value></file>
      </submodelElements>
    </submodel>
  </submodels>
</environment>`

class MemoryStream implements ReadWriteSeeker {
  private bytes = new Uint8Array()

  readAll (): Uint8Array {
    return this.bytes.slice()
  }

  writeAll (data: Uint8Array): void {
    this.bytes = data.slice()
  }
}

function importFile (name: string, content: string | Uint8Array): File {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  return {
    name,
    text: async () => new TextDecoder().decode(bytes),
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
  } as File
}

async function aasxFile (xml: string): Promise<File> {
  const pkg = await NewPackaging().CreateInStream(new MemoryStream())
  const spec = await pkg.PutPart(
    new URL('https://package.local/aasx/environment.xml'),
    'application/xml',
    new TextEncoder().encode(xml),
  )
  await pkg.MakeSpec(spec)
  const bytes = await pkg.Flush()
  pkg.Close()
  return importFile('environment.aasx', bytes)
}

function uploadedElements (): Record<string, any> {
  const submodel = mocks.postSubmodel.mock.calls[0][0]
  const json = jsonization.toJsonable(submodel) as { submodelElements: Array<Record<string, any>> }
  return Object.fromEntries(json.submodelElements.map(element => [element.idShort, element]))
}

describe('client-side XML Blob import', () => {
  beforeEach(() => {
    mocks.postAas.mockReset().mockResolvedValue(true)
    mocks.postSubmodel.mockReset().mockResolvedValue(true)
  })

  it.each([
    ['plain XML', async () => importFile('environment.xml', xmlEnvironment)],
    ['XML-based AASX', async () => await aasxFile(xmlEnvironment)],
  ])('preserves Blob values when importing %s', async (_label, makeFile) => {
    const file = await makeFile()
    const importer = useAASXImport()
    const result = file.name.endsWith('.aasx')
      ? await importer.importAasxFileClient(file)
      : await importer.importEnvironmentFileClient(file)

    expect(result.importedAasIds).toEqual(['urn:aas:test'])
    expect(mocks.postSubmodel).toHaveBeenCalledOnce()

    const elements = uploadedElements()
    expect(elements.Top.value).toBe('SGVsbG8=')
    expect(elements.Group.value[0].value).toBe('V29ybGQ=')
    expect(elements.Items.value[0].value).toBe('TGlzdA==')
    expect(elements.Empty).not.toHaveProperty('value')
    expect(elements.Attachment.value).toBe('/file.txt')
  })

  it.each([
    ['plain XML', async (xml: string) => importFile('environment.xml', xml)],
    ['XML-based AASX', aasxFile],
  ])('imports %s with a wrapped Blob value', async (_label, makeFile) => {
    const xml = xmlEnvironment.replace('SGVsbG8=', 'SGVs\n  bG8=')
    const file = await makeFile(xml)
    const importer = useAASXImport()

    await (file.name.endsWith('.aasx')
      ? importer.importAasxFileClient(file)
      : importer.importEnvironmentFileClient(file))

    expect(uploadedElements().Top.value).toBe('SGVsbG8=')
  })

  it('preserves Blob values in JSON imports', async () => {
    const environment = {
      assetAdministrationShells: [{
        modelType: 'AssetAdministrationShell',
        id: 'urn:aas:test',
        assetInformation: { assetKind: 'Instance' },
      }],
      submodels: [{
        modelType: 'Submodel',
        id: 'urn:sm:test',
        submodelElements: [{
          modelType: 'Blob',
          idShort: 'Top',
          contentType: 'text/plain',
          value: 'SGVsbG8=',
        }],
      }],
    }

    await useAASXImport().importEnvironmentFileClient(importFile('environment.json', JSON.stringify(environment)))

    expect(uploadedElements().Top.value).toBe('SGVsbG8=')
  })
})
