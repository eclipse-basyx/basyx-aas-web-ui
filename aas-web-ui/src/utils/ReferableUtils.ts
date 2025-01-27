/**
 * Extracts the display name from a referable object based on the specified language.
 *
 * The function follows these steps to determine the display name:
 *  1. If a `displayName` entry with the specified language is found, it returns its text.
 *  2. If `defaultNameToDisplay` is provided and not an empty string, it returns this value.
 *  3. If `idShort` is available and not an empty string, it returns `idShort`.
 *  4. If `id` is available and not an empty string, it returns `id`.
 *  5. If none of the above conditions are met, it returns an empty string.
 *
 * @param {Object} referable - The referable object to extract the display name from.
 * @param {string} [language='en'] - The language code for the desired display name text. Defaults to 'en'.
 * @param {string} [defaultNameToDisplay=''] - The default name to return if no display name is found. Defaults to an empty string.
 * @returns {string} The determined display name or an appropriate fallback value.
 */
export function nameToDisplay(referable: any, language: string = 'en', defaultNameToDisplay: string = ''): string {
    if (referable && Object.keys(referable).length > 0) {
        // 1.) Check if displayName is available, if so, return displayName
        if (referable?.displayName && Array.isArray(referable?.displayName) && referable?.displayName.length > 0) {
            const displayNameEn = referable.displayName.find((displayName: any) => {
                return displayName.language === language && displayName?.text;
            });
            if (displayNameEn && displayNameEn?.text && displayNameEn?.text.trim() !== '') return displayNameEn.text;
        }

        // 2.) Otherwise return defaultNameToDisplay (if specified)
        if (defaultNameToDisplay.trim() !== '') return defaultNameToDisplay;

        // 3.) Otherwise return idShort (if available and not empty string)
        if (referable?.idShort && referable?.idShort.trim() !== '') return referable.idShort;

        // 4.) If referable is also an identifiable at the same time return id (if available and not empty string)
        if (referable?.id && referable?.id.trim() !== '') return referable.id;
    }

    // 4.) Return defaultNameToDisplay if specified, otherwise return an empty string
    return defaultNameToDisplay.trim() || '';
}

// Function to extract the english description from a referable
export function descriptionToDisplay(referable: any, language = 'en', defaultDescriptionToDisplay = '') {
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
