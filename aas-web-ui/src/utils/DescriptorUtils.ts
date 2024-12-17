// Extract the right endpoints href from a descriptor
export function extractEndpointHref(descriptor: any, interfaceShortName: string): string {
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
    if (!interfaceShortNames.some((iShortName) => interfaceShortName.startsWith(`${iShortName}-`))) {
        return '';
    }
    if (!Array.isArray(descriptor?.endpoints) || descriptor?.endpoints.length === 0 || interfaceShortName === '') {
        return '';
    }
    const endpoints = descriptor.endpoints;
    // find the right endpoint based on the interfaceShortName (has to match endpoint.interface)
    const endpoint = endpoints.find((endpoint: any) => {
        return endpoint?.interface === interfaceShortName;
    });
    return endpoint?.protocolInformation?.href ? endpoint.protocolInformation.href : '';
}