//import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { SubmodelElementTemplate } from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';

export class SubmodelTemplateService {
    private static readonly TECHNICAL_DATA_SEMANTIC_ID = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';
    private static readonly CONTACT_INFO_SEMANTIC_ID = 'https://admin-shell.io/ZVEI/ContactInformation/1/0';
    private static readonly CARBON_FOOTPRINT_SEMANTIC_ID = 'https://admin-shell.io/ZVEI/CarbonFootprint/0/9';

    getTemplateForSubmodel(submodelId: string): SubmodelElementTemplate[] {
        switch (submodelId) {
            case 'technical-data':
                return this.getTechnicalDataTemplate();
            case 'contact-information':
                return this.getContactInformationTemplate();
            case 'carbon-footprint':
                return this.getCarbonFootprintTemplate();
            default:
                console.warn(`No template found for submodel type: ${submodelId}`);
                return [];
        }
    }

    private getTechnicalDataTemplate(): SubmodelElementTemplate[] {
        return [
            {
                idShort: 'GeneralInformation',
                type: 'SubmodelElementCollection',
                required: true,
                description: 'General information about the product',
                semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1',
                children: [
                    {
                        idShort: 'ProductImage',
                        type: 'File',
                        valueType: 'image/*',
                        required: false,
                        description: 'Product image file',
                        semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/ProductImage/1/1',
                    },
                    {
                        idShort: 'ProductName',
                        type: 'MultiLanguageProperty',
                        required: true,
                        description: 'Name of the product',
                    },
                    {
                        idShort: 'SerialNumber',
                        type: 'Property',
                        valueType: 'xs:string',
                        required: true,
                        description: 'Serial number of the product',
                    },
                    {
                        idShort: 'Manufacturer',
                        type: 'MultiLanguageProperty',
                        required: true,
                        description: 'Name of the manufacturer',
                    },
                ],
            },
        ];
    }

    private getContactInformationTemplate(): SubmodelElementTemplate[] {
        // TODO: Add contact information template structure
        return [];
    }

    private getCarbonFootprintTemplate(): SubmodelElementTemplate[] {
        // TODO: Add carbon footprint template structure
        return [];
    }
}
