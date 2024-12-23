export function valueToDisplay(multiLanguageProperty: any, language = 'en', defaultValueToDisplay = '') {
    if (multiLanguageProperty && multiLanguageProperty?.value) {
        // console.log(
        //     'nameToDisplay()',
        //     'multiLanguageProperty:',
        //     multiLanguageProperty,
        //     'defaultValueToDisplay:',
        //     defaultdefaultValueToDisplayNameToDisplay,
        // );

        if (
            multiLanguageProperty &&
            Object.keys(multiLanguageProperty).length > 0 &&
            Array.isArray(multiLanguageProperty?.value) &&
            multiLanguageProperty?.value.length > 0
        ) {
            const value = multiLanguageProperty.value.find((value: any) => {
                return value.language === language && value.text !== '';
            });
            if (value && value.text) return value.text;
        }
    }
    return defaultValueToDisplay;
}
