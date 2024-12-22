// Function to extract the english display name from a referable
export function nameToDisplay(referable: any, defaultNameToDisplay = '') {
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
            return displayName.language === 'en' && displayName.text !== '';
        });
        if (displayNameEn && displayNameEn.text) return displayNameEn.text;
    }
    return !defaultNameToDisplay && referable?.idShort ? referable.idShort : defaultNameToDisplay;
}

// Function to extract the english description from a referable
export function descriptionToDisplay(referable: any) {
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
            (description: any) => description && description.language === 'en' && description.text !== ''
        );
        if (descriptionEn && descriptionEn.text) return descriptionEn.text;
    }
    return '';
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
