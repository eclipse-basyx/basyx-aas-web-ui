import { AASTemplate } from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';

export const sampleTemplates: AASTemplate[] = [
    {
        id: 'technical-data-v1.2',
        name: 'Technical Data Template',
        description: 'Template for technical product data following ZVEI specification',
        version: '1.2',
        aasVersion: '3.0',
        category: 'Product Data',
        tags: ['technical', 'product', 'specifications', 'ZVEI'],
        submodels: [
            {
                id: 'technical-data',
                name: 'Technical Data',
                semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
                version: '1.2',
                required: true,
            },
        ],
        defaults: {
            idShort: 'TechnicalData',
            semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
        },
    },
    {
        id: 'contact-info-v1.0',
        name: 'Contact Information Template',
        description: 'Template for company and product contact information following ZVEI nameplate specification',
        version: '1.0',
        aasVersion: '3.0',
        category: 'Business Data',
        tags: ['contact', 'business', 'company', 'ZVEI', 'nameplate'],
        submodels: [
            {
                id: 'contact-information',
                name: 'Contact Information',
                semanticId: 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations',
                version: '1.0',
                required: true,
            },
        ],
        defaults: {
            idShort: 'ContactInformation',
            semanticId: 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations',
        },
    },
    {
        id: 'carbon-footprint-v0.9',
        name: 'Carbon Footprint Template',
        description: 'Template for product and transport carbon footprint data following IDTA specification',
        version: '0.9',
        aasVersion: '3.0',
        category: 'Sustainability',
        tags: ['carbon', 'footprint', 'sustainability', 'IDTA'],
        submodels: [
            {
                id: 'carbon-footprint',
                name: 'Carbon Footprint',
                semanticId: 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9',
                version: '0.9',
                required: true,
            },
        ],
        defaults: {
            idShort: 'CarbonFootprint',
            semanticId: 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9',
        },
    },
];
