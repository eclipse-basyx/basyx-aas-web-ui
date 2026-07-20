import type { BaSyxComponentKey } from '@/types/BaSyx'
import type { ComponentConfig, InfrastructureConfig, InfrastructureTemplate } from '@/types/Infrastructure'
import { describe, expect, it } from 'vitest'
import {
  BASYX_COMPONENT_KEYS,
  getActiveComponentKeys,
  getActiveComponentUrlForTemplate,
  getCatenaXAccessMode,
  getDefaultAasUploadMode,
  getEndpointFieldsForTemplate,
  getEndpointFieldValue,
  getInfrastructureSummary,
  normalizeInfrastructureTemplate,
  setEndpointFieldValue,
  supportsInfrastructureTemplate,
  usesSubmodelSuperpath,
} from '@/utils/InfrastructureUtils'

function createComponents (): Record<BaSyxComponentKey, ComponentConfig> {
  return {
    AASDiscovery: { url: '' },
    AASRegistry: { url: '' },
    SubmodelRegistry: { url: '' },
    AASRepo: { url: '' },
    SubmodelRepo: { url: '' },
    ConceptDescriptionRepo: { url: '' },
  }
}

function createInfrastructure (template: InfrastructureTemplate): InfrastructureConfig {
  return {
    id: 'infra-1',
    name: 'Test Infrastructure',
    template,
    components: createComponents(),
    auth: { securityType: 'No Authentication' },
  }
}

describe('InfrastructureUtils.ts', () => {
  it('defaults unknown template values to full', () => {
    expect(normalizeInfrastructureTemplate(undefined)).toBe('full')
    expect(normalizeInfrastructureTemplate('unknown')).toBe('full')
    expect(normalizeInfrastructureTemplate('catena-x')).toBe('catena-x')
  })

  it('returns active endpoint fields per template', () => {
    expect(getEndpointFieldsForTemplate('full').map(field => field.key)).toEqual(BASYX_COMPONENT_KEYS)
    expect(getEndpointFieldsForTemplate('identifiable').map(field => field.key)).toEqual(['AASRepo'])
    expect(getEndpointFieldsForTemplate('mono-repo').map(field => field.key)).toEqual([
      'AASDiscovery',
      'AASRegistry',
      'SubmodelRegistry',
      'AASEnvironment',
    ])
    expect(getEndpointFieldsForTemplate('catena-x').map(field => field.key)).toEqual([
      'DigitalTwinRegistry',
      'SubmodelService',
    ])
  })

  it('uses no component endpoints for Catena-X EDC mode', () => {
    const infrastructure = createInfrastructure('catena-x')
    infrastructure.catenaX = {
      accessMode: 'edc',
      edc: { proxyId: 'default' },
    }

    expect(getCatenaXAccessMode(infrastructure)).toBe('edc')
    expect(getEndpointFieldsForTemplate(infrastructure)).toEqual([])
    expect(getActiveComponentKeys(infrastructure)).toEqual([])
  })

  it('maps grouped endpoint URLs into compatibility component slots', () => {
    const components = createComponents()
    const monoAllField = getEndpointFieldsForTemplate('mono-all')[0]

    setEndpointFieldValue(components, monoAllField, 'https://aas-env.example')

    expect(BASYX_COMPONENT_KEYS.every(key => components[key].url === 'https://aas-env.example')).toBe(true)
  })

  it('uses the first configured grouped endpoint URL when reading a shared field', () => {
    const components = createComponents()
    const monoRepoField = getEndpointFieldsForTemplate('mono-repo').find(
      field => field.key === 'AASEnvironment',
    )

    components.SubmodelRepo.url = '  https://aas-env.example  '

    expect(monoRepoField).toBeDefined()
    expect(getEndpointFieldValue(components, monoRepoField!)).toBe('https://aas-env.example')
  })

  it('counts configured grouped endpoints in summaries', () => {
    const monoAllInfrastructure = createInfrastructure('mono-all')
    monoAllInfrastructure.components.AASRegistry.url = 'https://aas-env.example'

    const catenaXInfrastructure = createInfrastructure('catena-x')
    catenaXInfrastructure.components.AASDiscovery.url = 'https://dtr.example'

    expect(getInfrastructureSummary(monoAllInfrastructure)).toBe('1 of 1 endpoints configured')
    expect(getInfrastructureSummary(catenaXInfrastructure)).toBe('1 of 2 endpoints configured')
  })

  it('exposes active component capabilities for identifiable superpath use', () => {
    expect(getActiveComponentKeys('identifiable')).toEqual(['AASRepo'])
    expect(usesSubmodelSuperpath('identifiable')).toBe(true)
    expect(usesSubmodelSuperpath('full')).toBe(false)
  })

  it('ignores stale inactive component URLs for a selected template', () => {
    const infrastructure = createInfrastructure('identifiable')
    infrastructure.components.AASRepo.url = '  https://aas-repo.example  '
    infrastructure.components.SubmodelRepo.url = 'https://stale-sm-repo.example'
    infrastructure.components.AASRegistry.url = 'https://stale-aas-registry.example'

    expect(getActiveComponentUrlForTemplate(infrastructure, 'AASRepo')).toBe('https://aas-repo.example')
    expect(getActiveComponentUrlForTemplate(infrastructure, 'SubmodelRepo')).toBe('')
    expect(getActiveComponentUrlForTemplate(infrastructure, 'AASRegistry')).toBe('')
  })

  it('defaults server-side upload only for mono templates', () => {
    expect(getDefaultAasUploadMode('mono-repo')).toBe('server')
    expect(getDefaultAasUploadMode('mono-all')).toBe('server')
    expect(getDefaultAasUploadMode('full')).toBe('client')
    expect(getDefaultAasUploadMode('identifiable')).toBe('client')
    expect(getDefaultAasUploadMode('catena-x')).toBe('client')
    expect(getDefaultAasUploadMode(undefined)).toBe('client')
  })

  it('defaults module template support to all templates', () => {
    expect(supportsInfrastructureTemplate(undefined, 'catena-x')).toBe(true)
    expect(supportsInfrastructureTemplate([], 'catena-x')).toBe(true)
  })

  it('checks explicit module template support lists', () => {
    expect(supportsInfrastructureTemplate(['full', 'mono-all'], 'mono-all')).toBe(true)
    expect(supportsInfrastructureTemplate(['full', 'mono-all'], 'catena-x')).toBe(false)
    expect(supportsInfrastructureTemplate(['mono-repo'], createInfrastructure('mono-repo'))).toBe(true)
  })
})
