/**
 * Checks if the given multi-language property object is a valid MultiLanguageProperty model with respect to AAS metamodel specs.
 *
 * @param {any} multiLanguageProperty - The multi-language property object to check.
 * @returns {boolean} True if the object is a MultiLanguageProperty model, otherwise false.
 */
export function isMultiLanguageProperty(multiLanguageProperty: any): boolean {
    if (
        multiLanguageProperty &&
        typeof multiLanguageProperty === 'object' &&
        Object.keys(multiLanguageProperty).length > 0 &&
        multiLanguageProperty.modelType &&
        typeof multiLanguageProperty.modelType === 'string' &&
        multiLanguageProperty.modelType.trim() === 'MultiLanguageProperty'
    ) {
        return true;
    }
    return false;
}

/**
 * Checks whether the given multi-language property object has a non-empty value.
 *
 * @param {any} multiLanguageProperty - The multi-language property object to check.
 * @returns {boolean} True if the multiLanguageProperty has a non-empty value, otherwise false.
 */
export function hasValue(multiLanguageProperty: any): boolean {
    if (
        isMultiLanguageProperty(multiLanguageProperty) &&
        multiLanguageProperty?.value &&
        Array.isArray(multiLanguageProperty?.value) &&
        multiLanguageProperty.value.length > 0
    ) {
        for (let index = 0; index < multiLanguageProperty.value.length; index++) {
            const langStringSet = multiLanguageProperty.value[index];
            if (langStringSet && langStringSet?.text && langStringSet.text.trim() !== '') {
                return true;
            }
        }
    }
    return false;
}

/**
 * Retrieves the display value from a multi-language property, defaulting to the specified language.
 *
 * @param {any} multiLanguageProperty - The multi-language property object.
 * @param {string} [language='en'] - The language code to look for in the multi-language property values (default is 'en').
 * @param {string} [defaultValueToDisplay=''] - The default value to return if no appropriate value is found.
 * @returns {string} The text value in the specified language, or the default value if not found.
 */
export function valueToDisplay(
    multiLanguageProperty: any,
    language: string = 'en',
    defaultValueToDisplay: string = ''
): string {
    if (isMultiLanguageProperty(multiLanguageProperty) && hasValue(multiLanguageProperty)) {
        const langStringSet = multiLanguageProperty.value.find((value: any) => value?.language === language);
        if (langStringSet && langStringSet?.text && langStringSet.text.trim() !== '') {
            return langStringSet.text;
        }
    }
    return defaultValueToDisplay;
}

/**
 * Retrieves the first non-empty text string from a multi-language property.
 *
 * @param {any} multiLanguageProperty - The multi-language property object.
 * @returns {string} The first non-empty text string or an empty string if none found.
 */
export function firstLangStringSetText(multiLanguageProperty: any): string {
    if (isMultiLanguageProperty(multiLanguageProperty) && hasValue(multiLanguageProperty)) {
        for (const { text } of multiLanguageProperty.value) {
            if (text.trim() !== '') {
                return text;
            }
        }
    }
    return '';
}
