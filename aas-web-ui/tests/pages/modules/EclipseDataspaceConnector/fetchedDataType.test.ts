import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import { describe, expect, it } from 'vitest'
import { fetchedDataType } from '@/pages/modules/EclipseDataspaceConnector/data/fetchedDataType'

const aas = {
  modelType: 'AssetAdministrationShell',
  id: 'urn:example:aas:1',
  assetInformation: { assetKind: 'Instance', globalAssetId: 'urn:example:asset:1' },
}
const submodel = { modelType: 'Submodel', id: 'urn:example:sm:1', idShort: 'Nameplate' }

describe('fetchedDataType', () => {
  it('detects an Asset Administration Shell', () => {
    expect(fetchedDataType(aas)?.title).toBe('AAS')
  })

  it('detects a Submodel', () => {
    expect(fetchedDataType(submodel)?.title).toBe('Submodel')
  })

  it('returns the deserialized instance', () => {
    const instance = fetchedDataType(submodel)?.instance
    expect(instance).toBeInstanceOf(aasTypes.Submodel)
    expect((instance as aasTypes.Submodel).idShort).toBe('Nameplate')
  })

  it('detects JSON delivered as text', () => {
    expect(fetchedDataType(JSON.stringify(submodel))?.title).toBe('Submodel')
  })

  it('ignores JSON that is neither an AAS nor a Submodel', () => {
    for (const data of [{}, { temperature: 21 }, [submodel], 42, true, null, '[1, 2]', '"text"', 'null']) {
      expect(fetchedDataType(data)).toBeUndefined()
    }
  })

  it('ignores objects whose model type is no AAS or Submodel', () => {
    for (const modelType of ['Property', 'Environment', 5, 'toString', '__proto__']) {
      expect(fetchedDataType({ ...submodel, modelType })).toBeUndefined()
    }
  })

  it('ignores an AAS or Submodel that does not deserialize', () => {
    expect(fetchedDataType({ modelType: 'Submodel' })).toBeUndefined() // the id is missing
    expect(fetchedDataType({ ...submodel, submodelElements: [{ modelType: 'Unknown' }] })).toBeUndefined()
    expect(fetchedDataType({ ...aas, assetInformation: null })).toBeUndefined()
  })

  it('ignores text that is no JSON', () => {
    expect(fetchedDataType('no json')).toBeUndefined()
    expect(fetchedDataType('')).toBeUndefined()
    expect(fetchedDataType(undefined)).toBeUndefined()
  })
})
