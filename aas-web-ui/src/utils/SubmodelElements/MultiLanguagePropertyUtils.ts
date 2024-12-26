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

export function valueToDisplay(multiLanguageProperty: any, language = 'en', defaultValueToDisplay = ''): string {
    // console.log(
    //     'nameToDisplay()',
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
