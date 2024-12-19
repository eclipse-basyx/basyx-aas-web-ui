// Function to capitalize the first letter of a string
export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to check if the valueType is a number
export function isNumber(valueType: string) {
    if (!valueType) return false;
    // List of all number types
    const numberTypes = [
        'double',
        'float',
        'integer',
        'int',
        'nonNegativeInteger',
        'positiveInteger',
        'unsignedLong',
        'unsignedInt',
        'unsignedShort',
        'unsignedByte',
        'nonPositiveInteger',
        'negativeInteger',
        'long',
        'short',
        'decimal',
        'byte',
    ];
    // strip xs: from the property if it exists
    if (valueType.includes('xs:')) {
        valueType = valueType.replace('xs:', '');
    }
    // check if the property is a number
    if (numberTypes.includes(valueType)) {
        return true;
    } else {
        return false;
    }
}

// Function to download a JSON File
export function downloadJson(obj: any, fileName: string) {
    const jsonStr = JSON.stringify(obj, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to download a binary File
export function downloadFile(filename: string, fileContent: Blob) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(fileContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

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
