/**
 * Extracts the endpoint from a descriptor based on the given interface short name.
 *
 * @param {Object} descriptor_or_model - The descriptor or model (AAS / Submodel) containing endpoint information.
 * @param {string} interfaceShortName - The short name of the interface to match against endpoint interfaces.
 * @returns {string} The href of the matching endpoint's protocol information if found, otherwise an empty string.
 */
export function extractEndpointHref(descriptor_or_model: any, interfaceShortName: string): string {
    const failResponse = '';

    const interfaceShortNames = [
        'AAS',
        'SUBMODEL',
        'SERIALIZE',
        'DESCRIPTION',
        'AASX-FILE',
        'AAS-REGISTRY',
        'SUBMODEL-REGISTRY',
        'AAS-REPOSITORY',
        'SUBMODEL-REPOSITORY',
        'CD-REPOSITORY',
        'AAS-DISCOVERY',
    ];

    if (
        (descriptor_or_model?.modelType == 'AssetAdministrationShell' ||
            descriptor_or_model?.modelType == 'Submodel') &&
        descriptor_or_model?.path
    ) {
        return descriptor_or_model.path;
    }

    if (!interfaceShortName || interfaceShortName.trim() === '') return failResponse;

    interfaceShortName = interfaceShortName.trim();
    interfaceShortName = interfaceShortName.toUpperCase();

    if (!interfaceShortNames.some((iShortName: string) => interfaceShortName.startsWith(`${iShortName}-`))) {
        return failResponse;
    }

    if (!Array.isArray(descriptor_or_model?.endpoints) || descriptor_or_model?.endpoints.length === 0) {
        return failResponse;
    }

    const endpoints = descriptor_or_model.endpoints;

    // First, try to find exact match
    let endpoint = endpoints.find((endpoint: any) => {
        return endpoint?.interface === interfaceShortName;
    });

    // If not found and it's AAS-3.X, try AAS-REPOSITORY-3.X as fallback
    if (!endpoint && /^AAS-3\.[^-]+$/.test(interfaceShortName)) {
        const versionPart = interfaceShortName.substring('AAS-'.length); // e.g., "3.0"
        const fallbackInterface = 'AAS-REPOSITORY-' + versionPart;
        endpoint = endpoints.find((endpoint: any) => {
            return endpoint?.interface === fallbackInterface;
        });
    }

    // If not found and it's SUBMODEL-3.X, try SUBMODEL-REPOSITORY-3.X as fallback
    if (!endpoint && /^SUBMODEL-3\.[^-]+$/.test(interfaceShortName)) {
        const versionPart = interfaceShortName.substring('SUBMODEL-'.length); // e.g., "3.0"
        const fallbackInterface = 'SUBMODEL-REPOSITORY-' + versionPart;
        endpoint = endpoints.find((endpoint: any) => {
            return endpoint?.interface === fallbackInterface;
        });
    }

    return endpoint?.protocolInformation?.href ? endpoint.protocolInformation.href : '';
}
