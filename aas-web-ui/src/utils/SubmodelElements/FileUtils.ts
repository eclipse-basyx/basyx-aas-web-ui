export function isFile(file: any): boolean {
    // console.log(
    //     'isFile()',
    //     'file:',
    //     file,
    // );

    if (file && Object.keys(file).length > 0 && file?.modelType && file.modelType.trim() === 'File') return true;
    return false;
}

export function hasValue(file: any): boolean {
    // console.log(
    //     'hasValue()',
    //     'file:',
    //     file,
    // );

    if (isFile(file) && file.value && file?.value.trim() !== '') {
        return true;
    }
    return false;
}

export function valueToDisplay(file: any, defaultValueToDisplay: string = ''): string {
    // console.log(
    //     'valueToDisplay()',
    //     'file:',
    //     file,
    //     'defaultValueToDisplay:',
    //     defaultValueToDisplay,
    // );

    if (isFile(file) && hasValue(file)) {
        return file.value;
    }
    return defaultValueToDisplay;
}

export function valueUrl(file: any): string {
    // console.log(
    //     'nameToDisplay()',
    //     'file:',
    //     file,
    //     'defaultValueToDisplay:',
    //     defaultdefaultValueToDisplayNameToDisplay,
    // );

    if (isFile(file) && hasValue(file)) {
        if (file.value.startsWith('http')) return file.value;

        if (!file.value.startsWith('http') && file.path.trim() !== '') return file.path + '/attachment';

        return file.value;
    }
    return '';
}
