import type { DigitalNameplateTemplate } from '../types/template';
import template from '../templates/digital-nameplate.json';

const templateData = template as DigitalNameplateTemplate;

// This function builds the raw data from the UI form into the Digital Nameplate Format
export function buildDigitalNameplate(rawData: Record<string, string> | null = null): DigitalNameplateTemplate {
    const existingData = rawData ?? {};
    console.log('raw data', existingData);
    return {
        ...templateData,
        submodelElements: templateData.submodelElements.map((element) => {
            if (element.modelType === 'Property' && element.valueType === 'string') {
                return {
                    ...element,
                    value: existingData[element.idShort] ?? '',
                };
            }
            return { ...element };
        }),
    };
}
