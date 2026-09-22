import { describe, expect, it } from 'vitest'
import { isSubmodelPayload } from '@/utils/AAS/SubmodelUtils'

describe('SubmodelUtils.ts', () => {
  it('accepts Submodel payloads with an ID', () => {
    expect(isSubmodelPayload({
      id: 'urn:example:submodel:1',
      modelType: 'Submodel',
      submodelElements: [],
    })).toBe(true)
  })

  it.each([
    null,
    [],
    {},
    { id: '', modelType: 'Submodel' },
    { id: 'urn:example:submodel:1', modelType: 'AssetAdministrationShell' },
    { id: 'urn:example:submodel:1', idShort: 'Submodel not found', modelType: 'Submodel' },
    { id: 'urn:example:submodel:1', idShort: 'Submodel Not Authorized!', modelType: 'Submodel' },
  ])('rejects unusable repository payloads', value => {
    expect(isSubmodelPayload(value)).toBe(false)
  })
})
