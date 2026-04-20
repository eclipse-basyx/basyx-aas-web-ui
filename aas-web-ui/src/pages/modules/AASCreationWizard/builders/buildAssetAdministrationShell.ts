import type { AssetDataForm } from '../stores/aasCreationForm'
import type { DigitalNameplateTemplate } from '../types/template'

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
