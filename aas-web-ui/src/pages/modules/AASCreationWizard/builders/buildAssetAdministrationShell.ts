import type { AssetDataForm } from '../stores/aasCreationForm'
import type { DigitalNameplateTemplate, HandoverDocumentationTemplate, TechnicalDataTemplate } from '../types/template'

// export function buildAssetAdministrationShell (
//   assetData: AssetDataForm,
//   digitalNameplate: DigitalNameplateTemplate | null,
// ) {
//   const submodels: any[] = []

//   if (digitalNameplate?.id) {
//     submodels.push({
//       type: 'ModelReference',
//       keys: [
//         {
//           type: 'Submodel',
//           value: digitalNameplate.id,
//         },
//       ],
//     })
//   }

//   const aas: any = {
//     modelType: 'AssetAdministrationShell',
//     id: assetData.aasId,
//     idShort: assetData.displayName.trim() || 'AAS',
//     assetInformation: {
//       assetKind: assetData.assetKind,
//       globalAssetId: assetData.globalAssetId,
//     },
//     submodels,
//   }

//   if (assetData.displayName.trim()) {
//     aas.displayName = [
//       {
//         language: 'en',
//         text: assetData.displayName.trim(),
//       },
//     ]
//   }

//   if (assetData.description.trim()) {
//     aas.description = [
//       {
//         language: 'en',
//         text: assetData.description.trim(),
//       },
//     ]
//   }

//   return aas
// }

type SubmodelWithId = {
  id?: string
}

function createSubmodelReference (submodel: SubmodelWithId) {
  return {
    type: 'ModelReference',
    keys: [
      {
        type: 'Submodel',
        value: submodel.id,
      },
    ],
  }
}

export function buildAssetAdministrationShell (
  assetData: AssetDataForm,
  digitalNameplate: DigitalNameplateTemplate | null,
  technicalData: TechnicalDataTemplate | null,
  handoverDocumentation: HandoverDocumentationTemplate | null,
) {
  const submodels = []

  if (digitalNameplate?.id) {
    submodels.push(createSubmodelReference(digitalNameplate))
  }

  if (technicalData?.id) {
    submodels.push(createSubmodelReference(technicalData))
  }
  if (handoverDocumentation?.id) {
    submodels.push(createSubmodelReference(handoverDocumentation))
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
