export function isMultiLanguageProperty(multiLanguageProperty: any): boolean {
    // console.log(
    //     'isMultiLanguageProperty()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    // );

    if (
        multiLanguageProperty &&
        Object.keys(multiLanguageProperty).length > 0 &&
        multiLanguageProperty?.modelType &&
        multiLanguageProperty.modelType.trim() === 'MultiLanguageProperty'
    )
        return true;
    return false;
}

export function hasValue(multiLanguageProperty: any): boolean {
    // console.log(
    //     'hasValue()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    // );

    if (
        isMultiLanguageProperty(multiLanguageProperty) &&
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

export function valueToDisplay(
    multiLanguageProperty: any,
    language: string = 'en',
    defaultValueToDisplay: string = ''
): string {
    // console.log(
    //     'valueToDisplay()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    //     'language::',
    //     language,
    //     'defaultValueToDisplay:',
    //     defaultdefaultValueToDisplayNameToDisplay,
    // );

    if (isMultiLanguageProperty(multiLanguageProperty) && hasValue(multiLanguageProperty)) {
        const langStringSet = multiLanguageProperty.value.find((value: any) => {
            return value?.language === language;
        });
        if (langStringSet && langStringSet?.text && langStringSet.text.trim() !== '') {
            return langStringSet.text;
        }
    }
    return defaultValueToDisplay;
}

export function firstLangStringSetText(multiLanguageProperty: any): string {
    // console.log(
    //     'firstLangStringSetText()',
    //     'multiLanguageProperty:',
    //     multiLanguageProperty,
    // );

    if (isMultiLanguageProperty(multiLanguageProperty) && hasValue(multiLanguageProperty)) {
        for (let index = 0; index < multiLanguageProperty.value.length; index++) {
            const text = multiLanguageProperty.value[index].text;
            if (text.trim() !== '') {
                return text;
            }
        }
    }
    return '';
}
