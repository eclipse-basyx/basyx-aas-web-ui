import type { FormStateObject } from '../types/form'
import type { DigitalNameplateTemplate } from '../types/template'
import template from '../templates/digital-nameplate.json'

const templateData = template as DigitalNameplateTemplate

export function buildDigitalNameplate (rawData: FormStateObject | null = null): DigitalNameplateTemplate {
  const existingData = rawData ?? {}
  console.log('raw data', existingData)

  return {
    ...templateData,
    submodelElements: templateData.submodelElements.map(element => {
      if (element.modelType === 'Property') {
        const fieldValue = existingData[element.idShort]

        return {
          ...element,
          value: typeof fieldValue === 'string' ? fieldValue : '',
        }
      }

      return { ...element }
    }),
  }
}
