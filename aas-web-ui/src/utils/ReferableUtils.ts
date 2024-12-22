// Function to extract the english display name from a referable
export function nameToDisplay(referable: any, defaultNameToDisplay = '') {
    if (referable && referable?.displayName) {
        const displayNameEn = referable.displayName.find((displayName: any) => {
            return displayName.language === 'en' && displayName.text !== '';
        });
        if (displayNameEn && displayNameEn.text) return displayNameEn.text;
    }
    return !defaultNameToDisplay && referable?.idShort ? referable.idShort : defaultNameToDisplay;
}

// Function to extract the english description from a referable
export function descriptionToDisplay(referable: any) {
    if (referable && referable?.description) {
        const descriptionEn = referable.description.find(
            (description: any) => description && description.language === 'en' && description.text !== ''
        );
        if (descriptionEn && descriptionEn.text) return descriptionEn.text;
    }
    return '';
}

// Function to check if the idShort of a SubmodelElement matches the given idShort
export function checkIdShort(
    referable: any,
    idShort: string,
    startsWith: boolean = false,
    strict: boolean = false
): boolean {
    if (idShort.trim() === '') return false;

    if (!referable || !referable.idShort || referable.idShort.length === 0) return false;

    if (startsWith) {
        // For matching e.g. ProductImage{00} with idShort ProductImage
        if (strict) {
            return referable.idShort.startsWith(idShort);
        } else {
            return referable.idShort.toLowerCase().startsWith(idShort.toLowerCase());
        }
    } else {
        if (strict) {
            return referable.idShort === idShort;
        } else {
            return referable.idShort.toLowerCase() === idShort.toLowerCase();
        }
    }
}
