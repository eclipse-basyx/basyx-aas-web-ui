export function firstCharToLowerCase(str: string) {
    // console.log('firstCharToLowerCase()', 'str:', str);

    if (!str || str.length === 0) return '';

    return str[0].toLowerCase() + str.slice(1);
}
