export function isProperty(property: any): boolean {
    // console.log(
    //     'isProperty()',
    //     'property:',
    //     property,
    // );
    if (property && Object.keys(property).length > 0 && property?.modelType && property.modelType.trim() === 'Property')
        return true;
    return false;
}

export function hasValue(property: any): boolean {
    // console.log(
    //     'hasValue()',
    //     'property:',
    //     property,
    // );

    if (isProperty(property) && property?.value && property.value.trim() !== '') {
        return true;
    }
    return false;
}

export function valueToDisplay(property: any, defaultValueToDisplay: string = ''): string {
    // console.log(
    //     'nameToDisplay()',
    //     'property:',
    //     property,
    //     'defaultValueToDisplay:',
    //     defaultdefaultValueToDisplayNameToDisplay,
    // );

    if (isProperty(property) && hasValue(property)) {
        return property.value;
    }
    return defaultValueToDisplay;
}
