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
