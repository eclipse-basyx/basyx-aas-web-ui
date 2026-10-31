import { describe, expect, it, vi } from 'vitest'
import {
  aasSpecVersion,
  createEmptyEdcAssetOAuth2,
  fillTemplatePlaceholders,
  hasEdcAssetOAuth2,
  useEdcAssetFromAas,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetFromAas'

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (referable: any) => referable?.idShort ?? '',
    descriptionToDisplay: (referable: any) => referable?.description?.[0]?.text ?? '',
  }),
}))

const catenaXContext = {
  'edc': 'https://w3id.org/edc/v0.0.1/ns/',
  'cx-common': 'https://w3id.org/catenax/ontology/common#',
  'cx-taxo': 'https://w3id.org/catenax/taxonomy#',
  // eslint-disable-next-line unicorn/prefer-https
  'dct': 'http://purl.org/dc/terms/',
  'aas-semantics': 'https://admin-shell.io/aas/3/0/HasSemantics/',
}

const dataAddressSettings = {
  '@type': 'DataAddress',
  'proxyPath': 'true',
  'proxyBody': 'false',
  'proxyMethod': 'false',
  'proxyQueryParams': 'false',
}

describe('EdcAssetFromAas.ts', () => {
  it('fills placeholders by label and removes properties without value', () => {
    const template = {
      'id': '{{Asset ID|Enter an ID|Hint}}',
      'name': '{{Asset Display Name}}',
      'fixed': 'value',
      'oauth2:clientId': '{{Endpoint client ID||}}',
      'list': ['{{Asset ID}}', '{{Unknown}}'],
    }

    expect(fillTemplatePlaceholders(template, { 'Asset ID': 'abc', 'Asset Display Name': 'Name' })).toEqual({
      id: 'abc',
      name: 'Name',
      fixed: 'value',
      list: ['abc'],
    })
  })

  it('creates the EDC Asset of an AAS pointing to the AAS endpoint', () => {
    const { createAasEdcAsset } = useEdcAssetFromAas()
    const aas = {
      id: 'urn:aas',
      idShort: 'Pump',
      description: [{ language: 'en', text: 'A pump' }],
      endpoints: [{ protocolInformation: { href: 'https://repo.test/shells/dXJuOmFhcw' }, interface: 'AAS-3.0' }],
    }

    const asset = createAasEdcAsset(aas)

    expect(asset['@id']).toBe('dXJuOmFhcw')
    expect(asset.properties).toEqual({
      'id': 'dXJuOmFhcw',
      'displayName': 'Pump',
      'description': 'A pump',
      'aas-identifiables:id': { '@id': 'urn:aas' },
      'aas-referables:idShort': { '@id': 'Pump' },
      'aas-referables:description': [{
        '@type': 'https://admin-shell.io/aas/3/0/LangStringTextType',
        'aas-langstrings:language': 'en',
        'aas-langstrings:text': 'A pump',
      }],
    })
    expect(asset['@context']).toMatchObject({
      ...catenaXContext,
      'aas-identifiables': 'https://admin-shell.io/aas/3/0/Identifiable/',
      'aas-referables': 'https://admin-shell.io/aas/3/0/Referable/',
      'aas-langstrings': 'https://admin-shell.io/aas/3/0/AbstractLangString/',
    })
    expect(asset.dataAddress).toEqual({ type: 'HttpData', baseUrl: 'https://repo.test/shells/dXJuOmFhcw', ...dataAddressSettings })
  })

  it('creates the EDC Asset of a Submodel pointing to the Submodel endpoint', () => {
    const { createSmEdcAsset } = useEdcAssetFromAas()
    const sm = {
      id: 'urn:sm',
      idShort: 'Nameplate',
      endpoints: [{ protocolInformation: { href: 'https://repo.test/submodels/dXJuOnNt' }, interface: 'SUBMODEL-3.0' }],
    }

    const asset = createSmEdcAsset({ id: 'urn:aas', idShort: 'Pump' }, sm)

    expect(asset['@id']).toBe('dXJuOnNt')
    expect(asset.properties).toEqual({
      'id': 'dXJuOnNt',
      'displayName': 'Pump - SM Nameplate',
      'aas-identifiables:id': { '@id': 'urn:sm' },
      'aas-referables:idShort': { '@id': 'Nameplate' },
      'dct:type': { '@id': 'https://w3id.org/catenax/taxonomy#Submodel' },
      'cx-common:version': '3.0',
    })
    expect(asset['@context']).toMatchObject(catenaXContext)
    expect(asset['@context']).toMatchObject({ 'aas-identifiables': 'https://admin-shell.io/aas/3/0/Identifiable/' })
    expect(asset.dataAddress).toEqual({ type: 'HttpData', baseUrl: 'https://repo.test/submodels/dXJuOnNt', ...dataAddressSettings })
  })

  it('adds the displayName and description of the Submodel as AAS LangStrings and leaves out empty texts', () => {
    const { createSmEdcAsset } = useEdcAssetFromAas()
    const sm = {
      id: 'urn:sm',
      idShort: 'Nameplate',
      displayName: [{ language: 'en', text: 'Nameplate' }, { language: 'de', text: 'Typenschild' }],
      description: [{ language: 'en', text: '' }],
    }

    const asset = createSmEdcAsset({ id: 'urn:aas', idShort: 'Pump' }, sm)

    expect(asset.properties['aas-referables:displayName']).toEqual([
      {
        '@type': 'https://admin-shell.io/aas/3/0/LangStringNameType',
        'aas-langstrings:language': 'en',
        'aas-langstrings:text': 'Nameplate',
      },
      {
        '@type': 'https://admin-shell.io/aas/3/0/LangStringNameType',
        'aas-langstrings:language': 'de',
        'aas-langstrings:text': 'Typenschild',
      },
    ])
    expect(asset.properties).not.toHaveProperty('aas-referables:description')
  })

  it('adds the semanticId of the Submodel to the EDC Asset properties', () => {
    const { createSmEdcAsset } = useEdcAssetFromAas()
    const sm = {
      id: 'urn:sm',
      idShort: 'Nameplate',
      semanticId: { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: 'urn:samm:io.catenax.serial_part:3.0.0#SerialPart' }] },
    }

    const asset = createSmEdcAsset({ id: 'urn:aas', idShort: 'Pump' }, sm)

    expect(asset.properties['aas-semantics:semanticId']).toEqual({ '@id': 'urn:samm:io.catenax.serial_part:3.0.0#SerialPart' })
    expect(asset['@context']).toMatchObject({ 'aas-semantics': 'https://admin-shell.io/aas/3/0/HasSemantics/' })
  })

  it('adds the supplementalSemanticIds of the AAS and Submodel to the EDC Asset properties', () => {
    const { createAasEdcAsset, createSmEdcAsset } = useEdcAssetFromAas()
    const reference = (value: string) => ({ type: 'ExternalReference', keys: [{ type: 'GlobalReference', value }] })
    const aas = { id: 'urn:aas', idShort: 'Pump', supplementalSemanticIds: [reference('urn:supplemental:aas')] }
    const sm = {
      id: 'urn:sm',
      idShort: 'Nameplate',
      supplementalSemanticIds: [reference('urn:supplemental:1'), { type: 'ExternalReference', keys: [] }, reference('urn:supplemental:2')],
    }

    const aasAsset = createAasEdcAsset(aas)
    const smAsset = createSmEdcAsset(aas, sm)

    expect(aasAsset.properties['aas-semantics:supplementalSemanticId']).toEqual([{ '@id': 'urn:supplemental:aas' }])
    expect(aasAsset['@context']).toMatchObject({ 'aas-semantics': 'https://admin-shell.io/aas/3/0/HasSemantics/' })
    expect(smAsset.properties['aas-semantics:supplementalSemanticId']).toEqual([
      { '@id': 'urn:supplemental:1' },
      { '@id': 'urn:supplemental:2' },
    ])
    expect(smAsset.properties).not.toHaveProperty('aas-semantics:semanticId')
  })

  it('uses the aas-* namespace version matching the interface version of the endpoint', () => {
    const { createSmEdcAsset } = useEdcAssetFromAas()
    const sm = {
      id: 'urn:sm',
      idShort: 'Nameplate',
      semanticId: { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: 'urn:samm:io.catenax.serial_part:3.0.0#SerialPart' }] },
      endpoints: [{ protocolInformation: { href: 'https://repo.test/submodels/dXJuOnNt' }, interface: 'SUBMODEL-3.1' }],
    }

    const asset = createSmEdcAsset({ id: 'urn:aas', idShort: 'Pump' }, sm)

    expect(asset['@context']).toMatchObject({
      'aas-identifiables': 'https://admin-shell.io/aas/3/1/Identifiable/',
      'aas-semantics': 'https://admin-shell.io/aas/3/1/HasSemantics/',
    })
    expect(asset.properties['cx-common:version']).toBe('3.1')
  })

  it('extracts the AAS specification version of an endpoint interface, at least 3.0', () => {
    expect(aasSpecVersion('AAS-3.0')).toBe('3.0')
    expect(aasSpecVersion('SUBMODEL-3.1')).toBe('3.1')
    expect(aasSpecVersion('SUBMODEL-REPOSITORY-3.2.1')).toBe('3.2')
    expect(aasSpecVersion('SUBMODEL-2.0')).toBe('3.0')
    expect(aasSpecVersion('SUBMODEL')).toBe('3.0')
    expect(aasSpecVersion(undefined)).toBe('3.0')
  })

  it('adds the given OAuth2 values to the data address and leaves out empty ones', () => {
    const { createAasEdcAsset, createSmEdcAsset } = useEdcAssetFromAas()
    const aas = {
      id: 'urn:aas',
      idShort: 'Pump',
      endpoints: [{ protocolInformation: { href: 'https://repo.test/shells/dXJuOmFhcw' }, interface: 'AAS-3.0' }],
    }
    const sm = { id: 'urn:sm', idShort: 'Nameplate' }
    const aasOAuth2 = { clientId: ' aas-client ', clientSecretKey: 'aas-secret-key', tokenUrl: 'https://idp.test/token', scope: '' }
    const smOAuth2 = { ...createEmptyEdcAssetOAuth2(), clientId: 'sm-client' }

    expect(createAasEdcAsset(aas, aasOAuth2).dataAddress).toEqual({
      'type': 'HttpData',
      'baseUrl': 'https://repo.test/shells/dXJuOmFhcw',
      'oauth2:clientId': 'aas-client',
      'oauth2:clientSecretKey': 'aas-secret-key',
      'oauth2:tokenUrl': 'https://idp.test/token',
      ...dataAddressSettings,
    })
    expect(createSmEdcAsset(aas, sm, smOAuth2).dataAddress).toEqual({ 'type': 'HttpData', 'oauth2:clientId': 'sm-client', ...dataAddressSettings })
  })

  it('reports whether any OAuth2 value is set', () => {
    expect(hasEdcAssetOAuth2(createEmptyEdcAssetOAuth2())).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: ' ' })).toBe(false)
    expect(hasEdcAssetOAuth2({ ...createEmptyEdcAssetOAuth2(), scope: 'read' })).toBe(true)
  })
})
