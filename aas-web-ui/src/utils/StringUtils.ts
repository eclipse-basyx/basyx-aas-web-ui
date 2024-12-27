// Function to capitalize the first letter of a string
export function capitalizeFirstLetter(string: string) {
    // console.log('capitalizeFirstLetter()', 'str:', str);
    if (!string || string.length === 0) return '';

    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function firstLetterToLowerCase(string: string) {
    // console.log('firstLetterToLowerCase()', 'str:', str);

    if (!string || string.length === 0) return '';

    return string[0].toLowerCase() + string.slice(1);
}
