// Function to extract the english display name from a referable
export function nameToDisplay(referable: any, language: string = 'en', defaultNameToDisplay: string = '') {
    // console.log(
    //     'nameToDisplay()',
    //     'referable:',
    //     referable,
    //     'defaultNameToDisplay:',
    //     defaultNameToDisplay,
    // );

    if (
        referable &&
        Object.keys(referable).length > 0 &&
        Array.isArray(referable?.displayName) &&
        referable?.displayName.length > 0
    ) {
        const displayNameEn = referable.displayName.find((displayName: any) => {
            return displayName.language === language && displayName.text !== '';
        });
        if (displayNameEn && displayNameEn.text) return displayNameEn.text;
    }
    return !defaultNameToDisplay && referable?.idShort ? referable.idShort : defaultNameToDisplay;
}

// Function to extract the english description from a referable
export function descriptionToDisplay(
    referable: any,
    language: string = 'en',
    defaultDescriptionToDisplay: string = ''
) {
    // console.log(
    //     'descriptionToDisplay()',
    //     'referable:',
    //     referable,
    // );

    if (
        referable &&
        Object.keys(referable).length > 0 &&
        Array.isArray(referable?.description) &&
        referable?.description.length > 0
    ) {
        const descriptionEn = referable.description.find(
            (description: any) => description && description.language === language && description.text !== ''
        );
        if (descriptionEn && descriptionEn.text) return descriptionEn.text;
    }
    return defaultDescriptionToDisplay;
}

// Function to check if the idShort of a referable matches the given idShort
// startsWith: idShort of referable starts with given idShort
// strict: consider lower and upper case
export function checkIdShort(
    referable: any,
    idShort: string,
    startsWith: boolean = false,
    strict: boolean = false
): boolean {
    // console.log(
    //     'checkIdShort()',
    //     'referable:',
    //     referable,
    //     'idShort:',
    //     idShort,
    //     startsWith ? 'startsWith' : '',
    //     strict ? 'strict' : ''
    // );
    if (idShort.trim() === '') return false;

    if (!referable || Object.keys(referable).length === 0 || !referable?.idShort || referable?.idShort.trim() === '')
        return false;

    if (startsWith) {
        // For matching e.g. ProductImage{00} with idShort ProductImage
        // For matching e.g. Markings__00__
        if (strict) {
            return (
                referable.idShort === idShort ||
                referable.idShort.startsWith(idShort + '{') ||
                referable.idShort.startsWith(idShort + '__')
            );
        } else {
            return (
                referable.idShort.toLowerCase() === idShort.toLowerCase() ||
                referable.idShort.toLowerCase().startsWith(idShort.toLowerCase() + '{') ||
                referable.idShort.toLowerCase().startsWith(idShort.toLowerCase() + '__')
            );
        }
    } else {
        if (strict) {
            return referable.idShort === idShort;
        } else {
            return referable.idShort.toLowerCase() === idShort.toLowerCase();
        }
    }
}

export function getSubmodelElementByIdShort(idShort: string, submodelElement: any): any {
    // console.log('getSubmodelElementByIdShort()', 'idShort', idShort, 'submodelElement', submodelElement);

    const failResponse = {} as any;

    if (idShort.trim() == '') return failResponse;

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') return failResponse;

    switch (submodelElement.modelType) {
        case 'Submodel':
            if (
                submodelElement?.submodelElements &&
                Array.isArray(submodelElement.submodelElements) &&
                submodelElement.submodelElements.length > 0
            ) {
                return submodelElement.submodelElements.find((sme: any) => {
                    return checkIdShort(sme, idShort);
                });
            }
            break;
        case 'SubmodelElementCollection':
        case 'SubmodelElementList':
            if (submodelElement?.value && Array.isArray(submodelElement.value) && submodelElement.value.length > 0) {
                return submodelElement.value.find((sme: any) => {
                    return checkIdShort(sme, idShort);
                });
            }
            break;
    }

    return failResponse;
}

export function getSubmodelElementsByIdShort(idShort: string, submodelElement: any): any[] {
    // console.log('getSubmodelElementsByIdShort()', 'idShort', idShort, 'submodelElement', submodelElement);

    const failResponse = [] as any[];

    if (idShort.trim() == '') return failResponse;

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') return failResponse;

    switch (submodelElement.modelType) {
        case 'Submodel':
            if (
                submodelElement?.submodelElements &&
                Array.isArray(submodelElement.submodelElements) &&
                submodelElement.submodelElements.length > 0
            ) {
                return submodelElement.submodelElements.filter((sme: any) => {
                    return checkIdShort(sme, idShort);
                });
            }
            break;
        case 'SubmodelElementCollection':
        case 'SubmodelElementList':
            if (submodelElement?.value && Array.isArray(submodelElement.value) && submodelElement.value.length > 0) {
                return submodelElement.value.filter((sme: any) => {
                    return checkIdShort(sme, idShort);
                });
            }
            break;
    }

    return failResponse;
}
