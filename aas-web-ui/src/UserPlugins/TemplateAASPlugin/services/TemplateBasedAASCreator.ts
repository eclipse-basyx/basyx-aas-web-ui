import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useIDUtils } from '@/composables/IDUtils';
import {
    AASTemplate,
    SubmodelElementTemplate,
    SubmodelTemplateRef,
} from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';
import { SubmodelTemplateService } from './SubmodelTemplateService';

export interface CreationResult {
    aasId: string;
    success: boolean;
    errors?: string[];
    aas?: aasTypes.AssetAdministrationShell;
}

export class TemplateBasedAASCreator {
    private idUtils = useIDUtils();
    private aasRegistryClient = useAASRegistryClient();
    private aasRepoClient = useAASRepositoryClient();
    private smRepoClient = useSMRepositoryClient();
    private smRegistryClient = useSMRegistryClient();
    private templateService = new SubmodelTemplateService();

    async createFromTemplate(
        template: AASTemplate,
        options: {
            displayName?: aasTypes.LangStringNameType[];
            description?: aasTypes.LangStringTextType[];
            assetId?: string;
            assetKind?: aasTypes.AssetKind;
            idShort?: string;
        } = {}
    ): Promise<CreationResult> {
        try {
            // 1. Create the base AAS
            const aasResult = await this.createAASFromTemplate(
                template,
                options.idShort || template.name,
                options.displayName,
                options.description
            );

            if (!aasResult.success || !aasResult.aas) {
                return aasResult;
            }

            // 2. Create and register submodels
            const errors: string[] = [];
            for (const submodelRef of template.submodels) {
                try {
                    // Create the submodel
                    const submodel = await this.createSubmodelFromTemplate(submodelRef);

                    // Post the submodel to the repository
                    await this.smRepoClient.postSubmodel(submodel);

                    // Create submodel descriptor with proper endpoints
                    const smEndpoint = await this.smRepoClient.getSmEndpointById(submodel.id);
                    const endpoints = [
                        {
                            interface: 'SUBMODEL-3.0',
                            protocolInformation: {
                                href: smEndpoint,
                                endpointProtocol: 'HTTP',
                                endpointProtocolVersion: ['1.1'],
                                subProtocol: 'REST',
                                subprotocolBody: null,
                                subprotocolBodyEncoding: null,
                                securityAttributes: null,
                            },
                        },
                    ];

                    // Create and register submodel descriptor
                    const smDescriptor = this.smRegistryClient.createDescriptorFromSubmodel(
                        jsonization.toJsonable(submodel),
                        endpoints
                    );
                    await this.smRegistryClient.putSubmodelDescriptor(smDescriptor);

                    // Add submodel reference to AAS
                    const submodelReference = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
                        new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
                    ]);

                    if (!aasResult.aas.submodels) {
                        aasResult.aas.submodels = [];
                    }
                    aasResult.aas.submodels.push(submodelReference);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    errors.push(`Failed to create submodel ${submodelRef.name}: ${errorMessage}`);
                }
            }

            // Update AAS with submodel references
            if (aasResult.aas.submodels && aasResult.aas.submodels.length > 0) {
                await this.aasRepoClient.putAas(aasResult.aas);

                // Update AAS descriptor with new submodels
                const aasEndpoint = this.aasRepoClient.getAasEndpointById(aasResult.aas.id);
                const aasDescriptor = this.aasRegistryClient.createDescriptorFromAAS(
                    jsonization.toJsonable(aasResult.aas),
                    [
                        {
                            interface: 'AAS-3.0',
                            protocolInformation: {
                                href: aasEndpoint,
                                endpointProtocol: 'HTTP',
                                endpointProtocolVersion: ['1.1'],
                                subProtocol: 'REST',
                                subprotocolBody: null,
                                subprotocolBodyEncoding: null,
                                securityAttributes: null,
                            },
                        },
                    ]
                );
                await this.aasRegistryClient.putAasDescriptor(aasDescriptor);
            }

            return {
                aasId: aasResult.aas.id,
                success: true,
                errors: errors.length > 0 ? errors : undefined,
                aas: aasResult.aas,
            };
        } catch (error) {
            return {
                aasId: '',
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
            };
        }
    }

    public async createAASFromTemplate(
        template: AASTemplate,
        idShort: string,
        displayName: aasTypes.LangStringNameType[] | null = null,
        description: aasTypes.LangStringTextType[] | null = null
    ): Promise<CreationResult> {
        try {
            const aasId = this.idUtils.generateUUID();
            const assetId = this.idUtils.generateUUID();

            // Create asset information
            const assetInfo = new aasTypes.AssetInformation(aasTypes.AssetKind.Instance);
            assetInfo.globalAssetId = assetId;

            // Create AAS
            const aas = new aasTypes.AssetAdministrationShell(aasId, assetInfo);
            aas.idShort = idShort;

            if (displayName) {
                aas.displayName = displayName;
            }

            if (description) {
                aas.description = description;
            }

            // Set category if provided in template
            if (template.category) {
                aas.category = template.category;
            }

            // Set administration information
            const adminInfo = new aasTypes.AdministrativeInformation();
            adminInfo.templateId = template.id;
            aas.administration = adminInfo;

            // Register the AAS
            await this.aasRepoClient.postAas(aas);

            // Create and register AAS descriptor
            const aasEndpoint = this.aasRepoClient.getAasEndpointById(aas.id);
            const aasJson = jsonization.toJsonable(aas);
            const descriptor = this.aasRegistryClient.createDescriptorFromAAS(aasJson, [
                {
                    interface: 'AAS-3.0',
                    protocolInformation: {
                        href: aasEndpoint,
                        endpointProtocol: 'HTTP',
                        endpointProtocolVersion: ['1.1'],
                        subProtocol: 'REST',
                        subprotocolBody: null,
                        subprotocolBodyEncoding: null,
                        securityAttributes: null,
                    },
                },
            ]);

            await this.aasRegistryClient.putAasDescriptor(descriptor);

            return {
                aasId: aas.id,
                success: true,
                aas,
            };
        } catch (error) {
            return {
                aasId: '',
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
            };
        }
    }

    private async createSubmodelFromTemplate(submodelRef: SubmodelTemplateRef): Promise<aasTypes.Submodel> {
        const submodelId = this.idUtils.generateUUID();
        const submodel = new aasTypes.Submodel(submodelId);

        // Set basic properties
        submodel.idShort = submodelRef.name;
        submodel.kind = aasTypes.ModellingKind.Instance;

        // Set semantic ID
        if (submodelRef.semanticId) {
            submodel.semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
                new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, submodelRef.semanticId),
            ]);
        }

        // Set administration info
        const adminInfo = new aasTypes.AdministrativeInformation();
        adminInfo.templateId = submodelRef.id;
        submodel.administration = adminInfo;

        // Get template elements from the template service
        let templateElements = this.templateService.getTemplateForSubmodel(submodelRef.id);

        // Validate template elements
        if (!templateElements || templateElements.length === 0) {
            console.warn(`No template elements found for submodel ${submodelRef.name} (${submodelRef.id})`);
            templateElements = submodelRef.elements || [];
        }

        // Create submodel elements
        try {
            const elements = await this.createSubmodelElements(templateElements);
            if (!elements || elements.length === 0) {
                throw new Error(`Failed to create elements for submodel ${submodelRef.name}`);
            }
            submodel.submodelElements = elements;
        } catch (error) {
            console.error('Error creating submodel elements:', error);
            throw error;
        }

        return submodel;
    }

    private async createSubmodelElements(templates: SubmodelElementTemplate[]): Promise<aasTypes.ISubmodelElement[]> {
        const elements: aasTypes.ISubmodelElement[] = [];
        const errors: string[] = [];

        for (const template of templates) {
            try {
                // Skip templates without required fields
                if (!template.type || !template.idShort) {
                    console.warn('Skipping invalid template:', template);
                    continue;
                }

                const element = await this.createSubmodelElement(template);
                if (element) {
                    elements.push(element);
                }

                // Handle nested elements (children) if present
                if (template.children && template.children.length > 0) {
                    const childElements = await this.createSubmodelElements(template.children);
                    if (element instanceof aasTypes.SubmodelElementCollection) {
                        element.value = childElements;
                    } else if (element instanceof aasTypes.SubmodelElementList) {
                        element.value = childElements;
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to create element ${template.idShort}: ${errorMessage}`);
                console.error('Error creating submodel element:', error);
            }
        }

        if (errors.length > 0) {
            console.warn('Errors while creating submodel elements:', errors);
        }

        return elements;
    }

    private async createSubmodelElement(template: SubmodelElementTemplate): Promise<aasTypes.ISubmodelElement> {
        // Validate required fields
        if (!template.type || !template.idShort) {
            throw new Error(`Invalid template: missing type or idShort`);
        }

        let element: aasTypes.ISubmodelElement;

        switch (template.type) {
            case 'Property': {
                const property = new aasTypes.Property(
                    aasTypes.DataTypeDefXsd[template.valueType as keyof typeof aasTypes.DataTypeDefXsd] ||
                        aasTypes.DataTypeDefXsd.String
                );
                property.idShort = template.idShort;
                if (template.value !== undefined) {
                    property.value = String(template.value);
                }
                element = property;
                break;
            }
            case 'MultiLanguageProperty': {
                const mlProperty = new aasTypes.MultiLanguageProperty();
                mlProperty.idShort = template.idShort;
                if (template.value) {
                    if (Array.isArray(template.value)) {
                        mlProperty.value = template.value;
                    } else if (typeof template.value === 'string') {
                        mlProperty.value = [new aasTypes.LangStringTextType('en', template.value)];
                    }
                }
                element = mlProperty;
                break;
            }
            case 'File': {
                const file = new aasTypes.File(template.valueType || 'application/octet-stream');
                file.idShort = template.idShort;
                if (template.value) {
                    file.value = String(template.value);
                }
                element = file;
                break;
            }
            case 'SubmodelElementCollection': {
                const collection = new aasTypes.SubmodelElementCollection();
                collection.idShort = template.idShort;
                element = collection;
                break;
            }
            case 'SubmodelElementList': {
                const list = new aasTypes.SubmodelElementList(aasTypes.AasSubmodelElements.SubmodelElement);
                list.idShort = template.idShort;
                element = list;
                break;
            }
            default:
                throw new Error(`Unsupported submodel element type: ${template.type}`);
        }

        // Set common properties
        if ('category' in template && typeof template.category === 'string') {
            element.category = template.category;
        }

        if (template.description) {
            if (typeof template.description === 'string') {
                element.description = [new aasTypes.LangStringTextType('en', template.description)];
            } else {
                element.description = template.description;
            }
        }

        if (template.semanticId) {
            element.semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
                new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, template.semanticId),
            ]);
        }

        return element;
    }
}
