import { describe, expect, it } from 'vitest'
import { withoutRuntimeFields } from '@/utils/AAS/RuntimeFields'

describe('RuntimeFields', () => {
  it('removes the fields the UI adds at runtime and keeps the model', () => {
    const submodel = {
      modelType: 'Submodel',
      id: 'urn:sm:1',
      idShort: 'Nameplate',
      path: 'https://sm-repo.internal/submodels/dXJuOnNtOjE',
      endpoints: [{ protocolInformation: { href: 'https://sm-repo.internal/submodels/dXJuOnNtOjE' }, interface: 'SUBMODEL-3.0' }],
      timestamp: 1,
      submodelElements: [
        { modelType: 'Property', idShort: 'Name', value: 'x', path: 'https://sm-repo.internal/…/Name', timestamp: 2 },
      ],
    }

    expect(withoutRuntimeFields(submodel)).toEqual({
      modelType: 'Submodel',
      id: 'urn:sm:1',
      idShort: 'Nameplate',
      submodelElements: [{ modelType: 'Property', idShort: 'Name', value: 'x' }],
    })
    expect(submodel.endpoints).toHaveLength(1) // Not changed in place
  })

  it('keeps the path of an attachment and the id of identifiables only', () => {
    expect(withoutRuntimeFields({ contentType: 'image/png', path: '/aasx/files/a.png' })).toEqual({ contentType: 'image/png', path: '/aasx/files/a.png' })
    expect(withoutRuntimeFields({ modelType: 'AssetAdministrationShell', id: 'urn:aas:1', conceptDescriptions: [] }))
      .toEqual({ modelType: 'AssetAdministrationShell', id: 'urn:aas:1' })
    expect(withoutRuntimeFields({ modelType: 'Property', id: 'runtime-id' })).toEqual({ modelType: 'Property' })
  })
})
