import type { ResourceAccessTargetKind } from '@/types/ResourceAccess'
import { describe, expect, it } from 'vitest'
import { accessEndpoint, buildResourceAccessTarget, resourceAccessTargetOptions } from '@/utils/ResourceAccessTargets'

describe('ResourceAccessTargets', () => {
  it.each([
    ['aas', 'https://host/api/shells/', { resourceId: 'urn:example:aas' }, 'https://host/api/shells/dXJuOmV4YW1wbGU6YWFz/$access'],
    ['submodel', 'https://host/api', { resourceId: 'urn:example:sm' }, 'https://host/api/submodels/dXJuOmV4YW1wbGU6c20/$access'],
    ['submodel-element', 'https://host/api', { submodelId: 'urn:example:sm', idShortPath: 'Items[0].Name' }, 'https://host/api/submodels/dXJuOmV4YW1wbGU6c20/submodel-elements/Items%5B0%5D.Name/$access'],
    ['nested-submodel', 'https://host/api', { aasId: 'aas', submodelId: 'sm' }, 'https://host/api/shells/YWFz/submodels/c20/$access'],
    ['nested-submodel-element', 'https://host/api', { aasId: 'aas', submodelId: 'sm', idShortPath: 'Items[0]' }, 'https://host/api/shells/YWFz/submodels/c20/submodel-elements/Items%5B0%5D/$access'],
    ['nested-submodel-descriptor', 'https://host/api', { aasId: 'aas', submodelId: 'sm' }, 'https://host/api/shell-descriptors/YWFz/submodel-descriptors/c20/$access'],
    ['discovery', 'https://host/api/lookup/shells', { resourceId: 'aas' }, 'https://host/api/lookup/shells/YWFz/$access'],
    ['concept-description', 'https://host/api', { resourceId: 'cd' }, 'https://host/api/concept-descriptions/Y2Q/$access'],
  ] as const)('builds %s endpoints', (kind, baseUrl, fields, expected) => {
    const target = buildResourceAccessTarget({ kind, baseUrl, ...fields })
    expect(accessEndpoint(target)).toBe(expected)
  })

  it.each(['aas-collection', 'submodel-collection', 'aas-descriptor-collection', 'submodel-descriptor-collection', 'discovery-collection', 'concept-description-collection'])('rejects obsolete collection target %s', kind => {
    expect(resourceAccessTargetOptions.some(option => option.value === kind)).toBe(false)
    expect(() => buildResourceAccessTarget({ kind: kind as ResourceAccessTargetKind, baseUrl: 'https://host' })).toThrow('individual resources')
  })

  it.each(resourceAccessTargetOptions)('requires an identifier for $value', option => {
    expect(() => buildResourceAccessTarget({ kind: option.value, baseUrl: 'https://host' })).toThrow('required')
  })

  it('rejects missing endpoints and identifiers', () => {
    expect(() => buildResourceAccessTarget({ kind: 'aas', baseUrl: '' })).toThrow('endpoint')
    expect(() => buildResourceAccessTarget({ kind: 'aas', baseUrl: 'https://host' })).toThrow('resource ID')
  })
})
