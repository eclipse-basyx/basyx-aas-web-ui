/**
 * Converts the first character of a string to uppercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character capitalized.
 */
export function capitalizeFirstLetter(string: string): string {
    if (!string || string.length === 0) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts the first character of a string to lowercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character lowercased.
 */
export function firstLetterToLowerCase(string: string): string {
    if (!string || string.length === 0) return '';
    return string[0].toLowerCase() + string.slice(1);
}
