import { describe, expect, it } from 'vitest'
import { catalogFilterItems, catalogFilterPreset } from '@/pages/modules/EclipseDataspaceConnector/data/catalogFilters'

function preset (value: string) {
  const catalogFilter = catalogFilterPreset(value)
  if (!catalogFilter) {
    throw new Error(`Missing catalog filter preset ${value}`)
  }
  return catalogFilter
}

describe('catalogFilters', () => {
  it('requests the full catalog by default', () => {
    expect(catalogFilterItems[0]).toEqual({ title: 'All', value: 'all' })
  })

  it('separates the preset groups by dividers', () => {
    const titles = catalogFilterItems.map(item => 'title' in item ? item.title : '---')

    expect(titles.slice(0, 2)).toEqual(['All', '---'])
    expect(titles.slice(titles.indexOf('Push Asset'), titles.indexOf('Push Asset') + 2)).toEqual(['Push Asset', '---'])
    expect(titles.filter(title => title === '---')).toHaveLength(2)
  })

  it('skips dividers when looking up a preset', () => {
    expect(catalogFilterPreset('divider')).toBeUndefined()
  })

  it('filters the catalog by Catena-X taxonomy type', () => {
    expect(preset('digitalTwinRegistry').querySpec?.filterExpression).toEqual([
      {
        '@context': { edc: 'https://w3id.org/edc/v0.0.1/ns/' },
        '@type': 'edc:Criterion',
        // eslint-disable-next-line unicorn/prefer-https -- The Dublin Core namespace is an exact identifier required by CX-0002.
        'operandLeft': '\'http://purl.org/dc/terms/type\'.\'@id\'',
        'operator': '=',
        'operandRight': 'https://w3id.org/catenax/taxonomy#DigitalTwinRegistry',
      },
    ])
    expect(preset('submodelService').querySpec?.filterExpression).toEqual([
      expect.objectContaining({ operandRight: 'https://w3id.org/catenax/taxonomy#Submodel' }),
    ])
  })

  it('matches push assets by ID, display name or description', () => {
    const { matches, querySpec } = preset('pushAsset')

    expect(querySpec).toBeUndefined()
    expect(matches?.({ '@id': 'asset-PUSH-1' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'displayName': 'Push data' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'edc:description': 'Data to push' })).toBe(true)
    expect(matches?.({
      '@id': 'asset-1',
      'aas-referables:displayName': [{ 'aas-langstrings:language': 'en', 'aas-langstrings:text': 'Push' }],
    })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'name': 'Push', 'displayName': 'Pull' })).toBe(false)
  })

  it('matches Asset Administration Shell assets by AAS or its full name', () => {
    const { matches } = preset('assetAdministrationShell')

    expect(matches?.({ '@id': 'aas-asset-1' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'description': 'An Asset Administration Shell' })).toBe(true)
    expect(matches?.({
      '@id': 'asset-1',
      'aas-referables:displayName': [{
        '@type': 'https://admin-shell.io/aas/3/0/LangStringNameType',
        'aas-langstrings:language': 'en',
        'aas-langstrings:text': 'Motor',
      }],
    })).toBe(false)
  })

  it('excludes Submodel assets from Asset Administration Shell assets', () => {
    const { matches } = preset('assetAdministrationShell')

    expect(matches?.({ '@id': 'aas-sm-1' })).toBe(false)
    expect(matches?.({ '@id': 'aas-asset-1', 'description': 'Submodel of an AAS' })).toBe(false)
  })

  it('matches Digital Product Passport assets by DPP or its full name', () => {
    const { matches } = preset('digitalProductPassport')

    expect(matches?.({ '@id': 'dpp-battery-1' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'displayName': 'Digital Product Passport of a battery' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'description': 'Product carbon footprint' })).toBe(false)
  })

  it('excludes service assets from Asset Administration Shell and Submodel assets', () => {
    expect(preset('assetAdministrationShell').matches?.({ '@id': 'asset-1', 'displayName': 'AAS Service' })).toBe(false)
    expect(preset('submodel').matches?.({
      '@id': 'asset-2',
      'name': 'Submodel Service',
      'description': 'The Submodel service allows to retrieve Submodels of Digital Twins',
    })).toBe(false)
  })

  it('matches Submodel assets by SM as a whole word or Submodel', () => {
    const { matches } = preset('submodel')

    expect(matches?.({ '@id': 'sm-1' })).toBe(true)
    expect(matches?.({ '@id': 'aas_SM' })).toBe(true)
    expect(matches?.({ '@id': 'asset-1', 'displayName': 'Nameplate submodel' })).toBe(true)
    expect(matches?.({ '@id': 'small-asset', 'description': 'Smart transmission data' })).toBe(false)
  })
})
