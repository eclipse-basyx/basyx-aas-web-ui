import type { AssetDataForm } from '../stores/aasCreationForm'
import type { DigitalNameplateTemplate } from '../types/template'

type Reference = {
  type: 'ModelReference'
  keys: Array<{
    type: string
    value: string
  }>
}

type AssetAdministrationShellPayload = {
  modelType: 'AssetAdministrationShell'
  id: string
  idShort: string
  displayName?: { language: string, text: string }[]
  description?: { language: string, text: string }[]
  assetInformation: {
    assetKind: 'Instance' | 'Type'
    globalAssetId: string
  }
  submodels: Reference[]
}

// function buildSubmodelReference (submodelId: string): Reference {
//   return {
//     type: 'ModelReference',
//     keys: [
//       {
//         type: 'Submodel',
//         value: submodelId,
//       },
//     ],
//   }
// }

export function buildAssetAdministrationShell (
  assetData: AssetDataForm,
  digitalNameplate: DigitalNameplateTemplate | null,
) {
  const submodels: any[] = []

  if (digitalNameplate?.id) {
    submodels.push({
      type: 'ModelReference',
      keys: [
        {
          type: 'Submodel',
          value: digitalNameplate.id,
        },
      ],
    })
  }

  const aas: any = {
    modelType: 'AssetAdministrationShell',
    id: assetData.aasId,
    idShort: assetData.displayName.trim() || 'AAS',
    assetInformation: {
      assetKind: assetData.assetKind,
      globalAssetId: assetData.globalAssetId,
    },
    submodels,
  }

  if (assetData.displayName.trim()) {
    aas.displayName = [
      {
        language: 'en',
        text: assetData.displayName.trim(),
      },
    ]
  }

  if (assetData.description.trim()) {
    aas.description = [
      {
        language: 'en',
        text: assetData.description.trim(),
      },
    ]
  }

  return aas
}
